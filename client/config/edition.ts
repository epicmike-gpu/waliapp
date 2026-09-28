/**
 * 应用版本（Edition）配置
 * - intl 海外版（默认）：名称「value」，Bundle ID com.wali.value，海外变现渠道（后续接 Amazon Associates 等）
 * - cn   国内版：名称「瓦砾」，Bundle ID com.wali.app，京东联盟 CPS（启动时 EXPO_PUBLIC_EDITION=cn 显式切换）
 * Expo 会将 EXPO_PUBLIC_* 内联到客户端运行时；默认海外版是因为平台托管 dev server 重启时
 * 不携带自定义环境变量，反转默认值可保证重启后仍是当前测试中的海外版。
 */
export type Edition = 'cn' | 'intl';

export const EDITION: Edition = process.env.EXPO_PUBLIC_EDITION === 'cn' ? 'cn' : 'intl';

/** 当前版本的应用显示名 */
export const APP_NAME = EDITION === 'intl' ? 'value' : '瓦砾';

/** 页面顶部品牌 kicker 行 */
export const BRAND_KICKER = EDITION === 'intl' ? 'VALUE · SWITCH RADAR' : 'WALI · SWITCH RADAR';
