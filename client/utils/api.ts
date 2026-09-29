/**
 * 后端 API 客户端
 *
 * BASE 解析优先级：
 * 1. 显式 EXPO_PUBLIC_BACKEND_BASE_URL（生产构建/eas build 注入）
 * 2. Web 预览：同源相对路径（平台网关 → Expo API 路由代理 → 9091）
 * 3. Expo Go 原生端：运行时读取 hostUri（隧道域名）→ 同一条隧道 → Expo API 路由代理 → 9091
 * 4. 兜底 localhost:9091（同机直连）
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import EventSource, { type EventSourceOptions } from 'react-native-sse';
import { EDITION } from '@/config/edition';

function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  if (Platform.OS === 'web') return '';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
      return `https://${host}`;
    }
  }
  return 'http://localhost:9091';
}

const BASE_URL = resolveBaseUrl();

export interface ColorOption {
  /** 配色名称（中文版），如 勃艮第酒红 */
  name: string;
  /** 配色名称（英文版，intl 版优先使用），如 Burgundy Red */
  name_en?: string;
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
  /** 官网级完整硬件规格：{ 分区: { 参数名: 参数值 } }（中文） */
  specs?: Record<string, Record<string, string>> | null;
  /** 官网级完整硬件规格（英文版，intl 版优先使用） */
  specs_en?: Record<string, Record<string, string>> | null;
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
  /** advice 输出语言：cn 版 'zh' / 海外版 'en'，默认 'zh' */
  lang?: 'zh' | 'en';
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

/** AI 报告的请求参数 */
export interface CompareReportInput {
  /** 用户旧机机型 id */
  currentPhoneId: number;
  /** 对比目标机型 id */
  targetPhoneId: number;
  /** 旧机电池最大容量（%），可选 */
  batteryHealth?: number;
  /** 旧机充电循环次数，可选 */
  batteryCycles?: number;
  /** 常用 App 类型（用机画像），可选 */
  usageCategories?: string[];
}

/** 设备报告额度快照（后端 report-quota.ts ReportQuota） */
export interface ReportQuota {
  freeRemaining: number;
  unlockedRemaining: number;
  dailyRemaining: number;
  dailyLimit: number;
  needUnlock: boolean;
  dailyExhausted: boolean;
  totalReports: number;
  freeQuota: number;
  dailyUnlockLimit: number;
}

/** 强制更新配置（后端 routes/app.ts） */
export interface AppVersionConfig {
  minVersion: string;
  latestVersion: string;
  updateUrl: string;
  forceUpdate: boolean;
}

/** AI 报告流式回调 */
export interface CompareReportHandlers {
  /** 收到增量文本（每帧调用，内容需自行拼接） */
  onText: (chunk: string) => void;
  /** 生成失败（服务端错误帧或连接异常）；reason 为机器可读错误码（quota_exhausted / daily_limit_reached / 其他为空） */
  onError: (message: string, reason?: string) => void;
  /** 流结束（无论成功失败都会触发，成功后可安全关闭连接） */
  onDone: () => void;
}

export interface CompareReportHandle {
  close: () => void;
}

/**
 * 打开 AI 对比报告 SSE 流（实时逐块接收，报告不落库）
 * 服务端文件：server/src/routes/phones.ts（POST /report → services/report-service.ts streamReport）
 * 接口：POST /api/v1/phones/report（响应 text/event-stream）
 * Body 参数：currentPhoneId:number, targetPhoneId:number, batteryHealth?:number,
 *            batteryCycles?:number, usageCategories?:('social'|'video'|'game'|'photo'|'work'|'web')[],
 *            lang?:'zh'|'en', deviceId:string（额度记账，必填）
 * SSE 帧：增量 data:{"text":"..."}；服务端错误 data:{"error":"...","reason":"quota_exhausted|daily_limit_reached"}；结束 data:[DONE]
 * 返回句柄用于取消（页面卸载时必须调用 close()）
 */
export function openCompareReportStream(
  input: CompareReportInput,
  deviceId: string,
  handlers: CompareReportHandlers
): CompareReportHandle {
  const lang = EDITION === 'intl' ? 'en' : 'zh';
  const payload = { ...input, lang, deviceId };
  let done = false;

  const options: EventSourceOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // 禁用库内置的自动重连（报告流为一次性任务，断线应交给用户重试）
    pollingInterval: 0,
    timeout: 300000,
  };
  const es = new EventSource(`${BASE_URL}/api/v1/phones/report`, options);

  const finish = () => {
    if (done) return;
    done = true;
    es.close();
    handlers.onDone();
  };

  es.addEventListener('message', (evt) => {
    const data = evt?.data;
    if (!data) return;
    if (data === '[DONE]') {
      finish();
      return;
    }
    try {
      const frame = JSON.parse(data) as { text?: string; error?: string; reason?: string };
      if (frame.error) {
        handlers.onError(frame.error, frame.reason);
        finish();
        return;
      }
      if (frame.text) handlers.onText(frame.text);
    } catch {
      // 非 JSON 帧忽略
    }
  });

  es.addEventListener('error', () => {
    // 库在连接关闭/异常时都会派发 error；若任务已正常完成则忽略
    if (done) return;
    handlers.onError('连接中断，请重试');
    finish();
  });

  return {
    close: () => {
      done = true;
      es.close();
    },
  };
}

/**
 * 查询设备报告额度（免费剩余/解锁剩余/今日剩余）
 * 服务端文件：server/src/routes/reports.ts
 * 接口：GET /api/v1/reports/quota
 * Query 参数：deviceId:string（设备唯一标识）
 */
export async function fetchReportQuota(deviceId: string): Promise<ReportQuota> {
  const qs = new URLSearchParams({ deviceId });
  const res = await fetch(`${BASE_URL}/api/v1/reports/quota?${qs.toString()}`);
  if (!res.ok) throw new Error('额度查询失败');
  const json = await res.json();
  return json.data as ReportQuota;
}

/**
 * 激励视频观看完成 → 解锁 1 份报告生成额度
 * 服务端文件：server/src/routes/reports.ts
 * 接口：POST /api/v1/reports/unlock
 * Body 参数：deviceId:string
 */
export async function unlockReportQuota(deviceId: string): Promise<{ unlockedRemaining: number; dailyUnlocksRemaining: number }> {
  const res = await fetch(`${BASE_URL}/api/v1/reports/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) throw new Error('解锁失败');
  const json = await res.json();
  return json.data as { unlockedRemaining: number; dailyUnlocksRemaining: number };
}

/**
 * 获取 App 版本与强制更新配置
 * 服务端文件：server/src/routes/app.ts
 * 接口：GET /api/v1/app/version
 */
export async function fetchAppVersion(): Promise<AppVersionConfig> {
  const res = await fetch(`${BASE_URL}/api/v1/app/version`);
  if (!res.ok) throw new Error('版本配置获取失败');
  const json = await res.json();
  return json.data as AppVersionConfig;
}