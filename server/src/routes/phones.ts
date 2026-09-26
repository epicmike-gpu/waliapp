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
import { HeaderUtils } from "coze-coding-dev-sdk";

export const phonesRouter = Router();

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
});

/**
 * AI 对比报告（SSE 流式，POST）
 * POST /api/v1/phones/report
 * Body: currentPhoneId:number, targetPhoneId:number, batteryHealth?:number, batteryCycles?:number,
 *        usageCategories?:('social'|'video'|'game'|'photo'|'work'|'web')[], lang?:'zh'|'en'
 * 响应：text/event-stream，增量帧 data:{"text":"..."}，结束帧 data:[DONE]
 */
phonesRouter.post('/report', async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '参数不合法' });
    return;
  }
  try {
    await streamReport(
      res,
      parsed.data,
      HeaderUtils.extractForwardHeaders(req.headers as unknown as Record<string, string>)
    );
  } catch (e) {
    // SSE 头已发出，只能以帧形式报错
    const msg = e instanceof Error ? e.message : '报告生成失败';
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
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