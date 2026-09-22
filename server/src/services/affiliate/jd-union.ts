/**
 * 京东联盟开放平台（CPS 导购）适配器
 *
 * 协议文档：union.jd.com「联盟开放平台 API」
 * - 网关：https://api.jd.com/routerjson
 * - 签名：v1.0 MD5 签名（参数按 key 升序拼接，首尾拼 secretKey，MD5 大写）
 * - 核心接口：
 *   - union.open.goods.query          关键词查询推广商品（图片/价格/佣金）
 *   - union.open.promotion.common.get 转链（生成带 UnionID 追踪的 cpLink）
 *
 * 接入配置（环境变量，缺省时本适配器自动降级为「未开通」状态）：
 *   JD_UNION_APP_KEY      联盟开放平台 appKey
 *   JD_UNION_SECRET_KEY   联盟开放平台 secretKey
 *   JD_UNION_UNION_ID     联盟 ID（数字）
 *   JD_UNION_POSITION_ID  推广位 ID（App 推广位，数字）
 */
import { createHash } from 'node:crypto';

const GATEWAY = 'https://api.jd.com/routerjson';

const APP_KEY = process.env.JD_UNION_APP_KEY ?? '';
const SECRET_KEY = process.env.JD_UNION_SECRET_KEY ?? '';
const UNION_ID = Number(process.env.JD_UNION_UNION_ID ?? 0);
const POSITION_ID = Number(process.env.JD_UNION_POSITION_ID ?? 0);

/** 联盟密钥是否已配置（未配置时上层应隐藏导购入口） */
export function isJdUnionConfigured(): boolean {
  return Boolean(APP_KEY && SECRET_KEY && UNION_ID);
}

/** 北京时间 yyyy-MM-dd HH:mm:ss（京东网关要求东八区时间戳） */
function beijingTimestamp(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/** v1.0 MD5 签名：按 key ASCII 升序拼 key+value，首尾拼 secretKey，MD5 大写 */
function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');
  return createHash('md5')
    .update(`${SECRET_KEY}${sorted}${SECRET_KEY}`, 'utf8')
    .digest('hex')
    .toUpperCase();
}

/** 调用京东联盟网关并解包结果（routerjson 的响应节点名为「接口名下划线 + _responce」） */
async function callApi(method: string, bizParams: Record<string, unknown>): Promise<Record<string, unknown>> {
  const common: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp: beijingTimestamp(),
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    '360buy_param_json': JSON.stringify(bizParams),
  };
  const body = new URLSearchParams({ ...common, sign: sign(common) }).toString();

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  if (!res.ok) throw new Error(`京东联盟网关 HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, any>;

  const nodeKey = `${method.replace(/\./g, '_')}_responce`;
  const node = json?.[nodeKey];
  if (!node || node.code !== '0') {
    throw new Error(node?.zh_desc ?? node?.msg ?? `京东联盟接口 ${method} 返回异常`);
  }
  // 结果值在 code/zh_desc 之外的键中，且多为 JSON 字符串需二次解析
  const resultKey = Object.keys(node).find((k) => k !== 'code' && k !== 'zh_desc' && k !== 'msg');
  const raw = node?.[resultKey ?? ''];
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>;
}

/** 关键词查询推广商品（返回按佣金与价格整理后的候选列表） */
async function queryGoods(keyword: string): Promise<JdGoods[]> {
  const result = await callApi('union.open.goods.query', {
    keyword,
    pageIndex: 1,
    pageSize: 8,
  });
  const list = (result?.list ?? result?.data ?? []) as Record<string, any>[];
  return list.map((g) => ({
    skuId: Number(g.skuId),
    goodsName: String(g.goodsName ?? ''),
    price: Number(g.priceInfo?.price ?? g.priceInfo?.lowestPrice ?? 0),
    image: String(
      g.imageInfo?.imageList?.[0]?.url ?? g.imageInfo?.whiteImage ?? ''
    ),
    commission: Number(g.commissionInfo?.commission ?? 0),
  }));
}

/** 生成 CPS 追踪链接（cpLink）：用户点击下单后佣金归属本推广位 */
async function buildPromotionLink(skuId: number): Promise<string> {
  const result = await callApi('union.open.promotion.common.get', {
    materialId: `https://item.jd.com/${skuId}.html`,
    unionId: UNION_ID,
    ...(POSITION_ID ? { positionId: POSITION_ID } : {}),
  });
  const url = String(result?.clickURL ?? '');
  if (!url) throw new Error('京东联盟转链结果为空');
  return url;
}

/** 查询到的候选商品（内部结构） */
interface JdGoods {
  skuId: number;
  goodsName: string;
  price: number;
  image: string;
  commission: number;
}

/**
 * 按机型名获取京东 CPS 导购链接
 * @param modelName 机型名（如 "iPhone 17 Pro"）
 * @param budget 预算上限（元），过滤价格高于预算的商品；不传则取首个结果
 */
export async function getJdUnionPurchaseLink(
  modelName: string,
  budget?: number
): Promise<JdPurchaseLinkResult> {
  if (!isJdUnionConfigured()) {
    return { available: false, reason: 'jd_union_not_configured' };
  }
  try {
    const goods = await queryGoods(modelName);
    const pool = budget && budget > 0 ? goods.filter((g) => g.price > 0 && g.price <= budget) : goods;
    const target = pool[0];
    if (!target) return { available: false, reason: 'no_goods_matched' };

    const url = await buildPromotionLink(target.skuId);
    return {
      available: true,
      platform: 'jd_union',
      url,
      goodsTitle: target.goodsName,
      price: target.price,
      image: target.image,
      commission: target.commission,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '京东联盟接口调用失败';
    return { available: false, reason: 'jd_union_api_error', error: msg };
  }
}

/** 导购链接结果（统一结构，affiliate/index.ts 按平台分发后返回） */
export interface JdPurchaseLinkResult {
  available: boolean;
  reason?: string;
  error?: string;
  platform?: string;
  url?: string;
  goodsTitle?: string;
  price?: number;
  image?: string;
  commission?: number;
}
