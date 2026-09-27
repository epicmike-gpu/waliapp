import app from "../src/app";
import { ensurePhoneModelsSeeded } from "../src/storage/database/seed";

// Hobby 计划函数上限 60s：AI 对比报告（SSE 流式）实测 15~40s
export const maxDuration = 60;

// Serverless 无常驻 listen：seed 自举在首个请求时执行一次（幂等，模块级缓存）
let bootstrap: Promise<void> | null = null;

function ensureBootstrap(): Promise<void> {
  if (!bootstrap) {
    bootstrap = ensurePhoneModelsSeeded().catch((error) => {
      console.error('[bootstrap] seed failed:', error);
    });
  }
  return bootstrap;
}

export default async function handler(req: import('express').Request, res: import('express').Response) {
  try {
    await ensureBootstrap();
    return await app(req, res);
  } catch (error) {
    // 完整堆栈写入 Vercel Runtime Logs，便于远端排障
    console.error('[handler] unhandled error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'internal error',
        detail: error instanceof Error ? error.message : String(error),
      });
    } else {
      res.end();
    }
  }
}
