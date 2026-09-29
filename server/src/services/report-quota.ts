/**
 * 报告额度记账服务（变现基建第一层）
 *
 * 额度模型（按设备 deviceId 记账）：
 * - 每设备免费 1 份报告（FREE_QUOTA）
 * - 激励视频解锁：每完整观看 1 次 +1 份可生成额度（当日解锁上限 DAILY_UNLOCK_LIMIT）
 * - 每日频控：无论免费/解锁，每设备每日生成上限 DAILY_LIMIT（防滥用，控制 LLM 成本）
 *
 * 存储：Postgres 直连（PGDATABASE_URL，表 device_report_usage DDL 幂等自建）；
 * 连接串缺失或不可达时降级为进程内存记账（serverless 重启会丢失，仅保功能不崩）。
 */
import { Pool } from "pg";

/** 每设备免费额度（份） */
export const FREE_QUOTA = 1;
/** 每设备每日生成上限（份，含免费与解锁额度） */
export const DAILY_LIMIT = 20;
/** 每设备每日激励视频解锁上限（次） */
export const DAILY_UNLOCK_LIMIT = 10;

/** 额度快照（返回给前端用于入口展示与解锁判断） */
export interface ReportQuota {
  /** 免费额度剩余份数（0/1） */
  freeRemaining: number;
  /** 解锁额度剩余份数（已观看激励视频未消耗的次数） */
  unlockedRemaining: number;
  /** 今日剩余可生成份数（受每日频控约束） */
  dailyRemaining: number;
  dailyLimit: number;
  /** 免费与解锁额度均耗尽，需观看激励视频 */
  needUnlock: boolean;
  /** 今日生成数已达每日上限 */
  dailyExhausted: boolean;
  /** 累计已生成份数 */
  totalReports: number;
}

interface UsageRow {
  free_used: number;
  unlocked_remaining: number;
  total_reports: number;
  daily_reports: number;
  daily_unlocks: number;
}

/** 额度消耗来源 */
export type QuotaSource = "free" | "unlocked";

let pool: Pool | null = null;
let schemaReady = false;
/** PG 不可用时的内存兜底（deviceId → 行） */
const memoryStore = new Map<string, UsageRow>();
let usingMemory = false;

function getPgPool(): Pool | null {
  const conn =
    process.env.PGDATABASE_URL ??
    (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD
      ? `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@${process.env.PGHOST}:${process.env.PGPORT ?? 5432}/${process.env.PGDATABASE ?? "postgres"}`
      : null);
  if (!conn) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 8000,
    });
    pool.on("error", (err) => console.error("[report-quota] pg pool error:", err.message));
  }
  return pool;
}

