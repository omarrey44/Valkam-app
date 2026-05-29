import { router } from 'expo-router';
import ClienteForm from '../../components/ClienteForm';

export default function NuevoCliente() {
  return <ClienteForm onSaved={() => router.back()} />;
}
