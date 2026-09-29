import { View, Text } from 'react-native';
import { LANG } from '@/i18n';
import { t } from '@/i18n';

/**
 * 官网级硬件规格分区渲染组件
 * 数据结构：{ 分区名: { 参数名: 参数值 } }（来自 phone_models.specs JSONB，后端同时返回英文版 specs_en）
 */

export type SpecMap = Record<string, Record<string, string>>;

/** 固定分区顺序（数据库 JSONB 返回时键序会被重排，展示必须按此顺序） */
export const SPEC_SECTION_ORDER = [
  '显示屏',
  '芯片',
  '内存与存储',
  '摄像头',
  '电池与充电',
  '机身',
  '连接与其他',
];

/** 英文版固定分区顺序（与后端 spec-i18n SECTION_MAP 的英文值一一对应） */
export const SPEC_SECTION_ORDER_EN = [
  'Display',
  'Chip',
  'Memory & Storage',
  'Camera',
  'Battery & Charging',
  'Body',
  'Connectivity & More',
];

/** 按当前语言选择规格数据与分区顺序 */
function pickLocalized(specs: SpecMap | null | undefined, specsEn?: SpecMap | null) {
  const data = LANG === 'en' ? specsEn ?? specs ?? {} : specs ?? {};
  const order = LANG === 'en' ? SPEC_SECTION_ORDER_EN : SPEC_SECTION_ORDER;
  return { data: data as SpecMap, order };
}

function orderedSections(specs: SpecMap, order: string[]): { key: string; rows: [string, string][] }[] {
  const keys = [
    ...order.filter((k) => specs[k]),
    ...Object.keys(specs).filter((k) => !order.includes(k)),
  ];
  return keys.map((key) => ({ key, rows: Object.entries(specs[key] ?? {}) }));
}

/** 分区标题（青色竖条 + 分隔线） */
export function SpecSectionHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 2 }}>
      <View style={{ width: 3, height: 12, backgroundColor: '#00F0FF', borderRadius: 1.5 }} />
      <Text style={{ color: '#00F0FF', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginLeft: 8 }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: '#1e2433', marginLeft: 10 }} />
    </View>
  );
}

/** 单机型完整规格列表（首页用） */
export function SpecSections({ specs, specsEn }: { specs: SpecMap; specsEn?: SpecMap | null }) {
  const { data, order } = pickLocalized(specs, specsEn);
  const sections = orderedSections(data, order);
  if (!sections.length) return null;
  return (
    <View>
      {sections.map((s) => (
        <View key={s.key}>
          <SpecSectionHeader title={s.key} />
          {s.rows.map(([label, value]) => (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                paddingVertical: 7,
                borderTopWidth: 1,
                borderTopColor: '#1a1f2c',
              }}
            >
              <Text style={{ width: 96, color: '#6b6b85', fontSize: 12, paddingTop: 1 }}>{label}</Text>
              <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 12.5, lineHeight: 18 }}>{value}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** 双机型分区规格对比表（对比页用，差异高亮） */
export function SpecCompareTable({
  mine,
  target,
  mineEn,
  targetEn,
}: {
  mine: SpecMap | null;
  target: SpecMap | null;
  mineEn?: SpecMap | null;
  targetEn?: SpecMap | null;
}) {
  if (!mine || !target) {
    return <Text style={{ color: '#6b6b85', fontSize: 12, lineHeight: 18 }}>{t('spec.noData')}</Text>;
  }
  const { data: mineData, order } = pickLocalized(mine, mineEn);
  const { data: targetData } = pickLocalized(target, targetEn);
  const sectionKeys = Object.keys(mineData).concat(Object.keys(targetData).filter((k) => !(k in mineData)));
  const ordered = [
    ...order.filter((k) => sectionKeys.includes(k)),
    ...sectionKeys.filter((k) => !order.includes(k)),
  ];
  return (
    <View>
      {ordered.map((sectionKey) => {
        const labels: string[] = [];
        for (const label of [...Object.keys(mineData[sectionKey] ?? {}), ...Object.keys(targetData[sectionKey] ?? {})]) {
          if (!labels.includes(label)) labels.push(label);
        }
        return (
          <View key={sectionKey}>
            <SpecSectionHeader title={sectionKey} />
            {labels.map((label) => {
              const a = mineData[sectionKey]?.[label] ?? '—';
              const b = targetData[sectionKey]?.[label] ?? '—';
              const diff = a !== b;
              return (
                <View
                  key={label}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#1a1f2c',
                    backgroundColor: diff ? 'rgba(0,240,255,0.04)' : 'transparent',
                  }}
                >
                  <Text style={{ flex: 1.1, color: '#6b6b85', fontSize: 11.5, paddingTop: 1 }}>{label}</Text>
                  <Text
                    style={{
                      flex: 1.4,
                      color: diff ? '#E8E8F0' : '#8a8aa0',
                      fontSize: 11.5,
                      lineHeight: 17,
                      paddingRight: 8,
                    }}
                  >
                    {a}
                  </Text>
                  <Text
                    style={{
                      flex: 1.4,
                      color: diff ? '#00F0FF' : '#8a8aa0',
                      fontSize: 11.5,
                      lineHeight: 17,
                      fontWeight: diff ? '700' : '400',
                    }}
                  >
                    {b}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
