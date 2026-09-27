/**
 * 诊断探针 1：零依赖最小函数
 * 用途：二分定位崩溃层。
 * - 若 /api/ping 也 500 → Vercel 基础运行时/配置问题（与业务代码无关）
 * - 若 /api/ping 200 而业务 500 → 崩溃在业务模块加载链
 * 注意：Vercel handler 收到的是原生 Node res（无 Express 方法），必须用 statusCode/end
 */
export default function handler(_req: unknown, res: import('http').ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, probe: 'ping' }));
}
