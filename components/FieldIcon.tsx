import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

function Label({ label }: { label: string }) {
  const { colors } = useTheme();
  const req = label.endsWith(' *');
  const base = req ? label.slice(0, -2) : label;
  return (
    <Text style={[styles.label, { color: colors.text }]}>
      {base}
      {req && <Text style={{ color: colors.danger }}> *</Text>}
    </Text>
  );
}

export function FieldIcon({
  label, icon, iconTint, iconBg, error, ...props
}: TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint?: string;
  iconBg?: string;
  error?: string | null;
}) {
  const { colors } = useTheme();
  const tint = iconTint ?? colors.textMuted;
  const bg = iconBg ?? (colors.card === '#1E293B' ? '#2D3A4A' : '#EEF2F7');
  const multiline = props.multiline;
  const borderColor = error ? colors.danger : colors.border;
  return (
    <View style={{ marginBottom: 16 }}>
      <Label label={label} />
      <View style={[styles.field, multiline && styles.fieldMultiline, { backgroundColor: colors.card, borderColor }]}>
        <View style={[styles.tile, { backgroundColor: bg, borderRightColor: borderColor }, multiline && styles.tileTop]}>
          <Ionicons name={icon} size={20} color={error ? colors.danger : tint} />
        </View>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, multiline && styles.inputMultiline, { color: colors.text }]}
          {...props}
        />
      </View>
      {!!error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

export function SelectIcon({
  label, icon, value, placeholder, onPress, iconTint, iconBg,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: string;
  placeholder: string;
  onPress: () => void;
  iconTint?: string;
  iconBg?: string;
}) {
  const { colors } = useTheme();
  const tint = iconTint ?? colors.textMuted;
  const bg = iconBg ?? (colors.card === '#1E293B' ? '#2D3A4A' : '#EEF2F7');
  return (
    <View style={{ marginBottom: 16 }}>
      <Label label={label} />
      <TouchableOpacity style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.tile, { backgroundColor: bg, borderRightColor: colors.border }]}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={[styles.selectText, { color: value ? colors.text : colors.textFaint }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} style={{ marginRight: 14 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontFamily: font.bold, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 56,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadow.card,
  },
  fieldMultiline: { height: 120, alignItems: 'stretch' },
  tile: { width: 52, height: '100%', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1 },
  tileTop: { paddingTop: 16, justifyContent: 'flex-start' },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: font.regular },
  inputMultiline: { paddingVertical: 14, textAlignVertical: 'top', height: '100%' },
  selectText: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: font.regular },
  errorText: { fontSize: 12, fontFamily: font.semibold, marginTop: -10, marginBottom: 4, marginLeft: 4 },
});
