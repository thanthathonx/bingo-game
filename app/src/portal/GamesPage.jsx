import { useState } from 'react';
import MascotImg from '../shared/MascotImg.jsx';
import { IconSearch, IconGamepad, IconUsers, IconClock, IconPlay, IconChevron } from '../shared/icons.jsx';
import { PortalHeader, PortalFooter } from './PortalChrome.jsx';
import { FEATURED, GAMES, TYPES, PLAYER_FILTERS, FAQ, matchesType, matchesPlayers } from './gamesData.js';

const CHIP_TINTS = ['cyan', 'purple', 'pink', 'cyan', 'pink', 'purple'];

export default function GamesPage() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState('Any');
  const [type, setType] = useState('All types');
  const [note, setNote] = useState('');
  const q = query.trim().toLowerCase();
  const list = GAMES.filter((g) => matchesType(g, type) && matchesPlayers(g, players)
    && (!q || g.name.toLowerCase().includes(q) || g.tagline.toLowerCase().includes(q)));

  const play = (g) => {
    if (g.href) window.location.href = g.href;
    else setNote(`${g.name} is coming soon — Bingo Friends is ready to play now!`);
  };

  return (
    <div className="pp-page">
      <PortalHeader active="games" />
      <main id="main">
        <section className="gd-top">
        <div className="gd-banner">
          <h1 className="gd-title">Free Browser Party Games to Play With Friends</h1>
          <span className="gd-banner-medal"><MascotImg size={76} prop="controller" alt="" /></span>
          <div className="gd-banner-art" aria-hidden="true">
            <span className="gd-star s1">✦</span><span className="gd-star s2">✦</span><span className="gd-star s3">✦</span>
          </div>
        </div>
          <p className="gd-hint">Play opens the game right here. Share your screen or pass the device around.</p>
          <div className="gd-filters">
            <label className="gd-search">
              <IconSearch size={20} />
              <input type="search" placeholder="Search games..." value={query} onChange={(e) => setQuery(e.target.value.slice(0, 40))} aria-label="Search games" />
            </label>
            <div className="gd-chips" role="group" aria-label="Players">
              <span className="gd-label">Players</span>
              {PLAYER_FILTERS.map((p, i) => (
                <button key={p} type="button" className={`gd-chip is-${CHIP_TINTS[i]}${players === p ? ' is-active' : ''}`} aria-pressed={players === p} onClick={() => setPlayers(p)}>
                  {p === 'Solo' && <IconGamepad size={18} />}{p}
                </button>
              ))}
            </div>
          </div>
          <div className="gd-chips gd-types" role="group" aria-label="Type">
            <span className="gd-label">Type</span>
            {TYPES.map((tp, i) => (
              <button key={tp} type="button" className={`gd-chip is-${CHIP_TINTS[i]}${type === tp ? ' is-active' : ''}`} aria-pressed={type === tp} onClick={() => setType(tp)}>{tp}</button>
            ))}
          </div>
          <p className="gd-label gd-count">{list.length + 1} games</p>
          {note && <p className="gd-note" role="status">{note}</p>}
        </section>
        <div className="gd-wrap">

          <section className="gd-list" aria-label="All games">
          <article className="gd-feature">
            <a className="gd-feature-art" href={FEATURED.href} aria-label={`Play ${FEATURED.name}`}>
              <span className="gd-new">New</span>
              <MascotImg size={190} prop={FEATURED.prop} alt={FEATURED.name} />
            </a>
            <div className="gd-feature-text">
              <h2>{FEATURED.name}</h2>
              <p>{FEATURED.tagline}</p>
              <ul className="gd-facts"><li><IconUsers size={18} /> {FEATURED.players}</li><li>{FEATURED.type}</li></ul>
            </div>
            <div className="gd-feature-cta">
              <a className="gd-play-big" href={FEATURED.href}><IconPlay size={22} /> Play with friends</a>
              <a className="gd-details" href="/bingo/">Details</a>
            </div>
          </article>

          <ul className="gd-grid">
            {list.map((g) => (
              <li key={g.name} className="gd-card" style={{ '--accent': g.accent }}>
                <button type="button" className="gd-card-art" onClick={() => play(g)} aria-label={`Play ${g.name}`}>
                  <MascotImg size={150} prop={g.prop} alt={g.name} />
                </button>
                <div className="gd-card-body">
                  <div className="gd-card-top"><h3>{g.name}</h3><span className="gd-type">{g.type}</span></div>
                  <p>{g.tagline}</p>
                  <ul className="gd-facts"><li><IconUsers size={18} /> {g.players}</li><li><IconClock size={18} /> {g.time}</li></ul>
                  <div className="gd-card-actions">
                    <button type="button" className="gd-details" onClick={() => play(g)}>Details</button>
                    <button type="button" className="gd-play" onClick={() => play(g)}><IconPlay size={18} /> Play</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          </section>
          {list.length === 0 && <p className="gd-hint">No games match those filters.</p>}

          <section className="gd-panel gd-intro" id="now">
            <h2>Free browser party games for game night — trivia, drawing, deduction and bingo. Play with friends in your browser, no download, no account.</h2>
            <p>Pick a game, gather everyone around one screen or pass the device around. Every game works on desktop, tablet or phone, and the bingo game even has a Big Screen mode for the TV.</p>
          </section>

          <section className="gd-panel" aria-labelledby="alt-h">
            <h2 id="alt-h" className="gd-panel-title">More ways to play — pick the right game</h2>
              <p className="gd-hint">Not sure where to start? These quick picks match the most common game-night moods.</p>
              <ul className="gd-tips">
                <li><b>Big group?</b> Bingo Friends with event cards works for any number of people around one screen.</li>
                <li><b>Love drawing?</b> Doodle Dash turns every round into a guessing frenzy.</li>
                <li><b>Quiz fans?</b> Quiz Pop and Last One Standing keep score for you.</li>
                <li><b>Short on time?</b> Mind Sync and Hot Potato last just a few minutes.</li>
                <li><b>Hosting a stream?</b> Bingo Friends has Streamer Mode and a Big Screen view.</li>
              </ul>
              <table className="gd-table">
                <thead><tr><th>Feature</th><th>PlayPals</th><th>Party app</th><th>Video quiz</th><th>Board game</th></tr></thead>
                <tbody>
                  <tr><td>Price</td><td>Free</td><td>Paid packs</td><td>Free (ads)</td><td>One-off</td></tr>
                  <tr><td>Download needed</td><td>No</td><td>Often</td><td>No</td><td>—</td></tr>
                  <tr><td>Computer players</td><td>Yes</td><td>Rarely</td><td>No</td><td>No</td></tr>
                  <tr><td>Works on a TV</td><td>Big Screen</td><td>Varies</td><td>Yes</td><td>No</td></tr>
                  <tr><td>Your own cards</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>
                </tbody>
              </table>
              <p className="gd-hint">All games are free and run in your browser — just open one and start playing.</p>
          </section>

          <section className="gd-panel" aria-labelledby="why-h">
            <h2 id="why-h" className="gd-panel-title">Why PlayPals?</h2>
            <ul className="gd-why">
              {['100% free — no paywalls, play instantly', 'No downloads or installs — everything in your browser', 'Computer buddies when your friends are busy', 'Works on desktop, tablet and mobile', 'Your settings are saved on your device'].map((w) => <li key={w}>✓ {w}</li>)}
            </ul>
          </section>

          <section className="gd-panel" id="faq" aria-labelledby="faq-h">
            <h2 id="faq-h" className="gd-panel-title">Frequently asked questions</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="gd-faq">
                <summary>{f.q}<IconChevron size={18} /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
