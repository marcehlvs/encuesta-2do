import { useEffect, useRef, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { BLOQUES, INTRO, OPCIONES, PREGUNTAS, TITULO } from '../preguntas.js';
import { limpiarRespuestas } from '../validacion.js';
import { guardarRondaLocal, leerEstado, rondaLocal } from '../ronda.js';
import { acento } from '../tema.js';
import Cargando from './Cargando.jsx';
import { IconoAlerta, IconoCandado, IconoCheck, IconoReloj } from './Iconos.jsx';

const DEBUG = new URLSearchParams(window.location.search).has('debug');

const TONOS = {
  indigo: 'bg-brand-soft text-brand ring-brand-line',
  slate: 'bg-surface-2 text-fg-soft ring-line',
  rojo: 'bg-danger-soft text-danger ring-danger-line',
  verde: 'bg-ok-soft text-ok ring-ok-line',
};

// Ancho del contenido: una columna en celular, más aire en tablet y compu.
const ANCHO = 'max-w-xl md:max-w-3xl lg:max-w-4xl';

// Pantalla de estado (gracias, cerrada, error). Los errores se anuncian de inmediato.
function Mensaje({ icono: Icono, tono = 'indigo', titulo, texto, accion }) {
  return (
    <main className="hero hero-dots flex min-h-screen items-center justify-center px-4 py-10">
      <div
        role={tono === 'rojo' ? 'alert' : 'status'}
        className="subir w-full max-w-md rounded-2xl bg-surface p-8 text-center text-fg shadow-2xl shadow-indigo-950/30 ring-1 ring-black/5"
      >
        <span className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full ring-8 ${TONOS[tono]}`}>
          <Icono className="h-7 w-7" />
        </span>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="leading-relaxed text-fg-soft">{texto}</p>
        {accion}
      </div>
    </main>
  );
}

export default function EncuestaForm() {
  const [estado, setEstado] = useState('cargando'); // cargando | abierta | cerrada | enviada | error
  const [resp, setResp] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const ronda = useRef(0);

  useEffect(() => {
    let vivo = true;
    const yaRespondio = rondaLocal(); // null si este dispositivo no respondió
    // Siempre se consulta la ronda vigente: si la docente reinició la encuesta, se puede participar de nuevo.
    leerEstado()
      .then(({ abierta, ronda: vigente }) => {
        if (!vivo) return;
        ronda.current = vigente;
        if (yaRespondio !== null && yaRespondio === vigente) setEstado('enviada');
        else setEstado(abierta ? 'abierta' : 'cerrada');
      })
      .catch((e) => {
        console.error(e);
        if (!vivo) return;
        // Sin conexión: si ya había respondido, se mantiene el agradecimiento; si no, se avisa del error.
        if (yaRespondio !== null) return setEstado('enviada');
        if (DEBUG) setError(String(e.code || e.message));
        setEstado('error');
      });
    return () => {
      vivo = false;
    };
  }, []);

  const respondidas = PREGUNTAS.filter((p) => resp[p.id]).length;
  const completa = respondidas === PREGUNTAS.length;
  const porcentaje = (respondidas / PREGUNTAS.length) * 100;

  // Teclado en las opciones: flechas para moverse y elegir, como en cualquier grupo de opciones.
  function teclado(e, p, i) {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + OPCIONES.length) % OPCIONES.length;
    const botones = e.currentTarget.parentElement.querySelectorAll('[role="radio"]');
    setResp((r) => ({ ...r, [p.id]: OPCIONES[j].valor }));
    botones[j]?.focus();
  }

  async function enviar() {
    setError('');
    const datos = limpiarRespuestas(resp);
    if (!datos) {
      // No dejamos a la persona buscando qué falta: la llevamos a la primera pregunta sin responder.
      const primera = PREGUNTAS.find((p) => !resp[p.id]);
      const caja = primera && document.getElementById(`q-${primera.id}`);
      if (caja) {
        caja.scrollIntoView({ block: 'center', behavior: 'smooth' });
        caja.querySelector('[role="radio"]')?.focus({ preventScroll: true });
      }
      setError(`Falta responder la pregunta ${PREGUNTAS.indexOf(primera) + 1}.`);
      return;
    }
    setEnviando(true);
    try {
      await addDoc(collection(db, 'respuestas'), datos);
      guardarRondaLocal(ronda.current);
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
        texto={DEBUG && error ? `Error técnico: ${error}` : 'Revisá tu conexión y volvé a intentar.'}
        accion={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            Reintentar
          </button>
        }
      />
    );

  return (
    <div className="min-h-screen pb-32">
      <header className="hero hero-dots text-white">
        <div className={`mx-auto ${ANCHO} px-5 pb-16 pt-8`}>
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

      <main className={`relative mx-auto -mt-8 ${ANCHO} px-4`}>
        {BLOQUES.map((b, i) => {
          const a = acento(b.id);
          const delBloque = PREGUNTAS.filter((p) => p.bloque === b.id);
          const hechas = delBloque.filter((p) => resp[p.id]).length;
          return (
            <section key={b.id} className="subir mb-8" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white ${a.sel}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={`text-lg font-extrabold leading-tight ${a.texto}`}>
                    <span aria-hidden="true">{b.emoji} </span>
                    {b.titulo}
                  </h2>
                  <p className="text-sm text-muted">{b.bajada}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${a.suave} ${a.texto}`}
                  aria-label={`${hechas} de ${delBloque.length} respondidas en este bloque`}
                >
                  {hechas}/{delBloque.length}
                </span>
              </div>

              <div className="md:grid md:grid-cols-2 md:items-start md:gap-3">
              {delBloque.map((p) => {
                const numero = PREGUNTAS.findIndex((x) => x.id === p.id) + 1;
                const contestada = Boolean(resp[p.id]);
                return (
                  <fieldset
                    key={p.id}
                    id={`q-${p.id}`}
                    className={
                      'mb-3 min-w-0 rounded-2xl border border-l-4 bg-surface p-4 shadow-sm shadow-slate-900/5 transition-colors md:mb-0 ' +
                      (contestada ? `border-line ${a.borde}` : 'border-line border-l-line')
                    }
                  >
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
                      Pregunta {numero} ·{' '}
                      <span aria-hidden="true">{p.sujeto === 'yo' ? '🙋' : '👥'}</span>{' '}
                      {p.sujeto === 'yo' ? 'Sobre mí' : 'Sobre el curso'}
                    </p>
                    <p id={`t-${p.id}`} className="mb-4 font-semibold leading-snug text-fg">{p.texto}</p>
                    <div role="radiogroup" aria-labelledby={`t-${p.id}`} className="grid grid-cols-2 gap-2">
                      {OPCIONES.map((o, i) => {
                        const activa = resp[p.id] === o.valor;
                        return (
                          <button
                            key={o.valor}
                            type="button"
                            role="radio"
                            aria-checked={activa}
                            tabIndex={activa || (!contestada && i === 0) ? 0 : -1}
                            onKeyDown={(e) => teclado(e, p, i)}
                            onClick={() => setResp((r) => ({ ...r, [p.id]: o.valor }))}
                            className={
                              'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ' +
                              a.foco +
                              ' ' +
                              (activa
                                ? `${a.sel} border-transparent text-white shadow-md`
                                : 'border-line bg-surface-2 text-fg-soft hover:border-brand-line hover:bg-surface')
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
              </div>
            </section>
          );
        })}
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="h-1 bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PREGUNTAS.length}
          aria-valuenow={respondidas}
          aria-label="Preguntas respondidas"
        >
          <div className="h-1 bg-indigo-600 transition-all duration-300" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className={`mx-auto flex ${ANCHO} items-center gap-3 p-3`}>
          <p className="w-24 shrink-0 text-sm leading-tight text-muted">
            <b className="text-lg font-extrabold text-fg tabular-nums">{respondidas}</b>/{PREGUNTAS.length}
            <span id="ayuda-envio" className="block text-xs">
              {completa ? 'listo para enviar' : `faltan ${PREGUNTAS.length - respondidas}`}
            </span>
          </p>
          <button
            type="button"
            disabled={enviando}
            aria-disabled={!completa}
            aria-describedby="ayuda-envio"
            onClick={enviar}
            className={
              'flex-1 rounded-xl px-4 py-3 font-bold transition active:scale-[0.99] disabled:opacity-60 ' +
              (completa
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700'
                : 'bg-surface-2 text-fg-soft ring-1 ring-line')
            }
          >
            {enviando ? 'Enviando…' : 'Enviar respuestas'}
          </button>
        </div>
        {error && (
          <p role="alert" className={`mx-auto ${ANCHO} px-3 pb-3 text-sm font-medium text-danger`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
