import { getSupabaseClient } from '../storage/database/supabase-client';
import type { PhoneModel } from '../storage/database/shared/schema';
import { affiliateConfigured } from './affiliate';

/** 当前环境年份，用于计算系统支持剩余年限 */
const CURRENT_YEAR = new Date().getFullYear();

/** 电池健康度阈值：低于该值建议更换电池（Apple 一般标准） */
const BATTERY_HEALTH_THRESHOLD = 80;

export interface DeviceInput {
  /** 用户手机机型 id */
  phoneId: number;
  /** 实测跑分（用户填写，可为空时用机型参考跑分） */
  benchmarkScore?: number;
  /** 电池健康度百分比 0-100 */
  batteryHealth?: number;
  /** 已循环次数（可选） */
  batteryCycles?: number;
  /** 当前主流 App 实测流畅度自评 1-5（可选，5 最流畅） */
  smoothness?: number;
  /** 常用 App 类型（用机画像，可选）：social/video/game/photo/work/web */
  usageCategories?: string[];
  /** 输出语言（advice 文案语言，默认中文） */
  lang?: 'zh' | 'en';
}

/** 常用 App 类型 → 性能需求档位（1-5，档位越高对性能余量要求越严） */
const USAGE_DEMAND_MAP: Record<string, number> = {
  social: 3,
  video: 4,
  game: 5,
  photo: 4,
  work: 2,
  web: 2,
};

/** 常用 App 类型的中文标签（用于生成建议理由） */
const USAGE_LABELS: Record<string, string> = {
  social: '社交通讯',
  video: '视频',
  game: '游戏',
  photo: '拍照摄影',
  work: '办公学习',
  web: '网页购物',
};

/** 常用 App 类型的英文标签（用于生成建议理由） */
const USAGE_LABELS_EN: Record<string, string> = {
  social: 'social & messaging',
  video: 'video streaming',
  game: 'gaming',
  photo: 'photo & camera',
  work: 'work & study',
  web: 'web & shopping',
};

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
  /** CPS 导购渠道是否已配置（决定前端是否渲染「换机购买」入口） */
  affiliateAvailable: boolean;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * 获取全部机型（按芯片代差升序）
 */
export async function listPhones(): Promise<PhoneModel[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('phone_models')
    .select('*')
    .order('chip_generation', { ascending: true })
    .order('reference_score', { ascending: true });
  if (error) throw new Error(`查询机型失败: ${error.message}`);
  return (data ?? []) as PhoneModel[];
}

/**
 * 按 id 查询机型
 */
export async function getPhoneById(id: number): Promise<PhoneModel | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('phone_models')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`查询机型失败: ${error.message}`);
  return (data ?? null) as PhoneModel | null;
}

/**
 * 查询最新款机型
 */
export async function getLatestPhone(): Promise<PhoneModel> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('phone_models')
    .select('*')
    .order('chip_generation', { ascending: false })
    .order('reference_score', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`查询最新机型失败: ${error.message}`);
  if (!data) throw new Error('机型数据库为空');
  return data as PhoneModel;
}

/**
 * 计算芯片代差得分
 * 每落后 1 代扣分，落后越多衰减越快。
 */
function chipScoreByGap(gap: number): number {
  if (gap <= 0) return 100;
  if (gap === 1) return 88;
  if (gap === 2) return 76;
  if (gap === 3) return 62;
  if (gap === 4) return 44;
  if (gap === 5) return 28;
  return 14;
}

/**
 * 计算系统支持得分
 * 以官方支持剩余年限衡量：剩余越多分数越高。
 */
function supportScoreByYears(remaining: number): number {
  if (remaining >= 4) return 100;
  if (remaining >= 3) return 90;
  if (remaining >= 2) return 72;
  if (remaining >= 1) return 52;
  if (remaining >= 0) return 30;
  return 10;
}

/**
 * 换机综合评分 + 建议
 */
