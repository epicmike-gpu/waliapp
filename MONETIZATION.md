# ValueRadar（value）变现方案 · 讨论稿 v1

> 状态：方案探讨，未实施。文中标注 **[拍板]** 的为需要确认的决策点。
> 前提：仅发布 iOS（App Store + TestFlight），Bundle ID `com.wali.value`，生产后端 `https://www.waliapp.top`。

---

## 1. 现状基建盘点（变现的底子）

| 层 | 现状 | 位置 |
|----|------|------|
| 免费额度 | 每设备 1 份 AI 报告（`FREE_QUOTA = 1`） | `server/src/services/report-quota.ts` |
| 激励视频解锁 | +1 份/次，每日上限 10 次（`DAILY_UNLOCK_LIMIT`） | 同上（前端解锁入口已接） |
| 每日频控 | 每设备每日生成上限 20 份（控 LLM 成本） | 同上 |
| 设备记账 | `device_report_usage` 表（PG 直连，deviceId 主键） | 同上 |
| AI 成本项 | 对比报告走 Coze OpenAPI（`COZE_API_TOKEN`），SSE 流式 | `src/services/report-service.ts` |
| 强更开关 | `/api/v1/app/version` + Vercel 环境变量 | 生产已验证 |
| 付费层 | **不存在** —— 本文要补的第三层 | — |

结论：额度记账、设备隔离、成本护栏全部就绪，付费层接入后只需在 `report-quota` 的额度判定里加一条「付费权益优先」。

---

## 2. iOS 合规硬约束（不可绕过）

- **指南 3.1.1**：数字内容（AI 报告次数、会员）必须走 Apple IAP，抽成 30%；年收入 < $1M 可申请小型开发者计划降至 **15%**。
- App 内**不得**出现引导外部支付的信息（支付宝/微信/官网购买入口、价格对比文案），包括截图与描述。
- 自动续期订阅必须在 paywall 明示：价格、周期、自动续订条款、隐私政策链接、EULA 链接。
- **恢复购买（Restore Purchases）** 按钮是审核必查项，缺了会被拒。
- TestFlight 沙盒可完整测试 IAP 流程；提审时 paywall 必须真实可用（不能是空壳）。

---

## 3. 商业模式：推荐「订阅为主 + 次数包为辅 + 广告兜底」三轨

| 轨道 | 形式 | 定位 | IAP 类型 |
|------|------|------|----------|
| 主轨 | Pro 订阅（周/年） | 高频用户，LTV 最优 | 自动续期订阅 |
| 辅轨 | 报告次数包 | 低频用户，不想订阅 | 消耗型（Consumable） |
| 兜底 | 激励视频 | 零付费用户也能用，同时贡献广告收入 | —（保留现有） |

### 商品定价（US 市场，参考同类 AI 工具）**[拍板]**

| SKU | 类型 | 建议价 | 说明 |
|-----|------|--------|------|
| `pro_weekly` | 订阅 | $2.99/周 | 短期尝鲜入口 |
| `pro_annual` | 订阅 | $19.99/年（≈$0.38/周） | 主推档，paywall 默认选中，带 3 天免费试用 |
| `pack_3` | 消耗型 | $1.99 | 3 份报告 |
| `pack_10` | 消耗型 | $4.99 | 10 份报告（单价锚定优于 pack_3） |

- 免费层维持 **1 份报告**：这是转化钩子，不建议加码。
- Pro 权益边界 **[拍板]**：建议 = 无限报告（保留每日 50 份的滥用频控）+ 后续新功能优先体验。**不要**把现有基础功能（机型库、参数对比）划进付费墙——工具底座免费、AI 深度服务收费，审核与口碑都更稳。

---

## 4. 技术路线：RevenueCat（推荐）vs 自建

| 维度 | A. RevenueCat | B. 自建（StoreKit 2 + App Store Server API） |
|------|--------------|---------------------------------------------|
| 接入速度 | 2~3 天（SDK + webhook 托管） | 1~2 周（收据验证/退款/续订事件全要自己写） |
| 沙盒/退款/续订 | 全托管，Dashboard 可视化 | 自行处理 Server Notifications V2 |
| 成本 | 月交易额 $2.5k 内免费，之后 1% | $0 |
| 风险 | 第三方依赖（可导出数据，锁定风险低） | 实现复杂度高，首次过审风险大 |

