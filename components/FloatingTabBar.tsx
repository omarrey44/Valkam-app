import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, shadow } from '../lib/theme';

// Tipo mínimo del tab bar (evita dependencia directa de @react-navigation/bottom-tabs)
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarBadge?: number | string } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'document-text', off: 'document-text-outline' },
  clientes: { on: 'business', off: 'business-outline' },
  proyectos: { on: 'construct', off: 'construct-outline' },
  pendientes: { on: 'notifications', off: 'notifications-outline' },
  perfil: { on: 'person', off: 'person-outline' },
};

export default function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const focused = state.index === index;
          const icons = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.item}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <View>
                  <Ionicons
                    name={focused ? icons.on : icons.off}
                    size={22}
                    color={focused ? colors.primaryBright : colors.textFaint}
                  />
                  {badge != null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                style={[styles.label, { color: focused ? colors.primaryBright : colors.textFaint }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 6,
    ...shadow.float,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: '#EAF1FE' },
  label: { fontSize: 11, fontFamily: font.semibold },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: font.bold },
});
