import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/portal.css';
import GamesPage from './portal/GamesPage.jsx';
import LegalPage, { CombinedLegalPage } from './portal/LegalPage.jsx';
import { TERMS, PRIVACY, IMPRINT } from './portal/legalContent.js';

const DOCS = { terms: TERMS, datenschutz: PRIVACY, impressum: IMPRINT };
const page = document.body.dataset.page;

document.body.classList.add('portal-body');
const root = createRoot(document.getElementById('root'));
function pageFor(name) {
  if (name === 'games') return <GamesPage />;
  if (name === 'impressum') return <CombinedLegalPage docs={[IMPRINT, PRIVACY, TERMS]} />;
  return <LegalPage doc={DOCS[name] ?? TERMS} />;
}

root.render(pageFor(page));
