/**
 * AI 对比报告服务
 *
 * 将两台机型的规格与用户旧机检测数据交给 LLM，生成 7 个角度的专业对比报告，
 * 并以 SSE（Server-Sent Events）流式写出。报告不落库，实时生成实时消费。
 *
 * LLM 通道：直连 Coze 官方 OpenAPI（v3/chat，SSE 流式）。
 * - 生产环境（Vercel）与本地共用同一通道，凭证：COZE_API_TOKEN（PAT）+ COZE_BOT_ID
 * - 平台 SDK 的 LLMClient 依赖沙箱内部网关凭证（sat_/workload identity），无法在 Vercel 使用，故弃用
 */
import type { Response } from "express";
import { getPhoneById } from "./phone-service";
import type { PhoneModel } from "../storage/database/shared/schema";

/** Coze 官方 OpenAPI 配置 */
const COZE_API_BASE = process.env.COZE_API_BASE ?? "https://api.coze.cn";
const COZE_API_TOKEN = process.env.COZE_API_TOKEN ?? "";
const COZE_BOT_ID = process.env.COZE_BOT_ID ?? "";

/** OpenAI 风格消息结构 */
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 报告请求参数（路由层已完成 zod 校验） */
export interface ReportInput {
  currentPhoneId: number;
  targetPhoneId: number;
  batteryHealth?: number;
  batteryCycles?: number;
  usageCategories?: string[];
  /** 报告语言：zh 简体中文 / en English */
  lang: "zh" | "en";
}

/** 报告固定章节结构（中/英标题，供 system prompt 与前端 TL;DR 识别） */
const SECTIONS_ZH = ["结论先行", "性能与流畅度", "影像系统", "电池与续航", "系统支持周期", "保值与转售", "升级性价比", "行动建议"];
const SECTIONS_EN = ["Verdict", "Performance", "Camera", "Battery", "Software Support", "Resale Value", "Upgrade Value", "Action Plan"];

/** 提取喂给 LLM 的机型关键数据（去掉渲染图等无关字段） */
function pickPhone(p: PhoneModel) {
  return {
    name: p.name,
    brand: p.brand,
    chip: p.chip_name,
    chipGeneration: p.chip_generation,
    releaseYear: p.release_year,
    supportUntilYear: p.support_until_year,
    batteryCycleStandard: p.battery_cycle_standard,
    referenceScore: p.reference_score,
    isLatest: p.is_latest,
    specs: p.specs ?? null,
  };
}

const USAGE_LABELS_ZH: Record<string, string> = {
  social: "社交聊天",
  video: "视频追剧",
  game: "游戏",
  photo: "拍照摄影",
  work: "办公效率",
  web: "网页阅读",
};
const USAGE_LABELS_EN: Record<string, string> = {
  social: "Social & messaging",
  video: "Video streaming",
  game: "Gaming",
  photo: "Photography",
  work: "Productivity",
  web: "Web reading",
};

