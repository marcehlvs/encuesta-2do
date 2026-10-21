import { PREGUNTAS } from './preguntas.js';

const VALIDOS = [1, 2, 3, 4];

// Devuelve { p01: 1..4, … } o null si falta alguna respuesta o hay un valor inválido.
// Nunca se agrega ningún otro dato (ni fecha, ni identificador).
export function limpiarRespuestas(crudas) {
  const limpias = {};
  for (const p of PREGUNTAS) {
    const v = Number(crudas[p.id]);
    if (!VALIDOS.includes(v)) return null;
    limpias[p.id] = v;
  }
  return limpias;
}
