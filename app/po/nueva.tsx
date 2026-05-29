import { router } from 'expo-router';
import POForm from '../../components/POForm';

export default function NuevaPO() {
  return <POForm onSaved={(id) => router.replace(`/po/${id}`)} />;
}
