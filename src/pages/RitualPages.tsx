import { ArrowLeft, ArrowRight, Check, Clock, Pause, PenLine, Play, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { emptyCheckIn, formatTime, remaining, type CheckIn, type CheckOut, type Flow, type Session } from '../domain';
import { Bonequinha } from '../components/Bonequinha';
import { FlowIcon } from '../components/FlowIcon';
import { ChipGroup, EnergyPicker } from '../components/ui';
import { dayTitle } from '../format';

export const beforeMoods = ['ansiosa', 'triste', 'cansada', 'travada', 'esperançosa', 'confiante', 'dispersa', 'calma', 'irritada', 'sobrecarregada'];
export const afterMoods = ['mais calma', 'mais confiante', 'mais leve', 'mais focada', 'mais segura', 'grata', 'esperançosa', 'cansada', 'sem muita mudança'];

const toggle = (list: string[], item: string) => list.includes(item) ? list.filter(x => x !== item) : [...list, item];

/* ---------- 3. Check-in antes do fluxo ---------- */

export function CheckInPage({ flow, date, today, onBegin, onBack }: {
  flow: Flow; date: string; today: string; onBegin: (before: CheckIn) => void; onBack: () => void;
}) {
  const [before, setBefore] = useState<CheckIn>(emptyCheckIn);
  return (
    <div className="ritual-layout">
      <aside className="ritual-art panel" aria-hidden="true">
        <span className="ritual-moon" />
        <Bonequinha className="ritual-avatar" />
        <p className="ritual-quote">Toda grande transformação começa com consciência. ✧</p>
      </aside>
      <section className="ritual-form panel light">
        <div className="ritual-heading">
          <FlowIcon flow={flow} />
          <div>
            <span className="eyebrow">Antes do fluxo · {flow.name}{date !== today ? ` · ${dayTitle(date)}` : ''}</span>
            <h1>Como você está antes do seu ritual?</h1>
          </div>
        </div>
        <p className="lead">Não existe resposta certa ou errada. Tudo aqui é opcional — se preferir, só toque em “Começar”.</p>

        <h3>Como estou me sentindo?</h3>
        <ChipGroup label="Emoções antes do fluxo" options={beforeMoods} selected={before.emotions} onToggle={m => setBefore(b => ({ ...b, emotions: toggle(b.emotions, m) }))} />

        <div className="fields">
          <label>O que está pesando em mim hoje? <span>(opcional)</span>
            <textarea rows={3} maxLength={2000} value={before.burden} onChange={e => setBefore({ ...before, burden: e.target.value })} placeholder="Escreva livremente o que está na sua mente…" />
          </label>
          <label>Qual é minha intenção para este fluxo? <span>(opcional)</span>
            <textarea rows={3} maxLength={2000} value={before.intention} onChange={e => setBefore({ ...before, intention: e.target.value })} placeholder="O que desejo cultivar ou sentir depois?" />
          </label>
        </div>

        <h3 id="energy-label">Nível de energia</h3>
        <EnergyPicker value={before.energy} onChange={energy => setBefore({ ...before, energy })} />

        <div className="form-footer">
          <button className="quiet-btn" onClick={onBack}><ArrowLeft size={16} /> Voltar</button>
          <button className="gold-button large" onClick={() => onBegin(before)}>Começar meu fluxo <ArrowRight size={19} /></button>
        </div>
      </section>
    </div>
  );
}

/* ---------- 4. Fluxo em execução ---------- */

export function TimerPage({ session, flow, now, onPause, onResume, onFinish, onCancel }: {
  session: Session; flow?: Flow; now: number;
  onPause: () => void; onResume: () => void; onFinish: () => void; onCancel: () => void;
}) {
  const left = remaining(session, now);
  const paused = session.lastStartedAt === null;
  const fraction = session.durationSeconds ? 1 - left / session.durationSeconds : 1;
  const C = 2 * Math.PI * 140;
  return (
    <section className={`focus-page panel${paused ? ' is-paused' : ''}`}>
      <span className="eyebrow centered"><Clock size={15} /> Meu momento de foco</span>
      <h1>{flow?.name ?? 'Fluxo em andamento'}</h1>
      {flow?.description && <p className="focus-sub">{flow.description}</p>}

      <div className="timer-wrap">
        <svg className="timer-ring" viewBox="0 0 320 320" aria-hidden="true">
          <circle cx="160" cy="160" r="140" className="timer-track" />
          <circle cx="160" cy="160" r="140" className="timer-progress" strokeDasharray={`${(fraction * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 160 160)" />
        </svg>
        <div className="timer-center">
          <Sparkles size={26} className="timer-icon" aria-hidden="true" />
          <strong className="timer-digits" role="timer" aria-live="off" aria-label={`Tempo restante: ${formatTime(left)}`}>{formatTime(left)}</strong>
          <span className="timer-state" aria-live="polite">{paused ? 'Pausado — seu tempo está guardado' : left === 0 ? 'Tempo concluído' : 'Tempo de presença'}</span>
        </div>
      </div>

      <p className="focus-note">Seu único foco agora é este fluxo.</p>

      <div className="timer-controls">
        {paused
          ? <button className="secondary-button xl" onClick={onResume}><Play size={20} /> Retomar</button>
          : <button className="secondary-button xl" onClick={onPause}><Pause size={20} /> Pausar</button>}
        <button className="gold-button xl" onClick={onFinish}><Check size={20} /> Concluir</button>
      </div>
      <p className="tiny-note">Pode trocar de aba ou de tela: o tempo continua contando pelo relógio real e nada se perde se a página recarregar.</p>
      <button className="link-btn" onClick={onCancel}><X size={14} /> Não vou fazer este fluxo agora</button>
    </section>
  );
}

/* ---------- 5. Check-out depois do fluxo ---------- */

export function CheckOutPage({ flow, draft, canReturnToTimer, onChange, onComplete, onLater, onBackToTimer }: {
  flow?: Flow; draft: CheckOut; canReturnToTimer: boolean;
  onChange: (draft: CheckOut) => void; onComplete: () => void; onLater: () => void; onBackToTimer: () => void;
}) {
  return (
    <div className="ritual-layout after-layout">
      <aside className="ritual-art panel" aria-hidden="true">
        <span className="ritual-moon" />
        <Bonequinha className="ritual-avatar" />
        <p className="ritual-quote">Você dedicou este tempo a si. ✧</p>
      </aside>
      <section className="ritual-form panel light">
        <div className="ritual-heading">
          {flow && <FlowIcon flow={flow} />}
          <div>
            <span className="eyebrow">Depois do fluxo · {flow?.name ?? 'Fluxo'}</span>
            <h1>Como você se sente depois do fluxo?</h1>
          </div>
        </div>
        <p className="lead">Reconheça sua experiência. Cada pequeno passo importa. Os campos são opcionais.</p>

        <h3>Como estou agora?</h3>
        <ChipGroup label="Emoções depois do fluxo" options={afterMoods} selected={draft.emotions} onToggle={m => onChange({ ...draft, emotions: toggle(draft.emotions, m) })} />

        <div className="fields">
          <label>O que mudou em mim? <span>(opcional)</span>
            <textarea rows={3} maxLength={2000} value={draft.changed} onChange={e => onChange({ ...draft, changed: e.target.value })} placeholder="Ex.: hoje me senti mais confiante…" />
          </label>
          <label>Quero registrar algo importante? <span>(opcional)</span>
            <textarea rows={3} maxLength={2000} value={draft.notes} onChange={e => onChange({ ...draft, notes: e.target.value })} placeholder="Percepções, ideias, gratidão…" />
          </label>
        </div>

        <label className="check-line">
          <input type="checkbox" checked={draft.showInBubble} onChange={e => onChange({ ...draft, showInBubble: e.target.checked })} />
          <span>Mostrar minha frase nos balões da bonequinha na página inicial</span>
        </label>

        <div className="success-hint">
          <Bonequinha className="hint-avatar" />
          <span>Ao concluir, este fluxo será registrado no seu progresso do mês e a sua bonequinha dará mais um passo. ✧</span>
        </div>

        <div className="form-footer">
          <div className="footer-secondary">
            {canReturnToTimer && <button className="quiet-btn" onClick={onBackToTimer}><ArrowLeft size={16} /> Voltar ao cronômetro</button>}
            <button className="quiet-btn" onClick={onLater}><PenLine size={16} /> Registrar depois</button>
          </div>
          <button className="gold-button large" onClick={onComplete}>Concluir ritual <Sparkles size={19} /></button>
        </div>
      </section>
    </div>
  );
}
