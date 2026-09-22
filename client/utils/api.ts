/**
 * 后端 API 客户端
 * 统一通过 EXPO_PUBLIC_BACKEND_BASE_URL 访问 Express 服务
 */
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? 'http://localhost:9091';

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