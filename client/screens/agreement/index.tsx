/**
 * 协议页：/agreement?type=user|privacy
 * 展示《用户协议》或《隐私政策》全文，支持两份文档互相跳转。
 */
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { AgreementSections } from '@/components/AgreementSections';
import { getAgreementDoc } from '@/utils/agreement-content';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useT, useLang } from '@/i18n';
import { APP_NAME } from '@/config/edition';

export default function AgreementScreen() {
  const t = useT();
  const lang = useLang();
  const router = useSafeRouter();
  const { type } = useSafeSearchParams<{ type?: string }>();

  const docType = type === 'privacy' ? 'privacy' : 'user';
  const doc = getAgreementDoc(lang, docType);
  const otherType = docType === 'user' ? 'privacy' : 'user';
  const otherDoc = getAgreementDoc(lang, otherType);

  const goOther = () => router.replace('/agreement', { type: otherType });

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
        {/* 顶栏 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color="#00F0FF" />
          </TouchableOpacity>
          <Text style={{ color: '#E8E8F0', fontSize: 17, fontWeight: '800' }}>{doc.title}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: '#6f6f85', fontSize: 11.5, marginBottom: 14 }}>
            {t('agreement.effectiveDate', { date: doc.effectiveDate })}
          </Text>

          <AgreementSections doc={doc} />

          {/* 互跳另一份协议 */}
          <TouchableOpacity
            onPress={goOther}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 28,
              paddingVertical: 13,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#12121A',
              borderWidth: 1,
              borderColor: '#2a3145',
            }}
          >
            <Ionicons name={otherType === 'user' ? 'document-text' : 'shield-checkmark'} size={16} color="#00F0FF" />
            <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 13, fontWeight: '700' }}>
              {otherType === 'user' ? t('agreement.viewUser') : t('agreement.viewPrivacy')}
            </Text>
            <Ionicons name="chevron-forward" size={15} color="#555570" />
          </TouchableOpacity>

          <Text style={{ color: '#3d3d52', fontSize: 10.5, textAlign: 'center', marginTop: 24, letterSpacing: 1 }}>
            {t('agreement.footer', { app: APP_NAME, title: doc.title })}
          </Text>
        </ScrollView>
      </View>
    </Screen>
  );
}
