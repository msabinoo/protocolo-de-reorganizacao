import { useEffect, useState } from 'react';
import { Bonequinha } from './Bonequinha';
import { goalPlaceholder } from '../assets';

type Props = {
  percent: number;
  /** Percentual anterior, quando acabou de concluir um fluxo: a bonequinha caminha dele até `percent`. */
  fromPercent?: number;
  bubbles: { id: string; text: string }[];
  goalImage: string;
  goalTitle: string;
  goalLabel: string;
  reducedMotion: boolean;
};

const milestones = [0, 25, 50, 75, 100];

export function JourneyBar({ percent, fromPercent, bubbles, goalImage, goalTitle, goalLabel, reducedMotion }: Props) {
  const [shown, setShown] = useState(fromPercent ?? percent);
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    if (fromPercent === undefined || reducedMotion) { setShown(percent); return; }
    setShown(fromPercent);
    const start = window.setTimeout(() => { setWalking(true); setShown(percent); }, 450);
    const stop = window.setTimeout(() => setWalking(false), 450 + 2200);
    return () => { clearTimeout(start); clearTimeout(stop); };
  }, [percent, fromPercent, reducedMotion]);

  const pos = Math.min(100, Math.max(0, shown));
  const bubbleSide = pos > 55 ? 'left' : 'right';

  return (
    <div className="journey">
      <div className="journey-road">
        <div
          className="journey-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`Progresso do mês: ${percent}% dos fluxos programados concluídos`}
        >
          <div className="track-fill" style={{ width: `${pos}%` }} />
          {milestones.map(m => (
            <span key={m} className={`milestone${pos >= m && (m > 0 || pos > 0) ? ' reached' : ''}`} style={{ left: `${m}%` }} aria-hidden="true">
              <i />
            </span>
          ))}
          <div className={`walker${walking ? ' is-walking' : ''}`} style={{ left: `${pos}%` }}>
            <div className={`bubbles bubbles-${bubbleSide}`} aria-label="Frases dos seus registros após os fluxos">
              {bubbles.length > 0
                ? bubbles.slice(0, 2).map((b, i) => <p key={b.id} className="speech-bubble" style={{ animationDelay: `${i * .25}s` }}>{b.text}</p>)
                : <p className="speech-bubble muted-bubble">Suas frases do pós-fluxo aparecem aqui ✧</p>}
            </div>
            <Bonequinha walking={walking} title="Bonequinha caminhando rumo ao objetivo" />
          </div>
        </div>
      </div>
      <figure className={`goal-visual${percent >= 100 ? ' arrived' : ''}`}>
        {goalImage
          ? <img src={goalImage} alt={`Imagem do objetivo: ${goalTitle}`} />
          : <img src={goalPlaceholder} alt="Espaço para a imagem do seu objetivo" />}
        <figcaption>
          <span>{goalLabel}</span>
          <strong>{goalTitle}</strong>
        </figcaption>
      </figure>
    </div>
  );
}
