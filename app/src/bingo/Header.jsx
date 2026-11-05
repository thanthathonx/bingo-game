import { useEffect, useRef, useState } from 'react';
import Mascot from '../shared/Mascot.jsx';
import {
  IconSpeaker, IconMuted, IconGear, IconMenu, IconClose, IconMusic, IconSparkles,
  IconCheck, IconHelp, IconMessage, IconKey, IconGamepad, IconUsers, IconShield, Flag,
} from '../shared/icons.jsx';
import { LANGUAGES, useLang } from '../shared/i18n.js';
import { getAudioSettings, onAudioChange, setAudioSettings, playSfx } from '../shared/audio.js';

/**
 * Room header with the audio, language and menu panels.
 * @param {{ onAction: (name: string) => void }} props
 */
export default function Header({ onAction }) {
  const { t, lang } = useLang();
  const [panel, setPanel] = useState(null);
  const [audio, setAudio] = useState(getAudioSettings());
  const panelRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => onAudioChange(setAudio), []);

  useEffect(() => {
    if (!panel) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setPanel(null);
    };
    const onDown = (e) => {
      const inPanel = panelRef.current?.contains(e.target);
      const inControls = controlsRef.current?.contains(e.target);
      if (!inPanel && !inControls) setPanel(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [panel]);

  const toggle = (name) => {
    playSfx('click');
    setPanel((p) => (p === name ? null : name));
  };
  const act = (name) => {
    setPanel(null);
    onAction(name);
  };
  const keyClass = (name) => `rh-key is-icon${panel === name ? ' is-open' : ''}`;
  const SpeakerIcon = audio.muted ? IconMuted : IconSpeaker;

  return (
    <header className="rh" data-world-ui="true">
      <div className="rh-row">
        <a className="rh-brand" href="/games/" aria-label="Bingo Friends · all games">
          <img src="/mascot.svg" width="46" height="46" alt="" className="rh-logo" />
          <span className="rh-title">
            <b>Bingo</b> Friends
          </span>
        </a>
        <div className="rh-controls" ref={controlsRef}>
          <button type="button" className={keyClass('audio')} aria-label={t('gameAudio')} title={t('gameAudio')}
            aria-haspopup="dialog" aria-expanded={panel === 'audio'} onClick={() => toggle('audio')}>
            <SpeakerIcon />
          </button>
          <button type="button" className="rh-key is-icon rh-settings" aria-label={t('settings')} title={t('settings')}
            onClick={() => act('settings')}>
            <IconGear />
          </button>
          <button type="button" className={`${keyClass('language')} rh-language`} aria-label={`${t('language')}: ${LANGUAGES.find((l) => l.code === lang)?.label}`}
            title={t('language')} aria-haspopup="dialog" aria-expanded={panel === 'language'} onClick={() => toggle('language')}>
            <span className="rh-flag"><Flag code={lang} /></span>
          </button>
          <button type="button" className="rh-key is-cta rh-signin" aria-label={t('gotCode')} title={t('gotCode')}
            onClick={() => act('join')}>
            <IconKey />
            <span className="rh-text">{t('join')}</span>
          </button>
          <button type="button" className={`${keyClass('menu')} rh-menu`} aria-label={t('menu')} title={t('menu')}
            aria-haspopup="dialog" aria-expanded={panel === 'menu'} onClick={() => toggle('menu')}>
            <IconMenu />
            <span className="rh-text">{t('menu')}</span>
          </button>
        </div>
      </div>
      {panel && (
        <div className="rh-panel" role="dialog" aria-label={panelTitle(panel, t)} ref={panelRef}>
          <div className="rh-panel-head">
            <h2>{panelTitle(panel, t)}</h2>
            <button type="button" className="rh-key is-icon rh-panel-close" aria-label={t('close')} onClick={() => setPanel(null)}>
              <IconClose />
            </button>
          </div>
          {panel === 'audio' && <AudioPanel audio={audio} t={t} />}
          {panel === 'language' && <LanguagePanel onDone={() => setPanel(null)} />}
          {panel === 'menu' && <MenuPanel t={t} act={act} />}
        </div>
      )}
    </header>
  );
}

function panelTitle(panel, t) {
  if (panel === 'audio') return t('gameAudio');
  if (panel === 'language') return t('language');
  return t('menu');
}

function AudioPanel({ audio, t }) {
  return (
    <div className="rh-panel-body">
      <div className="pa-row">
        <div className="pa-label"><span className="pa-icon"><IconMusic /></span>{t('music')}</div>
        <div className="pa-slider">
          <input type="range" min="0" max="100" value={audio.music} aria-label={t('music')}
            style={{ '--fill': `${audio.music}%` }}
            onChange={(e) => setAudioSettings({ music: Number(e.target.value) })} />
          <span className="pa-value">{audio.music}%</span>
        </div>
      </div>
      <div className="pa-row">
        <div className="pa-label"><span className="pa-icon"><IconSparkles /></span>{t('soundEffects')}</div>
        <div className="pa-slider">
          <input type="range" min="0" max="100" value={audio.sfx} aria-label={t('soundEffects')}
            style={{ '--fill': `${audio.sfx}%` }}
            onChange={(e) => setAudioSettings({ sfx: Number(e.target.value) })}
            onPointerUp={() => playSfx('daub')} />
          <span className="pa-value">{audio.sfx}%</span>
        </div>
      </div>
      <button type="button" className="pm-item pa-mute" aria-pressed={audio.muted}
        onClick={() => setAudioSettings({ muted: !audio.muted })}>
        <span className="pm-icon is-purple">{audio.muted ? <IconMuted /> : <IconSparkles />}</span>
        {audio.muted ? t('unmuteAudio') : t('muteAudio')}
      </button>
    </div>
  );
}

function LanguagePanel({ onDone }) {
  const { lang, setLang } = useLang();
  return (
    <div className="rh-panel-body pl-list">
      {LANGUAGES.map((l) => (
        <button key={l.code} type="button" className={`pm-item pl-item${l.code === lang ? ' is-active' : ''}`}
          aria-pressed={l.code === lang}
          onClick={() => { setLang(l.code); onDone(); }}>
          <span className="pl-flag"><Flag code={l.code} /></span>
          <span className="pl-name">{l.label}</span>
          {l.code === lang && <IconCheck className="pl-check" />}
        </button>
      ))}
    </div>
  );
}

function MenuPanel({ t, act }) {
  return (
    <div className="rh-panel-body">
      <button type="button" className="pm-profile" onClick={() => act('signin')}>
        <span className="pm-avatar"><Mascot size={46} /></span>
        <span>{t('noAccount')}<small>{t('changeName')}</small></span>
      </button>
      <button type="button" className="pm-item" onClick={() => act('join')}>
        <span className="pm-icon is-purple"><IconKey size={18} /></span>{t('gotCode')}
      </button>
      <a className="pm-item" href="/games/">
        <span className="pm-icon is-purple"><IconGamepad size={18} /></span>{t('allGames')}
      </a>
      <div className="pm-section">{t('helpSupport')}</div>
      <button type="button" className="pm-item" onClick={() => act('settings')}>
        <span className="pm-icon is-gold"><IconGear size={18} /></span>{t('settings')}
      </button>
      <button type="button" className="pm-item" onClick={() => act('howto')}>
        <span className="pm-icon is-gold"><IconHelp size={18} /></span>{t('howToPlay')}
      </button>
      <button type="button" className="pm-item" onClick={() => act('report')}>
        <span className="pm-icon is-gold"><IconMessage size={18} /></span>{t('report')}
      </button>
      <div className="pm-section">{t('you')}</div>
      <button type="button" className="pm-item" onClick={() => act('signin')}>
        <span className="pm-icon is-purple"><IconUsers size={18} /></span>{t('changeName')}
      </button>
      <a className="pm-item" href="/datenschutz#s6">
        <span className="pm-icon is-purple"><IconShield size={18} /></span>{t('privacySettings')}
      </a>
    </div>
  );
}
