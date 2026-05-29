import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow } from '../lib/theme';

function Label({ label }: { label: string }) {
  const req = label.endsWith(' *');
  const base = req ? label.slice(0, -2) : label;
  return (
    <Text style={styles.label}>
      {base}
      {req && <Text style={{ color: colors.danger }}> *</Text>}
    </Text>
  );
}

/** Campo de texto con tile de icono a la izquierda. */
export function FieldIcon({
  label,
  icon,
  iconTint = colors.textMuted,
  iconBg = '#EEF2F7',
  ...props
}: TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint?: string;
  iconBg?: string;
}) {
  const multiline = props.multiline;
  return (
    <View style={{ marginBottom: 16 }}>
      <Label label={label} />
      <View style={[styles.field, multiline && styles.fieldMultiline]}>
        <View style={[styles.tile, { backgroundColor: iconBg }, multiline && styles.tileTop]}>
          <Ionicons name={icon} size={20} color={iconTint} />
        </View>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, multiline && styles.inputMultiline]}
          {...props}
        />
      </View>
    </View>
  );
}

/** Campo tipo selector (toca para abrir) con icono + chevron. */
export function SelectIcon({
  label,
  icon,
  value,
  placeholder,
  onPress,
  iconTint = colors.textMuted,
  iconBg = '#EEF2F7',
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  placeholder: string;
  onPress: () => void;
  iconTint?: string;
  iconBg?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Label label={label} />
      <TouchableOpacity style={styles.field} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.tile, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconTint} />
        </View>
        <Text style={[styles.selectText, !value && { color: colors.textFaint }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} style={{ marginRight: 14 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontFamily: font.bold, color: colors.text, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    height: 56,
    overflow: 'hidden',
    ...shadow.card,
  },
  fieldMultiline: { height: 120, alignItems: 'stretch' },
  tile: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tileTop: { paddingTop: 16, justifyContent: 'flex-start' },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: font.regular, color: colors.text },
  inputMultiline: { paddingVertical: 14, textAlignVertical: 'top', height: '100%' },
  selectText: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: font.regular, color: colors.text },
});
