/**
 * 报告额度路由
 * - GET  /api/v1/reports/quota?deviceId=xxx  查询设备报告额度
 * - POST /api/v1/reports/unlock              激励视频观看完成 → 解锁 1 份生成额度
 */
import { Router } from "express";
import { z } from "zod";
import { getReportQuota, unlockReportQuota, DAILY_LIMIT, FREE_QUOTA, DAILY_UNLOCK_LIMIT } from "../services/report-quota";

export const reportsRouter = Router();

/** deviceId 校验：客户端 UUID（AsyncStorage 持久化） */
const deviceIdSchema = z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/, "deviceId 格式不合法");

/**
 * 查询设备报告额度
 * GET /api/v1/reports/quota?deviceId:string
 */
reportsRouter.get("/quota", async (req, res) => {
  try {
    const parsed = deviceIdSchema.safeParse(String(req.query.deviceId ?? ""));
    if (!parsed.success) {
      res.status(400).json({ error: "缺少或非法 deviceId" });
      return;
    }
    const quota = await getReportQuota(parsed.data);
    res.json({ data: { ...quota, freeQuota: FREE_QUOTA, dailyUnlockLimit: DAILY_UNLOCK_LIMIT } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务异常";
    res.status(500).json({ error: msg });
  }
});

/**
 * 激励视频解锁
 * POST /api/v1/reports/unlock
 * Body: deviceId:string
 * 说明：当前为模拟激励视频（Expo Go 阶段）；接入 AdMob 后此接口由服务端 S2S 回调验证替代。
 */
reportsRouter.post("/unlock", async (req, res) => {
  try {
    // reason: 'ad_failed' = 激励视频加载失败时的放行解锁（仍计入每日解锁上限，服务端打点）
    const parsed = z
      .object({
        deviceId: deviceIdSchema,
        reason: z.enum(["ad_completed", "ad_failed"]).default("ad_completed"),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "缺少或非法 deviceId" });
      return;
    }
    if (parsed.data.reason === "ad_failed") {
      console.log(`[reports] unlock via ad_failed fallback, device=${parsed.data.deviceId}`);
    }
    const result = await unlockReportQuota(parsed.data.deviceId);
    res.json({ data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务异常";
    res.status(500).json({ error: msg });
  }
});

/** 兜底：未知子路径 */
reportsRouter.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});
