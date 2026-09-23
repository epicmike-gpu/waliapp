/**
 * 协议正文渲染组件（暗黑科技风）
 * 供 screens/agreement 协议页 与 components/AgreementGate 首启弹窗共用
 */
import { View, Text } from 'react-native';
import type { AgreementDoc } from '@/utils/agreement-content';

export function AgreementSections({ doc }: { doc: AgreementDoc }) {
  return (
    <View style={{ gap: 22 }}>
      <Text style={{ color: '#6f6f85', fontSize: 11.5, letterSpacing: 1 }}>
        生效日期：{doc.effectiveDate}
      </Text>
      {doc.sections.map((s, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Text style={{ color: '#00F0FF', fontSize: 13.5, fontWeight: '800' }}>{s.heading}</Text>
          {s.paragraphs.map((p, j) => (
            <Text key={j} style={{ color: '#b9b9cf', fontSize: 12.5, lineHeight: 21 }}>
              {p}
            </Text>
          ))}
        </View>
      ))}
      <Text style={{ color: '#555570', fontSize: 11, marginTop: 4 }}>
        —— 本文档为「瓦砾」{doc.title}全文 ——
      </Text>
    </View>
  );
}
