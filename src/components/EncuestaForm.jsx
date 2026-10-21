import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { BLOQUES, INTRO, OPCIONES, PREGUNTAS, TITULO } from '../preguntas.js';
import { limpiarRespuestas } from '../validacion.js';

const CLAVE = 'encuesta-3ro-enviada';
const DEBUG = new URLSearchParams(window.location.search).has('debug');

function Mensaje({ titulo, texto }) {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="mb-3 text-2xl font-bold">{titulo}</h1>
      <p className="text-slate-600">{texto}</p>
    </main>
  );
}

export default function EncuestaForm() {
  const [estado, setEstado] = useState('cargando'); // cargando | abierta | cerrada | enviada | error
  const [resp, setResp] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    try {
      if (localStorage.getItem(CLAVE)) {
        setEstado('enviada');
        return;
      }
    } catch {
      /* modo privado: seguimos igual */
    }
    getDoc(doc(db, 'config', 'estado'))
      .then((s) => {
        if (vivo) setEstado(s.exists() && s.data().abierta === true ? 'abierta' : 'cerrada');
      })
      .catch((e) => {
        console.error(e);
        if (vivo) {
          if (DEBUG) setError(String(e.code || e.message));
          setEstado('error');
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  const respondidas = PREGUNTAS.filter((p) => resp[p.id]).length;
  const completa = respondidas === PREGUNTAS.length;

  async function enviar() {
    setError('');
    const datos = limpiarRespuestas(resp);
    if (!datos) {
      setError('Falta responder alguna pregunta.');
      return;
    }
    setEnviando(true);
    try {
      await addDoc(collection(db, 'respuestas'), datos);
      try {
        localStorage.setItem(CLAVE, '1');
      } catch {
        /* ignorar */
      }
      setEstado('enviada');
    } catch (e) {
      console.error(e);
      setError(
        DEBUG
          ? `Error técnico: ${e.code || e.message}`
          : 'No se pudo enviar. Es posible que la encuesta se haya cerrado; avisale a la docente.'
      );
      setEnviando(false);
    }
  }

  if (estado === 'cargando') return <p className="p-6 text-center text-slate-600">Cargando…</p>;
  if (estado === 'enviada')
    return <Mensaje titulo="¡Gracias!" texto="Tu respuesta anónima ya fue enviada. Ya podés cerrar esta página." />;
  if (estado === 'cerrada')
    return <Mensaje titulo="Encuesta cerrada" texto="Por ahora la encuesta no está recibiendo respuestas." />;
  if (estado === 'error')
    return (
      <Mensaje
        titulo="No se pudo cargar"
        texto={DEBUG && error ? `Error técnico: ${error}` : 'Revisá tu conexión y recargá la página.'}
      />
    );

  return (
    <main className="mx-auto max-w-xl px-4 pb-28 pt-6">
      <h1 className="text-2xl font-bold">{TITULO}</h1>
      <p className="mt-2 text-sm text-slate-600">{INTRO}</p>

      {BLOQUES.map((b) => (
        <section key={b.id} className="mt-8">
          <h2 className="text-xl font-semibold">{b.titulo}</h2>
          <p className="mb-3 text-sm text-slate-500">{b.bajada}</p>

          {PREGUNTAS.filter((p) => p.bloque === b.id).map((p) => (
            <fieldset key={p.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <legend className="sr-only">{p.texto}</legend>
              <p className="mb-3 font-medium">{p.texto}</p>
              <div role="radiogroup" aria-label={p.texto} className="grid grid-cols-2 gap-2">
                {OPCIONES.map((o) => {
                  const activa = resp[p.id] === o.valor;
                  return (
                    <button
                      key={o.valor}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => setResp((r) => ({ ...r, [p.id]: o.valor }))}
                      className={
                        'rounded-lg border px-3 py-3 text-sm font-medium transition ' +
                        (activa
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 active:bg-slate-100')
                      }
                    >
                      {o.texto}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <p className="text-sm text-slate-600">
            {respondidas}/{PREGUNTAS.length}
          </p>
          <button
            type="button"
            disabled={!completa || enviando}
            onClick={enviar}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {enviando ? 'Enviando…' : 'Enviar respuestas'}
          </button>
        </div>
        {error && <p className="mx-auto mt-2 max-w-xl text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
