import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import ScoreRing from '@/components/ScoreRing';
import { NeonCard, StatItem } from '@/components/NeonCard';
import { SpecSections } from '@/components/SpecSections';
import { fetchAnalysis, fetchPhones, fetchPurchaseLink, type AnalysisResult } from '@/utils/api';
import { loadDeviceConfig, saveDeviceConfig, type DeviceConfig } from '@/utils/device-storage';
import { getDetectedDevice, matchPhoneModel } from '@/utils/device-detect';
import { useT, t } from '@/i18n';
import { APP_NAME } from '@/config/edition';
import Toast from 'react-native-toast-message';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const ADVICE_TONE: Record<string, 'keep' | 'battery' | 'replace'> = {
  keep: 'keep',
  battery: 'battery',
  replace: 'replace',
};

const ADVICE_COLOR: Record<string, string> = {
  keep: '#00FF88',
  battery: '#00F0FF',
  replace: '#FF3366',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const t = useT();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hasDevice, setHasDevice] = useState(false);
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  /** 设备卡当前选中配色索引（null 时取第一个配色） */
  const [colorIdx, setColorIdx] = useState<number | null>(null);
  /** 导购链接请求中（防止重复点击） */
  const [buying, setBuying] = useState(false);

  /**
   * 换机建议 → 京东 CPS 导购：
   * 调后端转链接口获取带佣金的 cpLink，成功则跳转京东（已装唤起京东 App，未装打开 H5）
   */
  const handleGoJd = async () => {
    if (!result || buying) return;
    const targetName = result.upgrade?.name ?? result.device.name;
    setBuying(true);
    try {
      /**
       * 服务端文件：server/src/routes/phones.ts
       * 接口：GET /api/v1/phones/purchase-link
       * Query 参数：model:string（机型名），budget?:number（预算上限，元）
       */
      const link = await fetchPurchaseLink(targetName);
      if (link.available && link.url) {
        await Linking.openURL(link.url);
      } else {
        Toast.show({ type: 'info', text1: t('home.toast.noGoods'), text2: t('home.toast.noGoodsDesc') });
      }
    } catch {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('common.tryLater') });
    } finally {
      setBuying(false);
    }
  };

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const config = await loadDeviceConfig();
        setConfig(config);
        if (!config) {
          setHasDevice(false);
          setResult(null);
          return;
        }
        setHasDevice(true);
        const res = await fetchAnalysis({
          phoneId: config.phoneId,
          benchmarkScore: config.benchmarkScore,
          batteryHealth: config.batteryHealth,
          batteryCycles: config.batteryCycles,
          smoothness: config.smoothness,
          usageCategories: config.usageCategories,
        });
        setResult(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('home.toast.loadFail');
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const goConfig = useCallback(() => {
    router.navigate('/profile');
  }, [router]);

  /** 一键自动检测：识别本机机型 → 绑定数据库机型与参考跑分 */
  const runAutoSetup = useCallback(async () => {
    setAutoDetecting(true);
    try {
      const [det, phoneList] = await Promise.all([getDetectedDevice(), fetchPhones()]);
      const matched = matchPhoneModel(det, phoneList);
      if (!matched) {
        Toast.show({ type: 'info', text1: t('home.toast.notBound'), text2: t('home.toast.notBoundDesc') });
        router.navigate('/profile');
        return;
      }
      await saveDeviceConfig({
        phoneId: matched.id,
        benchmarkScore: matched.reference_score,
        smoothness: 3,
      });
      Toast.show({ type: 'success', text1: t('home.toast.bound', { name: matched.name }), text2: t('home.toast.boundDesc') });
      await load(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: t('home.toast.detectFail'), text2: e instanceof Error ? e.message : t('common.tryLater') });
    } finally {
      setAutoDetecting(false);
    }
  }, [load, router, t]);

  const tone = result ? ADVICE_TONE[result.advice.type] : 'neutral';
  const adviceColor = result ? ADVICE_COLOR[result.advice.type] : '#00F0FF';

  /** 设备卡配色：选中配色索引越界时自动收敛到最后一个 */
  const deviceColors = result?.device.colors ?? [];
  const activeColor =
    deviceColors.length > 0 ? deviceColors[Math.min(colorIdx ?? 0, deviceColors.length - 1)] : null;
  const deviceImageUri = activeColor?.image ?? result?.device.image_url ?? null;

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00F0FF" />}
      >
        {/* 顶部 Hero */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>
                {APP_NAME.toUpperCase()} · SWITCH RADAR
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>
                {t('home.title')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={goConfig}
              style={{
                backgroundColor: '#16161f',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(0,240,255,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="settings-outline" size={15} color="#00F0FF" />
              <Text style={{ color: '#00F0FF', fontSize: 11, letterSpacing: 1, marginLeft: 6, fontWeight: '600' }}>
                {t('home.configure')}
              </Text>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#00F0FF', '#BF00FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 2, borderRadius: 1, marginTop: 16, width: 80 }}
          />
        </View>

        {loading && !refreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 120 }}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={{ color: '#555570', marginTop: 12, fontSize: 12, letterSpacing: 2 }}>
              {t('home.checking')}
            </Text>
          </View>
        ) : error ? (
          <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF3366" />
            <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700', marginTop: 12 }}>{t('home.errorTitle')}</Text>
            <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>{error}</Text>
            <TouchableOpacity
              onPress={() => load(false)}
              style={{
                marginTop: 16,
                borderWidth: 1,
                borderColor: '#00F0FF',
                borderRadius: 6,
                paddingVertical: 10,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: '#00F0FF', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : !hasDevice || !result ? (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <View
              style={{
                backgroundColor: '#12121A',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(0,240,255,0.14)',
                padding: 28,
                alignItems: 'center',
                shadowColor: '#00F0FF',
                shadowOpacity: 0.1,
                shadowRadius: 16,
              }}
            >
              <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>
                NO DEVICE BOUND
              </Text>
              <Ionicons name="phone-portrait-outline" size={48} color="#00F0FF" style={{ marginVertical: 20 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#E8E8F0' }}>
                {t('home.noDevice')}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b6b85', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                {`${t('home.noDeviceDesc1')}\n${t('home.noDeviceDesc2')}`}
              </Text>
              <TouchableOpacity
                onPress={runAutoSetup}
                disabled={autoDetecting}
                style={{
                  marginTop: 22,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={['#00F0FF', '#BF00FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 13, paddingHorizontal: 30 }}
                >
                  <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>
                    {autoDetecting ? t('home.detecting') : t('home.autoDetect')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goConfig}
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(0,240,255,0.4)',
                  borderRadius: 6,
                  paddingVertical: 11,
                  paddingHorizontal: 30,
                }}
              >
                <Text style={{ color: '#00F0FF', fontSize: 11.5, fontWeight: '700', letterSpacing: 1.5 }}>
                  {t('home.manualConfig')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* 电池健康未填写提示（iOS 不开放该数据，需手动补全） */}
            {config?.batteryHealth === undefined ? (
              <TouchableOpacity
                onPress={goConfig}
                style={{
                  marginHorizontal: 16,
                  marginTop: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,209,102,0.08)',
                  borderColor: 'rgba(255,209,102,0.35)',
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Ionicons name="battery-half-outline" size={16} color="#FFD166" />
                <Text style={{ color: '#FFD166', fontSize: 11.5, marginLeft: 8, flex: 1, lineHeight: 17 }}>
                  {t('home.batteryHint')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#FFD166" />
              </TouchableOpacity>
            ) : null}
            {/* 设备卡片 + 评分环 */}
            <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
              <View
                style={{
                  backgroundColor: '#12121A',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(0,240,255,0.14)',
                  padding: 20,
                  shadowColor: '#00F0FF',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.12,
                  shadowRadius: 18,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: '#16161f' }}>
                    {deviceImageUri ? (
                      <Image source={{ uri: deviceImageUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="phone-portrait-outline" size={30} color="#555570" />
                      </View>
                    )}
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: '800', color: '#E8E8F0' }}>
                      {result.device.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 8 }}>
                      <Badge text={`${result.device.brand}`} />
                      <Badge text={t('home.releasedAt', { year: result.device.release_year })} />
                      <Badge text={t('home.chipPrefix', { chip: result.device.chip_name })} tone="cyan" />
                    </View>
                  </View>
                </View>
                {/* 配色切换（2.5D 渲染图实时联动） */}
                {deviceColors.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                    {deviceColors.map((c, i) => {
                      const active = activeColor?.name === c.name;
                      return (
                        <TouchableOpacity
                          key={c.name}
                          onPress={() => setColorIdx(i)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: c.hex,
                            borderWidth: 2,
                            borderColor: active ? '#00F0FF' : 'rgba(255,255,255,0.16)',
                          }}
                        />
                      );
                    })}
                    {activeColor ? (
                      <Text style={{ color: '#8a8aa0', fontSize: 11, fontWeight: '600', marginLeft: 2 }}>
                        {activeColor.name}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                  <ScoreRing score={result.score} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: `${adviceColor}66`,
                        backgroundColor: '#16161f',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: adviceColor, marginRight: 7 }} />
                      <Text style={{ color: adviceColor, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
                        {result.advice.title}
                      </Text>
                    </View>
                    <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 10, lineHeight: 19 }}>
                      {result.advice.summary}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 完整硬件规格（可展开） */}
            {result.device.specs && Object.keys(result.device.specs).length > 0 ? (
              <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                <NeonCard label={t('home.specsTitle')} divider={false}>
                  <TouchableOpacity
                    onPress={() => setSpecsOpen((v) => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ color: '#8a8aa0', fontSize: 12.5, fontWeight: '600' }}>
                      {specsOpen ? t('home.specsCollapse') : t('home.specsExpand')}
                    </Text>
                    <Ionicons name={specsOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#00F0FF" />
                  </TouchableOpacity>
                  {specsOpen ? (
                    <View style={{ marginTop: 2 }}>
                      <SpecSections specs={result.device.specs} />
                    </View>
                  ) : null}
                </NeonCard>
              </View>
            ) : null}

            {/* 指标网格 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14, flexDirection: 'row', gap: 10 }}>
              <StatItem
                k={t('home.metricChipGap')}
                v={result.metrics.chipGap === 0 ? t('home.latest') : t('home.chipGapValue', { n: result.metrics.chipGap })}
                tone="neutral"
              />
              <StatItem
                k={t('home.metricSupport')}
                v={t('home.yearsLeft', { n: Math.max(0, result.metrics.remainingSupportYears) })}
                tone="neutral"
              />
              <StatItem k={t('home.metricPerf')} v={`${result.metrics.benchmarkRatio}%`} tone="neutral" />
              <StatItem
                k={t('home.metricBattery')}
                v={result.metrics.batteryNeedReplace ? t('home.batteryReplace') : t('home.batteryOk')}
                tone={result.metrics.batteryNeedReplace ? 'battery' : 'keep'}
              />
            </View>

            {/* 分项得分 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('home.breakdownTitle')}>
                <ScoreBar label={t('home.metricChipGap')} value={result.components.chip} color="#BF00FF" />
                <ScoreBar label={t('home.metricSupport')} value={result.components.support} color="#00F0FF" />
                <ScoreBar label={t('home.metricPerf')} value={result.components.performance} color="#00FF88" />
              </NeonCard>
            </View>

            {/* 换机建议 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <View
                style={{
                  backgroundColor: '#12121A',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: `${adviceColor}44`,
                  padding: 18,
                  shadowColor: adviceColor,
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={result.advice.type === 'keep' ? 'checkmark-circle' : result.advice.type === 'battery' ? 'battery-half' : 'swap-horizontal'}
                    size={20}
                    color={adviceColor}
                  />
                  <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '800', color: '#E8E8F0' }}>
                    {result.advice.title}
                  </Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                  {result.advice.reasons.map((r, i) => (
                    <View key={i} style={{ flexDirection: 'row' }}>
                      <Text style={{ color: adviceColor, marginRight: 8, fontSize: 12 }}>▸</Text>
                      <Text style={{ color: '#b9b9cf', fontSize: 12.5, lineHeight: 19, flex: 1 }}>{r}</Text>
                    </View>
                  ))}
                </View>

                {/* CPS 导购入口（仅联盟渠道已配置且建议换机时展示） */}
                {result.advice.type !== 'keep' && result.affiliateAvailable ? (
                  <View style={{ marginTop: 14, gap: 8 }}>
                    <TouchableOpacity
                      onPress={handleGoJd}
                      disabled={buying}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 12,
                        borderRadius: 8,
                        backgroundColor: `${adviceColor}1A`,
                        borderWidth: 1,
                        borderColor: `${adviceColor}55`,
                      }}
                    >
                      {buying ? (
                        <ActivityIndicator size="small" color={adviceColor} />
                      ) : (
                        <Ionicons name="cart" size={16} color={adviceColor} />
                      )}
                      <Text style={{ color: adviceColor, fontSize: 13.5, fontWeight: '800' }}>
                        {buying ? t('home.gettingLink') : t('home.goStore')}
                      </Text>
                      {/* 《互联网广告管理办法》要求：测评推荐附购物链接须标明「广告」 */}
                      <View
                        style={{
                          backgroundColor: `${adviceColor}22`,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ color: adviceColor, fontSize: 9.5, fontWeight: '700' }}>{t('home.ad')}</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={{ color: '#6f6f85', fontSize: 10.5, lineHeight: 15 }}>
                      {t('home.adDisclaimer')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 升级机型对比 */}
            {result.upgrade && result.advice.type !== 'keep' ? (
              <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                <NeonCard label={t('home.compareTitle')}>
                  <View style={{ flexDirection: 'row' }}>
                    <MiniDevice model={result.device} />
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                      <Ionicons name="arrow-forward" size={18} color="#00F0FF" />
                    </View>
                    <MiniDevice model={result.upgrade} accent />
                  </View>
                </NeonCard>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Badge({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'cyan' }) {
  return (
    <View
      style={{
        backgroundColor: '#16161f',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: tone === 'cyan' ? 'rgba(0,240,255,0.3)' : '#2a3145',
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 10.5, color: tone === 'cyan' ? '#00F0FF' : '#8a8aa0', fontWeight: '600' }}>
        {text}
      </Text>
    </View>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: '#8a8aa0', fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{t('home.scorePoint', { v: value })}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#1b1b26', overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function MiniDevice({ model, accent = false }: { model: any; accent?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? '#0d1a1e' : '#16161f',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: accent ? 'rgba(0,240,255,0.3)' : '#2a3145',
        padding: 12,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: accent ? '#00F0FF' : '#E8E8F0' }}>{model.name}</Text>
      <Text style={{ fontSize: 11, color: '#6b6b85', marginTop: 4 }}>{t('home.chipPrefix', { chip: model.chip_name })}</Text>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#E8E8F0', marginTop: 8 }}>
        {model.reference_score}
      </Text>
      <Text style={{ fontSize: 10, color: '#6b6b85' }}>{t('home.refScore')}</Text>
    </View>
  );
}
