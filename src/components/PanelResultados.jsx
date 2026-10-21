import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import QRCode from 'qrcode';
import { auth, db } from '../firebaseConfig.js';
import { BLOQUES, OPCIONES, PREGUNTAS } from '../preguntas.js';
import { MIN_RESPUESTAS, aCSV, comparacionPorTema, contar, total } from '../agregacion.js';

const URL_ENCUESTA = (import.meta.env.VITE_URL_PUBLICA || window.location.origin).replace(/\/+$/, '');

const Tarjeta = ({ titulo, children }) => (
  <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    {titulo && <h2 className="mb-3 text-lg font-semibold">{titulo}</h2>}
    {children}
  </section>
);

function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), clave);
    } catch (err) {
      console.error(err);
      setError(`No se pudo ingresar (${err.code || 'error'}).`);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Panel docente</h1>
      <form onSubmit={entrar} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="username"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-3"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-3"
        />
        <button className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white">Ingresar</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}

function TablaConteos({ conteos }) {
  return (
    <div className="space-y-6">
      {BLOQUES.map((b) => (
        <div key={b.id}>
          <h3 className="mb-2 font-semibold text-indigo-700">{b.titulo}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-200 p-2">Pregunta</th>
                  {OPCIONES.map((o) => (
                    <th key={o.valor} className="border border-slate-200 p-2 text-center">{o.texto}</th>
                  ))}
                  <th className="border border-slate-200 p-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {PREGUNTAS.filter((p) => p.bloque === b.id).map((p) => (
                  <tr key={p.id}>
                    <td className="border border-slate-200 p-2">
                      <span className="mr-1 rounded bg-slate-200 px-1 text-xs uppercase">{p.sujeto}</span>
                      {p.texto}
                    </td>
                    {OPCIONES.map((o) => (
                      <td key={o.valor} className="border border-slate-200 p-2 text-center text-lg font-semibold">
                        {conteos[p.id][o.valor]}
                      </td>
                    ))}
                    <td className="border border-slate-200 p-2 text-center">{total(conteos[p.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function Barras({ conteo }) {
  const t = total(conteo) || 1;
  return (
    <div className="space-y-1">
      {OPCIONES.map((o) => {
        const pct = Math.round((conteo[o.valor] / t) * 100);
        return (
          <div key={o.valor} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-slate-600">{o.texto}</span>
            <div className="h-4 flex-1 rounded bg-slate-100">
              <div className="h-4 rounded bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums">{conteo[o.valor]} ({pct}%)</span>
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
      {BLOQUES.map((b) => (
        <div key={b.id}>
          <h3 className="mb-3 font-semibold text-indigo-700">{b.titulo}</h3>
          {temas.filter((t) => t.bloque === b.id).map((t) => (
            <div key={t.id} className="mb-5 rounded-lg border border-slate-200 p-3">
              <p className="mb-2 font-medium">{t.titulo}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {[t.yo, t.curso].map((p) => (
                  <div key={p.id}>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{p.sujeto === 'yo' ? 'Yo' : 'El curso'}</p>
                    <p className="mb-2 text-sm">{p.texto}</p>
                    <Barras conteo={conteos[p.id]} />
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded bg-amber-50 p-2 text-sm">
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
      ))}
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
      <p className="mb-3 break-all text-sm text-slate-600">{URL_ENCUESTA}</p>
      {qr && <img src={qr} alt="Código QR de la encuesta" className="mx-auto w-56" />}
      {qr && (
        <a href={qr} download="qr-encuesta-3ro.png" className="mt-3 block text-center text-sm text-indigo-700 underline">
          Descargar QR (PNG)
        </a>
      )}
    </Tarjeta>
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
    a.download = 'convivencia-3ro-conteos.csv';
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
      <main className="mx-auto max-w-md p-6">
        <p className="mb-4">Esta cuenta no está autorizada para ver los resultados.</p>
        <button onClick={() => signOut(auth)} className="rounded-lg border p-2">Salir</button>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel · Convivencia 3.° A</h1>
        <button onClick={() => signOut(auth)} className="text-sm text-slate-600 underline">
          Salir ({user.email})
        </button>
      </header>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Tarjeta titulo="Estado de la encuesta">
        <p className="mb-3">
          Respuestas recibidas: <b className="text-2xl">{respuestas ? n : '…'}</b>
        </p>
        <p className="mb-3 text-sm text-slate-600">
          La encuesta está <b>{abierta === null ? '…' : abierta ? 'abierta' : 'cerrada'}</b>.
          Cerrala antes de tabular para que el número no cambie mientras trabajan.
        </p>
        <button
          onClick={alternarEstado}
          disabled={abierta === null}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:bg-slate-300"
        >
          {abierta ? 'Cerrar encuesta' : 'Abrir encuesta'}
        </button>
      </Tarjeta>

      <Compartir />

      <Tarjeta titulo="Resultados">
        {!suficiente ? (
          <p className="text-slate-600">
            Se muestran resultados a partir de {MIN_RESPUESTAS} respuestas (para proteger el anonimato).
            {respuestas && ` Faltan ${MIN_RESPUESTAS - n}.`}
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setGraficos(false)}
                className={'rounded-lg px-3 py-2 text-sm font-semibold ' + (!graficos ? 'bg-indigo-600 text-white' : 'border border-slate-300')}
              >
                Modo pizarrón (solo conteos)
              </button>
              <button
                onClick={() => setGraficos(true)}
                className={'rounded-lg px-3 py-2 text-sm font-semibold ' + (graficos ? 'bg-indigo-600 text-white' : 'border border-slate-300')}
              >
                Mostrar gráficos y comparación yo / curso
              </button>
              <button onClick={descargar} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                Descargar conteos (CSV)
              </button>
            </div>
            {graficos ? <Graficos conteos={conteos} /> : <TablaConteos conteos={conteos} />}
          </>
        )}
      </Tarjeta>

      <section className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Borrar datos</h2>
        <p className="mb-3 text-sm text-red-800">
          Elimina todas las respuestas. No se puede deshacer. Escribí <b>BORRAR</b> para confirmar.
        </p>
        <div className="flex gap-2">
          <input
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="flex-1 rounded-lg border border-red-300 p-2"
            placeholder="BORRAR"
          />
          <button
            disabled={confirmar !== 'BORRAR'}
            onClick={borrar}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:bg-red-300"
          >
            Borrar
          </button>
        </div>
      </section>
    </main>
  );
}

export default function PanelResultados() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <p className="p-6 text-slate-600">Cargando…</p>;
  if (!user) return <Login />;
  return <Panel user={user} />;
}
