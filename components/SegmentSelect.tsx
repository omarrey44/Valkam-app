import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { font, radius } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export interface Opt { value: string; label: string; }

export default function SegmentSelect({
  label, options, value, onChange, colorMap,
}: {
  label?: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>}
      <View style={styles.row}>
        {options.map((o) => {
          const active = value === o.value;
          const activeBg = colorMap?.[o.value] ?? colors.primaryBright;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }, active && { backgroundColor: activeBg, borderColor: activeBg }]}
            >
              <Text style={[styles.text, { color: colors.text }, active && { color: '#fff' }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: font.semibold, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1 },
  text: { fontFamily: font.bold, fontSize: 13 },
});
