import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { font } from '../lib/theme';
import { valmakLogo } from '../lib/logo';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1D3FA8' }}>
      <LinearGradient
        colors={['#16317F', '#1D4ED8', '#2D6FF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <SvgXml xml={valmakLogo} width={250} height={76} />
          </View>

          {children}

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.footerText}>Tu información está protegida</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  blobTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  footerText: { color: 'rgba(255,255,255,0.7)', fontFamily: font.medium, fontSize: 13 },
});
