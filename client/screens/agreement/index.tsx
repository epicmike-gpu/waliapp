/**
 * 协议页：《瓦砾用户协议》/《瓦砾隐私政策》
 * 通过路由参数 type 切换：user（默认）| privacy
 * 入口：首启弹窗底部提示、「我的」页面常驻入口
 */
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { AgreementSections } from '@/components/AgreementSections';
import { USER_AGREEMENT, PRIVACY_POLICY } from '@/utils/agreement-content';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

export default function AgreementScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ type?: string }>();
  const isPrivacy = params.type === 'privacy';
  const doc = isPrivacy ? PRIVACY_POLICY : USER_AGREEMENT;
  const otherType = isPrivacy ? 'user' : 'privacy';
  const otherLabel = isPrivacy ? '查看《瓦砾用户协议》' : '查看《瓦砾隐私政策》';

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
        {/* 顶栏 */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#1b1b26',
          }}
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={22} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={{ color: '#E8E8F0', fontSize: 17, fontWeight: '800' }}>{doc.title}</Text>
        </View>

        {/* 正文 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <AgreementSections doc={doc} />

          {/* 互跳另一份协议 */}
          <TouchableOpacity
            onPress={() => router.replace('/agreement', { type: otherType })}
            style={{
              marginTop: 26,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.35)',
              backgroundColor: 'rgba(0,240,255,0.08)',
            }}
          >
            <Ionicons name="document-text" size={14} color="#00F0FF" />
            <Text style={{ color: '#00F0FF', fontSize: 12.5, fontWeight: '700' }}>{otherLabel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Screen>
  );
}
