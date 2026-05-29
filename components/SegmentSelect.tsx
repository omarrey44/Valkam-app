import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../lib/theme';

export interface Opt {
  value: string;
  label: string;
}

export default function SegmentSelect({
  label,
  options,
  value,
  onChange,
  colorMap,
}: {
  label?: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {options.map((o) => {
          const active = value === o.value;
          const activeBg = colorMap?.[o.value] ?? colors.primary;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[
                styles.btn,
                active && { backgroundColor: activeBg, borderColor: activeBg },
              ]}
            >
              <Text style={[styles.text, active && { color: '#fff' }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  text: { fontWeight: '700', color: colors.text, fontSize: 13 },
});