**推荐 A**：个人开发者首个产品，验证付费意愿的速度 > 省下的 1%。EAS Build 支持 prebuild 原生模块（`react-native-purchases`），当前构建链已打通，无新增障碍。

### 数据模型（两条路线通用，RevenueCat 路线由 webhook 写入）

```sql
CREATE TABLE IF NOT EXISTS iap_purchases (
  transaction_id text PRIMARY KEY,          -- Apple 交易号（幂等键）
  device_id text NOT NULL,
  product_id text NOT NULL,
  purchase_date timestamptz NOT NULL,
  expires_date timestamptz,                 -- 订阅到期时间
  revoked boolean NOT NULL DEFAULT false,   -- 退款/家庭共享撤销
  raw jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS iap_entitlements (
  device_id text PRIMARY KEY,
  unlimited boolean NOT NULL DEFAULT false, -- 订阅有效 → 无限报告
  packs_remaining integer NOT NULL DEFAULT 0, -- 次数包余量
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 接口清单（挂在现有 Express，`/api/v1/iap/*`）

| 接口 | 作用 |
|------|------|
| `POST /api/v1/iap/verify` | 前端购买成功后上报交易 → 校验 → 写 purchase + 刷 entitlement |
| `GET /api/v1/iap/entitlements?deviceId:string` | 前端启动/进入报告页时拉权益 |
| `POST /api/v1/iap/webhook` | App Store Server Notifications V2（续订/退款/撤销）→ 更新 entitlement |

### report-quota 改造（一处接入点）

`getReportQuota()` 判定顺序改为：`订阅有效 → unlimited` → `packs_remaining > 0 → 消耗次数包` → `免费额度` → `激励视频`。生成报告的扣减逻辑同步加「次数包」来源。

---

## 5. Paywall 转化设计

- **触发时机**：
  1. 第 2 份报告生成前（免费额度耗尽，最高意图时刻）；
  2. 报告页底部"解锁完整分析"软性入口（报告免费给摘要，深度建议归 Pro——**[拍板]** 可选做法）；
  3. 设置页常驻"升级 Pro"。
- **页面结构**：免费 vs Pro 对比卡（无限报告 / 全部机型深度对比 / 优先生成）→ 年订阅大卡（默认选中 + 划线价锚定）→ 周订阅小卡 → 次数包横排 → 「恢复购买」+ 条款链接。
- 文案走 `EXPO_PUBLIC_EDITION` 双语机制（intl 英文 / cn 中文）。

---

## 6. 分阶段落地

- **P0（提审前必须）**：ASC 配置 4 个商品 → RevenueCat 接入（SDK + webhook）→ 权益后端三接口 → paywall 页 → 沙盒全流程测试（购买/恢复/退款）→ 恢复购买按钮。
- **P1（上线后）**：定价 A/B（RevenueCat Offerings 远程改价不打版）、试用期转化率复盘、周/年占比分析。
- **P2（增值方向）**：机型行情/成交价数据订阅、跨设备同步（引入账号体系）、家庭共享、国内版（瓦砾）单独定价（需 ICP 备案与大陆区协议）。

---

## 7. 风险清单

| 风险 | 对策 |
|------|------|
| 订阅用户高频生成，LLM 成本失控 | 付费用户保留每日频控（建议 50/日），且 Coze 报告按次计费可监控 |
| iOS 激励视频（AdMob）审核与 eCPM 双低 | 保留现有逻辑但降低依赖；付费是主叙事 |
| 退款滥用 | RevenueCat webhook 自动回收权益（revoked） |
| 大陆区上架（国内版） | ICP 备案 + 大陆 IAP 发票合规，暂列 P2 |
| 沙盒购买不扣款导致测试误判 | RevenueCat 沙盒测试指南 + Sandbox Apple ID 专用测试 |

---

## 8. 待拍板清单（下一步执行的前提）

1. **定价**：按 §3 建议价执行，还是调整？（价格改起来只需 ASC + Offerings，先跑通再调）
2. **技术路线**：RevenueCat（推荐）还是自建？
3. **试用**：年订阅是否带 3 天免费试用（推荐带，转化显著更高）？
4. **Pro 边界**：仅「无限报告」还是叠加新功能（行情数据等）？
5. **激励视频去留**：保留现三层结构，还是简化为「免费 1 次 + 付费」两层？

> 拍板后按 P0 清单开工：预计 RevenueCat 路线 2~3 个工作日完成从商品配置到沙盒测试的全链路。
