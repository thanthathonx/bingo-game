import { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Mascot from './Mascot.jsx';

/**
 * The mascot as a real <img> (an inline SVG data address), for pages where it is a picture.
 * @param {{ size?: number, prop?: string, tint?: string, alt?: string, className?: string }} props
 */
export default function MascotImg({ size = 64, prop = 'card', tint, alt = '', className = '' }) {
  const src = useMemo(() => {
    const markup = renderToStaticMarkup(<Mascot size={size} prop={prop} tint={tint} />);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }, [size, prop, tint]);
  return <img src={src} width={size} height={size} alt={alt} className={className} decoding="async" />;
}
