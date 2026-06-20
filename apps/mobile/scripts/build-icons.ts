import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// better splitwise — the "split coin": a circle halved with a gap (the split),
// left = Splitwise's heritage teal-green, right = the Better lime. On near-black.
const BG = '#0c0e12';
const TEAL = '#1ec9a0'; // splitwise heritage green (left half)
const LIME = '#d4fd80'; // better accent (right half)

/** Two half-disc paths separated by a 3px gap, centred at (32,32). */
function coin(r: number): string {
  const d = 1.5; // half-gap
  const hc = Math.sqrt(r * r - d * d);
  const top = (32 - hc).toFixed(2);
  const bot = (32 + hc).toFixed(2);
  return (
    `<path d="M${32 - d} ${top} A${r} ${r} 0 0 0 ${32 - d} ${bot} Z" fill="${TEAL}"/>` +
    `<path d="M${32 + d} ${top} A${r} ${r} 0 0 1 ${32 + d} ${bot} Z" fill="${LIME}"/>`
  );
}

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;
const fullSvg = svg(`<rect width="64" height="64" fill="${BG}"/>${coin(19)}`); // iOS full-bleed (system masks corners)
const roundedSvg = svg(`<rect width="64" height="64" rx="14" fill="${BG}"/>${coin(19)}`); // web / favicon
const markSvg = svg(coin(16)); // transparent mark, for splash + android adaptive foreground

const assets = fileURLToPath(new URL('../assets/', import.meta.url));

function png(s: string, size: number): Buffer {
  return Buffer.from(new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng());
}

await writeFile(`${assets}images/icon.png`, png(fullSvg, 1024));
await writeFile(`${assets}images/splash-icon.png`, png(markSvg, 1024));
await writeFile(`${assets}images/android-icon-foreground.png`, png(markSvg, 1024));
await writeFile(`${assets}images/favicon.png`, png(roundedSvg, 196));
await writeFile(`${assets}logo.svg`, `${roundedSvg}\n`);

console.log('built: icon.png, splash-icon.png, android-icon-foreground.png, favicon.png, logo.svg');
