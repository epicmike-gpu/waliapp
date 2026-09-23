/**
 * 协议同意记录（版本化）
 * 首次启动 / 协议版本更新时，AgreementGate 会要求用户重新同意
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const AGREEMENT_KEY = 'switch_radar_agreement_version';

/** 当前协议版本：更新《用户协议》或《隐私政策》实质内容时递增 */
export const AGREEMENT_VERSION = '1.0.0';

/** 是否已同意当前版本的协议 */
export async function isAgreementAccepted(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(AGREEMENT_KEY);
    return v === AGREEMENT_VERSION;
  } catch {
    return false;
  }
}

/** 记录用户已同意当前版本 */
export async function acceptAgreement(): Promise<void> {
  await AsyncStorage.setItem(AGREEMENT_KEY, AGREEMENT_VERSION);
}
