import test from 'node:test';
import assert from 'node:assert/strict';
import {
  archiveFlow, bubbleMessages, completeSession, dateKey, daysInMonth, daysLeftInMonth, emptyCheckIn, emptyCheckOut,
  entryId, exampleFlows, firstWeekday, formatTime, initialData, makeMonth, migrateData, pauseSession,
  progressForMonth, remaining, repeatOnWeekday, resumeSession, scheduleFromPrevious, shiftMonth, startSession,
  toCheckout, toggleFlowOnDay, type Data, type Entry,
} from '../src/domain.ts';

const fakeEntry = (date: string, flowId: string, extra: Partial<Entry> = {}): Entry => ({
  id: entryId(date, flowId), date, flowId, flowName: 'X', before: emptyCheckIn(), after: emptyCheckOut(),
  startedAt: '2026-10-14T10:00:00.000Z', completedAt: '2026-10-14T11:00:00.000Z', elapsedSeconds: 3600, ...extra,
});
const baseData = (): Data => ({ version: 2, flows: exampleFlows(), months: { '2026-10': makeMonth('2026-10') }, entries: {}, settings: { motion: 'system', sound: true } });

/* ---------- Datas e calendário ---------- */

test('Data local preserva zeros de mês e dia', () => {
  assert.equal(dateKey(new Date(2026, 0, 7)), '2026-01-07');
});

test('Calendário alinha o primeiro dia com o dia da semana real', () => {
  assert.equal(firstWeekday('2026-10'), 4); // 1º de outubro de 2026 é quinta-feira
  assert.equal(daysInMonth('2026-02'), 28);
  assert.equal(daysInMonth('2028-02'), 29);
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});

test('Dias restantes não ficam negativos ao virar o mês', () => {
  assert.equal(daysLeftInMonth('2026-10', '2026-10-14'), 18);
  assert.equal(daysLeftInMonth('2026-10', '2026-11-02'), 0);
  assert.equal(daysLeftInMonth('2026-11', '2026-10-14'), 30);
});

/* ---------- Progresso ---------- */

test('Planejamento novo inicia sem conclusão fictícia', () => {
  const p = progressForMonth(makeMonth('2026-10'), {});
  assert.equal(p.percent, 0);
  assert.equal(p.total, 0);
});

test('Dados iniciais de exemplo têm programação mas 0 conclusões', () => {
  const d = initialData();
  const plan = Object.values(d.months)[0];
  assert.equal(Object.keys(d.entries).length, 0);
  assert.ok(progressForMonth(plan, d.entries).total > 0);
  assert.equal(progressForMonth(plan, d.entries).percent, 0);
});

test('Concluir 1 de 3 fluxos avança para 33%', () => {
  const plan = makeMonth('2026-10');
  plan.schedule['2026-10-14'] = ['f1', 'f3', 'f5'];
  const p = progressForMonth(plan, { [entryId('2026-10-14', 'f1')]: fakeEntry('2026-10-14', 'f1') });
  assert.deepEqual(p, { total: 3, completed: 1, completedDays: 0, plannedDays: 1, percent: 33 });
});

test('Concluir três fluxos no mesmo dia atinge 100% e conta 1 dia cumprido', () => {
  const plan = makeMonth('2026-10');
  plan.schedule['2026-10-14'] = ['f1', 'f3', 'f5'];
  const entries: Record<string, Entry> = {};
  for (const f of plan.schedule['2026-10-14']) entries[entryId('2026-10-14', f)] = fakeEntry('2026-10-14', f);
  const p = progressForMonth(plan, entries);
  assert.equal(p.completedDays, 1);
  assert.equal(p.percent, 100);
});

test('Mudar a programação recalcula o percentual sem apagar registros', () => {
  let plan = makeMonth('2026-10');
  plan = toggleFlowOnDay(plan, '2026-10-14', 'f1');
  plan = toggleFlowOnDay(plan, '2026-10-15', 'f2');
  const entries = { [entryId('2026-10-14', 'f1')]: fakeEntry('2026-10-14', 'f1') };
  assert.equal(progressForMonth(plan, entries).percent, 50);
  plan = toggleFlowOnDay(plan, '2026-10-14', 'f1'); // retirado da programação
  assert.equal(progressForMonth(plan, entries).percent, 0);
  assert.ok(entries[entryId('2026-10-14', 'f1')], 'registro continua no histórico');
  assert.equal(plan.schedule['2026-10-14'], undefined, 'dia vazio é removido');
});

