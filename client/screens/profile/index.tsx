import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { Screen } from '@/components/Screen';
import { NeonCard } from '@/components/NeonCard';
import { SpecSections } from '@/components/SpecSections';
import { fetchPhones, type PhoneModel } from '@/utils/api';
import {
  loadDeviceConfig,
  saveDeviceConfig,
  clearDeviceConfig,
  batteryGuide,
  type DeviceConfig,
} from '@/utils/device-storage';
import {
  getDetectedDevice,
  getBatterySnapshot,
  matchPhoneModel,
  type DetectedDevice,
  type BatterySnapshot,
} from '@/utils/device-detect';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [phones, setPhones] = useState<PhoneModel[]>([]);
  const [config, setConfig] = useState<DeviceConfig | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [benchmark, setBenchmark] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [batteryCycles, setBatteryCycles] = useState('');
  const [smoothness, setSmoothness] = useState(3);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);

  // 自动检测状态
  const [detected, setDetected] = useState<DetectedDevice | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<BatterySnapshot | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const selectedPhone = useCallback(() => {
    return phones.find((p) => p.id === selectedId) ?? null;
  }, [phones, selectedId]);

  useEffect(() => {
    (async () => {
      let phoneList: PhoneModel[] = [];
      let cfg: DeviceConfig | null = null;
      try {
        const [list, saved] = await Promise.all([fetchPhones(), loadDeviceConfig()]);
        phoneList = list;
        cfg = saved;
        setPhones(phoneList);
        if (cfg) {
          setConfig(cfg);
          setSelectedId(cfg.phoneId);
          setBenchmark(cfg.benchmarkScore ? String(cfg.benchmarkScore) : '');
          setBatteryHealth(cfg.batteryHealth !== undefined ? String(cfg.batteryHealth) : '');
          setBatteryCycles(cfg.batteryCycles !== undefined ? String(cfg.batteryCycles) : '');
          setSmoothness(cfg.smoothness ?? 3);
        }
      } catch (e) {
        Toast.show({ type: 'error', text1: '加载失败', text2: e instanceof Error ? e.message : '无法获取机型列表' });
      } finally {
        setLoading(false);
      }

      // 自动检测本机机型与电池实时信息（Expo Go / 真机可用）
      try {
        const [det, bat] = await Promise.all([getDetectedDevice(), getBatterySnapshot()]);
        setDetected(det);
        setBatteryInfo(bat);
        // 无已有配置时，按检测到的机型自动预填（含数据库参考跑分）
        if (!cfg) {
          const matched = matchPhoneModel(det, phoneList);
          if (matched) {
            setSelectedId(matched.id);
            setBenchmark(String(matched.reference_score));
            setAutoFilled(true);
          }
        }
      } catch {
        // 检测失败不阻塞表单
      }
    })();
  }, []);

  const applyAutoFill = useCallback(
    (det: DetectedDevice | null, list: PhoneModel[]) => {
      const matched = matchPhoneModel(det, list);
      if (matched) {
        setSelectedId(matched.id);
        setBenchmark(String(matched.reference_score));
        setAutoFilled(true);
        Toast.show({ type: 'success', text1: `已识别 ${matched.name}`, text2: `芯片 ${matched.chip_name}，跑分已填入参考值` });
      } else {
        Toast.show({ type: 'info', text1: '未识别到在册机型', text2: '请从列表中手动选择' });
      }
    },
    []
  );

  const handleRedetect = useCallback(async () => {
    setDetecting(true);
    try {
      const [det, bat] = await Promise.all([getDetectedDevice(), getBatterySnapshot()]);
      setDetected(det);
      setBatteryInfo(bat);
      applyAutoFill(det, phones);
    } finally {
      setDetecting(false);
    }
  }, [applyAutoFill, phones]);

  const handleSave = useCallback(async () => {
    if (!selectedId) {
      Toast.show({ type: 'error', text1: '请选择你的手机机型' });
      return;
    }
    setSaving(true);
    try {
      const bench = benchmark.trim() ? Number(benchmark.trim()) : undefined;
      const health = batteryHealth.trim() ? Number(batteryHealth.trim()) : undefined;
      const cycles = batteryCycles.trim() ? Number(batteryCycles.trim()) : undefined;
      if (bench !== undefined && (Number.isNaN(bench) || bench < 0)) {
        Toast.show({ type: 'error', text1: '跑分需为非负数字' });
        return;
      }
      if (health !== undefined && (Number.isNaN(health) || health < 0 || health > 100)) {
        Toast.show({ type: 'error', text1: '电池健康度需在 0-100 之间' });
        return;
      }
      await saveDeviceConfig({
        phoneId: selectedId,
        benchmarkScore: bench,
        batteryHealth: health,
        batteryCycles: Number.isNaN(cycles ?? NaN) ? undefined : cycles,
        smoothness,
      });
      Toast.show({ type: 'success', text1: '设备信息已保存' });
      router.navigate('/');
    } finally {
      setSaving(false);
    }
  }, [selectedId, benchmark, batteryHealth, batteryCycles, smoothness, router]);

  const handleClear = useCallback(() => {
    clearDeviceConfig().then(() => {
      setConfig(null);
      setSelectedId(null);
      setBenchmark('');
      setBatteryHealth('');
      setBatteryCycles('');
      setSmoothness(3);
      Toast.show({ type: 'info', text1: '设备配置已清除' });
    });
  }, []);

  const phone = selectedPhone();

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>DEVICE CENTER</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>设备信息录入</Text>
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
        ) : (
          <>
            {/* 自动检测 */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <NeonCard label="自动检测本机" divider={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <Ionicons name="sparkles" size={17} color="#00F0FF" />
                    <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700', marginLeft: 8 }} numberOfLines={1}>
                      {detected?.modelName ?? (detecting ? '正在读取设备...' : '未读取到设备型号')}
                    </Text>
                    {detected && !detected.isRealDevice ? (
                      <Text style={{ color: '#FFD166', fontSize: 10, marginLeft: 6 }}>模拟器</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={handleRedetect}
                    disabled={detecting}
                    style={{
                      borderWidth: 1,
                      borderColor: 'rgba(0,240,255,0.4)',
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    }}
                  >
                    <Text style={{ color: '#00F0FF', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      {detecting ? '检测中' : '重新检测'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12, gap: 7 }}>
                  <Text style={{ color: '#6b6b85', fontSize: 12 }}>
                    系统：{detected ? `${detected.osName ?? '-'} ${detected.osVersion ?? ''}` : '-'}
                  </Text>
                  <Text style={{ color: '#6b6b85', fontSize: 12 }}>
                    电池：{batteryInfo?.levelPercent != null ? `电量 ${batteryInfo.levelPercent}%（${batteryInfo.stateLabel}）` : '不可用'}
                  </Text>
                  <Text
                    style={{
                      color: autoFilled && selectedId ? '#00FF88' : '#6b6b85',
                      fontSize: 12,
                      lineHeight: 18,
                    }}
                  >
                    {autoFilled && selectedId
                      ? '已自动选择机型并填入参考跑分，可手动修正'
                      : detected?.modelName
                        ? `未识别到「${detected.modelName}」在册机型，请手动选择`
                        : '电池健康度受系统隐私限制无法自动读取，需手动填写'}
                  </Text>
                </View>
              </NeonCard>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label="① 选择机型">
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#16161f',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(0,240,255,0.2)',
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                >
                  {phone ? (
                    <View>
                      <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '700' }}>{phone.name}</Text>
                      <Text style={{ color: '#6b6b85', fontSize: 11.5, marginTop: 3 }}>
                        芯片 {phone.chip_name} · 参考跑分 {phone.reference_score}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#6b6b85', fontSize: 14 }}>点击选择你的 iPhone 机型</Text>
                  )}
                  <Ionicons name="chevron-down" size={18} color="#00F0FF" />
                </TouchableOpacity>
              </NeonCard>
            </View>

            {/* 完整硬件规格（随时可看，跟随所选机型） */}
            {phone?.specs && Object.keys(phone.specs).length > 0 ? (
              <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                <NeonCard label="完整硬件规格" divider={false}>
                  <TouchableOpacity
                    onPress={() => setSpecsOpen((v) => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ color: '#8a8aa0', fontSize: 12.5, fontWeight: '600', flex: 1, marginRight: 8 }}>
                      {specsOpen
                        ? '收起规格详情'
                        : `${phone.name} 完整参数（屏幕 / 摄像头 / 电池…）`}
                    </Text>
                    <Ionicons name={specsOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#00F0FF" />
                  </TouchableOpacity>
                  {specsOpen ? (
                    <View style={{ marginTop: 2 }}>
                      <SpecSections specs={phone.specs} />
                    </View>
                  ) : null}
                </NeonCard>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label="② 实测性能数据（选填）">
                <FieldInput
                  label="实测跑分"
                  hint="留空则使用机型参考跑分"
                  value={benchmark}
                  onChangeText={setBenchmark}
                  keyboardType="numeric"
                />
                <FieldInput
                  label="主流 App 流畅度自评"
                  hint="1 分卡顿 ~ 5 分流畅"
                  customContent={
                    <SmoothnessSelector value={smoothness} onChange={setSmoothness} />
                  }
                />
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <Ionicons name="information-circle-outline" size={13} color="#555570" />
                  <Text style={{ color: '#555570', fontSize: 10.5, marginLeft: 5, flex: 1, lineHeight: 15 }}>
                    跑分说明：「参考跑分」为本项目基于 Geekbench 6、3DMark 等公开跑分趋势整理的归一化参考值（非任何平台原始分数），仅用于同口径跨代对比；换机评估会优先采用你填写的实测值。
                  </Text>
                </View>
              </NeonCard>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label="③ 电池健康数据（选填）" divider={false}>
                <FieldInput
                  label="最大容量 %"
                  hint={phone ? `该机型设计循环标准 ${phone.battery_cycle_standard} 次` : '如 87'}
                  value={batteryHealth}
                  onChangeText={setBatteryHealth}
                  keyboardType="numeric"
                />
                <FieldInput
                  label="已循环次数"
                  hint="选填"
                  value={batteryCycles}
                  onChangeText={setBatteryCycles}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => setGuideVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
                >
                  <Ionicons name="information-circle-outline" size={15} color="#00F0FF" />
                  <Text style={{ color: '#00F0FF', fontSize: 12, marginLeft: 6, fontWeight: '600' }}>
                    如何查看电池健康度？
                  </Text>
                </TouchableOpacity>
              </NeonCard>
            </View>

            {/* 操作按钮 */}
            <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 12 }}>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ borderRadius: 6, overflow: 'hidden' }}>
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 15 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 13, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}>
                    {saving ? '保存中...' : '保存并生成评测'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {config ? (
                <TouchableOpacity
                  onPress={handleClear}
                  style={{
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#FF3366',
                    paddingVertical: 13,
                  }}
                >
                  <Text style={{ color: '#FF3366', fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center' }}>
                    清除设备配置
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      {/* 机型选择 Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ backgroundColor: '#12121A', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', paddingBottom: insets.bottom + 16 }}>
                <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: '#1e2433' }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '800' }}>选择你的机型</Text>
                  <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 4 }}>共 {phones.length} 款在册机型</Text>
                </View>
                <FlatList
                  data={phones}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ paddingHorizontal: 12 }}
                  renderItem={({ item }) => {
                    const active = item.id === selectedId;
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedId(item.id);
                          setPickerVisible(false);
                          if (!benchmark && phones.find((p) => p.id === item.id)) {
                            setBenchmark('');
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 14,
                          paddingHorizontal: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: '#1e2433',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name={active ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={active ? '#00F0FF' : '#555570'}
                          />
                          <View style={{ marginLeft: 10 }}>
                            <Text style={{ color: active ? '#00F0FF' : '#E8E8F0', fontSize: 14, fontWeight: '600' }}>
                              {item.name}
                            </Text>
                            <Text style={{ color: '#6b6b85', fontSize: 11, marginTop: 2 }}>
                              {item.chip_name} · {item.release_year} · 参考 {item.reference_score}
                            </Text>
                          </View>
                        </View>
                        {item.is_latest ? (
                          <Text style={{ color: '#00FF88', fontSize: 10, fontWeight: '700' }}>LATEST</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 电池指南 Modal */}
      <Modal visible={guideVisible} transparent animationType="fade" onRequestClose={() => setGuideVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setGuideVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#12121A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)', padding: 22, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>查看电池健康度</Text>
                <TouchableOpacity onPress={() => setGuideVisible(false)}>
                  <Ionicons name="close" size={20} color="#6b6b85" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#b9b9cf', fontSize: 13, lineHeight: 21, marginTop: 12 }}>{batteryGuide()}</Text>
              <TouchableOpacity
                onPress={() => setGuideVisible(false)}
                style={{ marginTop: 18, borderRadius: 6, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 11 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>知道了</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  keyboardType,
  hint,
  customContent,
}: {
  label: string;
  value?: string;
  onChangeText?: (t: string) => void;
  keyboardType?: 'numeric' | 'default';
  hint?: string;
  customContent?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, color: '#8a8aa0', fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      {customContent ?? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={hint}
          placeholderTextColor="#555570"
          style={{
            backgroundColor: '#16161f',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#2a3145',
            paddingHorizontal: 12,
            paddingVertical: 11,
            color: '#E8E8F0',
            fontSize: 14,
          }}
        />
      )}
      {hint && !customContent ? (
        <Text style={{ color: '#555570', fontSize: 10.5, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

function SmoothnessSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['卡顿', '较卡', '一般', '流畅', '极流畅'];
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {labels.map((l, i) => {
        const v = i + 1;
        const active = v === value;
        return (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            style={{
              flex: 1,
              backgroundColor: active ? '#0d1a1e' : '#16161f',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: active ? '#00F0FF' : '#2a3145',
              paddingVertical: 9,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: active ? '#00F0FF' : '#8a8aa0', fontSize: 11, fontWeight: '700' }}>{v}</Text>
            <Text style={{ color: active ? '#00F0FF' : '#6b6b85', fontSize: 9, marginTop: 2 }}>{l}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}