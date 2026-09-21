import { View, Text } from 'react-native';

/**
 * 官网级硬件规格分区渲染组件
 * 数据结构：{ 分区名: { 参数名: 参数值 } }（来自 phone_models.specs JSONB）
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

function orderedSections(specs: SpecMap): { key: string; rows: [string, string][] }[] {
  const keys = [
    ...SPEC_SECTION_ORDER.filter((k) => specs[k]),
    ...Object.keys(specs).filter((k) => !SPEC_SECTION_ORDER.includes(k)),
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
export function SpecSections({ specs }: { specs: SpecMap }) {
  const sections = orderedSections(specs);
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
export function SpecCompareTable({ mine, target }: { mine: SpecMap | null; target: SpecMap | null }) {
  if (!mine || !target) {
    return <Text style={{ color: '#6b6b85', fontSize: 12, lineHeight: 18 }}>该机型暂无完整规格数据</Text>;
  }
  const sectionKeys = Object.keys(mine).concat(Object.keys(target).filter((k) => !(k in mine)));
  const ordered = [
    ...SPEC_SECTION_ORDER.filter((k) => sectionKeys.includes(k)),
    ...sectionKeys.filter((k) => !SPEC_SECTION_ORDER.includes(k)),
  ];
  return (
    <View>
      {ordered.map((sectionKey) => {
        const labels: string[] = [];
        for (const label of [...Object.keys(mine[sectionKey] ?? {}), ...Object.keys(target[sectionKey] ?? {})]) {
          if (!labels.includes(label)) labels.push(label);
        }
        return (
          <View key={sectionKey}>
            <SpecSectionHeader title={sectionKey} />
            {labels.map((label) => {
              const a = mine[sectionKey]?.[label] ?? '—';
              const b = target[sectionKey]?.[label] ?? '—';
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
