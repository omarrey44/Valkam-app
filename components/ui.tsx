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
import { colors, font, radius, shadow } from '../lib/theme';

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
  const bg =
    variant === 'primary'
      ? colors.primaryBright
      : variant === 'danger'
      ? colors.danger
      : '#fff';
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
  const req = label.endsWith(' *');
  const base = req ? label.slice(0, -2) : label;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>
        {base}
        {req && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, props.multiline && styles.inputMultiline]}
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
  const content = <View style={[styles.card, style]}>{children}</View>;
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
  label: { fontSize: 13, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: font.regular,
    color: colors.text,
    ...shadow.card,
  },
  inputMultiline: { minHeight: 90, paddingTop: 14, textAlignVertical: 'top' },
  card: {
    backgroundColor: colors.card,
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
