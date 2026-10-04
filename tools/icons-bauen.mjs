// Baut die App-Icons (app/app-icons/*.png) aus einer Pixel-Grafik: Ortsmarker in
// Oberwelt-Grün auf dem Hintergrund der Companion, darunter die drei Dimensionen.
// Aufruf: node tools/icons-bauen.mjs  (braucht Playwright mit Chromium)
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ZIEL = fileURLToPath(new URL("../app/app-icons/", import.meta.url));

// 16 × 16, „#“ = Marker; die Dimensions-Punkte kommen extra dazu
const MARKER = [
  "................",
  "......####......",
  "....########....",
  "...###....###...",
  "..###......###..",
  "..##...##...##..",
  "..##..####..##..",
  "..##..####..##..",
  "..##...##...##..",
  "..###......###..",
  "...###....###...",
  "....###..###....",
  ".....######.....",
  "......####......",
  ".......##.......",
  "................",
];
const FARBEN = { hintergrund: "#0d0f13", marker: "#2ed47e", nether: "#e8443c", ende: "#b274e6" };

/** SVG der Grafik; rand = Anteil des Rands je Seite (maskable braucht eine Schutzzone) */
function svg(rand) {
  const raster = 16, innen = 1 - 2 * rand, z = innen / raster;
  const rechtecke = [];
  MARKER.forEach((zeile, y) => [...zeile].forEach((c, x) => {
    if (c === "#") rechtecke.push(`<rect x="${rand + x * z}" y="${rand + (y - 0.5) * z}" width="${z}" height="${z}" fill="${FARBEN.marker}"/>`);
  }));
  // Oberwelt · Nether · End als Punkte unten
  [FARBEN.marker, FARBEN.nether, FARBEN.ende].forEach((f, i) =>
    rechtecke.push(`<rect x="${rand + (4.5 + i * 2.5) * z}" y="${rand + 14.5 * z}" width="${z * 2}" height="${z}" fill="${f}"/>`));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" shape-rendering="crispEdges">
    <rect width="1" height="1" fill="${FARBEN.hintergrund}"/>${rechtecke.join("")}</svg>`;
}

const ICONS = [
  { datei: "icon-192.png", groesse: 192, rand: 0.06 },
  { datei: "icon-512.png", groesse: 512, rand: 0.06 },
  { datei: "icon-maskable-512.png", groesse: 512, rand: 0.16 },
  { datei: "apple-touch-icon.png", groesse: 180, rand: 0.1 },
  { datei: "favicon-32.png", groesse: 32, rand: 0 },
];

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const seite = await browser.newPage();
for (const { datei, groesse, rand } of ICONS) {
  await seite.setViewportSize({ width: groesse, height: groesse });
  await seite.setContent(`<style>*{margin:0}svg{display:block;width:${groesse}px;height:${groesse}px}</style>${svg(rand)}`);
  await writeFile(path.join(ZIEL, datei), await seite.screenshot({ omitBackground: false }));
  console.log("✓", datei);
}
await browser.close();
