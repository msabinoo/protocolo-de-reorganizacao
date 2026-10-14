import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { BookOpen, Check, CloudDownload, CloudUpload, Search, ShieldCheck, Trash2, Zap } from 'lucide-react';
import { areas, formatDuration, type Data, type Entry } from '../domain';
import { FlowIcon } from '../components/FlowIcon';
import { Mandala } from '../components/Mandala';
import { EmptyState } from '../components/ui';
import { clockTime, dayTitle, titleMonth } from '../format';

type Props = {
  data: Data;
  storageKb: number;
  onExport: () => void;
  onImport: (e: ChangeEvent<HTMLInputElement>) => void;
  onDeleteEntry: (entry: Entry) => void;
  onGoToday: () => void;
};

function topCounts(list: string[][], limit = 4) {
  const counts = new Map<string, number>();
  list.flat().forEach(e => counts.set(e, (counts.get(e) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function DiaryPage({ data, storageKb, onExport, onImport, onDeleteEntry, onGoToday }: Props) {
  const importInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'entries' | 'mandala'>('entries');
  const [monthFilter, setMonthFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all');
  const [query, setQuery] = useState('');

  const all = useMemo(() => Object.values(data.entries).sort((a, b) => b.date.localeCompare(a.date) || b.completedAt.localeCompare(a.completedAt)), [data.entries]);
  const monthsWithEntries = [...new Set(all.map(e => e.date.slice(0, 7)))];
  const flowsWithEntries = [...new Map(all.map(e => [e.flowId, e.flowName] as const)).entries()];
  const q = query.trim().toLowerCase();
  const filtered = all.filter(e =>
    (monthFilter === 'all' || e.date.startsWith(monthFilter)) &&
    (flowFilter === 'all' || e.flowId === flowFilter) &&
    (!q || [e.flowName, e.before.burden, e.before.intention, e.after.changed, e.after.notes, ...e.before.emotions, ...e.after.emotions].join(' ').toLowerCase().includes(q)));

  const beforeTop = topCounts(filtered.map(e => e.before.emotions));
  const afterTop = topCounts(filtered.map(e => e.after.emotions));
  const avgEnergy = filtered.length ? (filtered.reduce((s, e) => s + e.before.energy, 0) / filtered.length).toFixed(1) : '–';
  const totalTime = filtered.reduce((s, e) => s + e.elapsedSeconds, 0);
  const mandalaMonths = Object.values(data.months).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow"><BookOpen size={16} /> Memórias da sua jornada</span>
          <h1>Meu diário de evolução</h1>
          <p>Seus atendimentos, emoções antes e depois e a evolução da sua mandala.</p>
        </div>
      </div>

      <section className="backup-bar panel">
        <ShieldCheck size={26} className="decor-icon" />
        <div>
          <h3>Seus dados ficam só neste navegador</h3>
          <p>Nada é enviado para servidores. Exporte um backup de vez em quando e guarde em local seguro — ele contém seus registros emocionais. ({storageKb} KB usados)</p>
        </div>
        <div className="backup-actions">
          <button className="secondary-button" onClick={onExport}><CloudDownload size={17} /> Exportar backup</button>
          <button className="secondary-button" onClick={() => importInput.current?.click()}><CloudUpload size={17} /> Importar backup</button>
          <input type="file" hidden accept="application/json,.json" ref={importInput} onChange={onImport} />
        </div>
      </section>

      <div className="tabs wide" role="tablist" aria-label="Seções do diário">
        <button role="tab" aria-selected={tab === 'entries'} className={tab === 'entries' ? 'active' : ''} onClick={() => setTab('entries')}>Atendimentos</button>
        <button role="tab" aria-selected={tab === 'mandala'} className={tab === 'mandala' ? 'active' : ''} onClick={() => setTab('mandala')}>Evolução da mandala</button>
      </div>

      {tab === 'entries' && (all.length === 0 ? (
        <EmptyState icon={<BookOpen size={30} />} title="Sua jornada ainda não tem registros." action={<button className="gold-button" onClick={onGoToday}>Ver meus fluxos de hoje</button>}>
          Quando você concluir seu primeiro fluxo, o antes e o depois aparecerão aqui.
        </EmptyState>
      ) : (
        <>
          <div className="filters panel">
            <label>Mês
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                <option value="all">Todos</option>
                {monthsWithEntries.map(m => <option key={m} value={m}>{titleMonth(m)}</option>)}
              </select>
            </label>
            <label>Fluxo
              <select value={flowFilter} onChange={e => setFlowFilter(e.target.value)}>
                <option value="all">Todos</option>
                {flowsWithEntries.map(([id, name]) => <option key={id} value={id}>{data.flows.find(f => f.id === id)?.name ?? name}</option>)}
              </select>
            </label>
            <label className="search">Buscar
              <span><Search size={15} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Palavra, emoção…" /></span>
            </label>
          </div>

          <div className="diary-summary">
            <div className="panel"><strong>{filtered.length}</strong><span>atendimentos</span></div>
            <div className="panel"><strong>{formatDuration(totalTime)}</strong><span>de presença</span></div>
            <div className="panel"><strong>{avgEnergy}</strong><span>energia média antes</span></div>
            <div className="panel emotions-summary">
              <span>Antes: {beforeTop.length ? beforeTop.map(([e, n]) => `${e} (${n})`).join(', ') : '—'}</span>
              <span>Depois: {afterTop.length ? afterTop.map(([e, n]) => `${e} (${n})`).join(', ') : '—'}</span>
            </div>
          </div>

          {filtered.length === 0 && <p className="muted center">Nenhum registro com esses filtros.</p>}
          <div className="diary-list">
            {filtered.map(e => {
              const flow = data.flows.find(f => f.id === e.flowId);
              return (
                <article key={e.id} className="diary-card panel">
                  <header className="diary-meta">
                    {flow && <FlowIcon flow={flow} size="sm" />}
                    <div>
                      <span className="eyebrow">{dayTitle(e.date)}</span>
                      <h3>{flow?.name ?? e.flowName}</h3>
                    </div>
                    <span className="done-pill"><Check size={14} /> Concluído</span>
                  </header>
                  <p className="diary-time">Concluído às {clockTime(e.completedAt)} · {formatDuration(e.elapsedSeconds)} de fluxo</p>
                  <div className="before-after">
                    <div>
                      <h4>Antes</h4>
                      {e.before.emotions.length > 0 && <div className="tags">{e.before.emotions.map(m => <span key={m}>{m}</span>)}</div>}
                      <p className="energy-line"><Zap size={13} /> Energia {e.before.energy}/5</p>
                      {e.before.burden && <p><strong>Pesando:</strong> {e.before.burden}</p>}
                      {e.before.intention && <p><strong>Intenção:</strong> {e.before.intention}</p>}
                    </div>
                    <div>
                      <h4>Depois</h4>
                      {e.after.emotions.length > 0 && <div className="tags after">{e.after.emotions.map(m => <span key={m}>{m}</span>)}</div>}
                      {e.after.changed && <p><strong>O que mudou:</strong> {e.after.changed}</p>}
                      {e.after.notes && <p><strong>Registro:</strong> {e.after.notes}</p>}
                      {!e.after.emotions.length && !e.after.changed && !e.after.notes && <p className="muted">Sem anotações — e tudo bem.</p>}
                    </div>
                  </div>
                  <button className="link-btn danger" onClick={() => onDeleteEntry(e)}><Trash2 size={13} /> Excluir registro</button>
                </article>
              );
            })}
          </div>
        </>
      ))}

      {tab === 'mandala' && (
        <div className="mandala-history">
          {mandalaMonths.map(m => (
            <article key={m.monthKey} className="panel mandala-card">
              <span className="eyebrow">{titleMonth(m.monthKey)}</span>
              <h3>{m.name}</h3>
              <Mandala ratings={m.ratingsBefore} compare={m.ratingsAfter} label={`Mandala de ${titleMonth(m.monthKey)}`} />
              <p className="muted">{m.ratingsAfter ? 'Preenchimento = início do mês · linha tracejada = fim do mês' : 'Avaliação do fim do mês ainda não feita.'}</p>
              {m.ratingsAfter && (
                <ul className="delta-list">
                  {areas.map(a => {
                    const d = m.ratingsAfter![a] - m.ratingsBefore[a];
                    return <li key={a}><span>{a}</span><b className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>{m.ratingsBefore[a]} → {m.ratingsAfter![a]}</b></li>;
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
