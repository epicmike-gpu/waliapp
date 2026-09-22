/**
 * 导购数据源抽象层（affiliate adapters）
 *
 * 统一入口：getPurchaseLink / affiliateConfigured
 * 按平台分发，后续接入新平台（如淘宝客、拼多多多多进宝、爱回收回收导流）时，
 * 新增 adapter 并在 getPurchaseLink 中扩展 platform 参数即可，前端无需改动。
 */
import {
  getJdUnionPurchaseLink,
  isJdUnionConfigured,
  type JdPurchaseLinkResult,
} from './jd-union';

export interface PurchaseLinkResult extends JdPurchaseLinkResult {}

/** 导购渠道是否已配置（未配置时前端隐藏导购入口，避免死按钮） */
export function affiliateConfigured(): boolean {
  return isJdUnionConfigured();
}

/**
 * 获取机型对应的 CPS 导购链接
 * @param modelName 机型名（如 "iPhone 17 Pro"）
 * @param budget 预算上限（元），可选
 */
export async function getPurchaseLink(
  modelName: string,
  budget?: number
): Promise<PurchaseLinkResult> {
  // 当前仅接入京东联盟；多平台后可按 modelId → 平台映射分发
  return getJdUnionPurchaseLink(modelName, budget);
}
