import { useState } from 'react';
import MascotImg from '../shared/MascotImg.jsx';
import { IconShield, IconBook, IconInfo, IconClock, IconMail, IconArrowUp, IconChevron } from '../shared/icons.jsx';
import { PortalHeader, PortalFooter } from './PortalChrome.jsx';
import { LEGAL_TABS, CONTACT } from './legalContent.js';

const TAB_ICONS = { shield: IconShield, book: IconBook, info: IconInfo };

const STORAGE_PREFIX = 'bingoFriends:';

function ClearStorageButton() {
  const [done, setDone] = useState(false);
  const clear = () => {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
      setDone(true);
    } catch {
      setDone(false);
    }
  };
  return (
    <p className="lg-actions">
      <button type="button" className="lg-btn" onClick={clear}>Clear my saved settings</button>
      {done && <span role="status"> Done — this site's saved settings were removed from this browser.</span>}
    </p>
  );
}

function Block({ item }) {
  if (item.kind === 'clear') return <ClearStorageButton />;
  if (item.kind === 'ul') return <ul>{item.items.map((t) => <li key={t}>{t}</li>)}</ul>;
  if (item.kind === 'h3') return <h3>{item.text}</h3>;
  return <p>{item.text}</p>;
}

function LegalTabs({ slug }) {
  return (
    <nav className="lg-tabs" aria-label="Legal documents">
      {LEGAL_TABS.map((t) => {
        const Icon = TAB_ICONS[t.icon];
        return (
          <a key={t.slug} href={t.href} aria-current={t.slug === slug ? 'page' : undefined} className={t.slug === slug ? 'is-active' : ''}>
            <Icon size={16} /><span className="lg-tab-long">{t.label}</span><span className="lg-tab-short">{t.short}</span>
          </a>
        );
      })}
    </nav>
  );
}

/** @param {{ doc: { slug: string, title: string, subtitle: string, updated: string, tint: string, sections: Array<{title: string, body: Array<object>}> } }} props */
export default function LegalPage({ doc }) {
  const [tocOpen, setTocOpen] = useState(false);
  const DocIcon = TAB_ICONS[LEGAL_TABS.find((t) => t.slug === doc.slug)?.icon] ?? IconBook;
  const toc = (
    <ol className="lg-toc">
      {doc.sections.map((s, i) => (
        <li key={s.title}><a href={`#s${i + 1}`}><span>{i + 1}</span>{s.title}</a></li>
      ))}
    </ol>
  );
  return (
    <div className="pp-page">
      <PortalHeader />
      <main id="main">
        <LegalTabs slug={doc.slug} />
        <section className="lg-doc">
          <header className={`lg-head is-${doc.tint}`}>
            <span className="lg-head-art"><MascotImg size={96} prop="star" alt="" /></span>
            <h1 className="lg-title"><span className="lg-title-icon"><DocIcon size={22} /></span>{doc.title}</h1>
            <p className="lg-sub">{doc.subtitle}</p>
            <div className="lg-meta">
              <span><IconClock size={18} /> {doc.updated}</span>
              <span><IconMail size={18} /> Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></span>
            </div>
          </header>
          <div className="lg-body">
            <nav className="lg-contents-wide" aria-label="Contents">
              <h2 className="lg-label">Contents</h2>
              {toc}
            </nav>
            <div className="lg-contents-narrow">
              <button type="button" aria-expanded={tocOpen} onClick={() => setTocOpen((v) => !v)}>
                <IconBook size={16} /> <b>Contents</b> <span>{doc.sections.length} sections</span> <IconChevron size={18} />
              </button>
              {tocOpen && toc}
            </div>
            <div className="lg-sections">
              {doc.sections.map((s, i) => (
                <section key={s.title} id={`s${i + 1}`} className="lg-section">
                  <h2>{i + 1}. {s.title}</h2>
                  {s.body.map((b, k) => <Block key={k} item={b} />)}
                </section>
              ))}
            </div>
          </div>
          <a className="lg-top" href="#main"><IconArrowUp size={16} /> Back to Top</a>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}

/**
 * Imprint page: one long plain document with the imprint, then privacy and terms, like the original's.
 * @param {{ docs: Array<object> }} props
 */
export function CombinedLegalPage({ docs }) {
  return (
    <div className="pp-page">
      <PortalHeader />
      <main id="main" className="lc-main">
        <LegalTabs slug="impressum" />
        <article className="lc-doc">
          <MascotImg size={72} prop="book" alt="PlayPals mascot reading the rules" className="lc-mascot" />
          <h1>Legal information — PlayPals.io</h1>
          <p>This imprint applies to the website and to every page and social media presence of the PlayPals demo.</p>
          {docs.map((d) => (
            <section key={d.slug} className="lc-part">
              <h2>{d.title}</h2>
              <p>{d.subtitle} — {d.updated}</p>
              {d.sections.map((s, i) => (
                <section key={s.title} className="lc-section">
                  <h3>{d.slug === 'impressum' ? s.title : `${i + 1}. ${s.title}`}</h3>
                  {s.body.map((b, k) => <Block key={k} item={b} />)}
                </section>
              ))}
            </section>
          ))}
        </article>
      </main>
      <PortalFooter />
    </div>
  );
}
