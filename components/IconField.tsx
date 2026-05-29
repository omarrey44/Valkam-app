import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, font, radius } from '../lib/theme';

export default function IconField({
  icon,
  rightIcon,
  onRightPress,
  ...props
}: TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textFaint} style={styles.input} {...props} />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} hitSlop={8}>
          <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 54,
  },
  input: { flex: 1, fontSize: 16, fontFamily: font.regular, color: colors.text, height: '100%' },
});
