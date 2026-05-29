import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { font, radius, shadow } from '../lib/theme';

export default function GradientCard({
  colors,
  icon,
  title,
  subtitle,
  onPress,
  glow,
}: {
  colors: readonly [string, string, ...string[]];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  glow?: object;
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.wrap, glow]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* atmósfera: círculos translúcidos */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.iconTile}>
          <Ionicons name={icon} size={26} color="#fff" />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, marginBottom: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: 22,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    right: -30,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  blob2: {
    position: 'absolute',
    right: 40,
    bottom: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, marginLeft: 16 },
  title: { color: '#fff', fontSize: 21, fontFamily: font.bold },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: font.medium, marginTop: 3 },
  chevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
