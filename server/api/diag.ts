/**
 * 诊断探针 2：全业务链加载
 * 用途：import 完整 Express 应用（含全部路由/服务/SDK）。
 * - 若 /api/ping 200 而 /api/diag 500 → 崩溃在业务模块加载链（配合 Runtime Logs 堆栈定位具体模块）
 */
import type { Request } from 'express';
import app from '../src/app.js';

export default function handler(req: unknown, res: unknown) {
  return app(req as Request, res as never);
}
