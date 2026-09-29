/**
 * 激励视频组件（变现基建：广告适配层）
 *
 * 当前实现：模拟激励视频（5 秒倒计时全屏页，Expo Go / 开发阶段可用）
 * 正式版替换：接入 AdMob 激励视频（expo-ads-admob / react-native-admob 需 dev build），
 * 只需保持本组件对外接口不变：visible + onClose(result)。
 *
 * result:
 * - 'completed'  完整观看 → 服务端解锁 1 份生成额度
 * - 'abandoned'  提前关闭 → 不解锁
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { t } from '@/i18n';

const REWARD_DURATION_MS = 5000;

export type RewardedAdResult = 'completed' | 'abandoned';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: (result: RewardedAdResult) => void;
}

/** 文件顶层定义子组件（引用稳定，防止倒计时重挂载） */
function ProgressBar({ progress }: { progress: Animated.Value }) {
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

export default function RewardedAdModal({ visible, onClose }: RewardedAdModalProps) {
  const [remainingMs, setRemainingMs] = useState(REWARD_DURATION_MS);
  const progress = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    finishedRef.current = false;
    setRemainingMs(REWARD_DURATION_MS);
    progress.setValue(0);

    const startAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startAt;
      const left = Math.max(0, REWARD_DURATION_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        clearInterval(timer);
        onClose('completed');
      }
    }, 100);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: REWARD_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();

    return () => {
      clearInterval(timer);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSkip = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onClose('abandoned');
  };

  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleSkip}>
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        {/* 模拟视频区域 */}
        <View style={{ width: '100%', height: 260, backgroundColor: '#101018', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="videocam" size={44} color="#00F0FF" />
          <Text style={{ color: '#8a8aa0', fontSize: 12, marginTop: 12, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
            {t('ad.mockNotice')}
          </Text>
          <Text style={{ color: '#E8E8F0', fontSize: 44, fontWeight: '800', marginTop: 14, fontVariant: ['tabular-nums'] }}>
            {secondsLeft}
          </Text>
        </View>

        {/* 底部进度与操作 */}
        <View style={{ position: 'absolute', bottom: 60, left: 24, right: 24, gap: 16 }}>
          <ProgressBar progress={progress} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6b6b85', fontSize: 12 }}>{t('ad.rewardHint')}</Text>
            <TouchableOpacity onPress={handleSkip} hitSlop={10} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={{ color: '#E8E8F0', fontSize: 12, fontWeight: '700' }}>
                {secondsLeft > 0 ? `${t('ad.skip')} (${secondsLeft})` : t('ad.skip')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 解锁说明 */}
        <View style={{ position: 'absolute', top: 80, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="gift" size={16} color="#00F0FF" />
          <Text style={{ color: '#00F0FF', fontSize: 13, fontWeight: '800' }}>{t('ad.title')}</Text>
        </View>
      </View>
    </Modal>
  );
}
