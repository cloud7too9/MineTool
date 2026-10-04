# Companion · die Minecraft-App am Handy

Die Companion für die gemeinsame Minecraft-Welt: Karte mit Welt-Import, Sammelobjekte, Portal-Verwaltung, Banner und Rüstung. Sie ist eine **installierbare PWA** und läuft am Handy.

Seit dem 04.10.2026 hat die App ihr **eigenes Repo** (dieses, früher „MineTool“). Vorher lag sie im Repo `flexibel-visionboard` unter `companion/`. Übernommen wurde der Stand `304042b` (04.10.2026) ohne den alten Git-Verlauf. Der **Server** bleibt das Koordinaten-Board im Repo `flexibel-visionboard`. Dort bleiben vorerst auch die Playwright-Tests der Companion, die Werkzeuge für den Welt-Import, das Widget-Dashboard (`companion/widgets/`) und die Fach-Doku (`companion/README.md`, `companion/UEBERGABE.md`).

## Aufbau

```
app/                        ← die App; das Board liefert diesen Ordner aus (COMPANION_ORDNER)
  index.html                ← Companion-Seite (vorher companion-prototyp.html)
  regeln.js                 ← Stammdaten + Regeln, lädt auch der Board-Server
  board-karten.js           ← Anzeigeschemas („Aufs Board“, Widgets), lädt auch der Board-Server
  biom-*.js, vendor/        ← Welt-Import (Web Worker, Dekoder, LevelDB-Bibliothek)
  icons/                    ← Kennblöcke der Strukturen
  ruestungs-baukasten/      ← Bedrock-Texturen, Baukasten, 3D-Figur
  manifest.webmanifest      ← PWA: Name, Farben, Icons, standalone
  sw.js                     ← PWA: Service Worker für den Start ohne Netz
  app-icons/                ← PWA: App-Icons (gebaut von tools/icons-bauen.mjs)
tools/
  server.mjs                ← statischer Server zum Ausprobieren (Demo ohne Board)
  icons-bauen.mjs           ← erzeugt app/app-icons/*.png
tests/
  pwa.test.mjs              ← Playwright: Manifest, Service Worker, offline, Hinweis ohne Board
```

## Zusammen mit dem Board

Beide Repos liegen **nebeneinander im selben Ordner**:

```
…/flexibel-visionboard/     ← Board (Server, Anzeige, Dashboard)
…/Companion/                ← dieses Repo
```

Das Board sucht die App standardmäßig unter `../Companion/app`. Liegt sie woanders: `COMPANION_ORDNER=/pfad/zu/Companion/app`. Ohne die App startet das Board nicht, weil es `regeln.js` und `board-karten.js` von hier lädt.

```bash
git clone https://github.com/cloud7too9/Companion.git      # neben flexibel-visionboard
cd flexibel-visionboard/koordinaten-board && npm start      # liefert die Companion unter / aus
```

## Ohne Board ausprobieren

```bash
npm install
npm start          # http://localhost:8080 – Demo mit Beispielwelt
npm test           # PWA-Prüfungen (Screenshots in tests/ergebnisse/)
npm run icons      # App-Icons neu bauen
```

Ist Chromium nicht an der Stelle, die Playwright erwartet: `CHROMIUM=/pfad/zu/chrome npm test`.

## Betrieb: wie die App zu ihren Daten kommt

| Wie geöffnet | Betrieb | Daten |
|---|---|---|
| vom Board ausgeliefert (`http://<board>:3000/`, QR-Code der Anzeige) | **Live** | auf dem Board, live bei allen |
| vom Board installiert, Board nicht erreichbar | Demo, mit Hinweis „Board nicht erreichbar – nur Demo-Daten“ | Beispielwelt, nur im Tab |
| `npm start`, andere Server, `?demo=1` | Demo | Beispielwelt, nur im Tab |

Die Erkennung: `GET /api/server` muss `{ name: "koordinaten-board" }` liefern. Live geht nur, wenn das Board die App selbst ausliefert. Von einer anderen https-Adresse aus blockiert der Browser die Verbindung zum http-Board.

## PWA

**Installieren:** Seite vom Board öffnen → Teilen → „Zum Home-Bildschirm“. Das Board liefert dafür `manifest.webmanifest`, `sw.js` und `app-icons/` aus (Branch `board/pwa` im Board-Repo).

**Offline gibt es erst mit HTTPS.** Der Browser startet Service Worker nur in einem sicheren Kontext (https oder `localhost`). Am Handy läuft die App über `http://192.168…`. Dort wirken Manifest und Icons (Name, Icon, Vollbild), der Service Worker aber nicht. HTTPS am Board mit eigenem Zertifikat ist entschieden (N5) und kommt mit Offline B3 (`planung/PLAN.md` im Board-Repo).

**Service Worker (`app/sw.js`):**
- Seite, Skripte, JSON: **network-first.** Online kommt immer der aktuelle Stand, offline die letzte Version aus dem Cache. Ein „neue Version verfügbar“ braucht es dadurch nicht.
- Bilder und three.js vom CDN: **cache-first.** Die rund 1.100 Rüstungs-Icons werden beim ersten Ansehen gecacht, nicht vorab.
- Nie angefasst: `/api`, `/ws`, `/anzeige`, `/dashboard`, `/assets` und alles außer GET. Daten kommen immer vom Board.
- `VERSION` in `sw.js` hochzählen, wenn sich die Liste der Shell-Dateien ändert. Alte `companion-*`-Caches werden beim Aktivieren gelöscht.

## Änderungen gegenüber `companion-prototyp.html`

- Kopf: Titel „Companion · Minecraft“, Manifest, App-Icons, `apple-mobile-web-app-title`
- Abschnitt **9z · PWA**: Service Worker registrieren (nur in einem sicheren Kontext)
- `init()`: Hinweis „Board nicht erreichbar – nur Demo-Daten“, wenn die gespeicherte Board-Verbindung zu dieser Adresse gehört, das Board aber nicht antwortet

Alles andere (Bereiche, Regeln, Mock, Accounts, Welt-Import) ist unverändert. Die Fach-Doku dazu steht in `companion/README.md` und `companion/UEBERGABE.md` im Board-Repo.

## Konventionen

Wie im Board-Repo (`UEBERGABE.md` dort): Deutsch in Code, UI und Commits; ein Branch je Bereich (`bereich/<name>`); gemergt wird nur nach Rückfrage bei Max.
