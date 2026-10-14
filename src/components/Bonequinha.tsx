import { useId } from 'react';

type Props = { walking?: boolean; className?: string; title?: string };

/** Personagem original em SVG. As pernas e braços balançam via CSS quando `walking` está ativo. */
export function Bonequinha({ walking = false, className = '', title }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `bq-${name}-${uid}`;
  return (
    <svg viewBox="0 0 120 170" className={`bonequinha${walking ? ' walking' : ''} ${className}`} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={id('dress')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#C8B4E6" />
          <stop offset=".45" stopColor="#8E5CCB" />
          <stop offset="1" stopColor="#4B1E6D" />
        </linearGradient>
        <linearGradient id={id('hair')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A4630" />
          <stop offset="1" stopColor="#3B1E1A" />
        </linearGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#F3E3A1" stopOpacity=".55" />
          <stop offset="1" stopColor="#F3E3A1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="163" rx="24" ry="4" fill="#0C0514" opacity=".45" />
      <path className="bq-hair-back" d="M41 38 C33 66 35 96 47 112 L77 112 C88 94 86 62 79 38 Z" fill={`url(#${id('hair')})`} />
      <g className="bq-leg bq-leg-back">
        <path d="M56 116 L54 150" stroke="#D9A88A" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="55" cy="154" rx="7" ry="3.4" fill="#B98F2A" />
      </g>
      <g className="bq-arm bq-arm-back">
        <path d="M51 74 L43 99" stroke="#D9A88A" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g className="bq-leg bq-leg-front">
        <path d="M65 116 L67 150" stroke="#EDC3A3" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="68" cy="154" rx="7" ry="3.4" fill="#D4AF37" />
      </g>
      <g className="bq-body">
        <path d="M50 69 Q60 64 70 69 L74 86 Q88 112 94 126 Q60 138 26 126 Q33 110 46 86 Z" fill={`url(#${id('dress')})`} stroke="#F3E3A1" strokeOpacity=".55" strokeWidth="1.2" />
        <path d="M30 124 Q60 134 90 124" fill="none" stroke="#F3E3A1" strokeWidth="2" strokeLinecap="round" />
        <path d="M47 86 Q60 91 73 86" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="89" r="2.4" fill="#F3E3A1" />
        <circle cx="44" cy="112" r="1.2" fill="#F3E3A1" opacity=".8" />
        <circle cx="74" cy="104" r="1.2" fill="#F3E3A1" opacity=".8" />
        <circle cx="62" cy="118" r="1" fill="#F3E3A1" opacity=".8" />
        <rect x="56" y="54" width="8" height="13" rx="4" fill="#E2B595" />
        <circle cx="60" cy="41" r="17" fill="#EDC3A3" />
        <path d="M42 46 C38 21 58 15 71 22 C80 27 82 39 79 52 C76 43 71 35 63 32 C57 38 49 41 42 46 Z" fill={`url(#${id('hair')})`} />
        <path d="M77 38 C85 58 83 82 75 96 C73 80 75 62 72 46 Z" fill={`url(#${id('hair')})`} />
        <path d="M52 44 q3 2.4 6 0 M63 44 q3 2.4 6 0" fill="none" stroke="#4A2620" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="51" cy="49" r="2.6" fill="#E59AA6" opacity=".55" />
        <circle cx="71" cy="49" r="2.6" fill="#E59AA6" opacity=".55" />
        <path d="M56 51.5 q4 3.2 8 0" fill="none" stroke="#9B4552" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M66 21 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 z" fill="#F3E3A1" />
      </g>
      <g className="bq-arm bq-arm-front">
        <path d="M70 73 L79 97" stroke="#EDC3A3" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="99" r="3.6" fill="#EDC3A3" />
      </g>
      <circle className="bq-sparkle" cx="98" cy="30" r="12" fill={`url(#${id('glow')})`} />
      <path className="bq-sparkle" d="M98 22 l1.6 6.4 6.4 1.6 -6.4 1.6 -1.6 6.4 -1.6 -6.4 -6.4 -1.6 6.4 -1.6 z" fill="#F3E3A1" />
    </svg>
  );
}
