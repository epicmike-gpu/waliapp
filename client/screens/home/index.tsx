import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import ScoreRing from '@/components/ScoreRing';
import { NeonCard, StatItem } from '@/components/NeonCard';
import { fetchAnalysis, fetchPhones, type AnalysisResult } from '@/utils/api';
import { loadDeviceConfig, saveDeviceConfig, type DeviceConfig } from '@/utils/device-storage';
import { getDetectedDevice, matchPhoneModel } from '@/utils/device-detect';
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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hasDevice, setHasDevice] = useState(false);
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);

  const load = useCallback(async (silent = false) => {
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
      });
      setResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '数据加载失败';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        Toast.show({ type: 'info', text1: '未识别到在册机型', text2: '请在「配置设备」中手动选择' });
        router.navigate('/profile');
        return;
      }
      await saveDeviceConfig({
        phoneId: matched.id,
        benchmarkScore: matched.reference_score,
        smoothness: 3,
      });
      Toast.show({ type: 'success', text1: `已绑定 ${matched.name}`, text2: '机型与参考跑分已自动填入' });
      await load(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: '自动检测失败', text2: e instanceof Error ? e.message : '请稍后重试' });
    } finally {
      setAutoDetecting(false);
    }
  }, [load, router]);

  const tone = result ? ADVICE_TONE[result.advice.type] : 'neutral';
  const adviceColor = result ? ADVICE_COLOR[result.advice.type] : '#00F0FF';

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
                SWITCH RADAR
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>
                设备换机评测
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
                配置设备
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
              正在体检设备...
            </Text>
          </View>
        ) : error ? (
          <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF3366" />
            <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700', marginTop: 12 }}>连接服务失败</Text>
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
              <Text style={{ color: '#00F0FF', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>重试</Text>
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
                还没有绑定你的手机
              </Text>
              <Text style={{ fontSize: 12, color: '#6b6b85', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                {'自动识别机型并生成换机评分\n或手动录入跑分与电池健康数据'}
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
                    {autoDetecting ? '正在检测本机...' : '一键自动检测本机 →'}
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
                  手动配置设备
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
                  电池健康度未填写（受系统限制无法自动读取），补全后建议更准确
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
                    {result.device.image_url ? (
                      <Image source={{ uri: result.device.image_url }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
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
                      <Badge text={`${result.device.release_year} 年发布`} />
                      <Badge text={`芯片 ${result.device.chip_name}`} tone="cyan" />
                    </View>
                  </View>
                </View>
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

            {/* 指标网格 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14, flexDirection: 'row', gap: 10 }}>
              <StatItem k="芯片代差" v={result.metrics.chipGap === 0 ? '最新' : `-${result.metrics.chipGap}代`} tone="neutral" />
              <StatItem k="系统支持" v={`${Math.max(0, result.metrics.remainingSupportYears)}年`} tone="neutral" />
              <StatItem k="实测性能" v={`${result.metrics.benchmarkRatio}%`} tone="neutral" />
              <StatItem k="电池健康" v={result.metrics.batteryNeedReplace ? '需更换' : '正常'} tone={result.metrics.batteryNeedReplace ? 'battery' : 'keep'} />
            </View>

            {/* 分项得分 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label="评分维度分析">
                <ScoreBar label="芯片代差" value={result.components.chip} color="#BF00FF" />
                <ScoreBar label="系统支持" value={result.components.support} color="#00F0FF" />
                <ScoreBar label="实测性能" value={result.components.performance} color="#00FF88" />
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
              </View>
            </View>

            {/* 升级机型对比 */}
            {result.upgrade && result.advice.type !== 'keep' ? (
              <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                <NeonCard label="同级 / 升级机型对比">
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
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{value}分</Text>
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
      <Text style={{ fontSize: 11, color: '#6b6b85', marginTop: 4 }}>芯片 {model.chip_name}</Text>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#E8E8F0', marginTop: 8 }}>
        {model.reference_score}
      </Text>
      <Text style={{ fontSize: 10, color: '#6b6b85' }}>参考跑分</Text>
    </View>
  );
}