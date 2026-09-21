import { View, Text, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';

interface NeonCardProps extends ViewProps {
  children: ReactNode;
  /** 卡片标题（可选，大写 HUD 风格） */
  label?: string;
  /** 发光主色，默认电光青 */
  glow?: string;
  style?: StyleProp<ViewStyle>;
  /** 是否带底部渐变分隔条 */
  divider?: boolean;
}

/** 暗黑科技风卡片容器：微亮黑底 + 霓虹边框/阴影 */
export function NeonCard({ children, label, glow = '#00F0FF', style, divider = true }: NeonCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#12121A',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'rgba(0,240,255,0.14)',
          padding: 18,
          shadowColor: glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 2,
        },
        style,
      ]}
    >
      {label ? (
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            color: '#555570',
            fontWeight: '600',
            marginBottom: 12,
          }}
        >
          {label}
        </Text>
      ) : null}
      {children}
      {divider ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,240,255,0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1, marginTop: 16 }}
        />
      ) : null}
    </View>
  );
}

interface StatItemProps {
  k: string;
  v: string;
  /** 数值颜色倾向 keep/电池/换机 */
  tone?: 'keep' | 'battery' | 'replace' | 'neutral';
}

const TONE_TEXT: Record<string, string> = {
  keep: '#00FF88',
  battery: '#00F0FF',
  replace: '#FF3366',
  neutral: '#E8E8F0',
};

/** 数据统计小卡片 */
export function StatItem({ k, v, tone = 'neutral' }: StatItemProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#16161f',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,240,255,0.08)',
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 11, letterSpacing: 1, color: '#555570', marginBottom: 6 }}>{k}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: TONE_TEXT[tone] }}>{v}</Text>
    </View>
  );
}