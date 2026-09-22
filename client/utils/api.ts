/**
 * 后端 API 客户端
 * 统一通过 EXPO_PUBLIC_BACKEND_BASE_URL 访问 Express 服务
 */
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? 'http://localhost:9091';

export interface ColorOption {
  /** 配色名称，如 勃艮第酒红 */
  name: string;
  /** 色值，如 #6B1F2A */
  hex: string;
  /** 该配色的 2.5D 渲染图 URL */
  image: string;
}

export interface PhoneModel {
  id: number;
  name: string;
  brand: string;
  chip_name: string;
  chip_generation: number;
  release_year: number;
  support_until_year: number;
  battery_cycle_standard: number;
  reference_score: number;
  image_url: string | null;
  is_latest: boolean;
  upgrade_model_id: number | null;
  /** 官网级完整硬件规格：{ 分区: { 参数名: 参数值 } } */
  specs?: Record<string, Record<string, string>> | null;
  /** 可选配色（含各配色渲染图） */
  colors?: ColorOption[] | null;
}

export interface Advice {
  type: 'keep' | 'battery' | 'replace';
  title: string;
  summary: string;
  reasons: string[];
}

export interface AnalysisResult {
  device: PhoneModel;
  latest: PhoneModel;
  upgrade: PhoneModel | null;
  metrics: {
    chipGap: number;
    chipScore: number;
    supportScore: number;
    performanceScore: number;
    remainingSupportYears: number;
    benchmarkRatio: number;
    batteryNeedReplace: boolean;
    effectiveBenchmarkScore: number;
    /** 用机画像折算出的性能需求档位 1-5（未选常用 App 时为 3） */
    usageDemand: number;
  };
  components: { chip: number; support: number; performance: number };
  score: number;
  advice: Advice;
  /** CPS 导购渠道是否已配置（true 时换机建议卡显示「京东导购」入口） */
  affiliateAvailable: boolean;
}

/** CPS 导购链接结果（京东联盟转链） */
export interface PurchaseLink {
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

export interface AnalysisInput {
  phoneId: number;
  benchmarkScore?: number;
  batteryHealth?: number;
  batteryCycles?: number;
  smoothness?: number;
  /** 常用 App 类型（用机画像）：social/video/game/photo/work/web */
  usageCategories?: string[];
}

/** 获取机型列表 */
export async function fetchPhones(): Promise<PhoneModel[]> {
  const res = await fetch(`${BASE_URL}/api/v1/phones`);
  if (!res.ok) throw new Error('机型列表加载失败');
  const json = await res.json();
  return json.data as PhoneModel[];
}

/** 换机分析评分 */
export async function fetchAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/v1/phones/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? '换机分析服务异常');
  }
  const json = await res.json();
  return json.data as AnalysisResult;
}

/**
 * 获取 CPS 导购链接（京东联盟转链）
 * 服务端文件：server/src/routes/phones.ts
 * 接口：GET /api/v1/phones/purchase-link
 * Query 参数：model:string（机型名，如 "iPhone 17 Pro"），budget?:number（预算上限，元）
 */
export async function fetchPurchaseLink(model: string, budget?: number): Promise<PurchaseLink> {
  const qs = new URLSearchParams({ model });
  if (budget != null) qs.set('budget', String(budget));
  const res = await fetch(`${BASE_URL}/api/v1/phones/purchase-link?${qs.toString()}`);
  if (!res.ok) throw new Error('导购服务异常');
  const json = await res.json();
  return json.data as PurchaseLink;
}