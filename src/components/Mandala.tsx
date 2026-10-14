import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { areas, type Area, type Ratings } from '../domain';

type Props = {
  ratings: Ratings;
  compare?: Ratings;
  onChange?: (area: Area, value: number) => void;
  size?: 'full' | 'mini';
  label?: string;
};

const W = 440, H = 390, CX = 220, CY = 195, R = 120;
const SECTOR = 360 / areas.length;
const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (deg: number, r: number) => [CX + Math.cos(rad(deg)) * r, CY + Math.sin(rad(deg)) * r] as const;
const startAngle = (i: number) => -90 - SECTOR + i * SECTOR;

function wedge(i: number, r: number) {
  if (r <= 0) return '';
  const a0 = startAngle(i), a1 = a0 + SECTOR;
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${CX},${CY} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

/**
 * Mandala da Vida: círculo com 8 áreas e anéis de 0 a 10.
 * Clique/toque (ou arraste) dentro de uma fatia para definir a nota; cada fatia também é um
 * controle deslizante acessível por teclado (setas, Home, End).
 */
export function Mandala({ ratings, compare, onChange, size = 'full', label = 'Mandala da vida' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const editable = Boolean(onChange);

  function valueFromPointer(e: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || !onChange) return;
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W - CX;
    const y = ((e.clientY - box.top) / box.height) * H - CY;
    const dist = Math.hypot(x, y);
    if (dist > R * 1.08) return;
    let angle = (Math.atan2(y, x) * 180) / Math.PI - startAngle(0);
    angle = ((angle % 360) + 360) % 360;
    const index = Math.floor(angle / SECTOR) % areas.length;
    const value = dist < R * .05 ? 0 : Math.min(10, Math.max(1, Math.ceil((dist / R) * 10)));
    if (ratings[areas[index]] !== value) onChange(areas[index], value);
  }
  function onKey(e: KeyboardEvent<SVGPathElement>, area: Area) {
    if (!onChange) return;
    const v = ratings[area];
    const map: Record<string, number> = { ArrowUp: v + 1, ArrowRight: v + 1, ArrowDown: v - 1, ArrowLeft: v - 1, Home: 0, End: 10, PageUp: v + 2, PageDown: v - 2 };
    if (!(e.key in map)) return;
    e.preventDefault();
    onChange(area, Math.min(10, Math.max(0, map[e.key])));
  }

  const polygon = (r: Ratings) => areas.map((a, i) => pt(startAngle(i) + SECTOR / 2, (r[a] / 10) * R).map(n => n.toFixed(1)).join(',')).join(' ');

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`mandala mandala-${size}${editable ? ' editable' : ''}`}
      role="group"
      aria-label={label}
      onPointerDown={e => { if (!editable) return; dragging.current = true; svgRef.current?.setPointerCapture?.(e.pointerId); valueFromPointer(e); }}
      onPointerMove={e => { if (dragging.current) valueFromPointer(e); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      <defs>
        <radialGradient id={`gold-${uid}`} cx={CX} cy={CY} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F3E3A1" stopOpacity=".95" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity=".9" />
        </radialGradient>
        <radialGradient id={`purple-${uid}`} cx={CX} cy={CY} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C8B4E6" stopOpacity=".95" />
          <stop offset="1" stopColor="#6F3FAE" stopOpacity=".95" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={R + 6} fill="rgba(20,11,31,.55)" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="1.5" />
      {areas.map((_, i) => <path key={`bg-${i}`} d={wedge(i, R)} fill={i % 2 ? 'rgba(111,63,174,.16)' : 'rgba(212,175,55,.08)'} />)}
      {areas.map((a, i) => (
        <path
          key={a}
          d={wedge(i, (ratings[a] / 10) * R) || wedge(i, .01)}
          className="mandala-sector"
          fill={`url(#${i % 2 ? 'purple' : 'gold'}-${uid})`}
          tabIndex={editable ? 0 : -1}
          role={editable ? 'slider' : 'img'}
          aria-label={`${a}: ${ratings[a]} de 10`}
          aria-valuemin={editable ? 0 : undefined}
          aria-valuemax={editable ? 10 : undefined}
          aria-valuenow={editable ? ratings[a] : undefined}
          onKeyDown={e => onKey(e, a)}
        />
      ))}
      {Array.from({ length: 10 }, (_, k) => (
        <circle key={k} cx={CX} cy={CY} r={(R * (k + 1)) / 10} fill="none" stroke="#F7F1FF" strokeOpacity={k === 4 || k === 9 ? .32 : .12} pointerEvents="none" />
      ))}
      {areas.map((_, i) => {
        const [x, y] = pt(startAngle(i), R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#F3E3A1" strokeOpacity=".4" pointerEvents="none" />;
      })}
      {compare && <polygon points={polygon(compare)} fill="none" stroke="#F7F1FF" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />}
      <circle cx={CX} cy={CY} r="4" fill="#D4AF37" pointerEvents="none" />
      {size === 'full' && areas.map((a, i) => {
        const mid = startAngle(i) + SECTOR / 2;
        const [x, y] = pt(mid, R + 24);
        const c = Math.cos(rad(mid));
        const anchor = c > .3 ? 'start' : c < -.3 ? 'end' : 'middle';
        return (
          <g key={`l-${a}`} pointerEvents="none">
            <text x={x} y={y - 4} textAnchor={anchor} className="mandala-label">{a}</text>
            <text x={x} y={y + 18} textAnchor={anchor} className="mandala-value">
              {ratings[a]}{compare ? <tspan className="mandala-compare"> → {compare[a]}</tspan> : null}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
