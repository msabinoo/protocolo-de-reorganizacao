import { ArrowRight, CalendarDays, Check, CirclePlay, Hourglass, Moon, PenLine, Play, Sparkles } from 'lucide-react';
import {
  bubbleMessages, daysLeftInMonth, entryId, formatTime, makeMonth, progressForMonth, remaining,
  type Data, type Flow,
} from '../domain';
import { Bonequinha } from '../components/Bonequinha';
import { FlowIcon } from '../components/FlowIcon';
import { JourneyBar } from '../components/JourneyBar';
import { EmptyState } from '../components/ui';
import { longDate } from '../format';

type Props = {
  data: Data; today: string; now: number; reducedMotion: boolean;
  celebrateFrom?: number;
  onStart: (date: string, flowId: string) => void;
  onResumeSession: () => void;
  onPlanToday: () => void;
};

const gentleLines = [
  'Um passo de cada vez também é caminho.',
  'Você não precisa fazer tudo hoje. Só o próximo passo.',
  'Começar pequeno ainda é começar.',
  'Seu ritmo é válido. Volte sempre que puder.',
  'Presença vale mais que perfeição.',
  'Hoje é um bom dia para cuidar de você.',
  'Cada fluxo é um encontro com você mesma.',
];

type Status = 'done' | 'running' | 'paused' | 'checkout' | 'todo';
const statusLabel: Record<Status, string> = {
  done: 'Concluído', running: 'Em andamento', paused: 'Pausado', checkout: 'Falta registrar', todo: 'Não iniciado',
};

