// Un color de acento por bloque. Las clases van completas (Tailwind no detecta clases armadas con texto).
// Sobrios a propósito: índigo / verde azulado / ámbar oscuro. Ninguno es rojo ni verde "bueno/malo",
// para no sugerir que una respuesta es correcta.
export const ACENTO = {
  roles: {
    punto: 'bg-indigo-600',
    texto: 'text-indigo-700 dark:text-indigo-300',
    textoOscuro: 'text-indigo-700 dark:text-indigo-300',
    suave: 'bg-indigo-50 dark:bg-indigo-500/20',
    borde: 'border-l-indigo-500',
    sel: 'bg-indigo-600',
    foco: 'focus-visible:outline-indigo-600',
  },
  reglas: {
    punto: 'bg-teal-700',
    texto: 'text-teal-800 dark:text-teal-300',
    textoOscuro: 'text-teal-800 dark:text-teal-300',
    suave: 'bg-teal-50 dark:bg-teal-500/20',
    borde: 'border-l-teal-600',
    sel: 'bg-teal-700',
    foco: 'focus-visible:outline-teal-700',
  },
  valores: {
    punto: 'bg-amber-700',
    texto: 'text-amber-800 dark:text-amber-300',
    textoOscuro: 'text-amber-800 dark:text-amber-300',
    suave: 'bg-amber-50 dark:bg-amber-500/20',
    borde: 'border-l-amber-600',
    sel: 'bg-amber-700',
    foco: 'focus-visible:outline-amber-700',
  },
};

export const acento = (bloque) => ACENTO[bloque] || ACENTO.roles;
