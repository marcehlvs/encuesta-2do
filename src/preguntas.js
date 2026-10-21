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
//  en firestore.rules (p01…p12) y volvé a publicar las reglas.
// =====================================================================

export const TITULO = 'Encuesta de convivencia · 3.° A';
export const INTRO =
  'Es anónima: no se pide nombre ni ningún dato personal. Respondé con sinceridad; no hay respuestas correctas ni incorrectas. Lo que importa es tener una foto real del curso.';

export const OPCIONES = [
  { valor: 4, texto: 'Siempre' },
  { valor: 3, texto: 'Casi siempre' },
  { valor: 2, texto: 'A veces' },
  { valor: 1, texto: 'Nunca' },
];

export const BLOQUES = [
  { id: 'roles', titulo: 'Roles', bajada: 'Qué hacemos y qué nos falta como grupo.' },
  { id: 'reglas', titulo: 'Reglas', bajada: 'Qué normas cumplimos y por qué a veces no.' },
  { id: 'valores', titulo: 'Valores', bajada: 'Cómo nos tratamos, sobre todo cuando hay tensión.' },
];

export const TEMAS = [
  { bloque: 'roles', id: 'mediar', titulo: 'Mediar en una discusión' },
  { bloque: 'roles', id: 'discusion', titulo: 'Empezar o alimentar discusiones' },
  { bloque: 'reglas', id: 'normas', titulo: 'Cumplir las normas del aula' },
  { bloque: 'reglas', id: 'imitar', titulo: 'Incumplir porque los demás lo hacen' },
  { bloque: 'valores', id: 'respeto', titulo: 'Respeto en momentos de tensión' },
  { bloque: 'valores', id: 'injusticia', titulo: 'Defender a quien es tratado injustamente' },
];

export const PREGUNTAS = [
  // ---- ROLES ----
  { id: 'p01', bloque: 'roles', tema: 'mediar', sujeto: 'yo', positiva: true,
    texto: 'Cuando hay una discusión, intento calmar las cosas o ayudar a que se arreglen.' },
  { id: 'p02', bloque: 'roles', tema: 'mediar', sujeto: 'curso', positiva: true,
    texto: 'Cuando hay una discusión en el curso, alguien ayuda a calmar las cosas.' },
  { id: 'p03', bloque: 'roles', tema: 'discusion', sujeto: 'yo', positiva: false,
    texto: 'A veces empiezo o alimento una discusión.' },
  { id: 'p04', bloque: 'roles', tema: 'discusion', sujeto: 'curso', positiva: false,
    texto: 'En el curso hay quienes empiezan o alimentan las discusiones.' },

  // ---- REGLAS ----
  { id: 'p05', bloque: 'reglas', tema: 'normas', sujeto: 'yo', positiva: true,
    texto: 'Cumplo las normas del aula (llegar a horario, no interrumpir, cuidar el espacio).' },
  { id: 'p06', bloque: 'reglas', tema: 'normas', sujeto: 'curso', positiva: true,
    texto: 'El curso cumple las normas del aula.' },
  { id: 'p07', bloque: 'reglas', tema: 'imitar', sujeto: 'yo', positiva: false,
    texto: 'Incumplo una norma porque veo que los demás también lo hacen.' },
  { id: 'p08', bloque: 'reglas', tema: 'imitar', sujeto: 'curso', positiva: false,
    texto: 'En el curso se incumplen normas porque los demás también lo hacen.' },

  // ---- VALORES ----
  { id: 'p09', bloque: 'valores', tema: 'respeto', sujeto: 'yo', positiva: true,
    texto: 'Trato con respeto a mis compañeros, incluso cuando estoy enojado/a.' },
  { id: 'p10', bloque: 'valores', tema: 'respeto', sujeto: 'curso', positiva: true,
    texto: 'En el curso nos tratamos con respeto, incluso en momentos de tensión.' },
  { id: 'p11', bloque: 'valores', tema: 'injusticia', sujeto: 'yo', positiva: true,
    texto: 'Cuando veo una injusticia entre compañeros, lo digo o ayudo.' },
  { id: 'p12', bloque: 'valores', tema: 'injusticia', sujeto: 'curso', positiva: true,
    texto: 'En el curso alguien se anima a defender a quien está siendo tratado injustamente.' },
];
