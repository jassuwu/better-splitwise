import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// better splitwise — the mark is a loving parody of the Splitwise app icon: the same
// faceted "gem" house, two changes only — the greens become our lime, and the lone S
// becomes BS (better splitwise, naturally). The "BS" is Comic Code Bold, baked to a
// path so this needs no font installed. Splitwise's exact pinwheel: light (top),
// hero (left), then two darks (right, bottom). Ours runs lime → near-black ink.
//
// One mark, one source of truth: this builds the mobile (Expo) icon set AND the web
// app's favicon/PWA set. Run from apps/mobile:  bun run icons
const INK = '#0c0e12'; // bottom facet + background
const SLATE = '#2a3038'; // right facet
const LIME = '#d4fd80'; // left facet — the hero
const LIMELIGHT = '#e9ffb3'; // top facet
const WHITE = '#ffffff';

const C = '32 26'; // the facet convergence point, just under the roof
const HOUSE = 'M16 51 L16 27 L32 14 L48 27 L48 51 Z';
// "BS" — Comic Code Bold, size 29, baseline y=49, centred on x=32 (font outlines, baked once).
const BS =
  'M17.674 50.421C18.341 50.421 18.921 50.131 19.269 49.638C26.548 49.406 31.362 47.347 31.362 42.968C31.362 41.054 30.202 39.662 28.201 38.676C29.390 37.719 30.115 36.356 30.115 34.645C30.115 30.324 26.490 28.207 20.748 28.207C19.762 28.207 18.660 28.265 17.210 28.410C16.166 28.497 15.354 29.367 15.354 30.440C15.354 32.876 15.644 47.376 15.644 48.391C15.644 49.522 16.543 50.421 17.674 50.421M19.443 32.296C19.907 32.267 20.342 32.267 20.748 32.267C24.489 32.267 26.055 33.079 26.055 34.645C26.055 36.008 24.605 37.023 21.850 37.139C21.096 37.052 20.313 36.994 19.530 36.965M19.588 41.054C24.083 41.286 27.302 42.330 27.302 42.968C27.302 44.186 24.518 45.317 19.675 45.549M40.497 49.493C45.398 49.493 49.081 46.361 49.081 42.185C49.081 38.270 46.036 36.588 40.555 36.327C38.032 36.211 37.771 35.921 37.771 35.283C37.771 33.601 39.105 32.586 41.599 32.586C44.934 32.586 45.398 33.456 46.413 33.456C47.544 33.456 48.443 32.557 48.443 31.426C48.443 30.556 47.892 29.831 47.138 29.541C45.485 28.845 43.658 28.526 41.599 28.526C36.901 28.526 33.711 31.252 33.711 35.283C33.711 38.676 36.060 40.184 40.381 40.387C44.122 40.561 45.021 41.141 45.021 42.185C45.021 44.012 43.194 45.433 40.497 45.433C38.293 45.433 37.046 45.056 35.770 43.983C35.422 43.693 34.958 43.519 34.465 43.519C33.334 43.519 32.435 44.418 32.435 45.549C32.435 46.187 32.725 46.738 33.189 47.115C35.190 48.768 37.423 49.493 40.497 49.493';

/** The four-facet pinwheel, clipped to the tile (rounded for tabs, square for the OS to mask). */
const facets = (id: string) =>
  `<g clip-path="url(#${id})">` +
  `<path d="M${C} L0 0 H64 Z" fill="${LIMELIGHT}"/>` +
  `<path d="M${C} L0 0 V64 Z" fill="${LIME}"/>` +
  `<path d="M${C} L64 0 V64 Z" fill="${SLATE}"/>` +
  `<path d="M${C} L0 64 H64 Z" fill="${INK}"/>` +
  `</g>`;

