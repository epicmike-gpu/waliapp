# ValueRadar（value）变现方案 · v2 决议

> v1（订阅+次数包三轨）见 git 历史。**v2 拍板：纯激励视频模式**——不做订阅/Pro/次数包，报告按次看广告变现。
> 前提：仅发布 iOS（App Store + TestFlight），Bundle ID `com.wali.value`，生产后端 `https://www.waliapp.top`。

---

## 1. 模式定义（v2 决议）

| 规则 | 决议 |
|------|------|
| 免费额度 | **保留 1 次/设备**（新用户首次体验不设卡，先尝到价值再要求看广告） |
| 第 2 次起 | 每生成 1 份报告，先完整观看 1 个激励视频（1:1 挂钩，收入覆盖 LLM 成本） |
| 每日频控 | **保留**（每设备每日上限，防无效流量倒挂，建议放宽至 30~50/日） |
| 订阅/Pro/次数包 | **不做**。额度记账体系（`device_report_usage`）保留，未来若要加 IAP 零架构改动 |
| 广告 SDK | **AdMob 激励视频**（当前为模拟组件，需接入真广告——P0 核心工作量） |

### 为什么保留免费 1 次和每日频控（两个修正点）

- **免费 1 次**：无免费额度 = 新用户第一次点"生成"就被要求看 30 秒广告，转化漏斗断在价值体验之前。先免费给 1 份报告，第 2 次起再看广告，留存与广告完成率都显著更好。
- **每日频控**：唯一真正的亏损路径是无效流量——刷子刷广告展示，AdMob 判定无效不结钱，但 LLM 成本已经发生。1:1 挂钩覆盖的是"正常用户"，频控兜住的是"异常用户"。

---

## 2. 单位经济模型（2026-10 实测）

实测方法：调生产接口 `POST /api/v1/phones/report` 真实生成一份报告，量得输入/输出规模；单价取火山方舟豆包 seed-1.6/1.8（输入 ≤32k 档：输入 ¥0.8/百万 tokens、输出 ¥8/百万 tokens）。

| 项 | 实测值 |
|----|--------|
| 输入（system prompt + 两台机全量规格 JSON） | ~1,100 tokens（2,657 字符） |
| 输出（8 章节完整报告，中文） | ~650 tokens（实测 994 字符） |
| 合计 | ~1,750 tokens/次 |
| **单次 LLM 成本（方舟直连底价）** | **≈ ¥0.006/次（$0.0008）** |
| 单次 LLM 成本（扣子平台资源点结算，含平台加成估算） | ¥0.01~0.02/次 |
| 激励视频收入（US 流量，eCPM $10-25） | ¥0.07~0.18/次 |
| 激励视频收入（混合全球流量，eCPM $3-8） | ¥0.02~0.06/次 |

**结论：纯激励视频模式毛利约 1~18 倍，单次经济为正成立。** 准确数字以扣子后台用量账单为准（沙箱无 COZE_API_TOKEN，无法直连核对）。

> 注：模型为扣子平台上 Bot 绑定的模型（`COZE_BOT_ID`，大概率豆包系列）。若换成 thinking 档或更高价位模型，输出单价升至 ¥16-24/百万，单次成本约 ¥0.01-0.03，仍在广告覆盖范围内；避免使用 doubao-seed-2.0-pro 等高档模型（¥48/百万输出）即可。

---

## 3. P0 落地清单：接入真实 AdMob —— 已完成（2026-10-03，build 12）

