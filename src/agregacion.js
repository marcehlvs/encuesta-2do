import { PREGUNTAS, TEMAS, OPCIONES } from './preguntas.js';

// Con menos respuestas que esto, el panel no muestra resultados (protege el anonimato).
export const MIN_RESPUESTAS = 5;

// { p01: {1: n, 2: n, 3: n, 4: n}, … }
export function contar(respuestas) {
  const out = {};
  for (const p of PREGUNTAS) out[p.id] = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of respuestas) {
    for (const p of PREGUNTAS) {
      const v = r[p.id];
      if (out[p.id][v] !== undefined) out[p.id][v] += 1;
    }
  }
  return out;
}

export const total = (c) => c[1] + c[2] + c[3] + c[4];

// Tabla de frecuencias de una pregunta, en orden de menor a mayor (Nunca → Siempre) para que
// la frecuencia acumulada tenga sentido.
//   f   = frecuencia absoluta (cuántas personas eligieron la opción)
//   fr  = frecuencia relativa (f / n, entre 0 y 1)
//   pct = porcentaje (fr × 100)
//   F   = frecuencia absoluta acumulada (suma de f hasta esa fila)
//   Fpct = porcentaje acumulado
export function tablaFrecuencias(c) {
  const n = total(c);
  let acum = 0;
  const filas = [...OPCIONES]
    .sort((a, b) => a.valor - b.valor)
    .map((o) => {
      const f = c[o.valor];
      acum += f;
      return { valor: o.valor, texto: o.texto, f, fr: n ? f / n : 0, pct: n ? (f / n) * 100 : 0, F: acum, Fpct: n ? (acum / n) * 100 : 0 };
    });
  const maxF = Math.max(...filas.map((x) => x.f));
  const modas = maxF > 0 ? filas.filter((x) => x.f === maxF).map((x) => x.texto) : [];
  return { n, filas, modas };
}

// % de respuestas "deseables": siempre + casi siempre si es positiva; nunca + a veces si no.
export function favorables(c, positiva) {
  const t = total(c);
  if (!t) return 0;
  return ((positiva ? c[4] + c[3] : c[1] + c[2]) / t) * 100;
}

export function comparacionPorTema(conteos) {
  return TEMAS.map((t) => {
    const yo = PREGUNTAS.find((p) => p.bloque === t.bloque && p.tema === t.id && p.sujeto === 'yo');
    const curso = PREGUNTAS.find((p) => p.bloque === t.bloque && p.tema === t.id && p.sujeto === 'curso');
    const fy = favorables(conteos[yo.id], yo.positiva);
    const fc = favorables(conteos[curso.id], curso.positiva);
    return { ...t, yo, curso, fy, fc, brecha: fy - fc };
  });
}

const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;

// CSV con conteos agregados (sin respuestas individuales). BOM para que Excel lea las tildes.
export function aCSV(conteos) {
  const cab = ['bloque', 'tema', 'sujeto', 'pregunta', ...OPCIONES.map((o) => o.texto), 'total'];
  const filas = PREGUNTAS.map((p) => {
    const c = conteos[p.id];
    return [p.bloque, p.tema, p.sujeto, p.texto, ...OPCIONES.map((o) => c[o.valor]), total(c)];
  });
  const lineas = [cab, ...filas].map((f) => f.map(esc).join(','));
  return '\uFEFF' + lineas.join('\r\n');
}
