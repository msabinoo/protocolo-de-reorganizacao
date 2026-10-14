/**
 * Regras de negócio puras do Protocolo de Reorganização.
 * Este arquivo não acessa DOM nem localStorage para poder ser testado com `node --test`.
 */

export const areas = ['Financeiro', 'Saúde', 'Emocional', 'Espiritual', 'Relacionamentos', 'Carreira', 'Autoestima', 'Rotina'] as const;
export type Area = typeof areas[number];
export type Ratings = Record<Area, number>;

export const flowIcons = ['sprout', 'leaf', 'lotus', 'gem', 'key', 'moon', 'sun', 'heart', 'star', 'feather', 'coins', 'sparkles'] as const;
export type FlowIcon = typeof flowIcons[number];
export const flowColors = ['#D4AF37', '#C8B4E6', '#E9A6C8', '#8E6BD6', '#F3E3A1', '#9FD3C7'] as const;

export type Flow = {
  id: string; name: string; description: string; durationMinutes: number;
  icon: FlowIcon; color: string; archived?: boolean;
};
export type MonthPlan = {
  monthKey: string; name: string; objective: string;
  financialTarget: string; healthTarget: string; personalTarget: string;
  goalImage: string; goalLabel: string;
  ratingsBefore: Ratings; ratingsAfter?: Ratings;
  schedule: Record<string, string[]>;
  isExample?: boolean;
};
export type CheckIn = { emotions: string[]; burden: string; intention: string; energy: number };
export type CheckOut = { emotions: string[]; changed: string; notes: string; showInBubble: boolean };
export type Entry = {
  id: string; date: string; flowId: string; flowName: string;
  before: CheckIn; after: CheckOut;
  startedAt: string; completedAt: string; elapsedSeconds: number;
};
export type SessionPhase = 'running' | 'checkout';
export type Session = {
  id: string; date: string; flowId: string; before: CheckIn;
  remainingSeconds: number; lastStartedAt: number | null; durationSeconds: number;
  startedAt: string; phase: SessionPhase; afterDraft?: CheckOut;
};
export type MotionPreference = 'system' | 'reduced' | 'full';
export type Settings = { motion: MotionPreference; sound: boolean };
export type Data = {
  version: 2; flows: Flow[]; months: Record<string, MonthPlan>;
  entries: Record<string, Entry>; session?: Session; settings: Settings;
};

export const DATA_VERSION = 2;
export const emptyCheckIn = (): CheckIn => ({ emotions: [], burden: '', intention: '', energy: 3 });
export const emptyCheckOut = (): CheckOut => ({ emotions: [], changed: '', notes: '', showInBubble: true });
export const defaultSettings = (): Settings => ({ motion: 'system', sound: true });
export const defaultRatings = (): Ratings => ({
  Financeiro: 5, Saúde: 5, Emocional: 5, Espiritual: 5,
  Relacionamentos: 5, Carreira: 5, Autoestima: 5, Rotina: 5,
});

/* ---------- Datas (sempre no fuso local) ---------- */

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function monthKey(date = new Date()) { return dateKey(date).slice(0, 7); }
export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
}
export function shiftMonth(key: string, step: number) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + step, 1));
}
export function daysInMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
/** Dia da semana (0 = domingo) do primeiro dia do mês, usado para alinhar o calendário. */
export function firstWeekday(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).getDay();
}
export function monthDates(key: string) {
  return Array.from({ length: daysInMonth(key) }, (_, i) => `${key}-${String(i + 1).padStart(2, '0')}`);
}

/* ---------- Dados iniciais ---------- */

export const exampleFlows = (): Flow[] => [
  { id: 'f1', name: 'Prosperidade', description: 'Atrair abundância e oportunidades', durationMinutes: 60, icon: 'sprout', color: '#D4AF37' },
  { id: 'f2', name: 'Saúde', description: 'Vitalidade e bem-estar', durationMinutes: 60, icon: 'leaf', color: '#9FD3C7' },
  { id: 'f3', name: 'Reorganização energética', description: 'Organizar a energia e a rotina', durationMinutes: 60, icon: 'lotus', color: '#E9A6C8' },
  { id: 'f4', name: 'Limpeza emocional', description: 'Liberar o que não serve mais', durationMinutes: 60, icon: 'gem', color: '#C8B4E6' },
  { id: 'f5', name: 'Abertura de caminhos', description: 'Expandir possibilidades', durationMinutes: 60, icon: 'key', color: '#F3E3A1' },
];

