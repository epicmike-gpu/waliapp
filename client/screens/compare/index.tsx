import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/Screen';
import { NeonCard } from '@/components/NeonCard';
import { SpecCompareTable } from '@/components/SpecSections';
import { fetchPhones, type PhoneModel } from '@/utils/api';
import { loadDeviceConfig } from '@/utils/device-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useT, t, LANG } from '@/i18n';
import type { ColorOption } from '@/utils/api';

interface Row {
  key: string;
  label: string;
  a: string;
  b: string;
}

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const t = useT();
  const [phones, setPhones] = useState<PhoneModel[]>([]);
  const [myDevice, setMyDevice] = useState<PhoneModel | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [phoneList, cfg] = await Promise.all([fetchPhones(), loadDeviceConfig()]);
      setPhones(phoneList);
      if (!cfg) {
        setMyDevice(null);
        return;
      }
      const mine = phoneList.find((p) => p.id === cfg.phoneId) ?? null;
      setMyDevice(mine);
      const latest = phoneList.find((p) => p.is_latest) ?? phoneList[phoneList.length - 1];
      setTargetId((prev) => (prev && phoneList.some((p) => p.id === prev) ? prev : latest?.id ?? null));
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

  const target = phones.find((p) => p.id === targetId) ?? null;

  const rows: Row[] = useCallback(() => {
    if (!myDevice || !target) return [];
    return [
      { key: 'brand', label: t('compare.row.brand'), a: myDevice.brand, b: target.brand },
      { key: 'chip', label: t('compare.row.chip'), a: myDevice.chip_name, b: target.chip_name },
      { key: 'release', label: t('compare.row.release'), a: `${myDevice.release_year}`, b: `${target.release_year}` },
      {
        key: 'support',
        label: t('compare.row.support'),
        a: t('compare.years', { n: myDevice.support_until_year }),
        b: t('compare.years', { n: target.support_until_year }),
      },
      {
        key: 'cycle',
        label: t('compare.row.cycle'),
        a: `${myDevice.battery_cycle_standard}`,
        b: `${target.battery_cycle_standard}`,
      },
      { key: 'score', label: t('compare.row.score'), a: `${myDevice.reference_score}`, b: `${target.reference_score}` },
      {
        key: 'chipgap',
        label: t('compare.row.chipgap'),
        a: '—',
        b: t('compare.chipGapValue', { n: Math.max(0, target.chip_generation - myDevice.chip_generation) }),
      },
      {
        key: 'perf',
        label: t('compare.row.perf'),
        a: t('compare.perfBase'),
        b: target.reference_score > 0
          ? `${Math.round((target.reference_score / myDevice.reference_score) * 100)}%`
          : '—',
      },
    ] as Row[];
  }, [myDevice, target, t])();

  const comparisonFrame = rows.find((r) => r.key === 'perf');

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#00F0FF" />}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>SPEC COMPARE</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>{t('compare.title')}</Text>
          <LinearGradient
            colors={['#00F0FF', '#BF00FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 2, borderRadius: 1, marginTop: 14, width: 80 }}
          />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 100 }}>
            <ActivityIndicator color="#00F0FF" />
          </View>
        ) : !myDevice ? (
          <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="phone-portrait-outline" size={44} color="#00F0FF" />
            <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700', marginTop: 12 }}>{t('compare.noDevice')}</Text>
            <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
              {t('compare.noDeviceDesc')}
            </Text>
          </View>
        ) : (
          <>
            {/* 对比双方（key 绑定机型 id，切换目标时重置配色选择） */}
            <View style={{ paddingHorizontal: 16, marginTop: 24, flexDirection: 'row' }}>
              <DeviceCard key={`mine-${myDevice.id}`} model={myDevice} label={t('compare.myDevice')} />
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Ionicons name="git-compare" size={22} color="#00F0FF" />
              </View>
              <DeviceCard key={`target-${target?.id ?? 'none'}`} model={target} label={t('compare.target')} accent />
            </View>

            {/* 对比目标选择 */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <NeonCard label={t('compare.pickTitle')} divider={false}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {phones.slice().reverse().map((p) => {
                    const active = p.id === targetId;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setTargetId(p.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: active ? '#00F0FF' : '#2a3145',
                          backgroundColor: active ? '#0d1a1e' : '#16161f',
                        }}
                      >
                        <Text style={{ color: active ? '#00F0FF' : '#8a8aa0', fontSize: 12, fontWeight: '700' }}>
                          {p.name}
                        </Text>
                        {p.is_latest ? (
                          <Text style={{ color: '#00FF88', fontSize: 9, marginTop: 2, textAlign: 'center' }}>LATEST</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </NeonCard>
            </View>

            {/* 规格对比表 */}
            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('compare.tableTitle')}>
                <View style={{ flexDirection: 'row', marginBottom: 4, paddingHorizontal: 4 }}>
                  <Text style={{ flex: 1.2, color: '#6b6b85', fontSize: 10, letterSpacing: 1 }}>{t('compare.colParam')}</Text>
                  <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 10, letterSpacing: 1, textAlign: 'center' }}>
                    {t('compare.colMine')}
                  </Text>
                  <Text style={{ flex: 1, color: '#00F0FF', fontSize: 10, letterSpacing: 1, textAlign: 'center' }}>
                    {t('compare.colTarget')}
                  </Text>
                </View>
                {rows.map((r) => {
                  const isPerf = r.key === 'perf';
                  return (
                    <View
                      key={r.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderTopColor: '#1e2433',
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ flex: 1.2, color: '#8a8aa0', fontSize: 12.5 }}>{r.label}</Text>
                      <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                        {r.a}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          color: isPerf ? '#00FF88' : '#00F0FF',
                          fontSize: 13,
                          fontWeight: '800',
                          textAlign: 'center',
                        }}
                      >
                        {r.b}
                      </Text>
                    </View>
                  );
                })}
              </NeonCard>
            </View>

            {/* 完整规格分区对比（差异高亮） */}
            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('compare.specsTitle')}>
                <View style={{ flexDirection: 'row', marginBottom: 2, paddingHorizontal: 4 }}>
                  <Text style={{ flex: 1.1, color: '#6b6b85', fontSize: 10, letterSpacing: 1 }}>{t('compare.colParam')}</Text>
                  <Text style={{ flex: 1.4, color: '#E8E8F0', fontSize: 10, letterSpacing: 1 }} numberOfLines={1}>
                    {myDevice.name}
                  </Text>
                  <Text style={{ flex: 1.4, color: '#00F0FF', fontSize: 10, letterSpacing: 1 }} numberOfLines={1}>
                    {target?.name}
                  </Text>
                </View>
                <SpecCompareTable
                  mine={myDevice.specs ?? null}
                  target={target?.specs ?? null}
                  mineEn={myDevice.specs_en ?? null}
                  targetEn={target?.specs_en ?? null}
                />
              </NeonCard>
            </View>

            {/* AI 对比报告入口 */}
            {target ? (
              <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/report', { currentId: myDevice.id, targetId: target.id })}
                >
                  <LinearGradient
                    colors={['#00F0FF', '#BF00FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      shadowColor: '#00F0FF',
                      shadowOpacity: 0.25,
                      shadowRadius: 14,
                    }}
                  >
                    <Ionicons name="sparkles" size={16} color="#0A0A0F" />
                    <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14 }}>{t('report.genBtn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/** 配色名按语言输出（英文版优先 name_en） */
function colorName(c: ColorOption): string {
  return LANG === 'en' ? c.name_en ?? c.name : c.name;
}

function DeviceCard({ model, label, accent = false }: { model: PhoneModel | null; label: string; accent?: boolean }) {
  /** 当前选中配色索引（越界时收敛到最后一个） */
  const [colorIdx, setColorIdx] = useState(0);
  const colors = model?.colors ?? [];
  const activeColor = colors.length > 0 ? colors[Math.min(colorIdx, colors.length - 1)] : null;
  const imageUri = activeColor?.image ?? model?.image_url ?? null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? '#0d1a1e' : '#12121A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: accent ? 'rgba(0,240,255,0.35)' : 'rgba(0,240,255,0.14)',
        padding: 14,
        alignItems: 'center',
        shadowColor: accent ? '#00F0FF' : 'transparent',
        shadowOpacity: 0.2,
        shadowRadius: 12,
      }}
    >
      <Text style={{ fontSize: 10, letterSpacing: 1.5, color: accent ? '#00F0FF' : '#6b6b85', fontWeight: '700' }}>
        {label.toUpperCase()}
      </Text>
      {/* 当前配色渲染图 */}
      <View style={{ width: '100%', height: 132, borderRadius: 8, overflow: 'hidden', backgroundColor: '#16161f', marginTop: 10 }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} transition={150} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="phone-portrait-outline" size={40} color="#555570" />
          </View>
        )}
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#E8E8F0', marginTop: 10 }}>{model?.name}</Text>
      <Text style={{ fontSize: 11, color: '#6b6b85', marginTop: 4 }}>
        {t('home.chipPrefix', { chip: model?.chip_name ?? '' })}
      </Text>
      {/* 配色切换 */}
      {colors.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, flexWrap: 'wrap', gap: 7 }}>
          {colors.map((c, i) => {
            const active = activeColor?.name === c.name;
            return (
              <TouchableOpacity
                key={c.name}
                onPress={() => setColorIdx(i)}
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: 10,
                  backgroundColor: c.hex,
                  borderWidth: 2,
                  borderColor: active ? '#00F0FF' : 'rgba(255,255,255,0.16)',
                }}
              />
            );
          })}
        </View>
      ) : null}
      {activeColor ? (
        <Text style={{ fontSize: 10, color: accent ? '#00F0FF' : '#8a8aa0', marginTop: 5 }}>{colorName(activeColor)}</Text>
      ) : null}
      <Text style={{ fontSize: 20, fontWeight: '800', color: accent ? '#00F0FF' : '#00FF88', marginTop: 10 }}>
        {model?.reference_score}
      </Text>
      <Text style={{ fontSize: 9, color: '#555570' }}>{t('home.refScore')}</Text>
    </View>
  );
}
