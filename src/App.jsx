import { lazy, Suspense } from 'react';
import EncuestaForm from './components/EncuestaForm.jsx';

// El panel se carga aparte: los chicos no descargan nada que no usan.
const PanelResultados = lazy(() => import('./components/PanelResultados.jsx'));

export default function App() {
  const esPanel = window.location.pathname.replace(/\/+$/, '').endsWith('/panel');
  if (!esPanel) return <EncuestaForm />;
  return (
    <Suspense fallback={<p className="p-6 text-slate-600">Cargando panel…</p>}>
      <PanelResultados />
    </Suspense>
  );
}
