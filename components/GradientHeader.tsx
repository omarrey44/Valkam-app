import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { font, radius, shadow } from '../lib/theme';

export default function GradientHeader({
  colors,
  icon,
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  colors: readonly [string, string, ...string[]];
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: { label: string };
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.blob} />
      <View style={styles.row}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge.label.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadow.blue,
  },
  blob: {
    position: 'absolute',
    right: -40,
    top: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: 'rgba(255,255,255,0.8)', fontFamily: font.semibold, fontSize: 12, marginBottom: 2 },
  title: { color: '#fff', fontFamily: font.black, fontSize: 22 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontFamily: font.medium, fontSize: 14, marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: '#fff', fontFamily: font.bold, fontSize: 11, letterSpacing: 0.3 },
});
