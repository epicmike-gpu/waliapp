/**
 * 设备自动检测工具
 *
 * - 机型识别：基于 expo-device 读取本机型号（modelName / modelId），与机型数据库模糊匹配
 * - 电池信息：基于 expo-battery 读取系统实时电量与充电状态（iOS 不开放电池健康度，需手动填写）
 */
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import type { PhoneModel } from './api';

export interface DetectedDevice {
  modelName: string | null;
  modelId: string | null;
  osName: string | null;
  osVersion: string | null;
  manufacturer: string | null;
  isRealDevice: boolean;
}

export interface BatterySnapshot {
  /** 0-100 的系统电量百分比，读取失败为 null */
  levelPercent: number | null;
  /** 充电状态中文描述 */
  stateLabel: string;
  /** 是否低电量模式 */
  lowPowerMode: boolean | null;
}

/** 读取本机设备信息（Expo Go / 开发构建均可） */
export async function getDetectedDevice(): Promise<DetectedDevice> {
  try {
    return {
      modelName: Device.modelName ?? null,
      modelId: Device.modelId ?? null,
      osName: Device.osName ?? null,
      osVersion: Device.osVersion ?? null,
      manufacturer: Device.manufacturer ?? null,
      isRealDevice: Device.isDevice === true,
    };
  } catch {
    return {
      modelName: null,
      modelId: null,
      osName: null,
      osVersion: null,
      manufacturer: null,
      isRealDevice: false,
    };
  }
}

/** 充电状态 → i18n key（展示层用 t() 翻译，避免 intl 界面泄漏中文） */
const BATTERY_STATE_LABEL: Record<number, string> = {
  0: 'battery.state.unknown',
  1: 'battery.state.notCharging',
  2: 'battery.state.charging',
  3: 'battery.state.full',
};

/** 读取系统电池实时快照（iOS 仅开放电量/充电状态，健康度不可读） */
export async function getBatterySnapshot(): Promise<BatterySnapshot> {
  try {
    const power = await Battery.getPowerStateAsync();
    const level = power.batteryLevel;
    const percent =
      typeof level === 'number' && level >= 0 && level <= 1 ? Math.round(level * 100) : null;
    return {
      levelPercent: percent,
      stateLabel: BATTERY_STATE_LABEL[power.batteryState] ?? 'battery.state.unknown',
      lowPowerMode: power.lowPowerMode ?? null,
    };
  } catch {
    return { levelPercent: null, stateLabel: 'battery.state.unknown', lowPowerMode: null };
  }
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/^apple\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 将检测到的机型名称与机型数据库匹配。
 * 支持「Pro Max / Plus / mini / Max」等尺寸后缀的降级匹配：
 * 例如 iPhone 15 Pro Max → iPhone 15 Pro（同代芯片 A17 Pro）。
 */
export function matchPhoneModel(
  detected: DetectedDevice | null,
  phones: PhoneModel[]
): PhoneModel | null {
  const raw = detected?.modelName?.trim();
  if (!raw || phones.length === 0) return null;

  const target = normalize(raw);

  // 1. 精确匹配
  const exact = phones.find((p) => normalize(p.name) === target);
  if (exact) return exact;

  // 2. 尺寸后缀降级匹配（同代芯片，参数一致）
  const fallbacks = [
    target.replace(/ pro max$/, ' pro'),
    target.replace(/ plus$/, ''),
    target.replace(/ mini$/, ''),
    target.replace(/ max$/, ''),
  ];
  for (const candidate of fallbacks) {
    if (candidate === target) continue;
    const hit = phones.find((p) => normalize(p.name) === candidate);
    if (hit) return hit;
  }
  return null;
}
