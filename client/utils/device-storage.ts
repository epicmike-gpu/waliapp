import AsyncStorage from '@react-native-async-storage/async-storage';

/** 设备配置在本地持久化的 key */
const STORAGE_KEY = 'switch_radar_device_config';

export interface DeviceConfig {
  phoneId: number;
  benchmarkScore?: number;
  batteryHealth?: number;
  batteryCycles?: number;
  smoothness?: number;
  updatedAt: number;
}

/** 读取本地设备配置 */
export async function loadDeviceConfig(): Promise<DeviceConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeviceConfig;
  } catch {
    return null;
  }
}

/** 保存设备配置到本地 */
export async function saveDeviceConfig(config: Omit<DeviceConfig, 'updatedAt'>): Promise<void> {
  const payload: DeviceConfig = { ...config, updatedAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** 删除本地设备配置 */
export async function clearDeviceConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** 手动填写电池健康数据 */
export function batteryGuide(): string {
  return '前往「设置 → 电池 → 电池健康与充电」可查看最大容量百分比（如 87%）。若系统已显示「电池健康下降」，建议更换电池。';
}