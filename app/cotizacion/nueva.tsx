import { router } from 'expo-router';
import CotizacionForm from '../../components/CotizacionForm';

export default function NuevaCotizacion() {
  return <CotizacionForm onSaved={(id) => router.replace(`/cotizacion/${id}`)} />;
}
