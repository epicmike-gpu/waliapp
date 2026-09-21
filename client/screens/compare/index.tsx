import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/Screen';
import { NeonCard } from '@/components/NeonCard';
import { SpecCompareTable } from '@/components/SpecSections';
import { fetchPhones, type PhoneModel } from '@/utils/api';
import { loadDeviceConfig } from '@/utils/device-storage';

interface Row {
  key: string;
  label: string;
  a: string;
  b: string;
}

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
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
    const upgraded = target.upgrade_model_id === myDevice.id || myDevice.upgrade_model_id === target.id;
    return [
      { key: 'brand', label: '品牌', a: myDevice.brand, b: target.brand },
      { key: 'chip', label: '处理器', a: myDevice.chip_name, b: target.chip_name },
      { key: 'release', label: '发布年份', a: `${myDevice.release_year}`, b: `${target.release_year}` },
      { key: 'support', label: '系统支持至', a: `${myDevice.support_until_year} 年`, b: `${target.support_until_year} 年` },
      { key: 'cycle', label: '电池标准(次)', a: `${myDevice.battery_cycle_standard}`, b: `${target.battery_cycle_standard}` },
      { key: 'score', label: '参考跑分', a: `${myDevice.reference_score}`, b: `${target.reference_score}` },
      {
        key: 'chipgap',
        label: '芯片代差',
        a: '—',
        b: `${Math.max(0, target.chip_generation - myDevice.chip_generation)} 代`,
      },
      {
        key: 'perf',
        label: '性能对比',
        a: '基准 100%',
        b: target.reference_score > 0
          ? `${Math.round((target.reference_score / myDevice.reference_score) * 100)}%`
          : '—',
      },
    ] as Row[];
  }, [myDevice, target])();

  const comparisonFrame = rows.find((r) => r.key === 'perf');

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#00F0FF" />}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>SPEC COMPARE</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>机型对比</Text>
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
            <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700', marginTop: 12 }}>尚未绑定设备</Text>
            <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
              请先在「我的 → 设备信息录入」绑定你的机型
            </Text>
          </View>
        ) : (
          <>
            {/* 对比双方 */}
            <View style={{ paddingHorizontal: 16, marginTop: 24, flexDirection: 'row' }}>
              <DeviceCard model={myDevice} label="我的设备" />
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Ionicons name="git-compare" size={22} color="#00F0FF" />
              </View>
              <DeviceCard model={target} label="对比目标" accent />
            </View>

            {/* 对比目标选择 */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <NeonCard label="选择对比目标" divider={false}>
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
              <NeonCard label="硬件参数对比">
                <View style={{ flexDirection: 'row', marginBottom: 4, paddingHorizontal: 4 }}>
                  <Text style={{ flex: 1.2, color: '#6b6b85', fontSize: 10, letterSpacing: 1 }}>参数</Text>
                  <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 10, letterSpacing: 1, textAlign: 'center' }}>
                    我的设备
                  </Text>
                  <Text style={{ flex: 1, color: '#00F0FF', fontSize: 10, letterSpacing: 1, textAlign: 'center' }}>
                    对比目标
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
              <NeonCard label="完整规格对比">
                <View style={{ flexDirection: 'row', marginBottom: 2, paddingHorizontal: 4 }}>
                  <Text style={{ flex: 1.1, color: '#6b6b85', fontSize: 10, letterSpacing: 1 }}>参数</Text>
                  <Text style={{ flex: 1.4, color: '#E8E8F0', fontSize: 10, letterSpacing: 1 }} numberOfLines={1}>
                    {myDevice.name}
                  </Text>
                  <Text style={{ flex: 1.4, color: '#00F0FF', fontSize: 10, letterSpacing: 1 }} numberOfLines={1}>
                    {target?.name}
                  </Text>
                </View>
                <SpecCompareTable mine={myDevice.specs ?? null} target={target?.specs ?? null} />
              </NeonCard>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function DeviceCard({ model, label, accent = false }: { model: PhoneModel | null; label: string; accent?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
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
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#E8E8F0', marginTop: 10 }}>{model?.name}</Text>
      <Text style={{ fontSize: 11, color: '#6b6b85', marginTop: 4 }}>芯片 {model?.chip_name}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: accent ? '#00F0FF' : '#00FF88', marginTop: 14 }}>
        {model?.reference_score}
      </Text>
      <Text style={{ fontSize: 9, color: '#555570' }}>参考跑分</Text>
    </TouchableOpacity>
  );
}