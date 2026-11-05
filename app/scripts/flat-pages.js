// After the build, also write /<page>.html next to /<page>/index.html so the
// pages open at "/terms" as well as "/terms/" on any static host.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
for (const page of ['bingo', 'games', 'impressum', 'datenschutz', 'terms']) {
  const from = join(dist, page, 'index.html');
  if (!existsSync(from)) throw new Error(`Missing built page: ${from}`);
  copyFileSync(from, join(dist, `${page}.html`));
}
