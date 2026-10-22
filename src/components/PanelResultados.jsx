import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import QRCode from 'qrcode';
import { auth, db } from '../firebaseConfig.js';
import { BLOQUES, OPCIONES, PREGUNTAS } from '../preguntas.js';
import { MIN_RESPUESTAS, aCSV, comparacionPorTema, contar, total } from '../agregacion.js';
import { acento } from '../tema.js';
import Cargando from './Cargando.jsx';
import { IconoAlerta, IconoEscudo, IconoOjo, IconoOjoTachado } from './Iconos.jsx';

const URL_ENCUESTA = (import.meta.env.VITE_URL_PUBLICA || window.location.origin).replace(/\/+$/, '');

// Escala secuencial de un solo color: más oscuro = más frecuencia de acuerdo.
// No usamos rojo/verde porque en las preguntas "negativas" lo deseable es lo contrario.
const COLOR_BARRA = {
  4: 'bg-indigo-700 dark:bg-indigo-300',
  3: 'bg-indigo-500 dark:bg-indigo-400',
  2: 'bg-indigo-400 dark:bg-indigo-500',
  1: 'bg-indigo-300 dark:bg-indigo-600',
};

const Tarjeta = ({ titulo, children }) => (
  <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
    {titulo && (
      <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
        <span className="h-5 w-1 rounded-full bg-indigo-600" />
        {titulo}
      </h2>
    )}
    {children}
  </section>
);

const CAMPO =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100';

function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [ingresando, setIngresando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setIngresando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), clave);
    } catch (err) {
      console.error(err);
      setError(`No se pudo ingresar (${err.code || 'error'}).`);
      setIngresando(false);
    }
  }

  return (
    <main className="hero hero-dots flex min-h-screen items-center justify-center px-4 py-10">
      <div className="subir w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/25">
            <IconoEscudo className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Panel docente</h1>
          <p className="mt-1 text-sm text-indigo-200">Encuesta de convivencia · 2.° A</p>
        </div>

        <form
          onSubmit={entrar}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl shadow-indigo-950/30 ring-1 ring-black/5"
        >
          <div>
            <label htmlFor="correo" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              required
              autoComplete="username"
              placeholder="docente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CAMPO}
            />
          </div>

          <div>
            <label htmlFor="clave" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="clave"
                type={mostrar ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className={CAMPO + ' pr-12'}
              />
              <button
                type="button"
                onClick={() => setMostrar((m) => !m)}
                aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrar}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-800"
              >
                {mostrar ? <IconoOjoTachado /> : <IconoOjo />}
              </button>
            </div>
          </div>

          <button
            disabled={ingresando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-[0.99] disabled:bg-indigo-400"
          >
            {ingresando && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {ingresando ? 'Ingresando…' : 'Ingresar'}
          </button>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          )}

          <p className="text-center text-xs leading-relaxed text-slate-500">
            Acceso solo para docentes. Las respuestas de los chicos son anónimas.
          </p>
        </form>
      </div>
    </main>
  );
}

