/**
 * App 版本与强制更新配置路由
 * GET /api/v1/app/version → { data: { minVersion, latestVersion, updateUrl, forceUpdate } }
 *
 * 配置来源（Vercel 环境变量，未配置时给默认值=不强制更新）：
 * - APP_MIN_VERSION     最低可用版本（低于此版本强制更新），如 "1.1.0"
 * - APP_LATEST_VERSION  最新版本号（用于"发现新版本"提示），默认 "1.0.0"
 * - APP_UPDATE_URL      商店更新链接（App Store 上架后填 itms-apps:// 链接）
 * - APP_FORCE_UPDATE    "true" 时对全部低于 latest 的版本也强制（默认 false）
 */
import { Router } from "express";

export const appRouter = Router();

appRouter.get("/version", (_req, res) => {
  const minVersion = process.env.APP_MIN_VERSION ?? "0.0.0";
  const latestVersion = process.env.APP_LATEST_VERSION ?? "1.0.0";
  const updateUrl = process.env.APP_UPDATE_URL ?? "";
  const forceUpdate = (process.env.APP_FORCE_UPDATE ?? "false") === "true";
  res.json({ data: { minVersion, latestVersion, updateUrl, forceUpdate } });
});

/** 兜底：未知子路径 */
appRouter.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});
