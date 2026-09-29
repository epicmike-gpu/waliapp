/**
 * 强制更新守卫（变现基建：版本管控）
 *
 * 启动时查询后端版本配置（GET /api/v1/app/version），
 * 当前 App 版本低于 minVersion 时弹全屏不可关闭的更新弹窗。
 *
 * - Expo Go 环境（executionEnvironment === Store）跳过检查：Expo Go 内无真实 App 版本号，
 *   且开发阶段不应被强更拦截；该机制面向 EAS Build / App Store 正式包。
 * - updateUrl 上架后配置为 App Store 链接（itms-apps://apps.apple.com/app/idXXXX）。
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Modal, Linking, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

import { fetchAppVersion } from '@/utils/api';
import { compareVersion } from '@/utils/version';
import { t } from '@/i18n';

/** Expo Go 判定：StoreClient 仅在 Expo Go / dev-client 中为真；正式包为 Standalone */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export default function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const [needUpdate, setNeedUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState('');
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      const cfg = await fetchAppVersion();
      if (!cfg.forceUpdate) {
        setChecking(false);
        return;
      }
      const current = Application.nativeApplicationVersion ?? '0.0.0';
      if (compareVersion(current, cfg.minVersion) < 0) {
        setNeedUpdate(true);
        setUpdateUrl(cfg.updateUrl ?? '');
      }
    } catch {
      // 配置接口失败不阻塞使用（后端不可达时保持默认放行）
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (isExpoGo()) {
      setChecking(false);
      return;
    }
    check();
  }, [check]);

  const handleUpdate = useCallback(() => {
    if (updateUrl) {
      Linking.openURL(updateUrl).catch(() => undefined);
    }
  }, [updateUrl]);

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Modal visible={needUpdate} transparent animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#12121A', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)', padding: 24, alignItems: 'center' }}>
            <Ionicons name="cloud-download-outline" size={40} color="#00F0FF" />
            <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '800', marginTop: 14 }}>{t('update.title')}</Text>
            <Text style={{ color: '#8a8aa0', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>
              {t('update.description')}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={handleUpdate} style={{ width: '100%', marginTop: 20 }}>
              <LinearGradient
                colors={['#00F0FF', '#BF00FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: '#0A0A0F', fontWeight: '800', fontSize: 14 }}>{t('update.cta')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!updateUrl ? (
              <Text style={{ color: '#555570', fontSize: 11, marginTop: 10, textAlign: 'center' }}>{t('update.noStoreUrl')}</Text>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* 检查期间短暂遮罩，避免低于最低版本的旧包闪烁可用界面 */}
      {checking && !isExpoGo() ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#00F0FF" />
        </View>
      ) : null}
    </View>
  );
}
