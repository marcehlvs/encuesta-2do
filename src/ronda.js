import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// "Ronda": número que identifica cada vuelta de la encuesta. Vive en config/estado (junto a "abierta"),
// así que no hace falta tocar firestore.rules. Cuando la docente reinicia, la ronda cambia y los celulares
// que habían respondido en la ronda anterior vuelven a poder participar.
const CLAVE = 'encuesta-2do-enviada';
const REF = () => doc(db, 'config', 'estado');

// Ronda en la que este dispositivo ya respondió, o null si no respondió.
// El valor "1" de versiones anteriores equivale a la ronda 0 (la inicial).
export function rondaLocal() {
  try {
    const v = localStorage.getItem(CLAVE);
    if (v === null) return null;
    return v.startsWith('r:') ? Number(v.slice(2)) : 0;
  } catch {
    return null;
  }
}

export function guardarRondaLocal(ronda) {
  try {
    localStorage.setItem(CLAVE, `r:${ronda}`);
  } catch {
    /* sin almacenamiento: no se puede recordar */
  }
}

// { abierta, ronda } vigentes. Si todavía no hay ronda, es la 0. Si no se puede leer, lanza el error.
export async function leerEstado() {
  const s = await getDoc(REF());
  const d = s.exists() ? s.data() : {};
  return { abierta: d.abierta === true, ronda: Number.isInteger(d.ronda) ? d.ronda : 0 };
}

// Cambia la ronda sin tocar "abierta" (merge). Solo desde el panel docente (las reglas exigen ser docente).
export async function nuevaRonda() {
  await setDoc(REF(), { ronda: Date.now() }, { merge: true });
}
