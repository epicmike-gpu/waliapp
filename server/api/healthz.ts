/**
 * 终极诊断探针：路径 /healthz（不在 /api/* 下，100% 不受 rewrite 影响）
 * 返回运行时环境信息（只列环境变量名，不返回值），用于定位 Vercel 函数崩溃层。
 */
export default function handler(_req: unknown, res: { status: (n: number) => { json: (d: unknown) => void } }) {
  const safeEnvKeys = Object.keys(process.env).filter(
    (k) => k.includes('COZE') || k.includes('SUPABASE') || k === 'NODE_ENV' || k === 'VERCEL_REGION'
  );
  res.status(200).json({
    ok: true,
    probe: 'healthz',
    node: process.version,
    region: process.env.VERCEL_REGION ?? 'unknown',
    envKeys: safeEnvKeys,
  });
}
