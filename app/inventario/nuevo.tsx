import { router } from 'expo-router';
import InventarioForm from '../../components/InventarioForm';

export default function NuevoInventario() {
  return <InventarioForm onSaved={() => router.back()} />;
}
