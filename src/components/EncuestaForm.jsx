import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { BLOQUES, INTRO, OPCIONES, PREGUNTAS, TITULO } from '../preguntas.js';
import { limpiarRespuestas } from '../validacion.js';
import { acento } from '../tema.js';
import Cargando from './Cargando.jsx';
import { IconoAlerta, IconoCandado, IconoCheck, IconoReloj } from './Iconos.jsx';

const CLAVE = 'encuesta-2do-enviada';
const DEBUG = new URLSearchParams(window.location.search).has('debug');

const TONOS = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  rojo: 'bg-red-50 text-red-600 ring-red-100',
  verde: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

function Mensaje({ icono: Icono, tono = 'indigo', titulo, texto }) {
  return (
    <main className="hero hero-dots flex min-h-screen items-center justify-center px-4 py-10">
      <div className="subir w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl shadow-indigo-950/30 ring-1 ring-black/5">
        <span className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full ring-8 ${TONOS[tono]}`}>
          <Icono className="h-7 w-7" />
        </span>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="leading-relaxed text-slate-600">{texto}</p>
      </div>
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
  const porcentaje = (respondidas / PREGUNTAS.length) * 100;

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

  if (estado === 'cargando') return <Cargando />;
  if (estado === 'enviada')
    return (
      <Mensaje
        icono={IconoCheck}
        tono="verde"
        titulo="¡Gracias!"
        texto="Tu respuesta anónima ya fue enviada. Ya podés cerrar esta página."
      />
    );
  if (estado === 'cerrada')
    return (
      <Mensaje
        icono={IconoReloj}
        tono="slate"
        titulo="Encuesta cerrada"
        texto="Por ahora la encuesta no está recibiendo respuestas."
      />
    );
  if (estado === 'error')
    return (
      <Mensaje
        icono={IconoAlerta}
        tono="rojo"
        titulo="No se pudo cargar"
        texto={DEBUG && error ? `Error técnico: ${error}` : 'Revisá tu conexión y recargá la página.'}
      />
    );

  return (
    <div className="min-h-screen pb-32">
      <header className="hero hero-dots text-white">
        <div className="mx-auto max-w-xl px-5 pb-16 pt-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
            <IconoCandado className="h-3.5 w-3.5" />
            Encuesta anónima
          </p>
          <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight">{TITULO}</h1>
          <p className="mt-3 text-sm leading-relaxed text-indigo-100">{INTRO}</p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-indigo-100">
            <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">{PREGUNTAS.length} preguntas</li>
            <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">{BLOQUES.length} bloques</li>
            <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">Unos 3 minutos</li>
          </ul>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-xl px-4">
        {BLOQUES.map((b, i) => {
          const a = acento(b.id);
          const delBloque = PREGUNTAS.filter((p) => p.bloque === b.id);
          const hechas = delBloque.filter((p) => resp[p.id]).length;
          return (
            <section key={b.id} className="subir mb-8" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white ${a.sel}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={`text-lg font-extrabold leading-tight ${a.texto}`}>{b.titulo}</h2>
                  <p className="text-sm text-slate-500">{b.bajada}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${a.suave} ${a.texto}`}
                  aria-label={`${hechas} de ${delBloque.length} respondidas en este bloque`}
                >
                  {hechas}/{delBloque.length}
                </span>
              </div>

              {delBloque.map((p) => {
                const numero = PREGUNTAS.findIndex((x) => x.id === p.id) + 1;
                const contestada = Boolean(resp[p.id]);
                return (
                  <fieldset
                    key={p.id}
                    className={
                      'mb-3 rounded-2xl border border-l-4 bg-white p-4 shadow-sm shadow-slate-900/5 transition-colors ' +
                      (contestada ? `border-slate-200 ${a.borde}` : 'border-slate-200 border-l-slate-200')
                    }
                  >
                    <legend className="sr-only">{p.texto}</legend>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pregunta {numero}
                    </p>
                    <p className="mb-4 font-semibold leading-snug text-slate-800">{p.texto}</p>
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
                              'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ' +
                              a.foco +
                              ' ' +
                              (activa
                                ? `${a.sel} border-transparent text-white shadow-md`
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white')
                            }
                          >
                            {activa && <IconoCheck className="h-4 w-4" />}
                            {o.texto}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </section>
          );
        })}
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="h-1 bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PREGUNTAS.length}
          aria-valuenow={respondidas}
          aria-label="Preguntas respondidas"
        >
          <div className="h-1 bg-indigo-600 transition-all duration-300" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="mx-auto flex max-w-xl items-center gap-3 p-3">
          <p className="w-24 shrink-0 text-sm leading-tight text-slate-500">
            <b className="text-lg font-extrabold text-slate-900 tabular-nums">{respondidas}</b>/{PREGUNTAS.length}
            <span className="block text-xs">respondidas</span>
          </p>
          <button
            type="button"
            disabled={!completa || enviando}
            onClick={enviar}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none"
          >
            {enviando ? 'Enviando…' : 'Enviar respuestas'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mx-auto max-w-xl px-3 pb-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