async function buildMessages(input: ReportInput): Promise<ChatMessage[]> {
  const zh = input.lang !== "en";
  const sections = zh ? SECTIONS_ZH : SECTIONS_EN;
  const usageLabels = zh ? USAGE_LABELS_ZH : USAGE_LABELS_EN;

  const usage = (input.usageCategories ?? [])
    .map((c) => usageLabels[c] ?? c)
    .filter(Boolean);

  const system = [
    "You are a senior mobile device review editor writing a phone upgrade comparison report. 你的读者是普通用户，不是参数党。",
    zh
      ? "请用简体中文输出。"
      : "Please write in English.",
    "",
    "核心原则：不要罗列参数，把参数差异翻译成用户能感知的体感差别（卡顿、续航天数、照片成片率、二手卖价等）。",
    "",
    "输出格式（严格遵守，markdown）:",
    `- 全文必须且只能包含以下 ${sections.length} 个章节，每个章节以 "## 标题" 独立成行开始：${sections.map((s) => `## ${s}`).join(" → ")}`,
    '- 每个章节正文 2~4 句话，关键数字与机型名用 **加粗**（如 **2 代**、**87%**、**A19 Pro**）',
    "- 第一章节（结论先行）不超过 3 句：先给出明确结论（建议换机 / 不建议换 / 可再观望），再用一句话说明最核心理由",
    "- 最后一章节（行动建议）给出可执行清单（用 - 开头的列表，2~3 条）",
    "- 直接输出正文，禁止任何开场白、结尾客套、代码块包裹",
    `- 全文总长度控制在 ${zh ? "600~900 字" : "450~650 words"}`,
  ].join("\n");

  const [current, target] = await Promise.all([
    getPhoneById(input.currentPhoneId),
    getPhoneById(input.targetPhoneId),
  ]);
  if (!current) throw new Error(`机型不存在 (id=${input.currentPhoneId})`);
  if (!target) throw new Error(`机型不存在 (id=${input.targetPhoneId})`);

  const user = [
    `=== 用户旧机 ===`,
    JSON.stringify(pickPhone(current), null, 0),
    ``,
    `=== 对比目标机 ===`,
    JSON.stringify(pickPhone(target), null, 0),
    ``,
    `=== 用户真实使用数据（可选，缺失则忽略该项并按通用场景评估）===`,
    input.batteryHealth != null
      ? `- 旧机电池最大容量：${input.batteryHealth}%`
      : `- 旧机电池最大容量：未提供`,
    input.batteryCycles != null
      ? `- 旧机充电循环次数：${input.batteryCycles} 次`
      : `- 旧机充电循环次数：未提供`,
    usage.length > 0 ? `- 常用场景：${usage.join("、")}` : `- 常用场景：未提供`,
    ``,
    zh
      ? "请基于以上数据生成对比报告。若旧机电池健康度低于 80%，必须在电池章节明确提示「更换电池可能比换机更划算」的判断。"
      : "Generate the comparison report based on the data above. If the old phone's battery health is below 80%, you must address in the battery section whether replacing the battery alone would be more cost-effective.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * 调用 Coze 官方 OpenAPI v3/chat（SSE 流式），解析增量文本并回调
 *
 * Coze SSE 事件结构（event: 行 + data: 行成对出现）：
 * - event: conversation.message.delta + data: {"type":"answer","content":"增量文本",...}
 * - event: conversation.chat.completed / failed
 * - data: "[DONE]" 结束标记
 */
async function streamCozeChat(messages: ChatMessage[], onDelta: (text: string) => void): Promise<void> {
  if (!COZE_API_TOKEN || !COZE_BOT_ID) {
    throw new Error("LLM 未配置：请在环境变量中设置 COZE_API_TOKEN 与 COZE_BOT_ID");
  }

  const resp = await fetch(`${COZE_API_BASE}/v3/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COZE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: COZE_BOT_ID,
      user_id: "wali-report",
      stream: true,
      auto_save_history: false,
      additional_messages: messages,
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Coze API ${resp.status}: ${errText.slice(0, 200)}`);
  }

  // 非 SSE 的 JSON 响应 = 业务错误（如 Bot 未发布 API 渠道 code=4015），必须显式抛出
  const contentType = resp.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await resp.json().catch(() => ({}))) as { code?: number; msg?: string };
    throw new Error(`Coze API${data.code ? ` code=${data.code}` : ""}: ${data.msg ?? "unknown error"}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let eventName = "";

  const handleLine = (rawLine: string): void => {
    const line = rawLine.trimEnd();
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      return;
    }
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let evt: Record<string, unknown>;
    try {
      evt = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return; // 非 JSON data 帧忽略
    }
    if (eventName === "conversation.message.delta") {
      if (evt.type === "answer" && typeof evt.content === "string" && evt.content) {
        onDelta(evt.content);
      }
    } else if (eventName === "conversation.chat.failed" || eventName === "error") {
      const msg = (evt.last_error as { msg?: string })?.msg ?? String(evt.msg ?? "chat failed");
      throw new Error(`Coze chat failed: ${msg}`);
    }
    eventName = "";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      handleLine(buf.slice(0, idx));
      buf = buf.slice(idx + 1);
    }
  }
  if (buf.trim()) handleLine(buf); // 冲刷残余
}

/**
 * 生成报告并以 SSE 流式写出
 *
 * SSE 帧格式：
 * - 增量内容：data: {"text":"..."}
 * - 结束帧：  data: [DONE]
 */
export async function streamReport(
  res: Response,
  input: ReportInput,
  _forwardHeaders?: Record<string, string>,
): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, no-transform, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as unknown as { flushHeaders?: () => void }).flushHeaders?.();

  let clientClosed = false;
  res.on("close", () => {
    clientClosed = true;
  });

  try {
    const messages = await buildMessages(input);
    await streamCozeChat(messages, (text) => {
      if (clientClosed || !text) return;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });
    if (!clientClosed) res.write("data: [DONE]\n\n");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "报告生成失败";
    console.error("[report] stream error:", msg);
    if (!clientClosed) {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write("data: [DONE]\n\n");
    }
  } finally {
    res.end();
  }
}
