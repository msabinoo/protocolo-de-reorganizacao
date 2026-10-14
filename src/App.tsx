import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BookOpen, CalendarDays, CirclePlay, Home, PenLine, Settings2 } from 'lucide-react';
import {
  backToTimer, completeSession, dateKey, emptyCheckOut, entryId, formatTime, makeMonth, migrateData, monthKey,
  pauseSession, progressForMonth, remaining, resumeSession, startSession, toCheckout,
  type CheckIn, type CheckOut, type Data, type Entry, type MotionPreference,
} from './domain';
import { load, parseBackup, save, STORAGE_KEY, storageUsageKb } from './storage';
import { Bonequinha } from './components/Bonequinha';
import { ClickSparkles, GoldParticles, playChime } from './components/Effects';
import { Modal, useConfirm, useToasts } from './components/ui';
import { TodayPage } from './pages/TodayPage';
import { PlanPage } from './pages/PlanPage';
import { CheckInPage, CheckOutPage, TimerPage } from './pages/RitualPages';
import { DiaryPage } from './pages/DiaryPage';

type Screen = 'home' | 'plan' | 'before' | 'timer' | 'after' | 'diary';
const hashes: Record<Screen, string> = { home: '#/hoje', plan: '#/planejamento', before: '#/antes', timer: '#/fluxo', after: '#/depois', diary: '#/diario' };
const screenFromHash = (hash: string): Screen => (Object.entries(hashes).find(([, h]) => h === hash)?.[0] as Screen) ?? 'home';

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

