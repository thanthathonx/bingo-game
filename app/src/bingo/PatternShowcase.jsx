import { useEffect, useState } from 'react';
import { useLang } from '../shared/i18n.js';
import { showcaseCells } from './engine.js';

/** How long each example line stays lit when the round is "any line". */
export const LINE_STEP_MS = 1200;

/**
 * A big picture of this round's winning pattern for the caller panel, so a room watching the
 * host's screen or a TV can see what to aim for.
 */
export default function PatternShowcase({ size, pattern }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (pattern !== 'line') return undefined;
    const id = window.setInterval(() => setStep((s) => s + 1), LINE_STEP_MS);
    return () => window.clearInterval(id);
  }, [pattern]);

  const on = new Set(showcaseCells(size, pattern, step));
  return (
    <figure className="pattern-showcase" aria-label={`${t('patternGoal')}: ${t(`pattern_${pattern}`)}`}>
      <div className="pattern-showcase-grid" aria-hidden="true" style={{ '--n': size }}>
        {Array.from({ length: size * size }, (_, i) => <span key={i} className={on.has(i) ? 'is-on' : ''} />)}
      </div>
      <figcaption>{t('patternGoal')}: <strong>{t(`pattern_${pattern}`)}</strong></figcaption>
    </figure>
  );
}
