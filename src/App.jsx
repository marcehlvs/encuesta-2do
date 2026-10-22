import { lazy, Suspense } from 'react';
import EncuestaForm from './components/EncuestaForm.jsx';
import Cargando from './components/Cargando.jsx';

// El panel se carga aparte: los chicos no descargan nada que no usan.
const PanelResultados = lazy(() => import('./components/PanelResultados.jsx'));

export default function App() {
  const esPanel = window.location.pathname.replace(/\/+$/, '').endsWith('/panel');
  if (!esPanel) return <EncuestaForm />;
  return (
    <Suspense fallback={<Cargando texto="Cargando panel…" />}>
      <PanelResultados />
    </Suspense>
  );
}
