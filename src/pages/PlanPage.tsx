import { useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Eraser, History, ImagePlus,
  Minus, Pencil, Play, Plus, Repeat, Trash2, WandSparkles,
} from 'lucide-react';
import {
  areas, archiveFlow, defaultRatings, entryId, firstWeekday, flowColors, flowIcons, makeMonth, monthDates,
  parseDateKey, progressForMonth, repeatOnWeekday, scheduleFromPrevious, shiftMonth, toggleFlowOnDay,
  type Area, type Data, type Flow, type MonthPlan, type Ratings,
} from '../domain';
import { FlowIcon, flowAbbr, iconLabels, iconMap } from '../components/FlowIcon';
import { Mandala } from '../components/Mandala';
import { goalPlaceholder } from '../assets';
import type { ConfirmOptions } from '../components/ui';
import { dayTitle, titleMonth } from '../format';

type Props = {
  data: Data;
  update: (fn: (old: Data) => Data) => void;
  month: string; setMonth: (key: string) => void;
  selectedDate: string; setSelectedDate: (date: string) => void;
  today: string;
  onStart: (date: string, flowId: string) => void;
  ask: (o: ConfirmOptions) => Promise<boolean>;
  notify: (text: string, tone?: 'ok' | 'warn') => void;
};

const weekdayNames = ['domingos', 'segundas-feiras', 'terças-feiras', 'quartas-feiras', 'quintas-feiras', 'sextas-feiras', 'sábados'];

