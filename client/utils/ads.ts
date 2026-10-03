/**
 * AdMob 激励视频服务（变现 v2：报告按次看广告）
 *
 * 职责：
 * - 广告单元 ID 从后端下发（GET /api/v1/app/config），TestFlight 阶段用 Google 测试 ID，
 *   上架后在服务端环境变量 AD_REWARDED_UNIT_ID_IOS 配置正式 ID，前端无需重新提审
 * - ATT（App Tracking Transparency）首次请求；拒绝则回退非个性化广告
 * - 封装 RewardedAd 的加载/展示为 Promise，供 RewardedAdModal 调用
 *
 * 平台限制：广告 SDK 仅 iOS/Android 可用；Web 预览由调用方（RewardedAdModal）走模拟逻辑。
 */
import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

import { BACKEND_BASE_URL } from '@/utils/api';

/** 后端未配置时兜底用的 Google 测试广告单元 */
const FALLBACK_TEST_UNIT_ID = TestIds.REWARDED;

export interface AdConfig {
  enabled: boolean;
  rewardedUnitId: string;
  isTestUnit: boolean;
}

let initPromise: Promise<void> | null = null;
let configCache: AdConfig | null = null;
let attRequested = false;

/** SDK 初始化（幂等） */
export function initAds(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  if (!initPromise) {
    initPromise = mobileAds()
      .initialize()
      .then(() => undefined)
      .catch((err: unknown) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

/**
 * 服务端文件：server/src/routes/app.ts
 * 接口：GET /api/v1/app/config → { data: { ad: { enabled: boolean, rewardedUnitId: string, isTestUnit: boolean } } }
 * 拉取失败/离线时兜底为 Google 测试广告单元，保证功能可用
 */
export async function getAdConfig(): Promise<AdConfig> {
  if (configCache) return configCache;
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/app/config`);
    if (res.ok) {
      const json = (await res.json()) as { data?: { ad?: AdConfig } };
      if (json.data?.ad?.rewardedUnitId) {
        configCache = {
          enabled: json.data.ad.enabled !== false,
          rewardedUnitId: json.data.ad.rewardedUnitId,
          isTestUnit: json.data.ad.isTestUnit === true,
        };
        return configCache;
      }
    }
  } catch {
    // 后端不可达 → 兜底测试 ID
  }
  configCache = { enabled: true, rewardedUnitId: FALLBACK_TEST_UNIT_ID, isTestUnit: true };
  return configCache;
}

export function clearAdConfigCache(): void {
  configCache = null;
}

/**
 * ATT 权限（iOS 专用，仅请求一次）。返回是否允许个性化广告。
 * Android 上无 ATT，直接视为允许（SDK 自有合规通道）。
 */
export async function ensureTrackingPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;
  if (attRequested) {
    const current = await TrackingTransparency.getTrackingPermissionsAsync();
    return current.status === 'granted';
  }
  attRequested = true;
  try {
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export interface ShowRewardedAdResult {
  /** 用户获得奖励（完整观看） */
  earned: boolean;
  /** 广告层失败（加载失败/超时/展示错误）——调用方据此走"放行"闭环 */
  failed: boolean;
}

/**
 * 加载并展示一个激励视频，Promise 化等待结果。
 * 超时（默认 12s）或 SDK 错误 → failed: true；用户关闭 → 按是否获得奖励返回。
 */
export async function showRewardedAd(unitId: string, personalized: boolean, timeoutMs = 12_000): Promise<ShowRewardedAdResult> {
  await initAds();
  const ad = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: !personalized,
  });

  return new Promise<ShowRewardedAdResult>((resolve) => {
    let earned = false;
    let settled = false;
    const unsubscribes: Array<() => void> = [];

    const settle = (result: ShowRewardedAdResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      unsubscribes.forEach((fn) => fn());
      resolve(result);
    };

    const timer = setTimeout(() => settle({ earned: false, failed: true }), timeoutMs);

    unsubscribes.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        // loaded 后立即展示；show 失败按 failed 处理
        ad.show().catch(() => settle({ earned: false, failed: true }));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        settle({ earned, failed: false });
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        settle({ earned: false, failed: true });
      })
    );

    ad.load();
  });
}
