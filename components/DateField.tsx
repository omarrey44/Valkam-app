import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createElement, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow } from '../lib/theme';

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parse(v: string) {
  return v ? new Date(v + 'T00:00:00') : new Date();
}

export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  clearable = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  clearable?: boolean;
}) {
  const [show, setShow] = useState(false);

  function handle(e: DateTimePickerEvent, selected?: Date) {
    setShow(false);
    if (e.type === 'dismissed') return;
    if (selected) onChange(toYMD(selected));
  }

  // ----- WEB: input nativo del navegador -----
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.field}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          {createElement('input', {
            type: 'date',
            value: value || '',
            onChange: (e: { target: { value: string } }) => onChange(e.target.value),
            style: {
              flex: 1,
              marginLeft: 10,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              color: colors.text,
              fontFamily: 'Manrope_400Regular',
            },
          })}
          {clearable && !!value && (
            <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ----- NATIVE: picker del sistema -----
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.value, !value && { color: colors.textFaint }]}>{value || placeholder}</Text>
        {clearable && !!value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        )}
      </TouchableOpacity>
      {show && <DateTimePicker value={parse(value)} mode="date" display="default" onChange={handle} />}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    height: 56,
    ...shadow.card,
  },
  value: { flex: 1, fontSize: 16, fontFamily: font.regular, color: colors.text },
});
