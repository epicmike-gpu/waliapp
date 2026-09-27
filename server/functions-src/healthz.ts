/**
 * 终极诊断探针：路径 /api/healthz（rewrite 排除，100% 直连本函数）
 * 返回运行时环境信息（只列环境变量名，不返回值），用于定位 Vercel 函数崩溃层。
 * 注意：Vercel handler 收到的是原生 Node res（无 Express 方法），必须用 statusCode/end
 */
export default function handler(_req: unknown, res: import('http').ServerResponse) {
  const safeEnvKeys = Object.keys(process.env).filter(
    (k) => k.includes('COZE') || k.includes('SUPABASE') || k === 'NODE_ENV' || k === 'VERCEL_REGION'
  );
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      ok: true,
      probe: 'healthz',
      node: process.version,
      region: process.env.VERCEL_REGION ?? 'unknown',
      envKeys: safeEnvKeys,
    })
  );
}
