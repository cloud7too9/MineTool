// Kleiner statischer Server für app/ – zum Ausprobieren der PWA ohne Board (DEMO-Mock).
// Service Worker brauchen http(s); localhost zählt als sicher.
// Aufruf: npm start  →  http://localhost:8080   (Port über PORT)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const APP = fileURLToPath(new URL("../app/", import.meta.url));
const TYPEN = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
};

/** Startet den Server → { adresse, schliessen() } */
export async function appAusliefern(port = 8080, host = "127.0.0.1") {
  const server = createServer(async (req, res) => {
    let pfad = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^[/\\]+/, "");
    if (pfad === "" || pfad.endsWith(path.sep)) pfad += "index.html";
    const datei = path.join(APP, pfad);
    if (path.relative(APP, datei).startsWith("..")) { res.writeHead(403).end(); return; }
    try {
      const inhalt = await readFile(datei);
      res.writeHead(200, { "content-type": TYPEN[path.extname(datei)] ?? "application/octet-stream", "cache-control": "no-cache" })
        .end(inhalt);
    } catch {
      res.writeHead(404, { "content-type": "application/json" }).end('{"fehler":"Nicht gefunden"}');
    }
  });
  await new Promise((ok) => server.listen(port, host, ok));
  return { adresse: `http://${host === "0.0.0.0" ? "localhost" : host}:${server.address().port}`,
    schliessen: () => new Promise((ok) => server.close(ok)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { adresse } = await appAusliefern(Number(process.env.PORT) || 8080, process.env.HOST || "0.0.0.0");
  console.log(`Companion läuft (Demo ohne Board): ${adresse}`);
}
