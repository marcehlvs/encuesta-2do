// =====================================================================
//  ÚNICO ARCHIVO DE CONFIGURACIÓN DE LA ENCUESTA
//  Para cambiar textos, opciones o el orden, tocá solo este archivo.
//
//  Valores guardados:  4 = Siempre · 3 = Casi siempre · 2 = A veces · 1 = Nunca
//
//  Cada TEMA se pregunta dos veces:
//    sujeto 'yo'    → "yo cumplo / hago…"
//    sujeto 'curso' → "el curso cumple / hace…"
//  La diferencia entre ambas respuestas es el material para analizar
//  «lo que creemos hacer vs. lo que muestran los números».
//
//  positiva: true  → responder "siempre" es lo deseable
//  positiva: false → responder "nunca" es lo deseable (conductas que desgastan)
//
//  Si cambiás la CANTIDAD de preguntas, ajustá también la lista de campos
//  en firestore.rules (p01…p08) y volvé a publicar las reglas.
// =====================================================================

export const TITULO = 'Encuesta de convivencia · 2.° A';
export const INTRO =
  'Es anónima: no se pide nombre ni ningún dato personal. Respondé con sinceridad; no hay respuestas correctas ni incorrectas. Lo que importa es tener una foto real del curso.';

export const OPCIONES = [
  { valor: 4, texto: 'Siempre' },
  { valor: 3, texto: 'Casi siempre' },
  { valor: 2, texto: 'A veces' },
  { valor: 1, texto: 'Nunca' },
];

export const BLOQUES = [
  { id: 'roles', titulo: 'Trabajo en grupo', bajada: 'Cómo nos organizamos cuando trabajamos juntos.' },
  { id: 'reglas', titulo: 'Celular y comida', bajada: 'Qué acuerdos cumplimos en clase y cuáles se nos escapan.' },
  { id: 'valores', titulo: 'Respeto', bajada: 'Cómo cuidamos el derecho de todos a aprender.' },
];

export const TEMAS = [
  { bloque: 'roles', id: 'grupal', titulo: 'Hacer cada uno su parte en los trabajos grupales' },
  { bloque: 'reglas', id: 'celular', titulo: 'Usar el celular sin autorización' },
  { bloque: 'reglas', id: 'comida', titulo: 'Comer o tomar algo en clase' },
  { bloque: 'valores', id: 'turno', titulo: 'Respetar el turno de palabra' },
];

export const PREGUNTAS = [
  // ---- TRABAJO EN GRUPO ----
  { id: 'p01', bloque: 'roles', tema: 'grupal', sujeto: 'yo', positiva: true,
    texto: 'En los trabajos en grupo, hago la parte que me toca.' },
  { id: 'p02', bloque: 'roles', tema: 'grupal', sujeto: 'curso', positiva: true,
    texto: 'En el curso, en los trabajos en grupo, cada integrante hace su parte.' },

  // ---- CELULAR Y COMIDA ----
  { id: 'p03', bloque: 'reglas', tema: 'celular', sujeto: 'yo', positiva: false,
    texto: 'Uso el celular en clase sin que el docente lo haya autorizado.' },
  { id: 'p04', bloque: 'reglas', tema: 'celular', sujeto: 'curso', positiva: false,
    texto: 'En el curso se usa el celular en clase sin autorización.' },
  { id: 'p05', bloque: 'reglas', tema: 'comida', sujeto: 'yo', positiva: false,
    texto: 'Como o tomo algo durante la clase.' },
  { id: 'p06', bloque: 'reglas', tema: 'comida', sujeto: 'curso', positiva: false,
    texto: 'En el curso se come o se toma algo durante la clase.' },

  // ---- RESPETO ----
  { id: 'p07', bloque: 'valores', tema: 'turno', sujeto: 'yo', positiva: true,
    texto: 'Respeto el turno de palabra cuando habla el docente o un compañero.' },
  { id: 'p08', bloque: 'valores', tema: 'turno', sujeto: 'curso', positiva: true,
    texto: 'En el curso se respeta el turno de palabra del docente y de los compañeros.' },
];