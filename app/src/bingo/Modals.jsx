import { useEffect, useState } from 'react';
import { IconClose } from '../shared/icons.jsx';
import { useLang } from '../shared/i18n.js';
import { getAudioSettings, setAudioSettings } from '../shared/audio.js';

function Modal({ title, onClose, children }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="rh-panel-head">
          <h2>{title}</h2>
          <button type="button" className="rh-key is-icon" aria-label={t('close')} onClick={onClose} autoFocus><IconClose /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, prefs, onPrefs }) {
  const { t } = useLang();
  const [speakOn, setSpeakOn] = useState(getAudioSettings().speak);
  return (
    <Modal title={t('settings')} onClose={onClose}>
      <label className="home-check">
        <input type="checkbox" checked={speakOn} onChange={(e) => { setSpeakOn(e.target.checked); setAudioSettings({ speak: e.target.checked }); }} />
        <span>Read calls out loud</span>
      </label>
      <label className="home-check">
        <input type="checkbox" checked={prefs.reduceMotion} onChange={(e) => onPrefs({ reduceMotion: e.target.checked })} />
        <span>Reduce motion (no floating sparkles)</span>
      </label>
      <p className="hint">Music and sound volume live in the speaker button at the top.</p>
    </Modal>
  );
}

function SignInModal({ onClose, name, onName }) {
  const { t } = useLang();
  const [value, setValue] = useState(name);
  return (
    <Modal title={t('changeName')} onClose={onClose}>
      <p>{t('noAccountLong')}</p>
      <form className="home-form" onSubmit={(e) => { e.preventDefault(); onName(value.trim().slice(0, 20)); onClose(); }}>
        <div className="fl-wrap">
          <input id="profile-name" className="fl-input" placeholder=" " maxLength={20} value={value} onChange={(e) => setValue(e.target.value)} />
          <label htmlFor="profile-name" className="fl-label">{t('yourName')}</label>
        </div>
        <button type="submit" className="home-btn small" disabled={!value.trim()}>Save</button>
      </form>
    </Modal>
  );
}

function HowToModal({ onClose }) {
  const { t } = useLang();
  return (
    <Modal title={t('howToPlay')} onClose={onClose}>
      <ol className="howto">
        <li><b>Create a room</b> with your name, then add computer buddies in the lobby.</li>
        <li><b>Pick a mode:</b> number bingo (1–75 on a 5×5 card) or event cards built from your own list of things that might happen.</li>
        <li><b>Listen for calls.</b> Each call appears in the big ball. Tap the matching square on your card to daub it.</li>
        <li><b>Complete any line</b> — a row, column or diagonal. The star in the middle is free.</li>
        <li><b>Hit BINGO!</b> before the buddies do. A false BINGO locks your button for 3 seconds.</li>
        <li><b>Big Screen Mode</b> turns this screen into the caller board for a TV — you host and the buddies play.</li>
      </ol>
    </Modal>
  );
}

/** Renders whichever menu action is open. */
export default function Modals({ open, onClose, prefs, onPrefs, name, onName }) {
  if (open === 'settings') return <SettingsModal onClose={onClose} prefs={prefs} onPrefs={onPrefs} />;
  if (open === 'signin') return <SignInModal onClose={onClose} name={name} onName={onName} />;
  if (open === 'howto') return <HowToModal onClose={onClose} />;
  return null;
}