function TablaConteos({ conteos }) {
  return (
    <div className="space-y-8">
      {BLOQUES.map((b) => {
        const a = acento(b.id);
        return (
          <div key={b.id}>
            <h3 className={`mb-2 flex items-center gap-2 font-extrabold ${a.textoOscuro}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${a.punto}`} />
              {b.titulo}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-50 text-left text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-100">
                    <th className="border-b border-slate-200 dark:border-slate-700 p-2.5 font-bold">Pregunta</th>
                    {OPCIONES.map((o) => (
                      <th key={o.valor} className="border-b border-slate-200 dark:border-slate-700 p-2.5 text-center font-bold">
                        {o.texto}
                      </th>
                    ))}
                    <th className="border-b border-slate-200 dark:border-slate-700 p-2.5 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {PREGUNTAS.filter((p) => p.bloque === b.id).map((p) => (
                    <tr key={p.id} className="odd:bg-white even:bg-slate-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-800/50">
                      <td className="border-t border-slate-200 dark:border-slate-700 p-2.5">
                        <span
                          className={
                            'mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ' +
                            (p.sujeto === 'yo' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' : 'bg-slate-200 text-slate-700 dark:text-slate-300 dark:bg-slate-700 dark:text-slate-200')
                          }
                        >
                          {p.sujeto}
                        </span>
                        {p.texto}
                      </td>
                      {OPCIONES.map((o) => (
                        <td
                          key={o.valor}
                          className="border-t border-slate-200 dark:border-slate-700 p-2.5 text-center text-lg font-bold tabular-nums"
                        >
                          {conteos[p.id][o.valor]}
                        </td>
                      ))}
                      <td className="border-t border-slate-200 dark:border-slate-700 p-2.5 text-center font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                        {total(conteos[p.id])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Barras({ conteo }) {
  const t = total(conteo) || 1;
  return (
    <div className="space-y-1.5">
      {OPCIONES.map((o) => {
        const pct = Math.round((conteo[o.valor] / t) * 100);
        return (
          <div key={o.valor} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-slate-600 dark:text-slate-400">{o.texto}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${COLOR_BARRA[o.valor]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums">
              {conteo[o.valor]} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Graficos({ conteos }) {
  const temas = useMemo(() => comparacionPorTema(conteos), [conteos]);
  return (
    <div className="space-y-8">
      {BLOQUES.map((b) => {
        const a = acento(b.id);
        return (
          <div key={b.id}>
            <h3 className={`mb-3 flex items-center gap-2 font-extrabold ${a.textoOscuro}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${a.punto}`} />
              {b.titulo}
            </h3>
            {temas
              .filter((t) => t.bloque === b.id)
              .map((t) => (
                <div key={t.id} className="mb-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                  <p className="mb-3 font-bold text-slate-900 dark:text-slate-100">{t.titulo}</p>
                  <div className="grid gap-5 md:grid-cols-2">
                    {[t.yo, t.curso].map((p) => (
                      <div key={p.id}>
                        <p
                          className={
                            'mb-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ' +
                            (p.sujeto === 'yo' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' : 'bg-slate-200 text-slate-700 dark:text-slate-300 dark:bg-slate-700 dark:text-slate-200')
                          }
                        >
                          {p.sujeto === 'yo' ? 'Yo' : 'El curso'}
                        </p>
                        <p className="mb-3 text-sm leading-snug text-slate-700 dark:text-slate-300">{p.texto}</p>
                        <Barras conteo={conteos[p.id]} />
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                    Respuestas deseables: <b>yo {Math.round(t.fy)}%</b> · <b>curso {Math.round(t.fc)}%</b> ·
                    diferencia <b>{Math.round(t.brecha) > 0 ? '+' : ''}{Math.round(t.brecha)} puntos</b>
                    {' '}({Math.abs(Math.round(t.brecha)) < 5
                      ? 'el grupo se ve como ve al curso'
                      : t.brecha > 0
                      ? 'cada uno se ve mejor de lo que ve al curso'
                      : 'cada uno ve al curso mejor de lo que se ve a sí mismo'})
                  </p>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function Compartir() {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(URL_ENCUESTA, { width: 512, margin: 2 }).then(setQr).catch(console.error);
  }, []);
  return (
    <Tarjeta titulo="Compartir con el curso">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        {qr && (
          <div className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-sm">
            <img src={qr} alt="Código QR de la encuesta" className="w-48" />
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Dirección</p>
          <p className="mb-4 break-all rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
            {URL_ENCUESTA}
          </p>
          {qr && (
            <a
              href={qr}
              download="qr-encuesta-2do.png"
              className="inline-block rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
            >
              Descargar QR (PNG)
            </a>
          )}
        </div>
      </div>
    </Tarjeta>
  );
}

function EstadoPill({ abierta }) {
  if (abierta === null)
    return <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm font-bold text-slate-500 dark:text-slate-400">…</span>;
  return (
    <span
      className={
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ring-1 ' +
        (abierta
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700')
      }
    >
      <span className={'h-2 w-2 rounded-full ' + (abierta ? 'animate-pulse bg-emerald-500' : 'bg-slate-400')} />
      Encuesta {abierta ? 'abierta' : 'cerrada'}
    </span>
  );
}

function Panel({ user }) {
  const [respuestas, setRespuestas] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const [error, setError] = useState('');
  const [graficos, setGraficos] = useState(false);
  const [confirmar, setConfirmar] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'respuestas'),
      (snap) => setRespuestas(snap.docs.map((d) => d.data())),
      (e) => {
        console.error(e);
        if (e.code === 'permission-denied') setSinPermiso(true);
        else setError(`Error al leer respuestas (${e.code || e.message})`);
      }
    );
    getDoc(doc(db, 'config', 'estado'))
      .then((s) => setAbierta(s.exists() && s.data().abierta === true))
      .catch((e) => console.error(e));
    return unsub;
  }, []);

  const n = respuestas ? respuestas.length : 0;
  const suficiente = n >= MIN_RESPUESTAS;
  const conteos = useMemo(() => (respuestas && suficiente ? contar(respuestas) : null), [respuestas, suficiente]);

  async function alternarEstado() {
    try {
      await setDoc(doc(db, 'config', 'estado'), { abierta: !abierta });
      setAbierta(!abierta);
    } catch (e) {
      setError(`No se pudo cambiar el estado (${e.code || e.message})`);
    }
  }

  function descargar() {
    const blob = new Blob([aCSV(conteos)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'convivencia-2do-conteos.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function borrar() {
    try {
      const snap = await getDocs(collection(db, 'respuestas'));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      setConfirmar('');
    } catch (e) {
      setError(`No se pudieron borrar los datos (${e.code || e.message})`);
    }
  }

  if (sinPermiso)
    return (
      <main className="hero hero-dots flex min-h-screen items-center justify-center px-4 py-10">
        <div className="subir w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-8 text-center shadow-2xl shadow-indigo-950/30 ring-1 ring-black/5">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-700 ring-8 ring-amber-100">
            <IconoAlerta className="h-7 w-7" />
          </span>
          <p className="mb-5 leading-relaxed text-slate-700 dark:text-slate-300">Esta cuenta no está autorizada para ver los resultados.</p>
          <button
            onClick={() => signOut(auth)}
            className="rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2.5 font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Salir
          </button>
        </div>
      </main>
    );

  const faltan = MIN_RESPUESTAS - n;

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-slate-100">
      <header className="hero hero-dots text-white">
        <div className="mx-auto flex max-w-4xl items-start justify-between gap-3 px-4 pb-16 pt-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Panel docente</p>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Convivencia · 2.° A</h1>
            <p className="mt-0.5 truncate text-xs text-indigo-200">{user.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/20"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-4xl px-4 pb-12">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
            {error}
          </p>
        )}

        <Tarjeta titulo="Estado de la encuesta">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Respuestas recibidas</p>
              <p className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{respuestas ? n : '…'}</p>
            </div>
            <EstadoPill abierta={abierta} />
          </div>
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Cerrala antes de tabular para que el número no cambie mientras trabajan.
          </p>
          <button
            onClick={alternarEstado}
            disabled={abierta === null}
            className={
              'rounded-xl px-5 py-2.5 font-bold text-white shadow-md transition active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none ' +
              (abierta
                ? 'bg-slate-800 shadow-slate-800/20 hover:bg-slate-900'
                : 'bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700')
            }
          >
            {abierta ? 'Cerrar encuesta' : 'Abrir encuesta'}
          </button>
        </Tarjeta>

        <Compartir />

        <Tarjeta titulo="Resultados">
          {!suficiente ? (
            <div>
              <p className="mb-3 text-slate-600 dark:text-slate-400">
                Se muestran resultados a partir de {MIN_RESPUESTAS} respuestas (para proteger el anonimato).
                {respuestas && ` Faltan ${faltan}.`}
              </p>
              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={MIN_RESPUESTAS}
                aria-valuenow={Math.min(n, MIN_RESPUESTAS)}
                aria-label="Respuestas necesarias para mostrar resultados"
              >
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (n / MIN_RESPUESTAS) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="grid w-full gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 sm:inline-grid sm:w-auto sm:grid-cols-2">
                  <button
                    onClick={() => setGraficos(false)}
                    aria-pressed={!graficos}
                    className={
                      'rounded-lg px-3 py-2 text-sm font-bold transition ' +
                      (!graficos ? 'bg-white dark:bg-slate-900 text-indigo-800 shadow-sm dark:bg-slate-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100')
                    }
                  >
                    Modo pizarrón (solo conteos)
                  </button>
                  <button
                    onClick={() => setGraficos(true)}
                    aria-pressed={graficos}
                    className={
                      'rounded-lg px-3 py-2 text-sm font-bold transition ' +
                      (graficos ? 'bg-white dark:bg-slate-900 text-indigo-800 shadow-sm dark:bg-slate-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100')
                    }
                  >
                    Mostrar gráficos y comparación yo / curso
                  </button>
                </div>
                <button
                  onClick={descargar}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:ml-auto"
                >
                  Descargar conteos (CSV)
                </button>
              </div>
              {graficos ? <Graficos conteos={conteos} /> : <TablaConteos conteos={conteos} />}
            </>
          )}
        </Tarjeta>

        <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-red-800 dark:text-red-300">
            <IconoAlerta className="h-5 w-5" />
            Borrar datos
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-red-800 dark:text-red-300">
            Elimina todas las respuestas. No se puede deshacer. Escribí <b>BORRAR</b> para confirmar.
          </p>
          <div className="flex gap-2">
            <input
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="flex-1 rounded-xl border border-red-300 bg-white p-2.5 outline-none focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-red-950"
              placeholder="BORRAR"
              aria-label="Escribí BORRAR para confirmar"
            />
            <button
              disabled={confirmar !== 'BORRAR'}
              onClick={borrar}
              className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:bg-red-300"
            >
              Borrar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PanelResultados() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <Cargando />;
  if (!user) return <Login />;
  return <Panel user={user} />;
}