export function TodayPage({ data, today, now, reducedMotion, celebrateFrom, onStart, onResumeSession, onPlanToday }: Props) {
  const plan = data.months[today.slice(0, 7)] ?? makeMonth(today.slice(0, 7));
  const ids = plan.schedule[today] ?? [];
  const flows = ids.map(id => data.flows.find(f => f.id === id)).filter((f): f is Flow => Boolean(f));
  const progress = progressForMonth(plan, data.entries);
  const session = data.session;
  const bubbles = bubbleMessages(data.entries, 2, 64);
  const dayNumber = Number(today.slice(8, 10));

  const statusOf = (flow: Flow): Status => {
    const id = entryId(today, flow.id);
    if (data.entries[id]) return 'done';
    if (session?.id === id) return session.phase === 'checkout' ? 'checkout' : session.lastStartedAt === null ? 'paused' : 'running';
    return 'todo';
  };
  const pending = flows.filter(f => statusOf(f) !== 'done');
  const doneToday = flows.length - pending.length;
  const sessionFlow = session ? data.flows.find(f => f.id === session.flowId) : undefined;
  const nextFlow = pending.find(f => statusOf(f) === 'todo');

  const goalTitle = plan.goalLabel || plan.objective || plan.financialTarget || 'Defina seu objetivo no Planejamento';

  /* ---------- Próximo passo: uma única ação principal ---------- */
  let nextStep;
  if (session && sessionFlow) {
    const left = remaining(session, now);
    nextStep = (
      <div className="next-step panel">
        <Bonequinha className="next-step-avatar" />
        <div>
          <span className="eyebrow"><Hourglass size={15} /> Seu próximo passo</span>
          <h2>{session.phase === 'checkout' ? `Registrar como foi: ${sessionFlow.name}` : `Retomar ${sessionFlow.name}`}</h2>
          <p>
            {session.phase === 'checkout'
              ? 'Falta só o registro final para este fluxo contar no seu progresso.'
              : session.lastStartedAt === null
                ? `Pausado com ${formatTime(left)} restantes. Tudo bem pausar — seu tempo está guardado.`
                : `Em andamento · ${formatTime(left)} restantes.`}
            {session.date !== today && ' (fluxo iniciado em outro dia)'}
          </p>
        </div>
        <button className="gold-button large" onClick={onResumeSession}>
          {session.phase === 'checkout' ? <><PenLine size={19} /> Registrar agora</> : <><CirclePlay size={19} /> Retomar</>}
        </button>
      </div>
    );
  } else if (nextFlow) {
    nextStep = (
      <div className="next-step panel">
        <Bonequinha className="next-step-avatar" />
        <div>
          <span className="eyebrow"><Sparkles size={15} /> Seu próximo passo</span>
          <h2>{nextFlow.name}</h2>
          <p>{nextFlow.durationMinutes} minutos só para você. Antes, um check-in rapidinho.</p>
        </div>
        <button className="gold-button large" onClick={() => onStart(today, nextFlow.id)}><Play size={19} /> Começar agora</button>
      </div>
    );
  } else if (flows.length) {
    nextStep = (
      <div className="next-step panel all-done">
        <Bonequinha className="next-step-avatar" />
        <div>
          <span className="eyebrow"><Check size={15} /> Dia concluído</span>
          <h2>Você concluiu todos os fluxos de hoje ✧</h2>
          <p>Agora é tempo de integrar e descansar. Seu registro está guardado no diário.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="hero panel">
        <div className="hero-copy">
          <span className="eyebrow date-line">{longDate(today)}</span>
          <h1>Hoje é um novo capítulo <span className="hero-star" aria-hidden="true">✧</span></h1>
          <p>{gentleLines[dayNumber % gentleLines.length]}</p>
          {plan.isExample && <span className="example-tag">Programação de exemplo — personalize no Planejamento</span>}
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-moon" />
          <Bonequinha className="hero-avatar" />
          <blockquote className="hero-quote">“Mulher que se organiza<br />realiza sonhos.” <span>✦</span></blockquote>
        </div>
      </section>

      {nextStep}

      <section className="section-head">
        <div>
          <span className="eyebrow">Sua rotina</span>
          <h2>Seus fluxos de hoje</h2>
          {flows.length > 0 && <p className="section-sub">{doneToday} de {flows.length} concluído{flows.length > 1 ? 's' : ''} hoje</p>}
        </div>
        <button className="quiet-btn" onClick={onPlanToday}><CalendarDays size={16} /> Editar programação</button>
      </section>

      {flows.length > 0 ? (
        <div className="flow-grid">
          {flows.map((f, i) => {
            const st = statusOf(f);
            const busyElsewhere = Boolean(session) && st === 'todo';
            return (
              <article key={f.id} className={`flow-card panel status-${st}`}>
                <div className="flow-card-top">
                  <FlowIcon flow={f} size="lg" />
                  <div className="flow-info">
                    <span className="flow-order">Fluxo {i + 1}</span>
                    <h3>{f.name}</h3>
                    {f.description && <p>{f.description}</p>}
                  </div>
                </div>
                <div className="flow-status"><span className={`state-dot ${st}`} />{statusLabel[st]} · {f.durationMinutes} min</div>
                {st === 'done' ? (
                  <button className="secondary-button done-button" disabled><Check size={17} /> Concluído</button>
                ) : st === 'todo' ? (
                  <button className="gold-button" onClick={() => onStart(today, f.id)} disabled={busyElsewhere} title={busyElsewhere ? 'Conclua ou retome o fluxo em andamento primeiro' : undefined}>
                    <Play size={17} /> Iniciar
                  </button>
                ) : (
                  <button className="gold-button" onClick={onResumeSession}>
                    {st === 'checkout' ? <><PenLine size={17} /> Registrar</> : <><CirclePlay size={17} /> Retomar</>}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Moon size={30} />}
          title="Hoje é um dia livre de fluxos."
          action={<button className="gold-button" onClick={onPlanToday}>Programar um fluxo para hoje <ArrowRight size={16} /></button>}
        >
          Dias sem programação também fazem parte: são espaço para integrar e descansar. Se quiser, adicione um fluxo.
        </EmptyState>
      )}

      <section className="progress-panel panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Sua jornada · {plan.name}</span>
            <h2>Seu progresso do mês</h2>
          </div>
        </div>
        <JourneyBar
          percent={progress.percent}
          fromPercent={celebrateFrom}
          bubbles={bubbles}
          goalImage={plan.goalImage}
          goalTitle={goalTitle}
          goalLabel="Meu objetivo do mês"
          reducedMotion={reducedMotion}
        />
        <div className="stats">
          <div className="stat-ring">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="27" className="ring-bg" />
              <circle cx="32" cy="32" r="27" className="ring-fg" strokeDasharray={`${(progress.percent / 100) * 169.6} 169.6`} />
            </svg>
            <div><strong>{progress.percent}%</strong><span>concluído</span></div>
          </div>
          <div><strong>{progress.completed}<small>/{progress.total}</small></strong><span>fluxos concluídos</span></div>
          <div><strong>{progress.completedDays}</strong><span>dias cumpridos</span></div>
          <div><strong>{daysLeftInMonth(plan.monthKey, today)}</strong><span>dias restantes no mês</span></div>
        </div>
        <p className="tiny-note">
          {progress.total === 0
            ? 'Ainda não há fluxos programados neste mês. Programe no Planejamento para ver sua caminhada.'
            : 'A bonequinha avança a cada fluxo concluído com registro. O percentual mede práticas realizadas, não resultados externos. Pausas e recomeços fazem parte.'}
        </p>
      </section>
    </>
  );
}
