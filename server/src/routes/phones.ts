import { Router } from "express";
import { z } from "zod";
import {
  listPhones,
  getPhoneById,
  getLatestPhone,
  analyzeDevice,
  type DeviceInput,
} from "../services/phone-service";
import { getPurchaseLink } from "../services/affiliate";
import { streamReport } from "../services/report-service";
import { getReportQuota, consumeReportQuota, refundReportQuota, type QuotaSource } from "../services/report-quota";
import { HeaderUtils } from "coze-coding-dev-sdk";

export const phonesRouter = Router();

/** deviceId 校验：客户端 UUID（AsyncStorage 持久化） */
const deviceIdSchema = z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/, "deviceId 格式不合法");

const analysisSchema = z.object({
  phoneId: z.number().int().positive(),
  benchmarkScore: z.number().int().nonnegative().optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
  batteryCycles: z.number().int().nonnegative().optional(),
  smoothness: z.number().min(1).max(5).optional(),
  usageCategories: z.array(z.enum(['social', 'video', 'game', 'photo', 'work', 'web'])).max(6).optional(),
  /** advice 输出语言（cn 版传 zh / 海外版传 en，默认 zh） */
  lang: z.enum(['zh', 'en']).optional(),
});

/**
 * 获取机型列表
 * GET /api/v1/phones
 */
phonesRouter.get('/', async (_req, res) => {
  try {
    const phones = await listPhones();
    res.json({ data: phones });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常';
    res.status(500).json({ error: msg });
  }
});

/**
 * 获取最新机型
 * GET /api/v1/phones/latest
 */
phonesRouter.get('/latest', async (_req, res) => {
  try {
    const latest = await getLatestPhone();
    res.json({ data: latest });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常';
    res.status(500).json({ error: msg });
  }
});

/**
 * 换机分析评分
 * POST /api/v1/phones/analysis
 * Body: phoneId:number, benchmarkScore?:number, batteryHealth?:number, batteryCycles?:number, smoothness?:number, usageCategories?:('social'|'video'|'game'|'photo'|'work'|'web')[]
 */
phonesRouter.post('/analysis', async (req, res) => {
  try {
    const parsed = analysisSchema.parse(req.body) as DeviceInput;
    const result = await analyzeDevice(parsed);
    res.json({ data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常';
    res.status(400).json({ error: msg });
  }
});

/**
 * 获取 CPS 导购链接（京东联盟转链）
 * GET /api/v1/phones/purchase-link
 * Query 参数：model:string（机型名，如 "iPhone 17 Pro"），budget?:number（预算上限，元）
 * 联盟密钥未配置时返回 { available:false, reason:'jd_union_not_configured' }
 */
phonesRouter.get('/purchase-link', async (req, res) => {
  try {
    const model = String(req.query.model ?? '').trim();
    if (!model) {
      res.status(400).json({ error: '缺少 model 参数' });
      return;
    }
    const budgetRaw = Number(req.query.budget);
    const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : undefined;
    const result = await getPurchaseLink(model, budget);
    res.json({ data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常';
    res.status(500).json({ error: msg });
  }
});

const reportSchema = z.object({
  currentPhoneId: z.number().int().positive(),
  targetPhoneId: z.number().int().positive(),
  batteryHealth: z.number().min(0).max(100).optional(),
  batteryCycles: z.number().int().nonnegative().optional(),
  usageCategories: z.array(z.enum(['social', 'video', 'game', 'photo', 'work', 'web'])).max(6).optional(),
  lang: z.enum(['zh', 'en']).default('zh'),
  /** 设备标识（变现记账：每设备免费 1 份 + 激励视频解锁 + 每日频控） */
  deviceId: deviceIdSchema,
});

/** SSE 错误帧（带机器可读 reason，前端据此弹解锁/频控提示） */
function sseError(res: import("express").Response, reason: string, msg: string): void {
  res.write(`data: ${JSON.stringify({ error: msg, reason })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * AI 对比报告（SSE 流式，POST）
 * POST /api/v1/phones/report
 * Body: currentPhoneId:number, targetPhoneId:number, batteryHealth?:number, batteryCycles?:number,
 *        usageCategories?:('social'|'video'|'game'|'photo'|'work'|'web')[], lang?:'zh'|'en', deviceId:string
 * 响应：text/event-stream，增量帧 data:{"text":"..."}，错误帧 data:{"error":"...","reason":"quota_exhausted|daily_limit_reached"}，结束帧 data:[DONE]
 */
phonesRouter.post('/report', async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '参数不合法' });
    return;
  }
  const { deviceId, ...input } = parsed.data;
  try {
    // 1) 额度校验：免费额度 → 解锁额度 → 每日频控
    const quota = await getReportQuota(deviceId);
    if (quota.dailyExhausted) {
      sseError(res, 'daily_limit_reached', `今日生成次数已达上限（${quota.dailyLimit} 份），请明天再来`);
      return;
    }
    if (quota.needUnlock) {
      sseError(res, 'quota_exhausted', '免费额度已用完，观看一段短视频即可再生成 1 份');
      return;
    }
    // 2) 预扣额度（流完全失败时返还）
    const source: QuotaSource = quota.freeRemaining > 0 ? 'free' : 'unlocked';
    await consumeReportQuota(deviceId, source);
    try {
      await streamReport(
        res,
        input,
        HeaderUtils.extractForwardHeaders(req.headers as unknown as Record<string, string>),
        { deviceId, source },
      );
    } catch (e) {
      // streamReport 内部已 catch 自身错误（错误帧已发出）；此处防御性返还
      try {
        await refundReportQuota(deviceId, source);
      } catch (re) {
        console.error('[report] 返还额度失败:', re instanceof Error ? re.message : re);
      }
      throw e;
    }
  } catch (e) {
    // SSE 头可能已发出，只能以帧形式报错
    const msg = e instanceof Error ? e.message : '报告生成失败';
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

/**
 * 按 id 获取机型详情
 * GET /api/v1/phones/:id
 */
phonesRouter.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: '非法 id' });
      return;
    }
    const phone = await getPhoneById(id);
    if (!phone) {
      res.status(404).json({ error: '机型不存在' });
      return;
    }
    res.json({ data: phone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常';
    res.status(500).json({ error: msg });
  }
});