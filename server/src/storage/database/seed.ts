import { getSupabaseClient } from './supabase-client.js';
import { SEED_PHONE_MODELS } from './seed-data.js';

/**
 * 启动自举：确保 phone_models 表有数据。
 *
 * 表结构由平台发布流程（coze-coding-ai db upgrade / db ensure）负责同步，
 * 本函数只负责数据：目标库检测到空表时自动灌入 16 台机型种子数据（幂等，可重复执行）。
 * 这样发布到全新环境（如 product）时，只要表结构同步完成，服务一起来数据就位。
 */
export async function ensurePhoneModelsSeeded(): Promise<void> {
  const client = getSupabaseClient();
  try {
    const { count, error } = await client
      .from('phone_models')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;

    if ((count ?? 0) > 0) {
      console.log(`[seed] phone_models already has ${count} rows, skip seeding`);
      return;
    }

    console.log(`[seed] phone_models is empty, seeding ${SEED_PHONE_MODELS.length} models...`);

    // 自引用外键（upgrade_model_id -> phone_models.id）：
    // 先不带引用插入全部行，再逐条回填引用，避免同批次外键校验失败
    const baseRows = SEED_PHONE_MODELS.map(({ upgrade_model_id, ...rest }) => rest);
    const { error: insertError } = await client.from('phone_models').insert(baseRows);
    if (insertError) throw insertError;

    for (const model of SEED_PHONE_MODELS) {
      if (model.upgrade_model_id == null) continue;
      const { error: updateError } = await client
        .from('phone_models')
        .update({ upgrade_model_id: model.upgrade_model_id })
        .eq('id', model.id);
      if (updateError) throw updateError;
    }

    console.log(`[seed] phone_models seeded (${SEED_PHONE_MODELS.length} rows)`);
  } catch (err) {
    // 自举失败不阻断服务启动（例如目标库表结构尚未同步），仅记录告警
    console.error('[seed] ensurePhoneModelsSeeded failed:', err);
  }
}
