import { useEffect, useState } from 'react';
import { IconUsers } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';
import { decodeRoom, normalizeCode, CODE_LENGTH } from './roomCode.js';
import { onlineEnabled } from '../online/client.js';
import { isOnlineCode } from '../online/protocol.js';

const codeLooksRight = (code) => (onlineEnabled ? isOnlineCode(code) : Boolean(decodeRoom(code)));

/** Room code from an invite link (?room=ABC234), or ''. */
function codeFromLink() {
  try {
    return normalizeCode(new URLSearchParams(window.location.search).get('room') ?? '');
  } catch {
    return '';
  }
}

export const NAME_MAX = 20;

/**
 * Start screen: hero on the left, "create room" card (plus "join with a friend's code") on the right.
 * @param {{ initialName: string, onCreate: (opts: { name: string, streamer: boolean, bigScreen: boolean, code?: string }) => void }} props
 */
export default function Home({ initialName, onCreate, error = '' }) {
  const { t } = useLang();
  const [name, setName] = useState(initialName);
  // Name changed from the menu while on this screen: show it in the box.
  useEffect(() => setName(initialName), [initialName]);
  const [streamer, setStreamer] = useState(false);
  const [bigScreen, setBigScreen] = useState(false);
  const [invited] = useState(codeFromLink);
  const [code, setCode] = useState(invited);
  const [codeError, setCodeError] = useState(error ? t(error) : '');
  const trimmed = name.trim();

  // Opened from an invite link / QR code: the code is filled in, only the name is needed.
  useEffect(() => {
    if (invited) document.getElementById('player-name')?.focus();
  }, [invited]);

  // Invited: the main button joins the friend's room instead of creating a new one.
  const joining = Boolean(invited) && code === invited;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmed) return;
    if (joining) {
      handleJoin(e);
      return;
    }
    onCreate({ name: trimmed.slice(0, NAME_MAX), streamer, bigScreen });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!trimmed) {
      setCodeError(t('nameFirst'));
      document.getElementById('player-name')?.focus();
      return;
    }
    if (!codeLooksRight(code)) {
      setCodeError(t('badCode'));
      return;
    }
    setCodeError('');
    // Drop ?room= from the address so a later visit doesn't try an old room again.
    if (invited) window.history.replaceState(null, '', window.location.pathname);
    onCreate({ name: trimmed.slice(0, NAME_MAX), streamer, bigScreen: false, code: normalizeCode(code) });
  };

  return (
    <div className="home-stage">
      <div className="home-grid">
        <div className="home-hero-col">
          <div className="home-hero">
            <span className="home-mascot-wrap">
              <span className="home-mascot-halo" aria-hidden="true" />
              <img src="/logo-512.png" width="512" height="512" alt="Bingo Friends robot" className="home-mascot" decoding="async" />
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
            <p className="card-description">{t(joining ? 'joinIntro' : 'startNew')}</p>
            <form className="home-form" onSubmit={handleSubmit}>
              <div className="fl-wrap">
                <input id="player-name" className="fl-input" type="text" required maxLength={NAME_MAX}
                  placeholder=" " autoComplete="nickname" value={name}
                  onChange={(e) => { setName(e.target.value); setCodeError(''); }} />
                <label htmlFor="player-name" className="fl-label">
                  {t('yourName')}<span className="req">*</span>
                </label>
              </div>
              {!joining && (
                <>
                  <label className="home-check">
                    <input type="checkbox" checked={streamer} onChange={(e) => setStreamer(e.target.checked)} />
                    <span>{t('streamer')}</span>
                  </label>
                  <label className="home-check">
                    <input type="checkbox" checked={bigScreen} onChange={(e) => setBigScreen(e.target.checked)} />
                    <span>{t('bigScreen')}</span>
                  </label>
                </>
              )}
              {joining && <p className="invite-note">{t('invitedTo')} <b>{code}</b></p>}
              <button type="submit" className="home-btn" disabled={!trimmed}>
                {joining ? `${t('join')} ${code}` : t('createRoom')}
              </button>
            </form>
            <form className="join-form" onSubmit={handleJoin} noValidate>
              <label htmlFor="friend-code" className="join-label">{t('gotCode')}</label>
              <div className="join-row">
                <input id="friend-code" className="join-input" type="text" autoComplete="off" size={6}
                  autoCapitalize="characters" spellCheck={false} maxLength={CODE_LENGTH + 2}
                  placeholder={t('gotCode')} value={code} aria-invalid={Boolean(codeError)}
                  aria-describedby="code-help"
                  onChange={(e) => { setCode(normalizeCode(e.target.value)); setCodeError(''); }} />
                <button type="submit" className="join-btn" disabled={code.length !== CODE_LENGTH}>
                  {t('join')}
                </button>
              </div>
              <p id="code-help" className={codeError ? 'join-error' : 'join-help'} role={codeError ? 'alert' : undefined}>
                {codeError || t(onlineEnabled ? 'codeHelpOnline' : 'codeHelp')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
