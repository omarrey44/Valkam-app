import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { radius } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export function SkeletonBox({ style }: { style?: ViewStyle }) {
  const { isDark } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View style={[styles.box, { backgroundColor: bg, opacity: anim }, style]} />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <SkeletonBox style={styles.avatar} />
      <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
        <SkeletonBox style={styles.line} />
        <SkeletonBox style={[styles.line, { width: '60%' }]} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 14 },
  avatar: { width: 48, height: 48, borderRadius: radius.md },
  line: { height: 14, borderRadius: radius.sm, width: '85%' },
});
