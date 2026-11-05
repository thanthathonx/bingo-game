import { useState } from 'react';
import MascotImg from '../shared/MascotImg.jsx';
import { Flag, IconRadio, IconCrown, IconSpeaker, IconChevron, IconMessage, IconMenu, IconGamepad, IconHelp, IconMail, IconPlay } from '../shared/icons.jsx';

const NAV = [
  { href: '/games/', label: 'Games', key: 'games' },
  { href: '/bingo/', label: 'Bingo', key: 'bingo' },
  { href: '/games/#now', label: 'Now Playing', key: 'now', icon: true },
  { href: '/games/#faq', label: 'Help', key: 'help' },
];

export function Logo() {
  return (
    <a className="pp-logo" href="/games/" aria-label="PlayPals home">
      <MascotImg size={40} prop="none" alt="" />
      <span className="pp-logo-text">Play<b>Pals</b><i>.io</i></span>
    </a>
  );
}

/** @param {{ active?: string }} props */
function NavLinks({ active }) {
  return NAV.map((n) => (
    <a key={n.key} href={n.href} className={active === n.key ? 'is-active' : ''} aria-current={active === n.key ? 'page' : undefined}>
      {n.icon && <IconRadio size={18} />}
      {n.label}
    </a>
  ));
}

export function PortalHeader({ active }) {
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const say = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };
  return (
    <header className="pp-hdr">
      <div className="pp-hdr-top">
        <Logo />
        <nav className="pp-nav" aria-label="Main"><NavLinks active={active} /></nav>
        <div className="pp-hdr-right">
          <button type="button" className="pp-premium" onClick={() => say('Everything here is free — enjoy!')}>
            <IconCrown size={18} /> Premium
          </button>
          <button type="button" className="pp-keycap pp-lang" aria-label="Language: English" onClick={() => say('More languages are available inside the bingo game.')}>
            <Flag code="en" width={25} height={17} />
          </button>
          <button type="button" className="pp-login" onClick={() => say('Accounts are not part of this version — just play!')}>Log in</button>
          <button type="button" className="pp-keycap pp-burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <IconMenu size={22} />
          </button>
        </div>
      </div>
      <nav className="pp-nav-row" aria-label="Sections"><NavLinks active={active} /></nav>
      {menuOpen && <nav className="pp-drop" aria-label="Menu"><NavLinks active={active} /></nav>}
      <button type="button" className="pp-fab" aria-label="Feedback" onClick={() => say('Feedback: hello@example.com')}>
        <IconMessage size={20} />
      </button>
      {toast && <div className="pp-toast" role="status">{toast}</div>}
    </header>
  );
}

const COLS = [
  { title: 'Games', color: '#e94560', links: [['All party games', '/games/'], ['Bingo Friends', '/bingo/'], ['Free browser games', '/games/'], ['Play on your TV', '/bingo/']] },
  { title: 'Help', color: '#00d9ff', links: [['How it works', '/games/#faq'], ['For streamers', '/bingo/'], ['Send feedback', 'mailto:hello@example.com']] },
  { title: 'Company', color: '#a855f7', links: [['About us', '/impressum'], ['Contact us', 'mailto:hello@example.com']] },
  { title: 'Legal', color: '#ffb020', links: [['Privacy', '/datenschutz'], ['Terms', '/terms'], ['Impressum', '/impressum']] },
];

export function PortalFooter() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="pp-foot">
      <div className="pp-foot-grid">
        <div className="pp-foot-brand">
          <div className="pp-foot-logo">PLAY<b>PALS</b><i>.IO</i></div>
          <p>Party games with friends. Pick a game, share one screen, play together in the browser.</p>
          <div className="pp-foot-social">
            <a className="pp-pill pp-wide" href="/bingo/"><IconPlay size={18} /> Play Bingo Friends</a>
            <a className="pp-pill pp-sq" href="/games/" aria-label="All games"><IconGamepad size={20} /></a>
            <a className="pp-pill pp-sq" href="/games/#faq" aria-label="Help"><IconHelp size={20} /></a>
            <a className="pp-pill pp-sq" href="mailto:hello@example.com" aria-label="Email us"><IconMail size={20} /></a>
          </div>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} className="pp-foot-col" aria-label={c.title}>
            <h2 style={{ color: c.color }}>{c.title}</h2>
            <ul>
              {c.links.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}
              {c.title === 'Legal' && <li><button type="button" className="pp-foot-btn" onClick={() => window.location.assign('/datenschutz#s6')}>Privacy settings</button></li>}
            </ul>
          </nav>
        ))}
        {COLS.map((c) => (
          <details key={`acc-${c.title}`} className="pp-foot-acc">
            <summary><span style={{ color: c.color }}>{c.title}</span><IconChevron size={18} /></summary>
            {c.links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </details>
        ))}
      </div>
      <nav className="pp-foot-more" aria-label="Looking for more?">
        <h2>Looking for more?</h2>
        <ul>
          <li><a href="/bingo/">Bingo for parties</a></li>
          <li><a href="/bingo/">Bingo for streams</a></li>
          <li><a href="/bingo/">Classroom bingo</a></li>
        </ul>
      </nav>
      <nav className="pp-foot-legal" aria-label="Legal">
        <a href="/datenschutz">Privacy</a><a href="/terms">Terms</a><a href="/impressum">Impressum</a>
      </nav>
      <div className="pp-foot-bottom">
        <span>© 2026 PlayPals demo. All rights reserved.</span>
        <div className="pp-foot-actions">
          <button type="button" className="pp-pill" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <Flag code="en" width={25} height={17} /> English <IconChevron size={16} />
          </button>
          <a className="pp-pill" href="/bingo/"><IconSpeaker size={18} /> Sound and motion</a>
        </div>
      </div>
    </footer>
  );
}