/** Reduz a imagem para caber com folga no localStorage. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 960 / img.width, 720 / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) { reject(new Error('canvas')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', .8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem')); };
    img.src = url;
  });
}

export function PlanPage({ data, update, month, setMonth, selectedDate, setSelectedDate, today, onStart, ask, notify }: Props) {
  const plan = data.months[month] ?? makeMonth(month);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeFlows = data.flows.filter(f => !f.archived);
  const progress = progressForMonth(plan, data.entries);

  const updatePlan = (fn: (p: MonthPlan) => MonthPlan) =>
    update(old => ({ ...old, months: { ...old.months, [month]: fn(old.months[month] ?? makeMonth(month)) } }));
  const patch = (p: Partial<MonthPlan>) => updatePlan(old => ({ ...old, ...p }));

  async function changeImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Escolha um arquivo de imagem (JPG, PNG, WEBP…).', 'warn'); return; }
    try { patch({ goalImage: await compressImage(file) }); notify('Imagem do objetivo atualizada ✧'); }
    catch { notify('Não foi possível ler esta imagem. Tente outra.', 'warn'); }
  }

  const switchMonth = (step: number) => {
    const key = shiftMonth(month, step);
    setMonth(key);
    setSelectedDate(today.startsWith(key) ? today : `${key}-01`);
  };

  async function copyFromPrevious() {
    const prevKey = shiftMonth(month, -1);
    const prev = data.months[prevKey];
    if (!prev || !Object.keys(prev.schedule).length) { notify('O mês anterior não tem programação para copiar.', 'warn'); return; }
    if (Object.keys(plan.schedule).length && !await ask({ title: 'Substituir a programação deste mês?', message: 'A programação atual será trocada pelo padrão semanal do mês anterior. Os registros já concluídos continuam no diário.', confirmLabel: 'Substituir' })) return;
    patch({ schedule: scheduleFromPrevious(prev, month, activeFlows.map(f => f.id)), isExample: undefined });
    notify('Padrão semanal do mês anterior aplicado ✧');
  }
  async function clearMonth() {
    if (!await ask({ title: 'Limpar toda a programação do mês?', message: 'Os dias ficarão sem fluxos. Registros concluídos continuam guardados no diário.', confirmLabel: 'Limpar mês', tone: 'danger' })) return;
    patch({ schedule: {}, isExample: undefined });
  }

  /* ---------- Calendário ---------- */
  const dates = monthDates(month);
  const blanks = firstWeekday(month);
  const selectedInMonth = selectedDate.startsWith(month) ? selectedDate : dates[0];
  const dayIds = plan.schedule[selectedInMonth] ?? [];
  const weekday = parseDateKey(selectedInMonth).getDay();

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow"><WandSparkles size={16} /> Criar intencionalmente</span>
          <h1>Planejamento do mês</h1>
          <p>Crie a vida que você ama, com clareza e intenção.</p>
        </div>
        <div className="month-switch" role="group" aria-label="Escolher mês">
          <button onClick={() => switchMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={20} /></button>
          <strong aria-live="polite">{titleMonth(month)}</strong>
          <button onClick={() => switchMonth(1)} aria-label="Próximo mês"><ChevronRight size={20} /></button>
        </div>
      </div>

      {plan.isExample && (
        <div className="notice panel">
          <WandSparkles size={18} />
          <span>Este mês está com uma <strong>programação de exemplo</strong>. Edite à vontade ou comece do zero.</span>
          <button className="secondary-button small" onClick={() => patch({ schedule: {}, isExample: undefined })}>Começar do zero</button>
          <button className="quiet-btn small" onClick={() => patch({ isExample: undefined })}>Manter e personalizar</button>
        </div>
      )}

      {/* ---------- Metas ---------- */}
      <section className="plan-goals panel light" aria-labelledby="goals-title">
        <h2 id="goals-title" className="sr-only">Metas do mês</h2>
        <div className="form-grid">
          <label>Nome do protocolo
            <input value={plan.name} maxLength={80} onChange={e => patch({ name: e.target.value })} placeholder="Ex.: Minha melhor versão" />
          </label>
          <label>Objetivo principal do mês
            <textarea rows={2} maxLength={300} value={plan.objective} onChange={e => patch({ objective: e.target.value })} placeholder="O que desejo cultivar neste mês?" />
          </label>
          <label>Meta financeira
            <input value={plan.financialTarget} maxLength={120} onChange={e => patch({ financialTarget: e.target.value })} placeholder="Ex.: guardar R$ 2.000" />
          </label>
          <label>Meta de saúde
            <input value={plan.healthTarget} maxLength={120} onChange={e => patch({ healthTarget: e.target.value })} placeholder="Ex.: caminhar 3x por semana" />
          </label>
          <label>Meta pessoal
            <input value={plan.personalTarget} maxLength={120} onChange={e => patch({ personalTarget: e.target.value })} placeholder="Ex.: ler 1 livro" />
          </label>
          <label>Legenda da foto do objetivo
            <input value={plan.goalLabel} maxLength={60} onChange={e => patch({ goalLabel: e.target.value })} placeholder="Ex.: Meu novo MacBook" />
          </label>
        </div>
        <div className="upload-goal">
          <span className="form-label">Foto do objetivo</span>
          <div className="upload-frame">
            <img src={plan.goalImage || goalPlaceholder} alt={plan.goalImage ? 'Foto do objetivo escolhida' : 'Nenhuma foto escolhida ainda'} />
            <button className="gold-button small" onClick={() => fileInput.current?.click()}><ImagePlus size={16} /> {plan.goalImage ? 'Alterar imagem' : 'Enviar imagem'}</button>
          </div>
          {plan.goalImage && <button className="link-btn" onClick={() => patch({ goalImage: '' })}><Trash2 size={13} /> Remover imagem</button>}
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={changeImage} />
        </div>
      </section>

      <div className="plan-grid">
        <MandalaPanel plan={plan} onChange={p => patch(p)} />

        {/* ---------- Calendário ---------- */}
        <section className="panel calendar-panel" aria-labelledby="cal-title">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Sua programação</span>
              <h2 id="cal-title">Programação dos fluxos</h2>
            </div>
            <CalendarDays size={22} className="decor-icon" />
          </div>
          <p className="muted">{progress.total} fluxos programados · {progress.completed} concluídos ({progress.percent}%)</p>
          <div className="calendar-grid weekdays" aria-hidden="true">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(w => <span key={w}>{w}</span>)}</div>
          <div className="calendar-grid days">
            {Array.from({ length: blanks }, (_, i) => <span className="blank" key={`b${i}`} />)}
            {dates.map(date => {
              const ids = plan.schedule[date] ?? [];
              const done = ids.filter(id => data.entries[entryId(date, id)]).length;
              const cls = ['day', date === selectedInMonth && 'selected', date === today && 'today', date < today && 'past', ids.length && done === ids.length && 'complete'].filter(Boolean).join(' ');
              return (
                <button key={date} className={cls} onClick={() => setSelectedDate(date)} aria-pressed={date === selectedInMonth}
                  aria-label={`${dayTitle(date)}: ${ids.length ? `${ids.length} fluxo${ids.length > 1 ? 's' : ''}, ${done} concluído${done !== 1 ? 's' : ''}` : 'sem fluxos'}${date === today ? ' (hoje)' : ''}`}>
                  <b>{Number(date.slice(8))}</b>
                  <span className="day-badges">
                    {ids.slice(0, 4).map(id => {
                      const f = data.flows.find(x => x.id === id);
                      if (!f) return null;
                      return <i key={id} className={data.entries[entryId(date, id)] ? 'done' : ''} style={{ ['--flow-color' as string]: f.color }}>{flowAbbr(f.name)}</i>;
                    })}
                    {ids.length > 4 && <i className="more">+{ids.length - 4}</i>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            {activeFlows.map(f => <span key={f.id}><i style={{ ['--flow-color' as string]: f.color }}>{flowAbbr(f.name)}</i>{f.name}</span>)}
          </div>

          <div className="day-editor" aria-live="polite">
            <h3>{dayTitle(selectedInMonth)}{selectedInMonth === today && <span className="today-tag">hoje</span>}</h3>
            <p>Toque nos fluxos para incluir ou retirar deste dia:</p>
            {activeFlows.length === 0 && <p className="muted">Crie um fluxo na biblioteca para começar.</p>}
            <div className="day-checklist">
              {activeFlows.map(f => {
                const on = dayIds.includes(f.id);
                const done = Boolean(data.entries[entryId(selectedInMonth, f.id)]);
                return (
                  <button key={f.id} className={`day-flow${on ? ' on' : ''}`} aria-pressed={on} onClick={() => updatePlan(p => toggleFlowOnDay(p, selectedInMonth, f.id))}>
                    <FlowIcon flow={f} size="sm" />
                    <span>{f.name}</span>
                    {done ? <Check size={16} className="done-mark" aria-label="concluído" /> : on ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                );
              })}
            </div>
            {dayIds.some(id => !data.entries[entryId(selectedInMonth, id)]) && selectedInMonth <= today && (
              <div className="do-now">
                <span>Quer fazer um fluxo deste dia agora?</span>
                {dayIds.filter(id => !data.entries[entryId(selectedInMonth, id)]).map(id => {
                  const f = data.flows.find(x => x.id === id);
                  return f ? <button key={id} className="secondary-button small" onClick={() => onStart(selectedInMonth, id)}><Play size={14} /> {f.name}</button> : null;
                })}
              </div>
            )}
            <div className="day-actions">
              <button className="secondary-button small" onClick={() => { updatePlan(p => repeatOnWeekday(p, selectedInMonth)); notify(`Aplicado a todas as ${weekdayNames[weekday]} do mês ✧`); }}>
                <Repeat size={15} /> Repetir em todas as {weekdayNames[weekday]}
              </button>
              {dayIds.length > 0 && <button className="quiet-btn small" onClick={() => patch({ schedule: Object.fromEntries(Object.entries(plan.schedule).filter(([d]) => d !== selectedInMonth)), isExample: undefined })}><Eraser size={15} /> Limpar este dia</button>}
            </div>
          </div>
          <div className="month-tools">
            <button className="quiet-btn small" onClick={copyFromPrevious}><Copy size={15} /> Copiar padrão do mês anterior</button>
            <button className="quiet-btn small" onClick={clearMonth}><Eraser size={15} /> Limpar mês</button>
          </div>
        </section>

        <LibraryPanel data={data} update={update} ask={ask} notify={notify} />
      </div>

      <PreviousProtocols data={data} current={month} onOpen={key => { setMonth(key); setSelectedDate(`${key}-01`); window.scrollTo({ top: 0 }); }}
        onReuse={async key => {
          const source = data.months[key];
          if (!source) return;
          if (Object.keys(plan.schedule).length && !await ask({ title: `Usar “${source.name}” como modelo?`, message: `A programação de ${titleMonth(month)} será substituída pelo padrão semanal desse protocolo. Registros concluídos continuam no diário.`, confirmLabel: 'Usar como modelo' })) return;
          patch({ schedule: scheduleFromPrevious(source, month, activeFlows.map(f => f.id)), isExample: undefined });
          notify('Programação reutilizada ✧');
        }} />
    </>
  );
}

/* ---------- Mandala da Vida ---------- */

function MandalaPanel({ plan, onChange }: { plan: MonthPlan; onChange: (p: Partial<MonthPlan>) => void }) {
  const [tab, setTab] = useState<'before' | 'after'>('before');
  const [compare, setCompare] = useState(false);
  const ratings = tab === 'before' ? plan.ratingsBefore : plan.ratingsAfter;
  const set = (area: Area, value: number) => {
    const key = tab === 'before' ? 'ratingsBefore' : 'ratingsAfter';
    const base: Ratings = (tab === 'before' ? plan.ratingsBefore : plan.ratingsAfter) ?? defaultRatings();
    onChange({ [key]: { ...base, [area]: Math.min(10, Math.max(0, value)) } });
  };
  const other = tab === 'before' ? plan.ratingsAfter : plan.ratingsBefore;
  return (
    <section className="panel mandala-panel" aria-labelledby="mandala-title">
      <div className="section-head compact">
        <div>
          <span className="eyebrow">Autoavaliação</span>
          <h2 id="mandala-title">Mandala da Vida</h2>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Momento da avaliação">
        <button role="tab" aria-selected={tab === 'before'} className={tab === 'before' ? 'active' : ''} onClick={() => setTab('before')}>Início do mês</button>
        <button role="tab" aria-selected={tab === 'after'} className={tab === 'after' ? 'active' : ''} onClick={() => setTab('after')}>Fim do mês</button>
      </div>
      {ratings ? (
        <>
          <p className="muted">Toque ou arraste dentro de cada área para dar uma nota de 0 a 10 (mais perto da borda = nota maior).</p>
          <Mandala ratings={ratings} compare={compare && other ? other : undefined} onChange={set}
            label={`Mandala da vida — ${tab === 'before' ? 'início' : 'fim'} do mês`} />
          {other && (
            <label className="check-line compact">
              <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} />
              <span>Comparar com {tab === 'before' ? 'o fim' : 'o início'} do mês (linha tracejada)</span>
            </label>
          )}
          <div className="rating-list">
            {areas.map(area => (
              <div key={area} className="rating-row">
                <span>{area}</span>
                <button className="icon-button small" onClick={() => set(area, ratings[area] - 1)} aria-label={`Diminuir ${area}`} disabled={ratings[area] <= 0}><Minus size={14} /></button>
                <b aria-live="polite">{ratings[area]}</b>
                <button className="icon-button small" onClick={() => set(area, ratings[area] + 1)} aria-label={`Aumentar ${area}`} disabled={ratings[area] >= 10}><Plus size={14} /></button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mandala-empty">
          <p>No fim do mês, avalie novamente as oito áreas para perceber sua evolução — sem cobrança.</p>
          <button className="gold-button" onClick={() => onChange({ ratingsAfter: { ...plan.ratingsBefore } })}>Fazer avaliação do fim do mês</button>
        </div>
      )}
    </section>
  );
}

/* ---------- Biblioteca de fluxos ---------- */

type Draft = Pick<Flow, 'name' | 'description' | 'durationMinutes' | 'icon' | 'color'>;
const newDraft = (): Draft => ({ name: '', description: '', durationMinutes: 60, icon: 'sparkles', color: flowColors[0] });

function FlowForm({ initial, onSave, onCancel, saveLabel }: { initial: Draft; onSave: (d: Draft) => void; onCancel: () => void; saveLabel: string }) {
  const [d, setD] = useState<Draft>(initial);
  const valid = d.name.trim().length > 0;
  return (
    <form className="flow-edit" onSubmit={e => { e.preventDefault(); if (valid) onSave({ ...d, name: d.name.trim(), description: d.description.trim() }); }}>
      <label>Nome<input value={d.name} maxLength={50} onChange={e => setD({ ...d, name: e.target.value })} placeholder="Ex.: Prosperidade" required /></label>
      <label>Descrição curta<input value={d.description} maxLength={90} onChange={e => setD({ ...d, description: e.target.value })} placeholder="Ex.: Atrair oportunidades" /></label>
      <label>Duração (minutos)
        <input type="number" min={1} max={240} inputMode="numeric" value={d.durationMinutes}
          onChange={e => setD({ ...d, durationMinutes: Math.min(240, Math.max(1, Math.round(Number(e.target.value) || 1))) })} />
      </label>
      <fieldset>
        <legend>Ícone</legend>
        <div className="icon-picker">
          {flowIcons.map(key => {
            const Icon = iconMap[key];
            return <button type="button" key={key} className={d.icon === key ? 'on' : ''} aria-pressed={d.icon === key} aria-label={iconLabels[key]} onClick={() => setD({ ...d, icon: key })}><Icon size={18} /></button>;
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Cor</legend>
        <div className="color-picker">
          {flowColors.map(c => <button type="button" key={c} className={d.color === c ? 'on' : ''} style={{ background: c }} aria-pressed={d.color === c} aria-label={`Cor ${c}`} onClick={() => setD({ ...d, color: c })} />)}
        </div>
      </fieldset>
      <div className="flow-edit-actions">
        <button type="button" className="quiet-btn small" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="gold-button small" disabled={!valid}><Check size={15} /> {saveLabel}</button>
      </div>
    </form>
  );
}

function LibraryPanel({ data, update, ask, notify }: Pick<Props, 'data' | 'update' | 'ask' | 'notify'>) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const flows = data.flows.filter(f => !f.archived);

  async function remove(flow: Flow) {
    if (data.session?.flowId === flow.id) { notify('Este fluxo está em andamento. Conclua ou cancele antes de excluir.', 'warn'); return; }
    const ok = await ask({
      title: `Excluir “${flow.name}”?`,
      message: 'Ele sai da biblioteca e dos dias ainda não concluídos. Os registros já feitos continuam no diário e no progresso.',
      confirmLabel: 'Excluir fluxo', tone: 'danger',
    });
    if (!ok) return;
    update(old => archiveFlow(old, flow.id));
    setEditing(null);
    notify('Fluxo excluído. Seu histórico foi preservado.');
  }
  function duplicate(flow: Flow) {
    const id = `user-${Date.now().toString(36)}`;
    update(old => ({ ...old, flows: [...old.flows, { ...flow, id, name: `${flow.name} (cópia)`, archived: undefined }] }));
    setEditing(id);
  }

  return (
    <section className="panel library-panel" aria-labelledby="lib-title">
      <div className="section-head compact">
        <div>
          <span className="eyebrow">Meus rituais</span>
          <h2 id="lib-title">Biblioteca de fluxos</h2>
        </div>
        <button className="icon-button" onClick={() => { setCreating(c => !c); setEditing(null); }} aria-label="Criar novo fluxo" aria-expanded={creating}><Plus size={18} /></button>
      </div>
      <p className="muted">Crie, edite e reutilize seus fluxos em qualquer mês.</p>
      {creating && (
        <FlowForm initial={newDraft()} saveLabel="Criar fluxo" onCancel={() => setCreating(false)} onSave={d => {
          update(old => ({ ...old, flows: [...old.flows, { ...d, id: `user-${Date.now().toString(36)}` }] }));
          setCreating(false);
          notify(`Fluxo “${d.name}” criado ✧ Agora é só marcá-lo nos dias do calendário.`);
        }} />
      )}
      {flows.length === 0 && !creating && <p className="muted">Nenhum fluxo ainda. Toque em + para criar o primeiro.</p>}
      <ul className="library-list">
        {flows.map(f => (
          <li key={f.id} className="library-item">
            <div className="library-row">
              <FlowIcon flow={f} />
              <div className="library-text">
                <strong>{f.name}</strong>
                <span>{f.description || 'Sem descrição'} · {f.durationMinutes} min</span>
              </div>
              <button className="icon-button" onClick={() => setEditing(editing === f.id ? null : f.id)} aria-label={`Editar ${f.name}`} aria-expanded={editing === f.id}><Pencil size={15} /></button>
            </div>
            {editing === f.id && (
              <>
                <FlowForm key={f.id} initial={f} saveLabel="Salvar" onCancel={() => setEditing(null)} onSave={d => {
                  update(old => ({ ...old, flows: old.flows.map(x => x.id === f.id ? { ...x, ...d } : x) }));
                  setEditing(null);
                  notify('Fluxo atualizado ✧');
                }} />
                <div className="flow-edit-extra">
                  <button className="quiet-btn small" onClick={() => duplicate(f)}><Copy size={14} /> Duplicar</button>
                  <button className="quiet-btn small danger" onClick={() => remove(f)}><Trash2 size={14} /> Excluir</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Protocolos anteriores ---------- */

function PreviousProtocols({ data, current, onOpen, onReuse }: { data: Data; current: string; onOpen: (k: string) => void; onReuse: (k: string) => void }) {
  const months = Object.values(data.months)
    .filter(m => m.monthKey !== current && (Object.keys(m.schedule).length || m.objective || m.goalImage))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  return (
    <section className="panel previous-panel" aria-labelledby="prev-title">
      <div className="section-head compact">
        <div>
          <span className="eyebrow"><History size={14} /> Sua trajetória</span>
          <h2 id="prev-title">Outros protocolos</h2>
        </div>
      </div>
      {months.length === 0
        ? <p className="muted">Quando você planejar outros meses, eles aparecerão aqui para consulta e reutilização.</p>
        : (
          <ul className="previous-list">
            {months.map(m => {
              const p = progressForMonth(m, data.entries);
              return (
                <li key={m.monthKey} className="previous-item">
                  <img src={m.goalImage || goalPlaceholder} alt="" />
                  <div>
                    <span className="eyebrow">{titleMonth(m.monthKey)}</span>
                    <strong>{m.name}</strong>
                    {m.objective && <p>{m.objective}</p>}
                    <div className="mini-progress" aria-label={`${p.percent}% concluído`}><i style={{ width: `${p.percent}%` }} /></div>
                    <small>{p.completed} de {p.total} fluxos · {p.percent}%</small>
                  </div>
                  <div className="previous-actions">
                    <button className="secondary-button small" onClick={() => onOpen(m.monthKey)}>Abrir <ArrowRight size={14} /></button>
                    {Object.keys(m.schedule).length > 0 && <button className="quiet-btn small" onClick={() => onReuse(m.monthKey)}><Repeat size={14} /> Usar como modelo</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </section>
  );
}
