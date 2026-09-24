/**
 * 应用版本（Edition）配置
 * - cn   国内版：名称「瓦砾」，Bundle ID com.wali.app，京东联盟 CPS
 * - intl 海外版：名称「value」，Bundle ID com.wali.value，海外变现渠道（后续接 Amazon Associates 等）
 * 通过构建期环境变量 EXPO_PUBLIC_EDITION=intl 切换（Expo 会将 EXPO_PUBLIC_* 内联到客户端运行时）
 */
export type Edition = 'cn' | 'intl';

export const EDITION: Edition = process.env.EXPO_PUBLIC_EDITION === 'intl' ? 'intl' : 'cn';

/** 当前版本的应用显示名 */
export const APP_NAME = EDITION === 'intl' ? 'value' : '瓦砾';

/** 页面顶部品牌 kicker 行 */
export const BRAND_KICKER = EDITION === 'intl' ? 'VALUE · SWITCH RADAR' : 'WALI · SWITCH RADAR';
