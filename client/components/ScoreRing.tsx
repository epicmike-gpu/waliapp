import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';

interface ScoreRingProps {
  /** 0 - 100 综合评分 */
  score: number;
  size?: number;
  /** 环内主标题 */
  title?: string;
  /** 环内副标题 */
  subtitle?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#00FF88';
  if (score >= 60) return '#00F0FF';
  if (score >= 40) return '#FFB300';
  return '#FF3366';
}

/**
 * 霓虹评分环：渐变描边 + 呼吸光晕
 */
export default function ScoreRing({ score, size = 168, title = '换机评分', subtitle }: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(clamped);

  const progress = useMemo(() => (circumference * (1 - clamped / 100)), [circumference, clamped]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: size - 14,
          height: size - 14,
          borderRadius: (size - 14) / 2,
          backgroundColor: 'transparent',
          shadowColor: color,
          shadowOpacity: 0.5,
          shadowRadius: 22,
          borderWidth: 1,
          borderColor: `${color}33`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* 背景轨道 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1b1b26"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* 前景进度 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text style={{ fontSize: 15, letterSpacing: 2, color: '#555570', fontWeight: '600' }}>
          {title.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 44, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>
          {clamped}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: '#6b6b85', marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}