export async function analyzeDevice(input: DeviceInput): Promise<AnalysisResult> {
  const [device, latest] = await Promise.all([getPhoneById(input.phoneId), getLatestPhone()]);

  if (!device) throw new Error('机型不存在');

  // 实测跑分：优先用户填写，否则用机型参考跑分
  const effectiveBenchmark =
    input.benchmarkScore && input.benchmarkScore > 0
      ? input.benchmarkScore
      : device.reference_score;

  // 1) 芯片代差对比
  const chipGap = Math.max(0, latest.chip_generation - device.chip_generation);
  const chipScore = chipScoreByGap(chipGap);

  // 2) 系统支持周期
  const remainingSupportYears = device.support_until_year - CURRENT_YEAR;
  const supportScore = supportScoreByYears(remainingSupportYears);

  // 3) 实测性能：相对最新款参考跑分的性能余量
  const rawRatio = latest.reference_score > 0 ? effectiveBenchmark / latest.reference_score : 0;
  const benchmarkRatio = Math.min(1, rawRatio);
  let performanceScore = clamp(benchmarkRatio * 100);
  // 自评流畅度拉高/拉低：5 分满分，每分对应 8 分影响
  if (input.smoothness && input.smoothness >= 1 && input.smoothness <= 5) {
    performanceScore = clamp(performanceScore + (input.smoothness - 3) * 8);
  }

  // 4) 用机画像：常用 App 类型折算性能需求档位（未选时为 3，不产生影响）
  const demands = (input.usageCategories ?? [])
    .map((c) => USAGE_DEMAND_MAP[c])
    .filter((d): d is number => typeof d === 'number');
  const usageDemand = demands.length > 0 ? Math.max(...demands) : 3;
  // 需求档位拉高/拉低：重度使用（游戏/摄影/视频）对性能余量要求更严，轻量使用则放宽
  performanceScore = clamp(performanceScore + (3 - usageDemand) * 6);

  // 综合评分：芯片 40% / 系统支持 30% / 实测性能 30%
  const score = Math.round(clamp(chipScore * 0.4 + supportScore * 0.3 + performanceScore * 0.3));

  // 电池健康度判定
  const batteryNeedReplace =
    (input.batteryHealth !== undefined && input.batteryHealth !== null && input.batteryHealth < BATTERY_HEALTH_THRESHOLD) ||
    (input.batteryCycles !== undefined &&
      input.batteryCycles !== null &&
      input.batteryCycles > device.battery_cycle_standard);

  // 换机判定条件：
  // a) 芯片落后最新款多个世代（>= 4 代，硬件存在明显代差）
  // b) 已超出系统支持周期（剩余 <= 0）
  // c) 实测性能明显吃紧（跑分相对最新款 < 55 / 流畅度低）
  const chipObsolete = chipGap >= 4;
  const outOfSupport = remainingSupportYears <= 0;
  const perfLagging = performanceScore < 55;

  // advice 文案语言（lang 由前端按版本传入：cn 版中文 / intl 版英文）
  const isEn = input.lang === 'en';
  const usageLabels = isEn ? USAGE_LABELS_EN : USAGE_LABELS;
  const usageLabelList = (input.usageCategories ?? [])
    .filter((c) => usageLabels[c])
    .map((c) => usageLabels[c])
    .join(isEn ? ', ' : '、');
  const batteryHealthText =
    input.batteryHealth !== undefined && input.batteryHealth !== null
      ? `${input.batteryHealth}%`
      : isEn
        ? 'below the threshold'
        : '低于阈值';
  const perfPercent = Math.round(benchmarkRatio * 100);

  let advice: Advice;
  if (chipObsolete || outOfSupport || perfLagging) {
    const reasons: string[] = [];
    if (chipObsolete) {
      reasons.push(
        isEn
          ? `The ${device.chip_name} chip trails the latest chip by ${chipGap} generation(s) — a clear performance gap`
          : `芯片${device.chip_name}比最新款落后 ${chipGap} 个世代，处理性能存在明显代差`,
      );
    }
    if (outOfSupport) {
      reasons.push(
        isEn
          ? `Official software support has ended (last supported year: ${device.support_until_year}) — no more OS or security updates`
          : `已超出官方系统支持周期（支持至 ${device.support_until_year} 年），无法获得最新系统与安全更新`,
      );
    }
    if (perfLagging) {
      reasons.push(
        isEn
          ? `Benchmark (${effectiveBenchmark}) is only about ${perfPercent}% of the latest model — mainstream apps will struggle`
          : `实测跑分（${effectiveBenchmark}）相对最新款仅 ${perfPercent}%，运行主流 App 明显吃力`,
      );
    }
    if (usageDemand >= 4) {
      reasons.push(
        isEn
          ? `Your daily apps are mostly ${usageLabelList} — these scenarios demand more headroom, which older hardware struggles to deliver`
          : `常用 App 以${usageLabelList}类为主，这类场景对性能余量要求更高，老旧机型重载时会明显吃力`,
      );
    }
    advice = {
      type: 'replace',
      title: isEn ? 'Time to upgrade' : '建议换机',
      summary: isEn
        ? 'Your device has reached the end of its lifecycle — keeping it means living with performance and security compromises.'
        : '你的设备已进入生命周期尾声，继续使用会面临性能与安全短板。',
      reasons,
    };
  } else if (batteryNeedReplace) {
    advice = {
      type: 'battery',
      title: isEn ? 'Replace the battery' : '建议更换电池',
      summary: isEn
        ? 'Overall performance is still fine, but battery health has dropped below the threshold — expect weaker endurance and stability.'
        : '设备整体性能仍够用，但电池健康度已跌破阈值，续航与稳定性受到影响。',
      reasons: [
        isEn
          ? `Battery health is at ${batteryHealthText} (below the 80% threshold)`
          : `当前电池健康度 ${batteryHealthText}，低于 80% 建议更换`,
        isEn
          ? input.batteryCycles !== undefined &&
            input.batteryCycles !== null &&
            input.batteryCycles > device.battery_cycle_standard
            ? `Charge cycles (${input.batteryCycles}) exceed the rated ${device.battery_cycle_standard} for this model`
            : `This model is rated for ${device.battery_cycle_standard} charge cycles`
          : input.batteryCycles !== undefined &&
              input.batteryCycles !== null &&
              input.batteryCycles > device.battery_cycle_standard
            ? `循环次数（${input.batteryCycles}）已超过该机型设计标准（${device.battery_cycle_standard} 次）`
            : `该机型电池设计循环标准为 ${device.battery_cycle_standard} 次`,
        isEn
          ? 'A battery swap restores full endurance and extends the life of this device'
          : '更换电池后即可恢复满血续航，延续使用',
      ],
    };
  } else {
    advice = {
      type: 'keep',
      title: isEn ? 'Still good for 2–3 years' : '还能战 2-3 年',
      summary: isEn
        ? 'Your device has plenty of performance headroom and is still within its support window — more than enough for daily and mainstream use.'
        : '你的设备性能冗余充足，系统仍在支持周期内，完全满足日常及主流 App 需求。',
      reasons: [
        isEn
          ? `The ${device.chip_name} chip is only ${chipGap} generation(s) behind the latest — ample headroom`
          : `芯片${device.chip_name}与最新款仅相差 ${chipGap} 个世代，处理性能冗余充足`,
        isEn
          ? `Roughly ${remainingSupportYears} year(s) of official software support remain`
          : `官方系统支持剩余约 ${remainingSupportYears} 年，仍可正常更新`,
        isEn
          ? `Real-world performance is about ${perfPercent}% of the latest model — mainstream apps run smoothly`
          : `实测性能约达最新款的 ${perfPercent}%，流畅运行主流 App`,
        ...(usageDemand <= 2
          ? [
              isEn
                ? 'Your daily apps are mostly lightweight — everyday use stays effortless'
                : '常用 App 以轻量场景为主，对性能要求不高，日常使用依然从容',
            ]
          : []),
      ],
    };
  }

  const upgrade =
    !device.upgrade_model_id || device.is_latest
      ? null
      : await getPhoneById(device.upgrade_model_id);

  return {
    device,
    latest,
    upgrade,
    metrics: {
      chipGap,
      chipScore,
      supportScore,
      performanceScore: Math.round(performanceScore),
      remainingSupportYears,
      benchmarkRatio: Math.round(benchmarkRatio * 100),
      batteryNeedReplace,
      effectiveBenchmarkScore: effectiveBenchmark,
      usageDemand,
    },
    components: {
      chip: Math.round(chipScore),
      support: Math.round(supportScore),
      performance: Math.round(performanceScore),
    },
    score,
    advice,
    affiliateAvailable: affiliateConfigured(),
  };
}