export function makeMonth(key: string, example = false): MonthPlan {
  const [y, m] = key.split('-').map(Number);
  const schedule: Record<string, string[]> = {};
  if (example) {
    for (const date of monthDates(key)) {
      const day = parseDateKey(date).getDay();
      if (day === 1) schedule[date] = ['f1', 'f2'];
      if (day === 2) schedule[date] = ['f2', 'f4'];
      if (day === 3) schedule[date] = ['f1', 'f3', 'f5'];
      if (day === 4) schedule[date] = ['f3'];
      if (day === 5) schedule[date] = ['f1', 'f4'];
    }
  }
  return {
    monthKey: key,
    name: example ? 'Minha melhor versão' : `Meu protocolo de ${String(m).padStart(2, '0')}/${y}`,
    objective: example ? 'Criar consistência, um fluxo por vez.' : '',
    financialTarget: '', healthTarget: '', personalTarget: '',
    goalImage: '', goalLabel: '',
    ratingsBefore: defaultRatings(), schedule, ...(example ? { isExample: true } : {}),
  };
}

export function initialData(): Data {
  const key = monthKey();
  return { version: 2, flows: exampleFlows(), months: { [key]: makeMonth(key, true) }, entries: {}, settings: defaultSettings() };
}

/* ---------- Progresso ---------- */

export function entryId(date: string, flowId: string) { return `${date}__${flowId}`; }

/**
 * Métricas mensais: conta apenas sessões concluídas (com check-out) que ainda constam na programação.
 * Não confunde execução de práticas com conquista de objetivos externos.
 */
export function progressForMonth(plan: MonthPlan, entries: Record<string, Entry>) {
  const scheduledIds = Object.entries(plan.schedule).flatMap(([date, ids]) => ids.map(id => entryId(date, id)));
  const total = scheduledIds.length;
  const completed = scheduledIds.filter(id => Boolean(entries[id])).length;
  const plannedDays = Object.entries(plan.schedule).filter(([, ids]) => ids.length > 0);
  const completedDays = plannedDays.filter(([date, ids]) => ids.every(id => Boolean(entries[entryId(date, id)]))).length;
  return { total, completed, completedDays, plannedDays: plannedDays.length, percent: total ? Math.min(100, Math.round(completed / total * 100)) : 0 };
}

/** Dias do mês que ainda virão (incluindo hoje), para contadores gentis. */
export function daysLeftInMonth(key: string, today: string) {
  if (today.slice(0, 7) > key) return 0;
  if (today.slice(0, 7) < key) return daysInMonth(key);
  return daysInMonth(key) - Number(today.slice(8, 10)) + 1;
}

/* ---------- Cronômetro (relógio real) ---------- */

export function remaining(session: Pick<Session, 'remainingSeconds' | 'lastStartedAt'>, now: number) {
  const running = session.lastStartedAt === null ? 0 : Math.floor(Math.max(0, now - session.lastStartedAt) / 1000);
  return Math.max(0, session.remainingSeconds - running);
}
export function startSession(date: string, flow: Flow, before: CheckIn, now: number): Session {
  const duration = Math.max(1, Math.round(flow.durationMinutes || 60)) * 60;
  return {
    id: entryId(date, flow.id), date, flowId: flow.id, before,
    remainingSeconds: duration, durationSeconds: duration, lastStartedAt: now,
    startedAt: new Date(now).toISOString(), phase: 'running',
  };
}
export function pauseSession(session: Session, now: number): Session {
  if (session.lastStartedAt === null) return session;
  return { ...session, remainingSeconds: remaining(session, now), lastStartedAt: null };
}
export function resumeSession(session: Session, now: number): Session {
  if (session.lastStartedAt !== null || session.phase !== 'running') return session;
  return { ...session, lastStartedAt: now };
}
/** Vai para o registro final congelando o tempo. NÃO conclui o fluxo. */
export function toCheckout(session: Session, now: number): Session {
  return { ...pauseSession(session, now), phase: 'checkout', afterDraft: session.afterDraft ?? emptyCheckOut() };
}
export function backToTimer(session: Session): Session {
  return { ...session, phase: 'running' };
}
export function elapsedSeconds(session: Session, now: number) {
  return Math.min(session.durationSeconds, Math.max(0, session.durationSeconds - remaining(session, now)));
}
/** Conclui a sessão: somente aqui um fluxo passa a contar no progresso. */
export function completeSession(data: Data, after: CheckOut, now: number): Data {
  const s = data.session;
  if (!s) return data;
  const flow = data.flows.find(f => f.id === s.flowId);
  const entry: Entry = {
    id: s.id, date: s.date, flowId: s.flowId, flowName: flow?.name ?? 'Fluxo',
    before: s.before, after: { ...after, emotions: [...after.emotions] },
    startedAt: s.startedAt, completedAt: new Date(now).toISOString(), elapsedSeconds: elapsedSeconds(s, now),
  };
  const { session: _done, ...rest } = data;
  void _done;
  return { ...rest, entries: { ...data.entries, [s.id]: entry } };
}

