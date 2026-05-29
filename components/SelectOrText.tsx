import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

export default function SelectOrText({ label, value, onChange, options, placeholder }: Props) {
  const { colors } = useTheme();
  const isPreset = options.includes(value);
  const [showInput, setShowInput] = useState(!isPreset && value !== '');
  const [custom, setCustom] = useState(!isPreset ? value : '');

  useEffect(() => {
    if (options.includes(value)) { setShowInput(false); }
    else if (value) { setShowInput(true); setCustom(value); }
  }, []);

  function pick(opt: string) { setShowInput(false); setCustom(''); onChange(opt); }
  function pickOtro() { setShowInput(true); onChange(custom); }
  function handleCustom(text: string) { setCustom(text); onChange(text); }

  const active = showInput ? '__otro__' : value;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => {
          const on = active === opt;
          return (
            <TouchableOpacity key={opt} onPress={() => pick(opt)}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, on && { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright }]}>
              <Text style={[styles.chipText, { color: on ? '#fff' : colors.textMuted }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={pickOtro}
          style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, active === '__otro__' && { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright }]}>
          <Text style={[styles.chipText, { color: active === '__otro__' ? '#fff' : colors.textMuted }]}>Otro ✏️</Text>
        </TouchableOpacity>
      </ScrollView>
      {showInput && (
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={custom}
          onChangeText={handleCustom}
          placeholder={placeholder ?? 'Escribe aquí...'}
          placeholderTextColor={colors.textFaint}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: font.semibold, marginBottom: 8 },
  row: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, ...shadow.card },
  chipText: { fontFamily: font.semibold, fontSize: 13 },
  input: { marginTop: 10, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.medium, fontSize: 15, borderWidth: 1 },
});
