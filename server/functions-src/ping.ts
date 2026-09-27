/**
 * 诊断探针 1：零依赖最小函数
 * 用途：与 /api/diag 对照，二分定位 FUNCTION_INVOCATION_FAILED 的崩溃层。
 * - 若 /api/ping 也 500 → Vercel 基础运行时/配置问题（与业务代码无关）
 * - 若 /api/ping 200 而 /api/diag 500 → 崩溃在业务模块加载链
 */
export default function handler(_req: unknown, res: { status: (n: number) => { json: (d: unknown) => void } }) {
  res.status(200).json({ ok: true, probe: 'ping' });
}
