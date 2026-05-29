import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary'
      ? colors.primaryBright
      : variant === 'danger'
      ? colors.danger
      : colors.card;
  const fg = variant === 'secondary' ? colors.primaryBright : '#fff';
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: isDisabled ? 0.6 : 1 },
        variant === 'secondary' && { borderWidth: 1.5, borderColor: colors.primaryBright },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  const req = label.endsWith(' *');
  const base = req ? label.slice(0, -2) : label;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {base}
        {req && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          props.multiline && styles.inputMultiline,
          { backgroundColor: colors.card, color: colors.text },
        ]}
        {...props}
      />
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      {children}
    </View>
  );
  if (onPress)
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  return content;
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
      <Text style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnText: { fontSize: 16, fontFamily: font.bold },
  label: { fontSize: 13, fontFamily: font.semibold, marginBottom: 8 },
  input: {
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: font.regular,
    ...shadow.card,
  },
  inputMultiline: { minHeight: 90, paddingTop: 14, textAlignVertical: 'top' },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontFamily: font.bold, letterSpacing: 0.3 },
});