export function formatTime(n: number) {
  const seconds = Math.max(0, Math.floor(n));
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  if (seconds <= 3600) return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${ss}`;
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}
export function formatDuration(seconds: number) {
  const min = Math.round(seconds / 60);
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim();
}

/* ---------- Balões da bonequinha ---------- */

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
/** Frases curtas reais do pós-fluxo, mais recentes primeiro. Nunca inventa falas. */
export function bubbleMessages(entries: Record<string, Entry>, limit = 3, max = 70) {
  return Object.values(entries)
    .filter(e => e.after.showInBubble !== false)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .map(e => {
      const text = e.after.changed.trim() || (e.after.emotions.filter(x => x !== 'sem muita mudança').length
        ? `Depois do fluxo me senti ${joinPt(e.after.emotions.filter(x => x !== 'sem muita mudança'))}`
        : '');
      return { id: e.id, text: truncate(text, max) };
    })
    .filter(b => b.text)
    .slice(0, limit);
}
export function joinPt(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/* ---------- Programação ---------- */

export function toggleFlowOnDay(plan: MonthPlan, date: string, flowId: string): MonthPlan {
  const current = plan.schedule[date] ?? [];
  const next = current.includes(flowId) ? current.filter(id => id !== flowId) : [...current, flowId];
  const schedule = { ...plan.schedule };
  if (next.length) schedule[date] = next; else delete schedule[date];
  return { ...plan, schedule, isExample: undefined };
}
/** Copia os fluxos de um dia para todos os dias com o mesmo dia da semana no mês. */
export function repeatOnWeekday(plan: MonthPlan, date: string): MonthPlan {
  const weekday = parseDateKey(date).getDay();
  const ids = plan.schedule[date] ?? [];
  const schedule = { ...plan.schedule };
  for (const d of monthDates(plan.monthKey)) {
    if (parseDateKey(d).getDay() !== weekday) continue;
    if (ids.length) schedule[d] = [...ids]; else delete schedule[d];
  }
  return { ...plan, schedule, isExample: undefined };
}
/** Usa como modelo a última ocorrência de cada dia da semana do mês anterior. */
export function scheduleFromPrevious(previous: MonthPlan, targetKey: string, validFlowIds: string[]) {
  const pattern: Record<number, string[]> = {};
  for (const d of monthDates(previous.monthKey)) {
    pattern[parseDateKey(d).getDay()] = (previous.schedule[d] ?? []).filter(id => validFlowIds.includes(id));
  }
  const schedule: Record<string, string[]> = {};
  for (const d of monthDates(targetKey)) {
    const ids = pattern[parseDateKey(d).getDay()] ?? [];
    if (ids.length) schedule[d] = [...ids];
  }
  return schedule;
}
/** Exclui um fluxo da biblioteca sem apagar histórico: arquiva e retira apenas de dias não concluídos. */
export function archiveFlow(data: Data, flowId: string): Data {
  const months: Record<string, MonthPlan> = {};
  for (const [key, plan] of Object.entries(data.months)) {
    const schedule: Record<string, string[]> = {};
    for (const [date, ids] of Object.entries(plan.schedule)) {
      const next = ids.filter(id => id !== flowId || Boolean(data.entries[entryId(date, id)]));
      if (next.length) schedule[date] = next;
    }
    months[key] = { ...plan, schedule };
  }
  return { ...data, months, flows: data.flows.map(f => f.id === flowId ? { ...f, archived: true } : f) };
}

/* ---------- Migração e validação de dados salvos ---------- */

const legacyIcon: Record<string, FlowIcon> = { f1: 'sprout', f2: 'leaf', f3: 'lotus', f4: 'gem', f5: 'key' };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const num = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const strArr = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function normRatings(v: unknown): Ratings {
  const r = defaultRatings();
  if (isObj(v)) for (const a of areas) r[a] = Math.min(10, Math.max(0, Math.round(num(v[a], r[a]))));
  return r;
}
function normCheckIn(v: unknown): CheckIn {
  const o = isObj(v) ? v : {};
  return { emotions: strArr(o.emotions), burden: str(o.burden), intention: str(o.intention), energy: Math.min(5, Math.max(1, num(o.energy, 3))) };
}
function normCheckOut(v: unknown): CheckOut {
  const o = isObj(v) ? v : {};
  return { emotions: strArr(o.emotions), changed: str(o.changed), notes: str(o.notes), showInBubble: o.showInBubble !== false };
}

/**
 * Converte qualquer versão conhecida (v1, v2) para a atual sem descartar registros.
 * Retorna null quando o conteúdo não parece um backup do projeto.
 */
export function migrateData(raw: unknown): Data | null {
  if (!isObj(raw)) return null;
  if (raw.version !== 1 && raw.version !== 2) return null;
  if (!Array.isArray(raw.flows) || !isObj(raw.months) || !isObj(raw.entries)) return null;

  const flows: Flow[] = raw.flows.filter(isObj).map((f, i) => {
    const icon = str(f.icon) as FlowIcon;
    return {
      id: str(f.id, `flow-${i}`), name: str(f.name, 'Fluxo'), description: str(f.description),
      durationMinutes: Math.min(240, Math.max(1, Math.round(num(f.durationMinutes, 60)))),
      icon: flowIcons.includes(icon) ? icon : legacyIcon[str(f.id)] ?? 'sparkles',
      color: str(f.color, flowColors[i % flowColors.length]),
      ...(f.archived === true ? { archived: true } : {}),
    };
  });
  const flowName = (id: string) => flows.find(f => f.id === id)?.name ?? 'Fluxo';

  const months: Record<string, MonthPlan> = {};
  for (const [key, value] of Object.entries(raw.months)) {
    if (!/^\d{4}-\d{2}$/.test(key) || !isObj(value)) continue;
    const schedule: Record<string, string[]> = {};
    if (isObj(value.schedule)) for (const [date, ids] of Object.entries(value.schedule)) {
      const clean = [...new Set(strArr(ids))];
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && clean.length) schedule[date] = clean;
    }
    const name = str(value.name, `Protocolo ${key}`);
    months[key] = {
      monthKey: key, name: name.replace(' · Exemplo', ''), objective: str(value.objective),
      financialTarget: str(value.financialTarget), healthTarget: str(value.healthTarget), personalTarget: str(value.personalTarget),
      goalImage: str(value.goalImage), goalLabel: str(value.goalLabel),
      ratingsBefore: normRatings(value.ratingsBefore),
      ...(value.ratingsAfter ? { ratingsAfter: normRatings(value.ratingsAfter) } : {}),
      schedule,
      ...(value.isExample === true || name.includes('· Exemplo') ? { isExample: true } : {}),
    };
  }

  const entries: Record<string, Entry> = {};
  for (const [id, value] of Object.entries(raw.entries)) {
    if (!isObj(value)) continue;
    const date = str(value.date), flowId = str(value.flowId);
    if (!date || !flowId) continue;
    const completedAt = str(value.completedAt, new Date(0).toISOString());
    entries[id] = {
      id, date, flowId, flowName: str(value.flowName, flowName(flowId)),
      before: normCheckIn(value.before), after: normCheckOut(value.after),
      startedAt: str(value.startedAt, completedAt), completedAt, elapsedSeconds: Math.max(0, num(value.elapsedSeconds, 0)),
    };
  }

  let session: Session | undefined;
  if (isObj(raw.session) && str(raw.session.flowId) && str(raw.session.date)) {
    const s = raw.session;
    const duration = Math.max(60, num(s.durationSeconds, 3600));
    session = {
      id: str(s.id, entryId(str(s.date), str(s.flowId))), date: str(s.date), flowId: str(s.flowId),
      before: normCheckIn(s.before), durationSeconds: duration,
      remainingSeconds: Math.min(duration, Math.max(0, num(s.remainingSeconds, duration))),
      lastStartedAt: typeof s.lastStartedAt === 'number' ? s.lastStartedAt : null,
      startedAt: str(s.startedAt, new Date().toISOString()),
      phase: s.phase === 'checkout' ? 'checkout' : 'running',
      ...(s.afterDraft ? { afterDraft: normCheckOut(s.afterDraft) } : {}),
    };
    if (entries[session.id]) session = undefined;
  }

  const st = isObj(raw.settings) ? raw.settings : {};
  const motion = st.motion === 'reduced' || st.motion === 'full' ? st.motion : 'system';
  return {
    version: 2, flows: flows.length ? flows : exampleFlows(), months, entries,
    ...(session ? { session } : {}),
    settings: { motion, sound: st.sound !== false },
  };
}
