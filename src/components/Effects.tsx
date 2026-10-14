import { useEffect, useRef } from 'react';

/**
 * Partículas douradas em canvas. Leves: poucas partículas, ~30 fps, param quando a aba está oculta.
 * Desativadas por completo com movimento reduzido.
 */
export function GoldParticles({ enabled, density = 1 }: { enabled: boolean; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!enabled || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type P = { x: number; y: number; r: number; vy: number; vx: number; phase: number; speed: number };
    let parts: P[] = [];
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(46, (w * h) / 32000) * density);
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + .4,
        vy: -(Math.random() * .12 + .03), vx: (Math.random() - .5) * .06,
        phase: Math.random() * Math.PI * 2, speed: Math.random() * .02 + .008,
      }));
    };
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 33) return;
      const dt = Math.min(3, (t - last) / 16.7);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy * dt; p.x += p.vx * dt; p.phase += p.speed * dt;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        const a = .25 + Math.sin(p.phase) * .25 + .2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(243,227,161,${a.toFixed(3)})`;
        ctx.shadowColor = 'rgba(212,175,55,.8)';
        ctx.shadowBlur = p.r * 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = 0; raf = requestAnimationFrame(draw); }
    };
    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      ctx.clearRect(0, 0, w, h);
    };
  }, [enabled, density]);
  if (!enabled) return null;
  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}

/** Pequena explosão de brilhos no ponto do clique em botões. Some sozinha em ~0,6 s. */
export function ClickSparkles({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const layer = document.createElement('div');
    layer.className = 'sparkle-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('button:not(:disabled), a, label.chip')) return;
      for (let i = 0; i < 7; i++) {
        const s = document.createElement('span');
        const angle = (Math.PI * 2 * i) / 7 + Math.random() * .5;
        const dist = 18 + Math.random() * 22;
        s.style.left = `${e.clientX}px`;
        s.style.top = `${e.clientY}px`;
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        layer.appendChild(s);
        window.setTimeout(() => s.remove(), 650);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('pointerdown', onDown); layer.remove(); };
  }, [enabled]);
  return null;
}

/** Sino suave sintetizado localmente (sem arquivos externos) para avisar o fim do tempo. */
export function playChime() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [659.25, 987.77, 1318.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * .28;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.12, start + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, start + 2.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 2.3);
    });
    window.setTimeout(() => void ctx.close(), 3500);
  } catch { /* som é opcional */ }
}
