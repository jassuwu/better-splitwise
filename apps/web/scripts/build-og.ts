import { Resvg } from "@resvg/resvg-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// 1200x630 social card. like quilt's build-og: hand-built svg -> png via resvg.
// the panel shows the product (a balances card: who owes whom), not just a logo.

const W = 1200;
const H = 630;

const C = {
  bg: "#0c0e12",
  panel: "#14181d",
  line: "#242b33",
  ink: "#f4f6f8",
  muted: "#8b939c",
  lime: "#d4fd80",
  avatar: "#20262e",
  owed: "#30d158", // they owe you (green)
  owe: "#ff453a", // you owe (red)
};

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// inline the app icon (favicon.svg) as a scaled group
const fav = await readFile(here("../public/favicon.svg"), "utf8");
const favInner = fav
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");
const logo = `<g transform="translate(64 48) scale(1.375)">${favInner}</g>`;

// the balances shown in the card — net to the overall figure (1373 + 810 - 187 = 1996)
const rows = [
  { initial: "A", name: "aanya", amount: "+₹1,373", color: C.owed },
  { initial: "R", name: "rahul", amount: "+₹810", color: C.owed },
  { initial: "K", name: "kabir", amount: "−₹187", color: C.owe },
];

const rowSvg = rows
  .map((r, i) => {
    const y = 438 + i * 54;
    return `
    <circle cx="136" cy="${y - 9}" r="23" fill="${C.avatar}"/>
    <text x="136" y="${y - 1}" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="22" fill="${C.lime}">${r.initial}</text>
    <text x="178" y="${y}" font-family="Montserrat" font-weight="600" font-size="27" fill="${C.ink}">${r.name}</text>
    <text x="1088" y="${y}" text-anchor="end" font-family="Montserrat" font-weight="700" font-size="27" fill="${r.color}">${r.amount}</text>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${logo}
  <text x="176" y="118" font-family="Montserrat" font-weight="800" font-size="56"><tspan fill="${C.lime}">better</tspan><tspan fill="${C.ink}"> splitwise</tspan></text>
  <text x="66" y="180" font-family="Montserrat" font-weight="600" font-size="27" fill="${C.muted}">who owes whom, and a fast way to split the bill.</text>

  <rect x="64" y="212" width="1072" height="356" rx="24" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>
  <text x="112" y="282" font-family="Montserrat" font-weight="600" font-size="24" fill="${C.muted}">you're owed, overall</text>
  <text x="110" y="356" font-family="Montserrat" font-weight="800" font-size="72" fill="${C.owed}">₹1,996</text>
  <line x1="112" y1="392" x2="1088" y2="392" stroke="${C.line}" stroke-width="1.5"/>
  ${rowSvg}

  <text x="64" y="606" font-family="Montserrat" font-weight="600" font-size="22" fill="${C.muted}">an unofficial splitwise client</text>
  <text x="1136" y="606" text-anchor="end" font-family="Montserrat" font-weight="600" font-size="24" fill="${C.lime}">bettersplitwise.jass.gg</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  font: {
    loadSystemFonts: false,
    defaultFontFamily: "Montserrat",
    fontFiles: [
      here("./fonts/Montserrat-SemiBold.ttf"),
      here("./fonts/Montserrat-Bold.ttf"),
      here("./fonts/Montserrat-ExtraBold.ttf"),
    ],
  },
});

const outDir = here("../public/");
await mkdir(outDir, { recursive: true });
await writeFile(here("../public/og.png"), Buffer.from(resvg.render().asPng()));
console.log("wrote apps/web/public/og.png");