/** The white house outline + the BS wordmark. `scale` insets it into a mask safe zone. */
const housemark = (scale = 1) => {
  const inner =
    `<path d="${HOUSE}" fill="none" stroke="${WHITE}" stroke-width="3.6" stroke-linejoin="round"/>` +
    `<path d="${BS}" fill="${WHITE}"/>`;
  return scale === 1 ? inner : `<g transform="translate(32 32.5) scale(${scale}) translate(-32 -32.5)">${inner}</g>`;
};

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;
const clip = (rounded: boolean) =>
  `<defs><clipPath id="t"><rect width="64" height="64"${rounded ? ' rx="14"' : ''}/></clipPath></defs>`;

// the full mark — square for OS masking (app icon), rounded for tabs/splash/favicon
const tile = (rounded: boolean) =>
  svg(`${clip(rounded)}<rect width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${INK}"/>${facets('t')}${housemark()}`);
const squareSvg = tile(false);
const roundedSvg = tile(true);
// full-bleed facets + house held in the maskable safe zone (Android adaptive / PWA maskable)
const maskableSvg = svg(`${clip(false)}<rect width="64" height="64" fill="${INK}"/>${facets('t')}${housemark(0.78)}`);
// Android adaptive layers: facets as the background, house+BS as the safe-zone foreground
const bgSvg = svg(`${clip(false)}<rect width="64" height="64" fill="${INK}"/>${facets('t')}`);
const fgSvg = svg(housemark(0.82));

const png = (s: string, size: number): Buffer =>
  Buffer.from(new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng());

/** Pack PNG-encoded images into a multi-resolution .ico (PNG-in-ICO, Vista+). */
function ico(imgs: { size: number; data: Buffer }[]): Buffer {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(imgs.length, 4);
  const dir = Buffer.alloc(16 * imgs.length);
  let offset = 6 + 16 * imgs.length;
  imgs.forEach((img, i) => {
    const e = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 0);
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1);
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(img.data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += img.data.length;
  });
  return Buffer.concat([head, dir, ...imgs.map((i) => i.data)]);
}

const root = new URL('../', import.meta.url);
const assets = fileURLToPath(new URL('assets/', root));
const web = fileURLToPath(new URL('../web/public/', root));

// — Expo (mobile) —
await writeFile(`${assets}images/icon.png`, png(squareSvg, 1024));
await writeFile(`${assets}images/splash-icon.png`, png(roundedSvg, 1024));
await writeFile(`${assets}images/favicon.png`, png(roundedSvg, 196));
await writeFile(`${assets}images/android-icon-background.png`, png(bgSvg, 1024));
await writeFile(`${assets}images/android-icon-foreground.png`, png(fgSvg, 1024));
await writeFile(`${assets}images/android-icon-monochrome.png`, png(svg(housemark(0.82)), 1024));
await writeFile(`${assets}logo.svg`, `${roundedSvg}\n`);

// — web app (apps/web/public) —
await mkdir(web, { recursive: true });
await writeFile(`${web}favicon.svg`, `${roundedSvg}\n`);
await writeFile(`${web}favicon-16.png`, png(squareSvg, 16));
await writeFile(`${web}favicon-32.png`, png(squareSvg, 32));
await writeFile(`${web}favicon.ico`, ico([16, 32, 48].map((s) => ({ size: s, data: png(squareSvg, s) }))));
await writeFile(`${web}apple-touch-icon.png`, png(squareSvg, 180));
await writeFile(`${web}icon-192.png`, png(squareSvg, 192));
await writeFile(`${web}icon-512.png`, png(squareSvg, 512));
await writeFile(`${web}icon-512-maskable.png`, png(maskableSvg, 512));
await writeFile(
  `${web}site.webmanifest`,
  `${JSON.stringify(
    {
      name: 'better splitwise',
      short_name: 'better splitwise',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: INK,
      background_color: INK,
      display: 'standalone',
    },
    null,
    2,
  )}\n`,
);

console.log('built: Expo icons → assets/, web favicon + PWA set → ../web/public/');
