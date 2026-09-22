import AsyncStorage from '@react-native-async-storage/async-storage';

/** 设备配置在本地持久化的 key */
const STORAGE_KEY = 'switch_radar_device_config';

export interface DeviceConfig {
  phoneId: number;
  benchmarkScore?: number;
  batteryHealth?: number;
  batteryCycles?: number;
  smoothness?: number;
  /** 常用 App 类型（用机画像）：social/video/game/photo/work/web */
  usageCategories?: string[];
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

/** 屏幕使用时间查看指南（用机画像勾选参考） */
export function screenTimeGuide(): string {
  return (
    '打开 iPhone「设置 → 屏幕使用时间」（部分系统版本叫「屏幕时间」）：\n\n' +
    '1. 点按「查看所有 App 与网站活动」，顶部可在「天 / 周」间切换，查看过去 7 天或更久的使用情况；\n' +
    '2. 「最常使用」列表按使用时长排行，可看到微信、抖音等具体 App 的每日/每周时长；\n' +
    '3. 「类别」页签按社交、创意、娱乐、游戏、信息与阅读、效率等分类汇总；\n' +
    '4. 对照使用时长最多的类别，回到本页勾选对应的常用 App 类型（可多选）。\n\n' +
    '说明：屏幕使用时间数据受系统隐私保护，第三方 App 无法读取，因此需要你手动对照填写；若使用多台设备，可在「屏幕使用时间」中开启「在所有设备间共享」汇总统计。'
  );
}