export default function App() {
  const [initial] = useState(load);
  const [data, setData] = useState<Data>(initial.data);
  const [screen, setScreenState] = useState<Screen>(() => {
    const s = initial.data.session;
    if (s) return s.phase === 'checkout' ? 'after' : 'timer';
    const fromHash = screenFromHash(window.location.hash);
    return fromHash === 'plan' || fromHash === 'diary' ? fromHash : 'home';
  });
  const [now, setNow] = useState(Date.now());
  const today = dateKey(new Date(now));
  const [planMonth, setPlanMonth] = useState(monthKey);
  const [selectedDate, setSelectedDate] = useState(dateKey);
  const [pendingStart, setPendingStart] = useState<{ date: string; flowId: string } | null>(null);
  const [celebration, setCelebration] = useState<{ from: number; to: number; allDone: boolean; sameMonth: boolean; key: number } | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { ask, dialog } = useConfirm();
  const { notify, view: toastView } = useToasts();
  const systemReduced = usePrefersReducedMotion();
  const reducedMotion = data.settings.motion === 'reduced' || (data.settings.motion === 'system' && systemReduced);

  const session = data.session;
  const sessionFlow = session ? data.flows.find(f => f.id === session.flowId) : undefined;
  const left = session ? remaining(session, now) : 0;

  /* ---------- Navegação com histórico (botão voltar do celular funciona) ---------- */
  const setScreen = useCallback((next: Screen) => {
    setScreenState(next);
    if (window.location.hash !== hashes[next]) window.history.pushState(null, '', hashes[next]);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  useEffect(() => {
    if (window.location.hash !== hashes[screen]) window.history.replaceState(null, '', hashes[screen]);
    const onPop = () => setScreenState(screenFromHash(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Telas do ritual só existem com sessão/fluxo escolhido.
  useEffect(() => {
    if (screen === 'before' && !pendingStart) setScreenState(session ? 'timer' : 'home');
    if (screen === 'timer' && !session) setScreenState('home');
    if (screen === 'timer' && session?.phase === 'checkout') setScreenState('after');
    if (screen === 'after' && !session) setScreenState('home');
  }, [screen, session, pendingStart]);
  // Mantém o endereço igual à tela exibida (ex.: após um redirecionamento acima).
  useEffect(() => {
    if (window.location.hash !== hashes[screen]) window.history.replaceState(null, '', hashes[screen]);
  }, [screen]);

  /* ---------- Persistência: grava com pequeno atraso e força gravação ao sair ---------- */
  const latest = useRef(data);
  latest.current = data;
  useEffect(() => {
    const t = window.setTimeout(() => setStorageWarning(!save(data)), 200);
    return () => clearTimeout(t);
  }, [data]);
  useEffect(() => {
    const flush = () => { save(latest.current); };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); else setNow(Date.now()); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    // Outra aba alterou os dados: recarrega para não sobrescrever.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try { const next = migrateData(JSON.parse(e.newValue)); if (next) setData(next); } catch { /* ignora */ }
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('storage', onStorage); };
  }, []);
  useEffect(() => {
    if (initial.recovered) notify('Encontramos dados ilegíveis neste navegador. Uma cópia foi guardada com segurança e o app começou limpo. Se tiver um backup, importe-o no Diário.', 'warn');
  }, [initial.recovered, notify]);

  /* ---------- Relógio: rápido só quando há cronômetro rodando ---------- */
  const running = Boolean(session && session.phase === 'running' && session.lastStartedAt !== null);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), running ? 250 : 20000);
    return () => clearInterval(t);
  }, [running]);

  // Tempo esgotado: vai para o registro final (sem concluir automaticamente).
  const chimed = useRef<string | null>(null);
  useEffect(() => {
    if (!session || session.phase !== 'running' || session.lastStartedAt === null || left > 0) return;
    if (document.visibilityState === 'hidden') return;
    if (chimed.current !== session.id) { chimed.current = session.id; if (data.settings.sound) playChime(); }
    setData(old => old.session ? { ...old, session: toCheckout(old.session, Date.now()) } : old);
    if (screen === 'timer') setScreen('after');
    else notify('O tempo do seu fluxo terminou ✧ Quando puder, registre como foi.');
  }, [session, left, screen, data.settings.sound, setScreen, notify]);

  useEffect(() => {
    document.title = session && session.phase === 'running'
      ? `${session.lastStartedAt === null ? '⏸' : '⏳'} ${formatTime(left)} · ${sessionFlow?.name ?? 'Fluxo'}`
      : 'Protocolo de Reorganização';
  }, [session, left, sessionFlow]);

  // A animação de celebração acontece uma única vez.
  useEffect(() => {
    if (!celebration) return;
    const t = window.setTimeout(() => setCelebration(null), 5000);
    return () => clearTimeout(t);
  }, [celebration]);

  /* ---------- Ações ---------- */
  const update = useCallback((fn: (old: Data) => Data) => setData(fn), []);

  function startFlow(date: string, flowId: string) {
    if (data.entries[entryId(date, flowId)]) { notify('Este fluxo já foi concluído neste dia ✧'); return; }
    if (session) {
      if (session.id !== entryId(date, flowId)) notify('Você já tem um fluxo em andamento. Vamos terminar ele primeiro, sem pressa.', 'warn');
      setScreen(session.phase === 'checkout' ? 'after' : 'timer');
      return;
    }
    setPendingStart({ date, flowId });
    setScreen('before');
  }
  function beginFlow(before: CheckIn) {
    if (!pendingStart) return;
    const flow = data.flows.find(f => f.id === pendingStart.flowId);
    if (!flow) return;
    const t = Date.now();
    setData(old => old.session ? old : { ...old, session: startSession(pendingStart.date, flow, before, t) });
    setPendingStart(null);
    setNow(t);
    setScreen('timer');
  }
  const pause = () => { const t = Date.now(); setData(o => o.session ? { ...o, session: pauseSession(o.session, t) } : o); setNow(t); };
  const resume = () => { const t = Date.now(); setData(o => o.session ? { ...o, session: resumeSession(o.session, t) } : o); setNow(t); };
  async function finishEarly() {
    if (!session) return;
    if (remaining(session, Date.now()) > 0) {
      const ok = await ask({
        title: 'Concluir o fluxo agora?',
        message: <>Ainda faltam <strong>{formatTime(remaining(session, Date.now()))}</strong>. Tudo bem encerrar antes — o tempo realizado ficará registrado. Em seguida você faz o check-out.</>,
        confirmLabel: 'Sim, ir para o check-out', cancelLabel: 'Continuar o fluxo',
      });
      if (!ok) return;
    }
    const t = Date.now();
    setData(o => o.session ? { ...o, session: toCheckout(o.session, t) } : o);
    setScreen('after');
  }
  async function cancelSession() {
    const ok = await ask({
      title: 'Deixar este fluxo para outro momento?',
      message: 'O cronômetro será encerrado sem registro. O fluxo continua disponível no seu dia para quando você quiser. Sem culpa: recomeçar faz parte.',
      confirmLabel: 'Deixar para depois', cancelLabel: 'Continuar',
    });
    if (!ok) return;
    setData(({ session: _s, ...rest }) => { void _s; return rest; });
    setScreen('home');
  }
  function updateDraft(draft: CheckOut) {
    setData(o => o.session ? { ...o, session: { ...o.session, afterDraft: draft } } : o);
  }
  function complete() {
    const s = data.session;
    if (!s) return;
    const key = s.date.slice(0, 7);
    const plan = data.months[key] ?? makeMonth(key);
    const from = progressForMonth(plan, data.entries).percent;
    const next = completeSession(data, s.afterDraft ?? emptyCheckOut(), Date.now());
    const to = progressForMonth(next.months[key] ?? plan, next.entries).percent;
    const todayIds = next.months[today.slice(0, 7)]?.schedule[today] ?? [];
    const allDone = todayIds.length > 0 && todayIds.every(id => next.entries[entryId(today, id)]);
    setData(next);
    setCelebration({ from, to, allDone, sameMonth: key === today.slice(0, 7), key: Date.now() });
    setScreen('home');
    if (!(plan.schedule[s.date] ?? []).includes(s.flowId)) notify('Registro guardado no diário. Este fluxo não está na programação do dia, então não altera o percentual.');
  }
  function registerLater() {
    setScreen('home');
    notify('Tudo guardado. Quando quiser, toque em “Registrar” na página inicial.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocolo-de-reorganizacao-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify('Backup exportado ✧ Guarde o arquivo em local seguro.');
  }
  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed) { notify('Este arquivo não parece um backup do Protocolo de Reorganização.', 'warn'); return; }
    const ok = await ask({
      title: 'Restaurar este backup?',
      message: <>O backup tem <strong>{Object.keys(parsed.entries).length} registros</strong> e <strong>{Object.keys(parsed.months).length} meses</strong> planejados. Ele substituirá os dados atuais deste navegador (uma cópia de segurança dos dados atuais será guardada).</>,
      confirmLabel: 'Restaurar backup',
    });
    if (!ok) return;
    try { localStorage.setItem(`${STORAGE_KEY}-antes-da-importacao`, JSON.stringify(data)); } catch { /* sem espaço para cópia */ }
    setData(parsed);
    setPlanMonth(monthKey());
    setScreen(parsed.session ? (parsed.session.phase === 'checkout' ? 'after' : 'timer') : 'home');
    notify('Backup restaurado com sucesso ✧');
  }
  async function deleteEntry(entry: Entry) {
    const ok = await ask({ title: 'Excluir este registro?', message: 'O registro sai do diário e deixa de contar no progresso. Esta ação não pode ser desfeita (a não ser por um backup).', confirmLabel: 'Excluir registro', tone: 'danger' });
    if (!ok) return;
    setData(o => { const entries = { ...o.entries }; delete entries[entry.id]; return { ...o, entries }; });
  }
  const setMotion = (motion: MotionPreference) => setData(o => ({ ...o, settings: { ...o.settings, motion } }));

  /* ---------- Render ---------- */
  const nav: [Screen, string, typeof Home][] = [['home', 'Hoje', Home], ['plan', 'Planejamento', CalendarDays], ['diary', 'Diário', BookOpen]];
  const navActive = (s: Screen) => s === screen || (s === 'home' && (screen === 'before' || screen === 'timer' || screen === 'after'));
  const focusMode = screen === 'timer';
  const pendingFlow = pendingStart ? data.flows.find(f => f.id === pendingStart.flowId) : undefined;

  return (
    <div className={`app-shell${reducedMotion ? ' reduce-motion' : ''}${focusMode ? ' focus-mode' : ''}`}>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <GoldParticles enabled={!reducedMotion && !focusMode} />
      <ClickSparkles enabled={!reducedMotion} />
      <div className="aurora" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={() => setScreen('home')} aria-label="Protocolo de Reorganização — ir para Hoje">
          <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#D4AF37" strokeWidth="1.4" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="#F3E3A1" strokeOpacity=".5" strokeDasharray="2 3" />
            <path d="M24 9 l3 12 12 3 -12 3 -3 12 -3 -12 -12 -3 12 -3z" fill="#D4AF37" />
          </svg>
          <span><strong>Protocolo</strong><small>de Reorganização</small></span>
        </button>
        <nav aria-label="Navegação principal" className="main-nav">
          {nav.map(([key, label, Icon]) => (
            <button key={key} className={`nav-item${navActive(key) ? ' active' : ''}`} aria-current={navActive(key) ? 'page' : undefined} onClick={() => setScreen(key)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="header-date">{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now))}</span>
          <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Preferências de efeitos e som"><Settings2 size={18} /></button>
          <span className="mini-avatar" aria-hidden="true"><Bonequinha /></span>
        </div>
      </header>

      <main id="conteudo" className="main-container" tabIndex={-1}>
        {storageWarning && <p className="warning" role="alert">O navegador não conseguiu salvar os dados (talvez falte espaço). Exporte um backup no Diário antes de fechar esta aba e, se possível, use uma imagem de objetivo menor.</p>}

        {screen === 'home' && (
          <TodayPage
            key={celebration?.key ?? 'home'}
            data={data} today={today} now={now} reducedMotion={reducedMotion}
            celebrateFrom={celebration?.sameMonth ? celebration.from : undefined}
            onStart={startFlow}
            onResumeSession={() => session && setScreen(session.phase === 'checkout' ? 'after' : 'timer')}
            onPlanToday={() => { setPlanMonth(today.slice(0, 7)); setSelectedDate(today); setScreen('plan'); }}
          />
        )}
        {screen === 'plan' && (
          <PlanPage data={data} update={update} month={planMonth} setMonth={setPlanMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            today={today} onStart={startFlow} ask={ask} notify={notify} />
        )}
        {screen === 'before' && pendingStart && pendingFlow && (
          <CheckInPage flow={pendingFlow} date={pendingStart.date} today={today} onBegin={beginFlow} onBack={() => { setPendingStart(null); setScreen('home'); }} />
        )}
        {screen === 'timer' && session && (
          <TimerPage session={session} flow={sessionFlow} now={now} onPause={pause} onResume={resume} onFinish={finishEarly} onCancel={cancelSession} />
        )}
        {screen === 'after' && session && (
          <CheckOutPage flow={sessionFlow} draft={session.afterDraft ?? emptyCheckOut()} canReturnToTimer={left > 0}
            onChange={updateDraft} onComplete={complete} onLater={registerLater}
            onBackToTimer={() => { setData(o => o.session ? { ...o, session: backToTimer(o.session) } : o); setScreen('timer'); }} />
        )}
        {screen === 'diary' && (
          <DiaryPage data={data} storageKb={storageUsageKb()} onExport={exportData} onImport={importData} onDeleteEntry={deleteEntry} onGoToday={() => setScreen('home')} />
        )}
      </main>

      {session && screen !== 'timer' && screen !== 'after' && (
        <button className="session-pill" onClick={() => setScreen(session.phase === 'checkout' ? 'after' : 'timer')}>
          {session.phase === 'checkout'
            ? <><PenLine size={17} /> Falta registrar: {sessionFlow?.name}</>
            : <><CirclePlay size={17} /> {sessionFlow?.name} · {formatTime(left)}{session.lastStartedAt === null ? ' (pausado)' : ''}</>}
        </button>
      )}

      {celebration && screen === 'home' && (
        <Celebration key={celebration.key} percent={celebration.to} allDone={celebration.allDone} reducedMotion={reducedMotion} />
      )}

      <footer className="footer">
        <span>✧ Protocolo de Reorganização</span>
        <span>Seus dados ficam apenas neste navegador · faça backups no Diário</span>
      </footer>

      {showSettings && (
        <Modal title="Preferências" onClose={() => setShowSettings(false)}>
          <fieldset className="settings-group">
            <legend>Animações e brilhos</legend>
            {([['system', 'Automático', 'Segue a configuração do seu aparelho'], ['full', 'Completas', 'Partículas, brilhos nos cliques e caminhada da bonequinha'], ['reduced', 'Reduzidas', 'Interface calma, sem movimento']] as const).map(([value, label, hint]) => (
              <label key={value} className="radio-line">
                <input type="radio" name="motion" checked={data.settings.motion === value} onChange={() => setMotion(value)} />
                <span><strong>{label}</strong><small>{hint}</small></span>
              </label>
            ))}
          </fieldset>
          <label className="check-line">
            <input type="checkbox" checked={data.settings.sound} onChange={e => setData(o => ({ ...o, settings: { ...o.settings, sound: e.target.checked } }))} />
            <span>Tocar um sino suave quando o tempo do fluxo terminar</span>
          </label>
          <div className="modal-actions"><button className="gold-button" onClick={() => setShowSettings(false)}>Pronto</button></div>
        </Modal>
      )}
      {dialog}
      {toastView}
    </div>
  );
}

function Celebration({ percent, allDone, reducedMotion }: { percent: number; allDone: boolean; reducedMotion: boolean }) {
  const [open, setOpen] = useState(true);
  useEffect(() => { const t = window.setTimeout(() => setOpen(false), 4200); return () => clearTimeout(t); }, []);
  if (!open) return null;
  return (
    <div className={`celebration${reducedMotion ? ' still' : ''}`} role="status" aria-live="polite" onClick={() => setOpen(false)}>
      <div className="celebration-card panel">
        <div className="burst" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
        <Bonequinha className="celebration-avatar" />
        <h2>{allDone ? 'Todos os fluxos de hoje concluídos!' : 'Fluxo concluído ✧'}</h2>
        <p>Sua bonequinha deu mais um passo. Você já percorreu <strong>{percent}%</strong> da caminhada do mês.</p>
        <button className="quiet-btn small">Fechar</button>
      </div>
    </div>
  );
}
