import { Router } from "express";
import { z } from "zod";
import {
  listPhones,
  getPhoneById,
  getLatestPhone,
  analyzeDevice,
  type DeviceInput,
} from "../services/phone-service";

export const phonesRouter = Router();

const analysisSchema = z.object({
  phoneId: z.number().int().positive(),
  benchmarkScore: z.number().int().nonnegative().optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
  batteryCycles: z.number().int().nonnegative().optional(),
  smoothness: z.number().min(1).max(5).optional(),
  usageCategories: z.array(z.enum(['social', 'video', 'game', 'photo', 'work', 'web'])).max(6).optional(),
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