test('Repetir em todas as quartas-feiras copia os fluxos do dia', () => {
  let plan = makeMonth('2026-10');
  plan = toggleFlowOnDay(plan, '2026-10-14', 'f1');
  plan = toggleFlowOnDay(plan, '2026-10-14', 'f3');
  plan = repeatOnWeekday(plan, '2026-10-14');
  for (const d of ['2026-10-07', '2026-10-21', '2026-10-28']) assert.deepEqual(plan.schedule[d], ['f1', 'f3']);
  assert.equal(plan.schedule['2026-10-15'], undefined);
});

test('Copiar padrão do mês anterior usa os dias da semana', () => {
  const prev = makeMonth('2026-09');
  prev.schedule['2026-09-30'] = ['f1', 'f9']; // quarta-feira; f9 não existe mais
  const schedule = scheduleFromPrevious(prev, '2026-10', ['f1', 'f2']);
  assert.deepEqual(schedule['2026-10-07'], ['f1']);
  assert.equal(schedule['2026-10-08'], undefined);
});

test('Excluir fluxo preserva conclusões e retira dias pendentes', () => {
  const d = baseData();
  d.months['2026-10'].schedule = { '2026-10-13': ['f1', 'f2'], '2026-10-20': ['f1'] };
  d.entries[entryId('2026-10-13', 'f1')] = fakeEntry('2026-10-13', 'f1');
  const next = archiveFlow(d, 'f1');
  assert.deepEqual(next.months['2026-10'].schedule['2026-10-13'], ['f1', 'f2']);
  assert.equal(next.months['2026-10'].schedule['2026-10-20'], undefined);
  assert.equal(next.flows.find(f => f.id === 'f1')?.archived, true);
  assert.ok(next.entries[entryId('2026-10-13', 'f1')]);
});

/* ---------- Cronômetro ---------- */

test('Timer conta tempo real e respeita pausa', () => {
  const flow = { ...exampleFlows()[0], durationMinutes: 60 };
  let s = startSession('2026-10-14', flow, emptyCheckIn(), 1000);
  assert.equal(remaining(s, 31000), 3570);
  s = pauseSession(s, 31000);
  assert.equal(remaining(s, 999999), 3570, 'pausado não desconta tempo');
  s = resumeSession(s, 100000);
  assert.equal(remaining(s, 110000), 3560);
  assert.equal(remaining(s, 100000 + 10_000_000), 0, 'nunca negativo');
});

test('Pausar duas vezes ou retomar duas vezes não altera o tempo', () => {
  const s = startSession('2026-10-14', exampleFlows()[0], emptyCheckIn(), 0);
  const p1 = pauseSession(s, 10000);
  assert.deepEqual(pauseSession(p1, 50000), p1);
  const r1 = resumeSession(p1, 60000);
  assert.deepEqual(resumeSession(r1, 90000), r1);
});

test('Fim do cronômetro leva ao check-out sem concluir o fluxo', () => {
  const d = baseData();
  d.months['2026-10'].schedule['2026-10-14'] = ['f1'];
  d.session = startSession('2026-10-14', { ...exampleFlows()[0], durationMinutes: 1 }, emptyCheckIn(), 0);
  d.session = toCheckout(d.session, 120000);
  assert.equal(d.session.phase, 'checkout');
  assert.equal(remaining(d.session, 999999), 0);
  assert.equal(progressForMonth(d.months['2026-10'], d.entries).completed, 0, 'ainda não concluído');
  const done = completeSession(d, { ...emptyCheckOut(), changed: 'Mais leve' }, 130000);
  assert.equal(done.session, undefined);
  assert.equal(progressForMonth(done.months['2026-10'], done.entries).percent, 100);
  assert.equal(done.entries[entryId('2026-10-14', 'f1')].elapsedSeconds, 60);
});

test('Formato do relógio', () => {
  assert.equal(formatTime(3600), '60:00');
  assert.equal(formatTime(5400), '01:30:00');
  assert.equal(formatTime(47 * 60 + 12), '47:12');
  assert.equal(formatTime(-5), '00:00');
});

/* ---------- Balões ---------- */