async function ensureSchema(client: Pool): Promise<void> {
  if (schemaReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS device_report_usage (
      device_id text PRIMARY KEY,
      free_used integer NOT NULL DEFAULT 0,
      unlocked_remaining integer NOT NULL DEFAULT 0,
      total_reports integer NOT NULL DEFAULT 0,
      daily_date date NOT NULL DEFAULT CURRENT_DATE,
      daily_reports integer NOT NULL DEFAULT 0,
      daily_unlocks integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  schemaReady = true;
}

/** 内存兜底的跨天重置（UTC 日期） */
function memoryRow(deviceId: string): UsageRow {
  const today = new Date().toISOString().slice(0, 10);
  let row = memoryStore.get(deviceId);
  if (!row) {
    row = { free_used: 0, unlocked_remaining: 0, total_reports: 0, daily_reports: 0, daily_unlocks: 0 };
    memoryStore.set(deviceId, row);
  }
  return row;
}

/** 行数据 → 额度快照（daily_reports 由调用方保证已按当日重置） */
function toQuota(row: UsageRow): ReportQuota {
  const freeRemaining = Math.max(0, FREE_QUOTA - row.free_used);
  const dailyRemaining = Math.max(0, DAILY_LIMIT - row.daily_reports);
  return {
    freeRemaining,
    unlockedRemaining: row.unlocked_remaining,
    dailyRemaining,
    dailyLimit: DAILY_LIMIT,
    needUnlock: freeRemaining <= 0 && row.unlocked_remaining <= 0,
    dailyExhausted: dailyRemaining <= 0,
    totalReports: row.total_reports,
  };
}

/**
 * 查询设备额度（读取前自动跨天重置日计数）
 * 任何存储异常均向上抛出，由调用方决定降级行为。
 */
export async function getReportQuota(deviceId: string): Promise<ReportQuota> {
  const client = getPgPool();
  if (client && !usingMemory) {
    try {
      await ensureSchema(client);
      // 跨天重置（原子）
      await client.query(
        `UPDATE device_report_usage
         SET daily_date = CURRENT_DATE, daily_reports = 0, daily_unlocks = 0, updated_at = now()
         WHERE device_id = $1 AND daily_date < CURRENT_DATE`,
        [deviceId],
      );
      const { rows } = await client.query<UsageRow>(
        `SELECT free_used, unlocked_remaining, total_reports, daily_reports, daily_unlocks
         FROM device_report_usage WHERE device_id = $1`,
        [deviceId],
      );
      if (rows.length === 0) return toQuota({ free_used: 0, unlocked_remaining: 0, total_reports: 0, daily_reports: 0, daily_unlocks: 0 });
      return toQuota(rows[0]);
    } catch (e) {
      usingMemory = true;
      console.error("[report-quota] pg 读取失败，降级内存记账:", e instanceof Error ? e.message : e);
    }
  } else if (!usingMemory) {
    usingMemory = true;
    console.warn("[report-quota] PGDATABASE_URL 未配置，降级为内存记账（重启丢失）");
  }
  return toQuota(memoryRow(deviceId));
}

/**
 * 消耗一次生成额度（调用方需先通过 getReportQuota 校验 needUnlock/dailyExhausted）
 * source: free → free_used+1；unlocked → unlocked_remaining-1
 */
export async function consumeReportQuota(deviceId: string, source: QuotaSource): Promise<void> {
  const client = getPgPool();
  if (client && !usingMemory) {
    try {
      await ensureSchema(client);
      const field = source === "free" ? "free_used = free_used + 1" : "unlocked_remaining = GREATEST(unlocked_remaining - 1, 0)";
      await client.query(
        `INSERT INTO device_report_usage (device_id, free_used, total_reports, daily_reports)
         VALUES ($1, $2, 1, 1)
         ON CONFLICT (device_id) DO UPDATE SET
           ${source === "free" ? "free_used = device_report_usage.free_used + 1" : "unlocked_remaining = GREATEST(device_report_usage.unlocked_remaining - 1, 0)"},
           total_reports = device_report_usage.total_reports + 1,
           daily_reports = CASE WHEN device_report_usage.daily_date < CURRENT_DATE THEN 1 ELSE device_report_usage.daily_reports + 1 END,
           daily_date = CURRENT_DATE,
           updated_at = now()`,
        [deviceId, source === "free" ? 1 : 0],
      );
      return;
    } catch (e) {
      usingMemory = true;
      console.error("[report-quota] pg 扣账失败，降级内存记账:", e instanceof Error ? e.message : e);
    }
  }
  const row = memoryRow(deviceId);
  if (source === "free") row.free_used += 1;
  else row.unlocked_remaining = Math.max(0, row.unlocked_remaining - 1);
  row.total_reports += 1;
  row.daily_reports += 1;
}

/** 生成失败返还（仅当流未产出任何内容时调用） */
export async function refundReportQuota(deviceId: string, source: QuotaSource): Promise<void> {
  const client = getPgPool();
  if (client && !usingMemory) {
    try {
      const revert = source === "free" ? "free_used = GREATEST(free_used - 1, 0)" : "unlocked_remaining = unlocked_remaining + 1";
      await client.query(
        `UPDATE device_report_usage SET ${revert},
           total_reports = GREATEST(total_reports - 1, 0),
           daily_reports = GREATEST(daily_reports - 1, 0),
           updated_at = now()
         WHERE device_id = $1`,
        [deviceId],
      );
      return;
    } catch (e) {
      console.error("[report-quota] pg 返还失败:", e instanceof Error ? e.message : e);
    }
  }
  const row = memoryStore.get(deviceId);
  if (!row) return;
  if (source === "free") row.free_used = Math.max(0, row.free_used - 1);
  else row.unlocked_remaining += 1;
  row.total_reports = Math.max(0, row.total_reports - 1);
  row.daily_reports = Math.max(0, row.daily_reports - 1);
}

/**
 * 激励视频观看完成 → 解锁 1 份生成额度
 * 受每日解锁上限约束（防刷），返回是否解锁成功与当日剩余解锁次数。
 */
export async function unlockReportQuota(deviceId: string): Promise<{ unlockedRemaining: number; dailyUnlocksRemaining: number }> {
  const client = getPgPool();
  if (client && !usingMemory) {
    try {
      await ensureSchema(client);
      // 跨天重置后原子 +1（带每日上限守卫）
      const { rows } = await client.query<UsageRow>(
        `INSERT INTO device_report_usage (device_id, unlocked_remaining, daily_unlocks)
         VALUES ($1, 1, 1)
         ON CONFLICT (device_id) DO UPDATE SET
           unlocked_remaining = CASE
             WHEN device_report_usage.daily_date < CURRENT_DATE THEN device_report_usage.unlocked_remaining + 1
             WHEN device_report_usage.daily_unlocks < $2 THEN device_report_usage.unlocked_remaining + 1
             ELSE device_report_usage.unlocked_remaining END,
           daily_unlocks = CASE
             WHEN device_report_usage.daily_date < CURRENT_DATE THEN 1
             WHEN device_report_usage.daily_unlocks < $2 THEN device_report_usage.daily_unlocks + 1
             ELSE device_report_usage.daily_unlocks END,
           daily_date = CURRENT_DATE,
           updated_at = now()
         RETURNING unlocked_remaining, daily_unlocks`,
        [deviceId, DAILY_UNLOCK_LIMIT],
      );
      const row = rows[0];
      return { unlockedRemaining: row.unlocked_remaining, dailyUnlocksRemaining: Math.max(0, DAILY_UNLOCK_LIMIT - row.daily_unlocks) };
    } catch (e) {
      usingMemory = true;
      console.error("[report-quota] pg 解锁失败，降级内存记账:", e instanceof Error ? e.message : e);
    }
  }
  const row = memoryRow(deviceId);
  const dailyUnlocksRemaining = Math.max(0, DAILY_UNLOCK_LIMIT - row.daily_unlocks);
  if (dailyUnlocksRemaining > 0) {
    row.unlocked_remaining += 1;
    row.daily_unlocks += 1;
  }
  return { unlockedRemaining: row.unlocked_remaining, dailyUnlocksRemaining: Math.max(0, DAILY_UNLOCK_LIMIT - row.daily_unlocks) };
}
