import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { Profile } from '../lib/types';

export default function UserPicker({
  label,
  value,
  onChange,
  allowNone = true,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
}) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('nombre')
      .then(({ data }) => setUsers((data as Profile[]) ?? []));
  }, []);

  const sel = users.find((u) => u.id === value);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setOpen(true)}>
        <Text style={{ color: sel ? colors.text : colors.textMuted, fontSize: 16 }}>
          {sel ? sel.nombre ?? sel.email : 'Sin asignar'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{label}</Text>
          <TouchableOpacity onPress={() => setOpen(false)}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          ListHeaderComponent={
            allowNone ? (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Text style={styles.itemSub}>Sin asignar</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>No hay usuarios.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onChange(item.id);
                setOpen(false);
              }}
            >
              <Text style={styles.itemName}>{item.nombre ?? item.email}</Text>
              <Text style={styles.itemSub}>{item.rol}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: colors.primary,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: '#fff', fontWeight: '600' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
  itemSub: { color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
