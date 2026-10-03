/**
 * 激励视频组件（变现 v2：AdMob 真广告）
 *
 * - iOS/Android：ATT 首次请求 → 后端下发的广告单元 ID → AdMob 激励视频
 *   · 完整观看（EARNED_REWARD + CLOSED）→ 'completed'
 *   · 提前关闭 → 'abandoned'
 *   · 加载失败/超时/全局关停 → 'failed'（调用方放行本次生成并打点）
 * - Web：广告 SDK 不可用，保留开发用模拟倒计时（'completed'）
 *
 * 对外接口保持不变：visible + onClose(result)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { t } from '@/i18n';
import { ensureTrackingPermission, getAdConfig, showRewardedAd } from '@/utils/ads';

const MOCK_DURATION_MS = 5000;

export type RewardedAdResult = 'completed' | 'abandoned' | 'failed';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: (result: RewardedAdResult) => void;
}

/** 文件顶层定义子组件（引用稳定，防止倒计时重挂载） */
function MockProgressBar({ progress }: { progress: Animated.Value }) {
  return (
    <View style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: '#00F0FF',
          borderRadius: 3,
          transform: [{ scaleX: progress }],
          width: '100%',
        }}
      />
    </View>
  );
}

/** 加载态视图（native 广告加载中） */
function AdLoadingView({ isTestUnit }: { isTestUnit: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <ActivityIndicator size="large" color="#00F0FF" />
      <Text style={{ color: '#8a8aa0', fontSize: 13 }}>{t('ad.loading')}</Text>
      {isTestUnit ? (
        <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(0,240,255,0.10)' }}>
          <Text style={{ color: '#00F0FF', fontSize: 11, fontWeight: '700' }}>{t('ad.testNotice')}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Web 开发用模拟倒计时视图 */
function MockAdView({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [remainingMs, setRemainingMs] = useState(MOCK_DURATION_MS);
  const progress = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    setRemainingMs(MOCK_DURATION_MS);
    progress.setValue(0);

    const startAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startAt;
      const left = Math.max(0, MOCK_DURATION_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        clearInterval(timer);
        onDone();
      }
    }, 100);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: MOCK_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();

    return () => {
      clearInterval(timer);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onSkip();
  };

  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '100%', height: 260, backgroundColor: '#101018', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="videocam" size={44} color="#00F0FF" />
        <Text style={{ color: '#8a8aa0', fontSize: 12, marginTop: 12, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
          {t('ad.mockNotice')}
        </Text>
        <Text style={{ color: '#E8E8F0', fontSize: 44, fontWeight: '800', marginTop: 14, fontVariant: ['tabular-nums'] }}>
          {secondsLeft}
        </Text>
      </View>

      <View style={{ position: 'absolute', bottom: 60, left: 24, right: 24, gap: 16 }}>
        <MockProgressBar progress={progress} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#6b6b85', fontSize: 12 }}>{t('ad.rewardHint')}</Text>
          <Text onPress={handleSkip} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#E8E8F0', fontSize: 12, fontWeight: '700', overflow: 'hidden' }}>
            {secondsLeft > 0 ? `${t('ad.skip')} (${secondsLeft})` : t('ad.skip')}
          </Text>
        </View>
      </View>

      <View style={{ position: 'absolute', top: 80, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="gift" size={16} color="#00F0FF" />
        <Text style={{ color: '#00F0FF', fontSize: 13, fontWeight: '800' }}>{t('ad.title')}</Text>
      </View>
    </View>
  );
}

export default function RewardedAdModal({ visible, onClose }: RewardedAdModalProps) {
  const isWeb = Platform.OS === 'web';
  const [loading, setLoading] = useState(false);
  const [isTestUnit, setIsTestUnit] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const runNativeAd = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getAdConfig();
      if (!config.enabled) {
        // 广告全局关停（服务端兜底开关）→ 放行
        onCloseRef.current('failed');
        return;
      }
      setIsTestUnit(config.isTestUnit);
      const personalized = await ensureTrackingPermission();
      const result = await showRewardedAd(config.rewardedUnitId, personalized);
      if (result.earned) {
        onCloseRef.current('completed');
      } else if (result.failed) {
        onCloseRef.current('failed');
      } else {
        onCloseRef.current('abandoned');
      }
    } catch {
      onCloseRef.current('failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (isWeb) return; // Web 走 MockAdView 内部逻辑
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await runNativeAd();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {isWeb ? (
        <MockAdView
          onDone={() => onCloseRef.current('completed')}
          onSkip={() => onCloseRef.current('abandoned')}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 80, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="gift" size={16} color="#00F0FF" />
            <Text style={{ color: '#00F0FF', fontSize: 13, fontWeight: '800' }}>{t('ad.title')}</Text>
          </View>
          {loading ? <AdLoadingView isTestUnit={isTestUnit} /> : null}
          <Text style={{ position: 'absolute', bottom: 60, left: 24, right: 24, color: '#6b6b85', fontSize: 12, textAlign: 'center' }}>
            {t('ad.rewardHint')}
          </Text>
        </View>
      )}
    </Modal>
  );
}
