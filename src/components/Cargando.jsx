export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="grid min-h-screen place-items-center px-4" role="status">
      <div className="flex items-center gap-3 text-fg-soft">
        <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
        <span className="text-sm font-medium">{texto}</span>
      </div>
    </div>
  );
}
