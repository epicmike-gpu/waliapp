/**
 * 开发/预览链路代理：/api/* → 本地 Express 服务（9091）
 *
 * 链路说明：
 * - Expo Go（原生端）：App 经隧道访问 https://<tunnel-host>/api/v1/* → Expo dev server → 此路由 → localhost:9091
 * - Web 预览：同源相对路径 /api/v1/* → 平台网关 → Expo dev server → 此路由 → localhost:9091
 * - 生产构建不经过此文件（客户端直接使用 EXPO_PUBLIC_BACKEND_BASE_URL 绝对地址）
 */

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `http://localhost:9091${url.pathname}${url.search}`;

  const init: RequestInit = { method: request.method, headers: request.headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const res = await fetch(target, init);
    const body = await res.arrayBuffer();
    const headers = new Headers();
    const contentType = res.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    return new Response(body, { status: res.status, headers });
  } catch {
    return Response.json({ error: 'backend_unreachable' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
