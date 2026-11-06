import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useLang } from '../shared/i18n.js';
import { IconCopy } from '../shared/icons.jsx';
import { isOnlineCode } from './protocol.js';

/** The link a friend opens to land on the join form with the code filled in. */
export function inviteLink(code, origin = window.location.origin) {
  return `${origin}/?room=${encodeURIComponent(code)}`;
}

/**
 * Host lobby: QR code + invite link, so 200 people can join by scanning instead of typing.
 * @param {{ code: string, hidden?: boolean, big?: boolean, count?: number }} props
 *   hidden: streamer mode — don't show anything that reveals the code
 */
export default function InviteCard({ code, hidden = false, big = false, count = 0 }) {
  const { t } = useLang();
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const link = isOnlineCode(code) ? inviteLink(code) : '';

  useEffect(() => {
    if (!link || hidden) return undefined;
    let alive = true;
    QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1b1533', light: '#ffffff' } })
      .then((s) => alive && setSvg(s))
      .catch((err) => console.error('[bingo] QR code failed', err?.message));
    return () => { alive = false; };
  }, [link, hidden]);

  if (!link || hidden) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={`panel invite-card${big ? ' is-big' : ''}`} aria-label={t('inviteTitle')}>
      {/* The SVG comes from the qrcode library, built from our own validated link. */}
      <div className="invite-qr" role="img" aria-label={`QR: ${link}`} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="invite-text">
        <h2 className="panel-title">{t('inviteTitle')}</h2>
        <p className="invite-code">{code}</p>
        <p className="invite-link">{link.replace(/^https?:\/\//, '')}</p>
        <button type="button" className="ghost-btn" onClick={copy}>
          <IconCopy size={16} /> {copied ? '✓' : t('copyLink')}
        </button>
        <p className="invite-count" role="status"><b>{count}</b> {t('joinedCount')}</p>
      </div>
    </section>
  );
}
