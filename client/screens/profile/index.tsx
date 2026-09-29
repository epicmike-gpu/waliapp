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
import { loadDeviceConfig, saveDeviceConfig, clearDeviceConfig, type DeviceConfig } from '@/utils/device-storage';
import {
  getDetectedDevice,
  getBatterySnapshot,
  matchPhoneModel,
  type DetectedDevice,
  type BatterySnapshot,
} from '@/utils/device-detect';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useT } from '@/i18n';

/** 常用 App 类型选项（key 与后端 USAGE_DEMAND_MAP 对应；label 走 i18n） */
const USAGE_OPTIONS = [
  { key: 'social', icon: 'chatbubbles-outline' },
  { key: 'video', icon: 'videocam-outline' },
  { key: 'game', icon: 'game-controller-outline' },
  { key: 'photo', icon: 'camera-outline' },
  { key: 'work', icon: 'book-outline' },
  { key: 'web', icon: 'cart-outline' },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const t = useT();

  const [phones, setPhones] = useState<PhoneModel[]>([]);
  const [config, setConfig] = useState<DeviceConfig | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [benchmark, setBenchmark] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [batteryCycles, setBatteryCycles] = useState('');
  const [smoothness, setSmoothness] = useState(3);
  const [usageCategories, setUsageCategories] = useState<string[]>([]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [usageGuideVisible, setUsageGuideVisible] = useState(false);
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
          setUsageCategories(Array.isArray(cfg.usageCategories) ? cfg.usageCategories : []);
        }
      } catch (e) {
        Toast.show({ type: 'error', text1: t('profile.toast.loadFail'), text2: e instanceof Error ? e.message : t('profile.toast.loadFailDesc') });
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
  }, [t]);

  const applyAutoFill = useCallback(
    (det: DetectedDevice | null, list: PhoneModel[]) => {
      const matched = matchPhoneModel(det, list);
      if (matched) {
        setSelectedId(matched.id);
        setBenchmark(String(matched.reference_score));
        setAutoFilled(true);
        Toast.show({
          type: 'success',
          text1: t('profile.toast.matched', { name: matched.name }),
          text2: t('profile.toast.matchedDesc', { chip: matched.chip_name }),
        });
      } else {
        Toast.show({ type: 'info', text1: t('profile.toast.notMatched'), text2: t('profile.toast.pickManually') });
      }
    },
    [t]
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
      Toast.show({ type: 'error', text1: t('profile.toast.needModel') });
      return;
    }
    setSaving(true);
    try {
      const bench = benchmark.trim() ? Number(benchmark.trim()) : undefined;
      const health = batteryHealth.trim() ? Number(batteryHealth.trim()) : undefined;
      const cycles = batteryCycles.trim() ? Number(batteryCycles.trim()) : undefined;
      if (bench !== undefined && (Number.isNaN(bench) || bench < 0)) {
        Toast.show({ type: 'error', text1: t('profile.toast.benchInvalid') });
        return;
      }
      if (health !== undefined && (Number.isNaN(health) || health < 0 || health > 100)) {
        Toast.show({ type: 'error', text1: t('profile.toast.healthInvalid') });
        return;
      }
      await saveDeviceConfig({
        phoneId: selectedId,
        benchmarkScore: bench,
        batteryHealth: health,
        batteryCycles: Number.isNaN(cycles ?? NaN) ? undefined : cycles,
        smoothness,
        usageCategories,
      });
      Toast.show({ type: 'success', text1: t('profile.toast.saved') });
      router.navigate('/');
    } finally {
      setSaving(false);
    }
  }, [selectedId, benchmark, batteryHealth, batteryCycles, smoothness, usageCategories, router, t]);

  const handleClear = useCallback(() => {
    clearDeviceConfig().then(() => {
      setConfig(null);
      setSelectedId(null);
      setBenchmark('');
      setBatteryHealth('');
      setBatteryCycles('');
      setSmoothness(3);
      setUsageCategories([]);
      Toast.show({ type: 'info', text1: t('profile.toast.cleared') });
    });
  }, [t]);

  const phone = selectedPhone();

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>DEVICE CENTER</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#E8E8F0', marginTop: 6 }}>{t('profile.title')}</Text>
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
              <NeonCard label={t('profile.autoDetect')} divider={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <Ionicons name="sparkles" size={17} color="#00F0FF" />
                    <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700', marginLeft: 8 }} numberOfLines={1}>
                      {detected?.modelName ?? (detecting ? t('profile.reading') : t('profile.noDeviceRead'))}
                    </Text>
                    {detected && !detected.isRealDevice ? (
                      <Text style={{ color: '#FFD166', fontSize: 10, marginLeft: 6 }}>{t('profile.simulator')}</Text>
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
                      {detecting ? t('profile.detecting') : t('profile.redetect')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12, gap: 7 }}>
                  <Text style={{ color: '#6b6b85', fontSize: 12 }}>
                    {t('profile.system', {
                      v: detected ? `${detected.osName ?? '-'} ${detected.osVersion ?? ''}` : '-',
                    })}
                  </Text>
                  <Text style={{ color: '#6b6b85', fontSize: 12 }}>
                    {t(
                      'profile.battery',
                      batteryInfo?.levelPercent != null
                        ? { v: t('profile.batteryLevel', { level: batteryInfo.levelPercent, state: batteryInfo.stateLabel }) }
                        : { v: t('profile.batteryNA') }
                    )}
                  </Text>
                  <Text
                    style={{
                      color: autoFilled && selectedId ? '#00FF88' : '#6b6b85',
                      fontSize: 12,
                      lineHeight: 18,
                    }}
                  >
                    {autoFilled && selectedId
                      ? t('profile.autoFilled')
                      : detected?.modelName
                        ? t('profile.notMatched', { model: detected.modelName })
                        : t('profile.batteryManual')}
                  </Text>
                </View>
              </NeonCard>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('profile.step1')}>
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
                        {t('profile.chipScore', { chip: phone.chip_name, score: phone.reference_score })}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#6b6b85', fontSize: 14 }}>{t('profile.pickModel')}</Text>
                  )}
                  <Ionicons name="chevron-down" size={18} color="#00F0FF" />
                </TouchableOpacity>
              </NeonCard>
            </View>

            {/* 完整硬件规格（随时可看，跟随所选机型） */}
            {phone?.specs && Object.keys(phone.specs).length > 0 ? (
              <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
                <NeonCard label={t('home.specsTitle')} divider={false}>
                  <TouchableOpacity
                    onPress={() => setSpecsOpen((v) => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ color: '#8a8aa0', fontSize: 12.5, fontWeight: '600', flex: 1, marginRight: 8 }}>
                      {specsOpen ? t('home.specsCollapse') : `${phone.name} · ${t('home.specsExpand')}`}
                    </Text>
                    <Ionicons name={specsOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#00F0FF" />
                  </TouchableOpacity>
                  {specsOpen ? (
                    <View style={{ marginTop: 2 }}>
                      <SpecSections specs={phone.specs ?? {}} specsEn={phone.specs_en} />
                    </View>
                  ) : null}
                </NeonCard>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('profile.step2')}>
                <FieldInput
                  label={t('profile.benchmark')}
                  hint={t('profile.benchmarkHint')}
                  value={benchmark}
                  onChangeText={setBenchmark}
                  keyboardType="numeric"
                />
                <FieldInput
                  label={t('profile.smoothness')}
                  hint={t('profile.smoothnessHint')}
                  customContent={<SmoothnessSelector value={smoothness} onChange={setSmoothness} />}
                />
                <FieldInput
                  label={t('profile.usage')}
                  customContent={
                    <View>
                      <UsageProfileSelector value={usageCategories} onChange={setUsageCategories} />
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <Ionicons name="information-circle-outline" size={13} color="#555570" />
                        <Text style={{ color: '#555570', fontSize: 10.5, marginLeft: 5, flex: 1, lineHeight: 15 }}>
                          {t('profile.usageHint')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setUsageGuideVisible(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
                      >
                        <Ionicons name="help-circle-outline" size={14} color="#00F0FF" />
                        <Text style={{ color: '#00F0FF', fontSize: 11.5, marginLeft: 5, fontWeight: '600' }}>
                          {t('profile.usageGuideLink')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <Ionicons name="information-circle-outline" size={13} color="#555570" />
                  <Text style={{ color: '#555570', fontSize: 10.5, marginLeft: 5, flex: 1, lineHeight: 15 }}>
                    {t('profile.benchmarkNote')}
                  </Text>
                </View>
              </NeonCard>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
              <NeonCard label={t('profile.step3')} divider={false}>
                <FieldInput
                  label={t('profile.capacity')}
                  hint={phone ? t('profile.capacityHintPhone', { n: phone.battery_cycle_standard }) : t('profile.capacityHintDefault')}
                  value={batteryHealth}
                  onChangeText={setBatteryHealth}
                  keyboardType="numeric"
                />
                <FieldInput
                  label={t('profile.cycles')}
                  hint={t('profile.optional')}
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
                    {t('profile.batteryGuideLink')}
                  </Text>
                </TouchableOpacity>
              </NeonCard>
            </View>

            {/* 操作按钮 */}
            <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 12 }}>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ borderRadius: 6, overflow: 'hidden' }}>
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 15 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 13, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}>
                    {saving ? t('profile.saving') : t('profile.save')}
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
                    {t('profile.clear')}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* 协议入口 */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => router.push('/agreement', { type: 'user' })}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#2a3145',
                    backgroundColor: '#12121A',
                  }}
                >
                  <Ionicons name="document-text-outline" size={14} color="#8a8aa0" />
                  <Text style={{ color: '#8a8aa0', fontSize: 12, fontWeight: '600' }}>{t('profile.userAgreement')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/agreement', { type: 'privacy' })}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#2a3145',
                    backgroundColor: '#12121A',
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={14} color="#8a8aa0" />
                  <Text style={{ color: '#8a8aa0', fontSize: 12, fontWeight: '600' }}>{t('profile.privacyPolicy')}</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '800' }}>{t('profile.pickTitle')}</Text>
                  <Text style={{ color: '#6b6b85', fontSize: 12, marginTop: 4 }}>{t('profile.pickCount', { n: phones.length })}</Text>
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
                              {t('profile.pickItem', {
                                chip: item.chip_name,
                                year: item.release_year,
                                score: item.reference_score,
                              })}
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
                <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>{t('profile.guideTitle')}</Text>
                <TouchableOpacity onPress={() => setGuideVisible(false)}>
                  <Ionicons name="close" size={20} color="#6b6b85" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#b9b9cf', fontSize: 13, lineHeight: 21, marginTop: 12 }}>{t('guide.battery')}</Text>
              <TouchableOpacity
                onPress={() => setGuideVisible(false)}
                style={{ marginTop: 18, borderRadius: 6, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 11 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>{t('common.gotIt')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 屏幕使用时间查看指南 Modal（用机画像参考） */}
      <Modal visible={usageGuideVisible} transparent animationType="fade" onRequestClose={() => setUsageGuideVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setUsageGuideVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#12121A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)', padding: 22, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>{t('profile.usageGuideTitle')}</Text>
                <TouchableOpacity onPress={() => setUsageGuideVisible(false)}>
                  <Ionicons name="close" size={20} color="#6b6b85" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380, marginTop: 12 }}>
                <Text style={{ color: '#b9b9cf', fontSize: 13, lineHeight: 21 }}>{t('guide.screenTime')}</Text>
              </ScrollView>
              <TouchableOpacity
                onPress={() => setUsageGuideVisible(false)}
                style={{ marginTop: 18, borderRadius: 6, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 11 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>{t('common.gotIt')}</Text>
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

/** 常用 App 类型多选器（用机画像，供评分权重使用） */
function UsageProfileSelector({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const t = useT();
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {USAGE_OPTIONS.map((opt) => {
        const active = value.includes(opt.key);
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => toggle(opt.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: active ? '#0d1a1e' : '#16161f',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: active ? '#00F0FF' : '#2a3145',
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name={opt.icon} size={13} color={active ? '#00F0FF' : '#6b6b85'} />
            <Text style={{ color: active ? '#00F0FF' : '#8a8aa0', fontSize: 11, fontWeight: '600', marginLeft: 5 }}>
              {t(`profile.usage.${opt.key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SmoothnessSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useT();
  const labels = [1, 2, 3, 4, 5].map((n) => t(`profile.smooth.${n}`));
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
