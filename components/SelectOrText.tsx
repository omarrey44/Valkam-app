import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow } from '../lib/theme';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

export default function SelectOrText({ label, value, onChange, options, placeholder }: Props) {
  const isPreset = options.includes(value);
  const [showInput, setShowInput] = useState(!isPreset && value !== '');
  const [custom, setCustom] = useState(!isPreset ? value : '');

  useEffect(() => {
    if (options.includes(value)) {
      setShowInput(false);
    } else if (value) {
      setShowInput(true);
      setCustom(value);
    }
  }, []);

  function pick(opt: string) {
    setShowInput(false);
    setCustom('');
    onChange(opt);
  }

  function pickOtro() {
    setShowInput(true);
    onChange(custom);
  }

  function handleCustom(text: string) {
    setCustom(text);
    onChange(text);
  }

  const active = showInput ? '__otro__' : value;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((opt) => {
          const on = active === opt;
          return (
            <TouchableOpacity key={opt} onPress={() => pick(opt)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={pickOtro} style={[styles.chip, active === '__otro__' && styles.chipOn]}>
          <Text style={[styles.chipText, active === '__otro__' && styles.chipTextOn]}>Otro ✏️</Text>
        </TouchableOpacity>
      </ScrollView>

      {showInput && (
        <TextInput
          style={styles.input}
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
  label: { fontSize: 13, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 8 },
  row: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  chipOn: { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright },
  chipText: { fontFamily: font.semibold, color: colors.textMuted, fontSize: 13 },
  chipTextOn: { color: '#fff' },
  input: {
    marginTop: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.medium,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
