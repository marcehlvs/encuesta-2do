export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="grid min-h-screen place-items-center px-4" role="status">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <span className="text-sm font-medium">{texto}</span>
      </div>
    </div>
  );
}
