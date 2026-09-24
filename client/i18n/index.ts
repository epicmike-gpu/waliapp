/**
 * 语言与文案（i18n）
 * - 语言由版本（edition）决定：cn → zh，intl → en
 * - t(key, params?) 支持占位符替换：t('home.toast.bound', { name: 'iPhone 15' })
 * - 缺 key 时回退中文表，再回退 key 本身
 */
import zh from './zh';
import en from './en';
import { EDITION } from '@/config/edition';

export type Lang = 'zh' | 'en';

export const LANG: Lang = EDITION === 'intl' ? 'en' : 'zh';

const DICTS: Record<Lang, Record<string, string>> = { zh, en };

export type TFunc = (key: string, params?: Record<string, string | number>) => string;

function translate(key: string, params?: Record<string, string | number>): string {
  let text = DICTS[LANG][key] ?? zh[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}

export const t: TFunc = translate;

/** 组件内使用（引用稳定，不会因渲染产生新函数） */
export function useT(): TFunc {
  return t;
}

/** 当前语言（由 edition 决定），供协议文档等非 t() 场景选用对应语种内容 */
export function useLang(): Lang {
  return LANG;
}
