/**
 * 首启协议同意弹窗（合规门）
 * - 首次启动或协议版本更新后：全屏弹窗要求阅读《用户协议》《隐私政策》
 * - 未同意前不可使用应用功能（弹窗不可通过返回键/点击遮罩关闭）
 * - 弹窗内可直接查看两份协议全文；点击「同意并继续」记录版本化同意状态
 */
import { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AgreementSections } from '@/components/AgreementSections';
import { getAgreementDoc } from '@/utils/agreement-content';
import { isAgreementAccepted, acceptAgreement } from '@/utils/agreement';
import { useT, useLang } from '@/i18n';
import { APP_NAME } from '@/config/edition';

export default function AgreementGate() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const lang = useLang();
  const [visible, setVisible] = useState(false);
  /** 弹窗内查看的协议：null=欢迎页 | user | privacy */
  const [viewing, setViewing] = useState<null | 'user' | 'privacy'>(null);

  useEffect(() => {
    let cancelled = false;
    isAgreementAccepted().then((accepted) => {
      if (!cancelled && !accepted) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccept = async () => {
    await acceptAgreement();
    setVisible(false);
    Toast.show({ type: 'success', text1: t('gate.toast.welcome'), text2: t('gate.toast.welcomeDesc') });
  };

  const handleDecline = () => {
    Alert.alert(t('gate.alert.title'), t('gate.alert.declineMsg'), [
      { text: t('gate.alert.review'), style: 'cancel' },
      {
        text: t('gate.alert.decline'),
        style: 'destructive',
        onPress: () => {
          Toast.show({ type: 'info', text1: t('gate.toast.notAgreed'), text2: t('gate.toast.notAgreedDesc') });
        },
      },
    ]);
  };

  const viewingDoc = viewing ? getAgreementDoc(lang, viewing) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={() => Toast.show({ type: 'info', text1: t('gate.toast.needAgree'), text2: t('gate.toast.needAgreeDesc') })}
    >
      <View style={{ flex: 1, backgroundColor: '#0A0A0F', paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}>
        {viewingDoc ? (
          /* —— 协议全文视图 —— */
          <>
            <View style={{ paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => setViewing(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={22} color="#00F0FF" />
              </TouchableOpacity>
              <Text style={{ color: '#E8E8F0', fontSize: 17, fontWeight: '800' }}>{viewingDoc.title}</Text>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 12, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <AgreementSections doc={viewingDoc} />
            </ScrollView>
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={handleAccept}
                activeOpacity={0.85}
                style={{ borderRadius: 8, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 14, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}>
                    {t('gate.agree')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* —— 欢迎页 —— */
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <View style={{ marginTop: 40, gap: 8 }}>
              <Text style={{ fontSize: 11, letterSpacing: 3, color: '#555570', fontWeight: '600' }}>
                {APP_NAME.toUpperCase()} · SWITCH RADAR
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#E8E8F0' }}>{t('gate.welcome')}</Text>
              <Text style={{ color: '#8a8aa0', fontSize: 13, lineHeight: 22, marginTop: 8 }}>
                {t('gate.intro1')}
              </Text>
              <Text style={{ color: '#8a8aa0', fontSize: 13, lineHeight: 22 }}>
                {t('gate.intro2')}
              </Text>
            </View>

            {/* 协议入口 */}
            <View style={{ marginTop: 26, gap: 10 }}>
              <TouchableOpacity
                onPress={() => setViewing('user')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#12121A',
                  borderWidth: 1,
                  borderColor: '#2a3145',
                }}
              >
                <Ionicons name="document-text" size={17} color="#00F0FF" />
                <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 13.5, fontWeight: '700' }}>
                  {getAgreementDoc(lang, 'user').title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#555570" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewing('privacy')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: '#12121A',
                  borderWidth: 1,
                  borderColor: '#2a3145',
                }}
              >
                <Ionicons name="shield-checkmark" size={17} color="#00F0FF" />
                <Text style={{ flex: 1, color: '#E8E8F0', fontSize: 13.5, fontWeight: '700' }}>
                  {getAgreementDoc(lang, 'privacy').title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#555570" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#555570', fontSize: 11.5, lineHeight: 18, marginTop: 18 }}>
              {t('gate.intro3')}
            </Text>

            {/* 按钮区（吸底） */}
            <View style={{ flex: 1 }} />
            <View style={{ gap: 14 }}>
              <TouchableOpacity onPress={handleAccept} activeOpacity={0.85} style={{ borderRadius: 8, overflow: 'hidden' }}>
                <LinearGradient colors={['#00F0FF', '#BF00FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 15 }}>
                  <Text style={{ color: '#0A0A0F', fontSize: 14.5, fontWeight: '800', letterSpacing: 2, textAlign: 'center' }}>
                    {t('gate.agree')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDecline} style={{ paddingVertical: 8 }}>
                <Text style={{ color: '#6f6f85', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{t('gate.decline')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
