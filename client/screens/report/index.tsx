/**
 * AI 对比报告页
 *
 * 进入即通过 SSE 流式接收 LLM 生成的 7 角度对比报告（不落库），
 * 增量解析 markdown 章节并实时渲染：首节「结论先行」为高亮结论卡，其余为普通章节卡。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import RewardedAdModal, { type RewardedAdResult } from '@/components/RewardedAdModal';
import {
  fetchPhones,
  fetchReportQuota,
  unlockReportQuota,
  openCompareReportStream,
  type CompareReportHandle,
  type PhoneModel,
} from '@/utils/api';
import { loadDeviceConfig } from '@/utils/device-storage';
import { getDeviceId } from '@/utils/device';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useT } from '@/i18n';

type Phase = 'loading' | 'streaming' | 'done' | 'error';

/** 解析后的报告章节 */
interface Section {
  title: string;
  body: string;
}

/** 将流式 markdown 按 "## 标题" 拆为章节（流式过程中最后一节允许不完整） */
function parseSections(raw: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of raw.split('\n')) {
    // 章节标题行："## " 开头（不含三级标题 "###"）
    if (line.startsWith('##') && !line.startsWith('###')) {
      current = { title: line.slice(2).trim(), body: '' };
      sections.push(current);
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  return sections;
}

/** 行内 **加粗** 渲染（流式中未闭合的 ** 以原文展示，流结束后自动收敛） */
function RichText({ text, baseStyle, boldStyle }: { text: string; baseStyle: object; boldStyle: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
          <Text key={i} style={boldStyle}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { currentId, targetId } = useSafeSearchParams<{ currentId: number; targetId: number }>();
  const t = useT();

  const [phones, setPhones] = useState<PhoneModel[]>([]);
  const [raw, setRaw] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const streamRef = useRef<CompareReportHandle | null>(null);

  const hasParams = typeof currentId === 'number' && typeof targetId === 'number';

  /** 启动一次报告流（进入页面自动触发，重新生成按钮复用；含额度检查与解锁闭环） */
  const start = useCallback(async () => {
    if (!hasParams) return;
    streamRef.current?.close();
    setRaw('');
    setErrMsg('');
    setPhase('loading');
    try {
      const id = await getDeviceId();
      setDeviceId(id);
      // 服务端文件：server/src/routes/reports.ts
      // 接口：GET /api/v1/reports/quota?deviceId:string → 额度快照（免费 1 份 + 解锁次数 + 每日频控）
      const quota = await fetchReportQuota(id);
      if (quota.needUnlock) {
        // 免费额度与解锁次数均耗尽 → 弹激励视频解锁（Modal 全屏盖住 loading 骨架）
        setShowUnlock(true);
        return;
      }
      const [list, cfg] = await Promise.all([fetchPhones(), loadDeviceConfig()]);
      setPhones(list);
      setPhase('streaming');
      streamRef.current = openCompareReportStream(
        {
          currentPhoneId: currentId,
          targetPhoneId: targetId,
          batteryHealth: cfg?.batteryHealth,
          batteryCycles: cfg?.batteryCycles,
          usageCategories: cfg?.usageCategories,
        },
        id,
        {
          onText: (chunk) => setRaw((prev) => prev + chunk),
          onError: (msg, reason) => {
            if (reason === 'quota_exhausted') {
              // 并发/竞态兜底：生成途中额度被耗尽 → 转解锁闭环
              setShowUnlock(true);
              setPhase('loading');
              return;
            }
            setErrMsg(msg);
            setPhase('error');
          },
          onDone: () => setPhase((prev) => (prev === 'error' ? 'error' : 'done')),
        }
      );
    } catch {
      setErrMsg(t('report.loadFail'));
      setPhase('error');
    }
  }, [hasParams, currentId, targetId, t]);

  /** 激励视频结束：完整观看或广告加载失败（放行）→ 解锁 1 次并自动生成；提前关闭 → 提示需解锁 */
  const handleUnlockClose = useCallback(
    async (result: RewardedAdResult) => {
      setShowUnlock(false);
      if (result === 'completed' && deviceId) {
        try {
          // 服务端文件：server/src/routes/reports.ts
          // 接口：POST /api/v1/reports/unlock Body: { deviceId: string, reason?: 'ad_completed'|'ad_failed' } → 解锁 1 份生成额度
          await unlockReportQuota(deviceId, 'ad_completed');
        } catch {
          // 解锁失败按未解锁处理，下次生成时额度接口会再次拦截
        }
        start();
      } else if (result === 'failed' && deviceId) {
        // 广告加载失败/超时/关停 → 放行本次生成（服务端以 ad_failed 打点，防止广告事故卡死核心功能）
        try {
          await unlockReportQuota(deviceId, 'ad_failed');
        } catch {
          // 忽略：放行逻辑不依赖解锁成功
        }
        start();
      } else {
        setErrMsg(t('report.needUnlock'));
        setPhase('error');
      }
    },
    [deviceId, start, t]
  );

  useEffect(() => {
    // 进入页面即开始生成：start 内的 setState 属于有意的初始重置，非渲染级联
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
    // 卸载时断开 SSE，避免后台继续生成
    return () => streamRef.current?.close();
  }, [start]);

  const current = phones.find((p) => p.id === currentId) ?? null;
  const target = phones.find((p) => p.id === targetId) ?? null;

  const sections = useMemo(() => parseSections(raw), [raw]);

  const regenerate = useCallback(() => {
    start();
  }, [start]);

  /** Hooks 之后的无参守卫（缺参数为异常入口，直接给提示） */
  if (!hasParams) {
    return (
      <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="alert-circle-outline" size={40} color="#00F0FF" />
          <Text style={{ color: '#E8E8F0', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {t('report.missing')}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: '#00F0FF', fontWeight: '700' }}>{t('report.back')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const streaming = phase === 'streaming';

  const renderSectionBody = (s: Section, isLast: boolean, accent: string) => {
    const lines = s.body.replace(/\n+$/, '').split('\n');
    const visible = lines.filter((l) => l.trim().length > 0);
    return (
      <View style={{ marginTop: 8, gap: 6 }}>
        {visible.map((line, i) => {
          const bullet = line.trimStart().startsWith('- ');
          const text = bullet ? line.trimStart().slice(2) : line.trim();
          return (
            <View key={i} style={{ flexDirection: 'row' }}>
              {bullet ? (
                <Text style={{ color: accent, fontSize: 13, fontWeight: '800', marginRight: 8 }}>•</Text>
              ) : null}
              <RichText
                text={text}
                baseStyle={{ flex: 1, color: '#C9C9DA', fontSize: 13.5, lineHeight: 21 }}
                boldStyle={{ color: accent, fontWeight: '800' }}
              />
            </View>
          );
        })}
        {isLast && streaming ? <Text style={{ color: '#00F0FF', fontSize: 14, fontWeight: '800' }}>▌</Text> : null}
      </View>
    );
  };

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color="#E8E8F0" />
            </TouchableOpacity>
            <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600', marginLeft: 10 }}>
              {t('report.badge')}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 8 }}>{t('report.title')}</Text>
          <Text style={{ fontSize: 12, color: '#6b6b85', marginTop: 4, lineHeight: 18 }}>{t('report.subtitle')}</Text>
          <LinearGradient
            colors={['#00F0FF', '#BF00FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 2, borderRadius: 1, marginTop: 12, width: 80 }}
          />
        </View>

        {/* 对比双方 */}
        {(current || target) && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
            {[
              { m: current, accent: false },
              { m: target, accent: true },
            ].map(({ m, accent }, idx) => (
              <View key={idx} style={{ flex: 1, opacity: m ? 1 : 0.35 }}>
                {idx === 1 ? (
                  <View style={{ alignItems: 'center', paddingHorizontal: 6 }}>
                    <Text style={{ color: '#555570', fontSize: 11, fontWeight: '800' }}>VS</Text>
                  </View>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: accent ? '#0d1a1e' : '#12121A',
                    borderWidth: 1,
                    borderColor: accent ? 'rgba(0,240,255,0.35)' : 'rgba(0,240,255,0.12)',
                    borderRadius: 10,
                    padding: 10,
                    gap: 8,
                  }}
                >
                  <View style={{ width: 40, height: 52, borderRadius: 6, overflow: 'hidden', backgroundColor: '#16161f' }}>
                    {(m?.colors?.[0]?.image || m?.image_url) ? (
                      <Image
                        source={{ uri: (m?.colors?.[0]?.image || m?.image_url) as string }}
                        contentFit="cover"
                        style={{ width: '100%', height: '100%' }}
                        transition={120}
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="phone-portrait-outline" size={18} color="#555570" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: accent ? '#00F0FF' : '#6b6b85', fontSize: 9, letterSpacing: 1, fontWeight: '700' }}>
                      {idx === 0 ? t('compare.myDevice').toUpperCase() : t('compare.target').toUpperCase()}
                    </Text>
                    <Text numberOfLines={2} style={{ color: '#E8E8F0', fontSize: 12.5, fontWeight: '800', marginTop: 2 }}>
                      {m?.name ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 状态条 */}
        {streaming ? (
          <View style={{ paddingHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color="#00F0FF" size="small" />
            <Text style={{ color: '#8a8aa0', fontSize: 12 }}>{t('report.generating')}</Text>
          </View>
        ) : null}

        {/* 错误卡 */}
        {phase === 'error' ? (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(255,80,80,0.4)',
                backgroundColor: 'rgba(255,80,80,0.08)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Ionicons name="cloud-offline-outline" size={30} color="#FF5E5E" />
              <Text style={{ color: '#FF8A8A', fontSize: 13, fontWeight: '700', marginTop: 8 }}>{t('report.error')}</Text>
              <Text style={{ color: '#6b6b85', fontSize: 11, marginTop: 4, textAlign: 'center' }}>{errMsg}</Text>
              <TouchableOpacity onPress={regenerate} style={{ marginTop: 14 }}>
                <View
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: '#16161f',
                    borderWidth: 1,
                    borderColor: '#00F0FF',
                  }}
                >
                  <Text style={{ color: '#00F0FF', fontWeight: '800', fontSize: 13 }}>{t('report.retry')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 报告正文：首节为结论卡，其余为章节卡 */}
        {sections.map((s, i) => {
          const isVerdict = i === 0;
          const isLast = i === sections.length - 1;
          const accent = isVerdict ? '#00FF88' : '#00F0FF';
          if (isVerdict) {
            return (
              <View key={s.title + i} style={{ paddingHorizontal: 16, marginTop: 18 }}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(0,255,136,0.4)',
                    backgroundColor: '#0d1a16',
                    borderRadius: 12,
                    padding: 16,
                    shadowColor: '#00FF88',
                    shadowOpacity: 0.15,
                    shadowRadius: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Ionicons name="flash" size={15} color="#00FF88" />
                    <Text style={{ color: '#00FF88', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>
                      {t('report.verdictTag').toUpperCase()}
                    </Text>
                  </View>
                  {renderSectionBody(s, isLast, accent)}
                </View>
              </View>
            );
          }
          return (
            <View key={s.title + i} style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(0,240,255,0.14)',
                  backgroundColor: '#12121A',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Text style={{ color: '#00F0FF', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>{s.title}</Text>
                {renderSectionBody(s, isLast, accent)}
              </View>
            </View>
          );
        })}

        {/* 底部操作：完成后可重新生成 */}
        {phase === 'done' ? (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity activeOpacity={0.85} onPress={regenerate}>
              <LinearGradient
                colors={['#00F0FF', '#BF00FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Ionicons name="refresh" size={15} color="#0A0A0F" />
                <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14 }}>{t('report.regenerate')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 流式开始前的骨架提示 */}
        {phase === 'loading' ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color="#00F0FF" />
          </View>
        ) : null}
      </ScrollView>

      {/* 激励视频解锁（免费额度用完时弹出，完整观看解锁 1 次生成） */}
      <RewardedAdModal visible={showUnlock} onClose={handleUnlockClose} />
    </Screen>
  );
}
