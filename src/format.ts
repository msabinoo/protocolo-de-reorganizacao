import { parseDateKey } from './domain';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Quarta-feira, 14 de outubro de 2026" */
export function longDate(date: string) {
  return cap(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(date)));
}
/** "Quarta-feira, 14 de outubro" */
export function dayTitle(date: string) {
  return cap(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDateKey(date)));
}
/** "14/10/2026" */
export function shortDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(parseDateKey(date));
}
/** "Outubro de 2026" */
export function titleMonth(key: string) {
  return cap(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(parseDateKey(`${key}-01`)));
}
export function clockTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
}
