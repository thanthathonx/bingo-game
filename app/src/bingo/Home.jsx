import { useState } from 'react';
import { IconUsers } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';

export const NAME_MAX = 20;

/**
 * Start screen: hero on the left, "create room" card on the right.
 * @param {{ initialName: string, onCreate: (opts: { name: string, streamer: boolean, bigScreen: boolean }) => void }} props
 */
export default function Home({ initialName, onCreate }) {
  const { t } = useLang();
  const [name, setName] = useState(initialName);
  const [streamer, setStreamer] = useState(false);
  const [bigScreen, setBigScreen] = useState(false);
  const trimmed = name.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmed) return;
    onCreate({ name: trimmed.slice(0, NAME_MAX), streamer, bigScreen });
  };

  return (
    <div className="home-stage">
      <div className="home-grid">
        <div className="home-hero-col">
          <div className="home-hero">
            <span className="home-mascot-wrap">
              <span className="home-mascot-halo" aria-hidden="true" />
              <img src="/mascot.svg" width="512" height="512" alt="Bingo Friends mascot" className="home-mascot" decoding="async" />
            </span>
            <h1 className="home-title">
              Bingo<span className="home-title-accent"> Friends</span>
            </h1>
            <p className="home-tagline">{t('tagline')}</p>
          </div>
          <div className="home-badge">
            <IconUsers size={16} />
            <span className="home-badge-count">{t('players')}</span>
            <span className="home-badge-sep" aria-hidden="true">|</span>
            <span className="home-badge-cat">{t('partyGame')}</span>
          </div>
        </div>
        <div className="home-card-col">
          <div className="home-card" aria-label={t('createRoom')}>
            <p className="card-description">{t('startNew')}</p>
            <form className="home-form" onSubmit={handleSubmit}>
              <div className="fl-wrap">
                <input id="player-name" className="fl-input" type="text" required maxLength={NAME_MAX}
                  placeholder=" " autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />
                <label htmlFor="player-name" className="fl-label">
                  {t('yourName')}<span className="req">*</span>
                </label>
              </div>
              <label className="home-check">
                <input type="checkbox" checked={streamer} onChange={(e) => setStreamer(e.target.checked)} />
                <span>{t('streamer')}</span>
              </label>
              <label className="home-check">
                <input type="checkbox" checked={bigScreen} onChange={(e) => setBigScreen(e.target.checked)} />
                <span>{t('bigScreen')}</span>
              </label>
              <button type="submit" className="home-btn" disabled={!trimmed}>
                {t('createRoom')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
