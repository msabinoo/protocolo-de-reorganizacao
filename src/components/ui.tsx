import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';

/* ---------- Diálogo de confirmação acessível ---------- */

export type ConfirmOptions = { title: string; message?: ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: 'gold' | 'danger' };
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => setPending({ ...options, resolve })), []);
  const close = (ok: boolean) => { pending?.resolve(ok); setPending(null); };
  const dialog = pending ? (
    <Modal title={pending.title} onClose={() => close(false)}>
      {pending.message && <div className="modal-message">{pending.message}</div>}
      <div className="modal-actions">
        <button className="secondary-button" onClick={() => close(false)}>{pending.cancelLabel ?? 'Voltar'}</button>
        <button className={pending.tone === 'danger' ? 'danger-button' : 'gold-button'} onClick={() => close(true)} data-autofocus>
          {pending.confirmLabel ?? 'Confirmar'}
        </button>
      </div>
    </Modal>
  ) : null;
  return { ask, dialog };
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    (node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll<HTMLElement>('button, input, textarea, select, [tabindex="0"]')];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ---------- Avisos rápidos (toast) ---------- */

export type Toast = { id: number; text: string; tone?: 'ok' | 'warn' };
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);
  const view = (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => <div key={t.id} className={`toast ${t.tone ?? 'ok'}`}>{t.text}</div>)}
    </div>
  );
  return { notify, view };
}

/* ---------- Seleção rápida de emoções ---------- */

export function ChipGroup({ options, selected, onToggle, label }: { options: string[]; selected: string[]; onToggle: (value: string) => void; label: string }) {
  return (
    <div className="chip-group" role="group" aria-label={label}>
      {options.map(option => {
        const on = selected.includes(option);
        return (
          <button key={option} type="button" className={`chip${on ? ' selected' : ''}`} aria-pressed={on} onClick={() => onToggle(option)}>
            {on && <Check size={14} />} {option}
          </button>
        );
      })}
    </div>
  );
}

export function EnergyPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['Muito baixa', 'Baixa', 'Média', 'Boa', 'Muito alta'];
  return (
    <div className="energy">
      <div className="energy-options" role="radiogroup" aria-label="Nível de energia">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} – ${labels[n - 1]}`} className={`energy-dot${value === n ? ' selected' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="energy-captions"><span>Muito baixa</span><span>{labels[value - 1]}</span><span>Muito alta</span></div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state panel">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
