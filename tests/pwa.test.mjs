// PWA-Prüfungen: Manifest + Icons, Service Worker, Start ohne Netz, Hinweis ohne Board.
// Aufruf: npm test   (Screenshots landen in tests/ergebnisse/)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";
import { appAusliefern } from "../tools/server.mjs";

const ERGEBNISSE = fileURLToPath(new URL("ergebnisse/", import.meta.url));
let server, browser;

before(async () => {
  await mkdir(ERGEBNISSE, { recursive: true });
  server = await appAusliefern(0);
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
});
after(async () => { await browser?.close(); await server?.schliessen(); });

/** Neuer Handy-Kontext (iPhone-Maße), Seite geöffnet und Service Worker aktiv */
async function handy() {
  const { defaultBrowserType, ...iphone } = devices["iPhone 13"];
  const kontext = await browser.newContext({ ...iphone, serviceWorkers: "allow" });
  const seite = await kontext.newPage();
  await seite.goto(server.adresse + "/");
  await seite.evaluate(() => navigator.serviceWorker.ready);
  return { kontext, seite };
}

test("Manifest ist verlinkt, vollständig und alle Icons laden", async () => {
  const { kontext, seite } = await handy();
  const href = await seite.getAttribute('link[rel="manifest"]', "href");
  const res = await seite.request.get(new URL(href, server.adresse + "/").href);
  assert.equal(res.status(), 200);
  assert.match(res.headers()["content-type"], /manifest\+json/);
  const m = await res.json();
  assert.equal(m.short_name, "MineTool");
  assert.equal(m.display, "standalone");
  assert.ok(m.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"));
  for (const icon of [...m.icons.map((i) => i.src), "app-icons/apple-touch-icon.png", "app-icons/favicon-32.png"])
    assert.equal((await seite.request.get(`${server.adresse}/${icon}`)).status(), 200, icon);
  await kontext.close();
});

test("Service Worker übernimmt die Seite", async () => {
  const { kontext, seite } = await handy();
  await seite.reload();
  assert.ok(await seite.evaluate(() => Boolean(navigator.serviceWorker.controller)));
  await kontext.close();
});

test("Start ohne Netz: App lädt aus dem Cache und läuft als Demo", async () => {
  const { kontext, seite } = await handy();
  await seite.reload();                      // jetzt über den Service Worker
  await kontext.setOffline(true);
  await seite.reload();
  await seite.waitForFunction(() => document.getElementById("orteStatusLab")?.textContent === "Demo");
  await seite.waitForFunction(() => /Welt 68891/.test(document.querySelector("header")?.innerText || ""));   // Demo-Welt gezeichnet
  assert.equal(await seite.title(), "MineTool · Minecraft Companion");
  assert.ok(await seite.evaluate(() => typeof DIM_ORDER !== "undefined"),
    "regeln.js kommt aus dem Cache");
  await seite.screenshot({ path: ERGEBNISSE + "offline-start.png" });
  await kontext.close();
});

test("Vom Board installiert, Board weg: Hinweis statt stiller Demo-Daten", async () => {
  const { kontext, seite } = await handy();
  await seite.evaluate((adresse) => localStorage.setItem("board.verbindung",
    JSON.stringify({ adresse, token: "t", name: "Max" })), server.adresse);
  await seite.reload();
  await seite.waitForFunction(() => /Board nicht erreichbar/.test(document.getElementById("orteToast")?.textContent || ""));
  await seite.screenshot({ path: ERGEBNISSE + "board-weg.png" });
  await kontext.close();
});
