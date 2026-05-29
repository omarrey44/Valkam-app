import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, font, radius, shadow } from '../lib/theme';

export const SIG_WIDTH = 340;
export const SIG_HEIGHT = 200;

interface Props {
  onConfirm: (paths: string[]) => void;
  hasExisting?: boolean;
}

export default function SignaturePad({ onConfirm, hasExisting }: Props) {
  const [done, setDone] = useState<string[]>([]);
  const [live, setLive] = useState('');
  const pts = useRef('');
  const empty = done.length === 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pts.current = `M ${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setLive(pts.current);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pts.current += ` L ${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setLive(pts.current);
      },
      onPanResponderRelease: () => {
        if (pts.current) {
          const p = pts.current;
          setDone((prev) => [...prev, p]);
          pts.current = '';
          setLive('');
        }
      },
    })
  ).current;

  function limpiar() {
    setDone([]);
    setLive('');
    pts.current = '';
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Firma del receptor</Text>

      <View style={styles.pad} {...pan.panHandlers}>
        <Svg width={SIG_WIDTH} height={SIG_HEIGHT}>
          <Rect width={SIG_WIDTH} height={SIG_HEIGHT} fill="white" />
          {done.map((d, i) => (
            <Path key={i} d={d} stroke="#0F172A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {!!live && (
            <Path d={live} stroke="#0F172A" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
        {empty && (
          <View style={styles.ghost} pointerEvents="none">
            <Text style={styles.ghostText}>Firme aquí</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.clearBtn} onPress={limpiar}>
          <Text style={styles.clearText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.okBtn, empty && styles.okDisabled]}
          disabled={empty}
          onPress={() => onConfirm(done)}
        >
          <Text style={styles.okText}>Confirmar firma ✓</Text>
        </TouchableOpacity>
      </View>

      {hasExisting && empty && (
        <Text style={styles.hint}>Ya existe una firma. Dibuja para reemplazarla.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 8 },
  pad: {
    width: SIG_WIDTH,
    height: SIG_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  ghost: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.textFaint, fontFamily: font.regular, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10, alignSelf: 'center' },
  clearBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  clearText: { fontFamily: font.semibold, color: colors.textMuted, fontSize: 14 },
  okBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.success,
    ...shadow.card,
  },
  okDisabled: { opacity: 0.35 },
  okText: { fontFamily: font.bold, color: '#fff', fontSize: 14 },
  hint: { textAlign: 'center', fontSize: 12, fontFamily: font.regular, color: colors.textMuted, marginTop: 8 },
});
