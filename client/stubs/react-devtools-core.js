/**
 * Web 端 react-devtools-core stub（Metro resolver 注入，仅 platform=web）
 *
 * 背景：RN 0.86 的 setUpReactDevTools.js 在 __DEV__ 下无条件 require react-devtools-core
 * 与平台限定的 ReactDevToolsSettingsManager（仅 .android/.ios 实现），Web resolver 失败导致
 * 整包编译 500；而空模块又会让 getGlobalHookSettings() 调用报 TypeError。
 * 此 stub 提供运行时兼容接口，Web 预览不启用 DevTools 联调。
 */
module.exports = {
  initialize: function () {},
  connectToDevTools: function () {},
  connectWithCustomMessagingProtocol: function () {},
  getGlobalHookSettings: function () {
    return null;
  },
};
