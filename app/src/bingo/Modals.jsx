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
        <span>{t('readAloud')}</span>
      </label>
      <label className="home-check">
        <input type="checkbox" checked={prefs.reduceMotion} onChange={(e) => onPrefs({ reduceMotion: e.target.checked })} />
        <span>{t('reduceMotion')}</span>
      </label>
      <p className="hint">{t('volumeHint')}</p>
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
        <button type="submit" className="home-btn small" disabled={!value.trim()}>{t('save')}</button>
      </form>
    </Modal>
  );
}

function HowToModal({ onClose }) {
  const { t } = useLang();
  return (
    <Modal title={t('howToPlay')} onClose={onClose}>
      <ol className="howto">
        <li><b>{t('howto1T')}</b> {t('howto1')}</li>
        <li><b>{t('howto2T')}</b> {t('howto2')}</li>
        <li><b>{t('howto3T')}</b> {t('howto3')}</li>
        <li><b>{t('howto4T')}</b> {t('howto4')}</li>
        <li><b>{t('howto5T')}</b> {t('howto5')}</li>
        <li><b>{t('howto6T')}</b> {t('howto6')}</li>
      </ol>
    </Modal>
  );
}

/** "Leave this room?" before joining another one. The host is told it closes the room for everyone. */
function ConfirmLeaveModal({ onClose, isHost, onConfirm }) {
  const { t } = useLang();
  return (
    <Modal title={t('leaveTitle')} onClose={onClose}>
      <p>{t(isHost ? 'leaveHostBody' : 'leaveGuestBody')}</p>
      <div className="modal-actions">
        <button type="button" className="ghost-btn" onClick={onClose}>{t('cancel')}</button>
        <button type="button" className={`home-btn small${isHost ? ' is-danger' : ''}`} onClick={onConfirm}>{t('leaveConfirm')}</button>
      </div>
    </Modal>
  );
}

/** Renders whichever menu action is open. */
export default function Modals({ open, onClose, prefs, onPrefs, name, onName, isHost = false, onConfirmLeave }) {
  if (open === 'confirmLeave') return <ConfirmLeaveModal onClose={onClose} isHost={isHost} onConfirm={onConfirmLeave} />;
  if (open === 'settings') return <SettingsModal onClose={onClose} prefs={prefs} onPrefs={onPrefs} />;
  if (open === 'signin') return <SignInModal onClose={onClose} name={name} onName={onName} />;
  if (open === 'howto') return <HowToModal onClose={onClose} />;
  return null;
}
