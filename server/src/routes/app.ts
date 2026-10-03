/**
 * App 版本与强制更新配置路由
 * GET /api/v1/app/version  → { data: { minVersion, latestVersion, updateUrl, forceUpdate } }
 * GET /api/v1/app/config   → { data: { ad: { enabled, rewardedUnitId } } }
 *
 * 配置来源（Vercel 环境变量，未配置时给默认值=不强制更新）：
 * - APP_MIN_VERSION     最低可用版本（低于此版本强制更新），如 "1.1.0"
 * - APP_LATEST_VERSION  最新版本号（用于"发现新版本"提示），默认 "1.0.0"
 * - APP_UPDATE_URL      商店更新链接（App Store 上架后填 itms-apps:// 链接）
 * - APP_FORCE_UPDATE    "true" 时对全部低于 latest 的版本也强制（默认 false）
 *
 * 广告配置（Vercel 环境变量）：
 * - AD_REWARDED_UNIT_ID_IOS  AdMob 激励视频广告单元 ID（正式）；未配置时下发 Google 测试 ID（TestFlight 阶段）
 * - AD_ENABLED               "false" 时全局关闭广告（广告故障兜底，前端直接放行生成）
 */
import { Router } from "express";

export const appRouter = Router();

/** Google 官方激励视频测试广告单元（TestFlight/开发阶段） */
const TEST_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/1712485313";

appRouter.get("/version", (_req, res) => {
  const minVersion = process.env.APP_MIN_VERSION ?? "0.0.0";
  const latestVersion = process.env.APP_LATEST_VERSION ?? "1.0.0";
  const updateUrl = process.env.APP_UPDATE_URL ?? "";
  const forceUpdate = (process.env.APP_FORCE_UPDATE ?? "false") === "true";
  res.json({ data: { minVersion, latestVersion, updateUrl, forceUpdate } });
});

/** 远程配置：广告开关 + 广告单元 ID（后端下发，切换正式 ID 无需重新提审） */
appRouter.get("/config", (_req, res) => {
  const enabled = (process.env.AD_ENABLED ?? "true") !== "false";
  const rewardedUnitId = process.env.AD_REWARDED_UNIT_ID_IOS ?? TEST_REWARDED_UNIT_ID;
  res.json({
    data: {
      ad: {
        enabled,
        rewardedUnitId,
        /** 测试 ID 标记：前端据此展示"测试广告"提示，避免误判收入 */
        isTestUnit: !process.env.AD_REWARDED_UNIT_ID_IOS,
      },
    },
  });
});

/** 兜底：未知子路径 */
appRouter.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});
