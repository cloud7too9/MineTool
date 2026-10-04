/* ============================================================================
   Companion · Service Worker
   ----------------------------------------------------------------------------
   Ziel: Die App startet auch ohne Netz (Home-Bildschirm, Flugmodus) und bleibt
   trotzdem immer aktuell.
     Seite, Skripte, JSON  → network-first: online immer frisch, offline aus dem Cache
     Bilder (Icons, Baukasten-Texturen) → cache-first
     Fremde Adressen (three.js vom CDN) → nie; offline zeigt die Rüstung dann die 2D-Figur
     /api, /ws, /anzeige, /dashboard, /assets (alte Anzeige) und alles außer GET → nie angefasst (Daten kommen vom Board)
   Die Seite kommt vom Board bewusst ohne Cache (OHNE_CACHE); network-first
   passt dazu, ein „neue Version → neu laden“ braucht es so nicht.
   VERSION hochzählen, wenn sich die Liste der Shell-Dateien ändert.
   ========================================================================== */
const VERSION = "v1";
const CACHE = `companion-${VERSION}`;

// App-Shell: was für den ersten Start ohne Netz da sein muss
const SHELL = [
  "./",
  "regeln.js",
  "board-karten.js",
  "manifest.webmanifest",
  "app-icons/icon-192.png",
  "app-icons/icon-512.png",
  "app-icons/apple-touch-icon.png",
  "app-icons/favicon-32.png",
  "icons/manifest.json",
  "ruestungs-baukasten/manifest.json",
  "ruestungs-baukasten/baukasten.js",
  "ruestungs-baukasten/figur3d.js",
];
const NIE = /^\/(api|ws|anzeige|dashboard|assets)(\/|$)/;
const BILD = /\.(png|jpe?g|gif|webp|svg)$/i;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Einzeln, damit eine fehlende Datei (z. B. Board ohne Baukasten) nicht alles kippt
    await Promise.all(SHELL.map((url) =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const name of await caches.keys())
      if (name.startsWith("companion-") && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const eigen = url.origin === self.location.origin;
  if (!eigen || NIE.test(url.pathname)) return;

  if (req.mode === "navigate") return e.respondWith(seiteHolen(req));
  if (BILD.test(url.pathname)) return e.respondWith(cacheZuerst(req));
  e.respondWith(netzZuerst(req));
});

/** Seite: frisch vom Netz, offline die gecachte Shell (Abfrage wie ?pin=… egal) */
async function seiteHolen(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put("./", res.clone());
    return res;
  } catch {
    return (await caches.match("./")) || Response.error();
  }
}

async function netzZuerst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function cacheZuerst(req) {
  const cache = await caches.open(CACHE);
  const treffer = await cache.match(req);
  if (treffer) return treffer;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
