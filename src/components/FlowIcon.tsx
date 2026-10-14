import { Coins, Feather, Flower2, Gem, Heart, KeyRound, Leaf, Moon, Sparkles, Sprout, Star, Sun, type LucideIcon } from 'lucide-react';
import type { Flow, FlowIcon as IconKey } from '../domain';

export const iconMap: Record<IconKey, LucideIcon> = {
  sprout: Sprout, leaf: Leaf, lotus: Flower2, gem: Gem, key: KeyRound, moon: Moon,
  sun: Sun, heart: Heart, star: Star, feather: Feather, coins: Coins, sparkles: Sparkles,
};
export const iconLabels: Record<IconKey, string> = {
  sprout: 'Broto', leaf: 'Folha', lotus: 'Lótus', gem: 'Cristal', key: 'Chave', moon: 'Lua',
  sun: 'Sol', heart: 'Coração', star: 'Estrela', feather: 'Pena', coins: 'Moedas', sparkles: 'Brilho',
};

export function FlowIcon({ flow, size = 'md' }: { flow: Pick<Flow, 'icon' | 'color'>; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = iconMap[flow.icon] ?? Sparkles;
  const px = size === 'lg' ? 30 : size === 'sm' ? 16 : 23;
  return (
    <span className={`flow-icon flow-icon-${size}`} style={{ ['--flow-color' as string]: flow.color }} aria-hidden="true">
      <Icon size={px} strokeWidth={1.6} />
    </span>
  );
}

/** Abreviação curta para o calendário (ex.: "Pr" para Prosperidade). */
export function flowAbbr(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? '?').slice(0, 2).replace(/^./, c => c.toUpperCase());
}
