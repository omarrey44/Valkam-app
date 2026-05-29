import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { font, radius } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export default function IconField({
  icon, rightIcon, onRightPress, ...props
}: TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textFaint} style={[styles.input, { color: colors.text }]} {...props} />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} hitSlop={8}>
          <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, height: 54 },
  input: { flex: 1, fontSize: 16, fontFamily: font.regular, height: '100%' },
});
