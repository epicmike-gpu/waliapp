/**
 * 设备唯一标识（变现记账依据）
 * - expo-crypto randomUUID 生成，AsyncStorage 持久化，全局唯一且引用稳定
 * - 严禁多处各自生成随机 ID（会导致设备 ID 不一致、额度记账错乱）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'wali.deviceId';

let cachedId: string | null = null;

/** 获取（或首次生成并持久化）设备 ID */
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  cachedId = id;
  return id;
}