当前 `client/components/RewardedAdModal.tsx` 已重写为真广告（iOS/Android 走 AdMob SDK；Web 预览保留模拟倒计时）。对外接口扩展为 `onClose('completed' | 'abandoned' | 'failed')`。

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 安装 `react-native-google-mobile-ads@17.2.0` + `expo-tracking-transparency`；`app.config.js` 插件配置（Google 测试 App ID + ATT 双语文案） | ✅ |
| 2 | 广告单元 ID 由服务端下发：`GET /api/v1/app/config`（环境变量 `AD_REWARDED_UNIT_ID_IOS` / `AD_ENABLED`，Vercel 配置即可切正式 ID，前端免重新提审）；TestFlight 阶段用 Google 测试 ID | ✅ |
| 3 | `RewardedAdModal` 真广告：加载态 UI / EARNED_REWARD+CLOSED → completed / 提前关闭 → abandoned / 加载失败或超时（12s）→ **failed 放行**（前端照常调 unlock，reason=ad_failed 服务端打点） | ✅ |
| 4 | ATT 弹窗：首次看广告时请求（`ensureTrackingPermission`），拒绝 → 无个性化广告，仍可解锁 | ✅ |
| 5 | `app-ads.txt`：待 AdMob 后台创建正式 App 后部署到 `www.waliapp.top/app-ads.txt` | ⏳ 等正式账号 |
| 6 | 服务端加固：unlock 每日上限（`DAILY_UNLOCK_LIMIT`=10）已在；SSV 可选 P1 | ✅（SSV 未接） |
| 7 | 沙盒/真机验证：完整观看 → 解锁 +1 → 生成 → 扣减，全链路打点（服务端日志 `[reports] unlock via ad_failed/completed`） | ✅ 冒烟通过，待真机验收 |

**已知配套修复**：RN 0.86 Web 编译 500（`ReactDevToolsSettingsManager` 平台限定文件无法 resolve）→ `metro.config.js` 对 web 平台 stub `react-devtools-core`。

**build 12（构建中）包含**：AdMob SDK + ATT + 服务端广告配置下发 + unlock reason 打点 + DAILY_LIMIT 20→50。

---

## 4. 数据与观察指标（P1 决策输入）

上线后跟踪 4~6 周，用数据决定是否引入付费层（P1 观察项，非承诺）：

| 指标 | 含义 | 触发再评估的信号 |
|------|------|------------------|
| 人均报告生成次数 | 用量深度 | 周人均 > 5 次 → 用量深，用户可能愿意付费去广告 |
| 广告完成率 | 体验摩擦 | < 60% → 摩擦过高，考虑加免费额度或换广告位 |
| "免广告"负反馈 | 支付意愿 | 设置页/评价中出现付费询问 → 引入「去广告订阅」P1 |
| 次均广告收入 vs 次均成本 | 单位经济 | eCPM 季节性低谷导致倒挂 → 控频控或换模型 |
| D1/D7 留存 | 产品价值 | 留存健康才值得投 IAP 开发 |

**P1 备选（若数据触发）**：IAP「去广告订阅」或次数包（v1 方案的商品表与 RevenueCat 路线仍适用，架构已预留）。

---

## 5. 风险清单

| 风险 | 对策 |
|------|------|
| AdMob 无效流量不结钱，LLM 成本照付 | 每日频控保留（兜底）；SSV 校验（P0 可选） |
| 广告加载失败导致功能不可用 | 失败放行 + 打点（P0 步骤 3）；保留免费 1 次 |
| 模拟广告漏上生产（违规：自刷假广告） | ✅ 已消除：build 12 起原生端走 AdMob SDK；Web 预览的模拟倒计时仅限 dev 环境 |
| 旗舰模型成本倒挂 | 报告生成统一走轻量模型；长上下文裁剪 |
| ATT 拒绝率高拉低 eCPM | 文案优化（说明广告相关性）；拒绝仍可出无个性化广告 |
| 大陆区上架（国内版瓦砾） | 暂列 P2：ICP 备案 + 大陆广告合规 |

---

## 6. 已有基建（无需改动）

- `report-quota.ts`：免费 1 次 / 解锁额度 / 每日频控三层记账，PG 直连 + 内存兜底
- `device_report_usage` 表 + 设备隔离（deviceId）
- `RewardedAdModal` 对外接口已抽象（`visible + onClose(result)`），替换内部实现即可
- `POST /api/v1/reports/unlock` 每日解锁上限校验已在
- 强更开关 `/api/v1/app/version`（变现相关配置热更新能力）
