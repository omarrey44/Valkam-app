import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { colors, font } from '../lib/theme';

export function BarChart({
  data,
  color = colors.primaryBright,
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 32 - 32; // padding pantalla + card
  const H = 150;
  const pad = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const slot = (W - pad) / n;
  const barW = Math.min(28, slot * 0.55);

  return (
    <Svg width={W} height={H}>
      <G>
        {data.map((d, i) => {
          const h = (d.value / max) * (H - pad - 18);
          const x = pad + i * slot + (slot - barW) / 2;
          const y = H - pad - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={Math.max(2, h)} rx={5} fill={color} opacity={d.value === 0 ? 0.25 : 1} />
              {d.value > 0 && (
                <SvgText x={x + barW / 2} y={y - 5} fontSize={10} fontWeight="bold" fill={colors.text} textAnchor="middle">
                  {d.value}
                </SvgText>
              )}
              <SvgText x={x + barW / 2} y={H - 6} fontSize={10} fill={colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

export function Donut({ pct, label, color = colors.success }: { pct: number; label: string; color?: string }) {
  const size = 130;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText x={size / 2} y={size / 2 - 2} fontSize={26} fontWeight="bold" fill={colors.text} textAnchor="middle">
          {`${Math.round(pct)}%`}
        </SvgText>
        <SvgText x={size / 2} y={size / 2 + 18} fontSize={11} fill={colors.textMuted} textAnchor="middle">
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  donutWrap: { alignItems: 'center', justifyContent: 'center' },
});