test('Balões usam somente textos reais, respeitando privacidade e limite', () => {
  const entries: Record<string, Entry> = {
    a: fakeEntry('2026-10-12', 'f1', { completedAt: '2026-10-12T10:00:00Z', after: { ...emptyCheckOut(), changed: 'Hoje me senti mais confiante!' } }),
    b: fakeEntry('2026-10-13', 'f2', { completedAt: '2026-10-13T10:00:00Z', after: { ...emptyCheckOut(), emotions: ['mais leve', 'grata'] } }),
    c: fakeEntry('2026-10-14', 'f3', { completedAt: '2026-10-14T10:00:00Z', after: { ...emptyCheckOut(), changed: 'Segredo', showInBubble: false } }),
    d: fakeEntry('2026-10-14', 'f4', { completedAt: '2026-10-14T11:00:00Z', after: emptyCheckOut() }),
  };
  const b = bubbleMessages(entries, 3, 70);
  assert.deepEqual(b.map(x => x.text), ['Depois do fluxo me senti mais leve e grata', 'Hoje me senti mais confiante!']);
  assert.equal(bubbleMessages({}, 3).length, 0);
  const long = bubbleMessages({ x: fakeEntry('2026-10-14', 'f1', { after: { ...emptyCheckOut(), changed: 'a'.repeat(200) } }) }, 1, 40);
  assert.equal(long[0].text.length, 40);
});

/* ---------- Persistência / backup ---------- */

test('Migração da versão 1 preserva registros, sessão e programação', () => {
  const v1 = {
    version: 1,
    flows: [{ id: 'f1', name: 'Prosperidade', description: '', durationMinutes: 60, symbol: '✦' }],
    months: { '2026-10': { monthKey: '2026-10', name: 'Minha melhor versão · Exemplo', objective: 'x', financialTarget: '', healthTarget: '', goalImage: '', ratingsBefore: { Financeiro: 7 }, schedule: { '2026-10-14': ['f1', 'f1'] } } },
    entries: { '2026-10-13__f1': { id: '2026-10-13__f1', date: '2026-10-13', flowId: 'f1', before: { emotions: ['calma'], burden: '', intention: '', energy: 4 }, after: { emotions: [], changed: 'leve', notes: '' }, completedAt: '2026-10-13T12:00:00Z', elapsedSeconds: 3600 } },
    session: { id: '2026-10-14__f1', date: '2026-10-14', flowId: 'f1', before: { emotions: [], burden: '', intention: '', energy: 3 }, remainingSeconds: 1200, lastStartedAt: null, durationSeconds: 3600 },
  };
  const d = migrateData(v1);
  assert.ok(d);
  assert.equal(d.version, 2);
  assert.equal(d.flows[0].icon, 'sprout');
  assert.equal(d.entries['2026-10-13__f1'].flowName, 'Prosperidade');
  assert.equal(d.entries['2026-10-13__f1'].after.showInBubble, true);
  assert.deepEqual(d.months['2026-10'].schedule['2026-10-14'], ['f1'], 'duplicatas acidentais removidas');
  assert.equal(d.months['2026-10'].ratingsBefore.Financeiro, 7);
  assert.equal(d.months['2026-10'].ratingsBefore.Saúde, 5);
  assert.equal(d.months['2026-10'].isExample, true);
  assert.equal(d.months['2026-10'].name, 'Minha melhor versão');
  assert.equal(d.session?.phase, 'running');
  assert.equal(d.session?.remainingSeconds, 1200);
});

test('Backup exportado e importado volta idêntico', () => {
  const d = baseData();
  d.months['2026-10'].schedule['2026-10-14'] = ['f1'];
  d.months['2026-10'].ratingsAfter = { ...d.months['2026-10'].ratingsBefore, Saúde: 9 };
  d.entries[entryId('2026-10-14', 'f1')] = fakeEntry('2026-10-14', 'f1');
  d.settings.motion = 'reduced';
  assert.deepEqual(migrateData(JSON.parse(JSON.stringify(d))), d);
});

test('Arquivos que não são backup são recusados', () => {
  assert.equal(migrateData(null), null);
  assert.equal(migrateData({ foo: 1 }), null);
  assert.equal(migrateData({ version: 9, flows: [], months: {}, entries: {} }), null);
  assert.equal(migrateData([1, 2]), null);
});

test('Sessão já concluída não é restaurada como em andamento', () => {
  const d = baseData();
  d.entries[entryId('2026-10-14', 'f1')] = fakeEntry('2026-10-14', 'f1');
  d.session = startSession('2026-10-14', exampleFlows()[0], emptyCheckIn(), 0);
  assert.equal(migrateData(JSON.parse(JSON.stringify(d)))?.session, undefined);
});
