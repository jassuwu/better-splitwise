import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// better splitwise — the mark is a loving parody of the Splitwise app icon: the same
// faceted "gem" house, two changes only — the greens become our lime, and the lone S
// becomes BS (better splitwise, naturally). The "BS" is set in Montserrat ExtraBold —
// Splitwise's own brand typeface — recreated as outline paths so this needs no font
// installed. Splitwise's exact pinwheel: light (top),
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
// "BS" — Montserrat ExtraBold (Splitwise's own typeface), size 25, baseline y=49.5,
// centred on x=32, recreated as outlines so this needs no font installed.
const BS =
  'M25.500 49.500L16.050 49.500L16.050 32L25 32Q28.450 32 30.150 33.263Q31.850 34.525 31.850 36.575Q31.850 37.925 31.150 38.925Q30.525 39.800 29.475 40.375Q29.650 40.425 29.800 40.475Q31.175 41.050 31.937 42.112Q32.700 43.175 32.700 44.700Q32.700 46.975 30.862 48.237Q29.025 49.500 25.500 49.500M20.950 42.375L20.950 45.925L25.100 45.925Q26.375 45.925 27.037 45.487Q27.700 45.050 27.700 44.150Q27.700 43.250 27.037 42.813Q26.375 42.375 25.100 42.375L20.950 42.375M20.950 35.575L20.950 38.950L24.350 38.950Q25.600 38.950 26.225 38.525Q26.850 38.100 26.850 37.250Q26.850 36.400 26.225 35.987Q25.600 35.575 24.350 35.575L20.950 35.575M41.425 49.850Q39.275 49.850 37.288 49.313Q35.300 48.775 34.050 47.925L35.675 44.275Q36.850 45.025 38.388 45.513Q39.925 46 41.450 46Q42.475 46 43.100 45.813Q43.725 45.625 44.013 45.313Q44.300 45 44.300 44.575Q44.300 43.975 43.750 43.625Q43.200 43.275 42.325 43.050Q41.450 42.825 40.388 42.600Q39.325 42.375 38.262 42.025Q37.200 41.675 36.325 41.112Q35.450 40.550 34.900 39.638Q34.350 38.725 34.350 37.325Q34.350 35.750 35.212 34.475Q36.075 33.200 37.800 32.425Q39.525 31.650 42.100 31.650Q43.825 31.650 45.487 32.037Q47.150 32.425 48.450 33.175L46.925 36.850Q45.675 36.175 44.450 35.837Q43.225 35.500 42.075 35.500Q41.050 35.500 40.425 35.712Q39.800 35.925 39.525 36.275Q39.250 36.625 39.250 37.075Q39.250 37.650 39.788 37.987Q40.325 38.325 41.212 38.538Q42.100 38.750 43.163 38.975Q44.225 39.200 45.288 39.538Q46.350 39.875 47.225 40.438Q48.100 41 48.638 41.913Q49.175 42.825 49.175 44.200Q49.175 45.725 48.313 47.013Q47.450 48.300 45.737 49.075Q44.025 49.850 41.425 49.850';

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
