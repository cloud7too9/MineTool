# MineTool · Minecraft Companion als App

Die Companion für die gemeinsame Minecraft-Welt als **installierbare PWA** am Handy: Karte, Sammelobjekte, Portal-Verwaltung, Banner und Rüstung. Man legt sie auf den Home-Bildschirm, und sie startet auch ohne Netz.

Grundlage ist die Companion aus dem Repo `flexibel-visionboard` (Ordner `companion/`, Stand `c9cabd4` vom 01.10.2026). Die Seite wurde unverändert übernommen und um das ergänzt, was eine App braucht. Der Server bleibt das **Koordinaten-Board** im Repo `flexibel-visionboard`.

## Aufbau

```
app/                        ← die App (zugleich COMPANION_ORDNER fürs Board)
  index.html                ← Companion-Seite (vorher companion-prototyp.html)
  regeln.js                 ← Stammdaten + Regeln, gleiche Datei wie am Board-Server
  manifest.webmanifest      ← Name, Farben, Icons, standalone
  sw.js                     ← Service Worker: Start ohne Netz
  app-icons/                ← App-Icons (gebaut von tools/icons-bauen.mjs)
  icons/                    ← Kennblöcke der Strukturen
  ruestungs-baukasten/      ← Bedrock-Texturen, Baukasten, 3D-Figur
tools/
  server.mjs                ← statischer Server zum Ausprobieren (Demo ohne Board)
  icons-bauen.mjs           ← erzeugt app/app-icons/*.png
tests/
  pwa.test.mjs              ← Playwright: Manifest, Service Worker, offline, Hinweis ohne Board
```

## Schnellstart

```bash
npm install
npm start          # http://localhost:8080 – Demo mit Beispielwelt, ohne Board
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

Die Erkennung ist die der Companion: `GET /api/server` muss `{ name: "koordinaten-board" }` liefern.

**Wichtig für Live:** Das Board läuft über `http`. Eine App, die von einer anderen (https-)Adresse kommt, darf das Board nicht ansprechen (der Browser blockiert gemischte Inhalte). Live geht deshalb nur, wenn das Board die App selbst ausliefert. Installiert wird sie dann von dort: Seite öffnen → Teilen → „Zum Home-Bildschirm“.

### Board auf MineTool umstellen

Das Board liefert die App aus, wenn man es auf diesen Ordner zeigt:

```bash
# im Repo flexibel-visionboard, Ordner koordinaten-board
COMPANION_ORDNER=/pfad/zu/MineTool/app COMPANION_DATEI=index.html npm start
```

Damit kommen Seite, `regeln.js`, `icons/` und `ruestungs-baukasten/` aus MineTool. **Noch offen:** Das Board liefert bisher nur genau diese Pfade aus. Für die Installation braucht es zusätzlich `manifest.webmanifest`, `sw.js` und `app-icons/` (eine kleine Änderung in `koordinaten-board/server/src/server.js`, Branch `board/pwa`). Bis dahin läuft die App vom Board wie bisher im Browser, nur ohne „Zum Home-Bildschirm“ als echte App und ohne Offline-Start.

## Service Worker (`app/sw.js`)

- **Seite, Skripte, JSON: network-first.** Online kommt immer der aktuelle Stand (passt zu `OHNE_CACHE` am Board), offline die letzte Version aus dem Cache. Ein „neue Version verfügbar“ braucht es dadurch nicht.
- **Bilder und three.js vom CDN: cache-first.** Die rund 1.100 Rüstungs-Icons werden beim ersten Ansehen gecacht, nicht vorab.
- **Nie angefasst:** `/api`, `/ws`, `/anzeige`, `/dashboard` und alles außer GET. Daten kommen immer vom Board.
- `VERSION` in `sw.js` hochzählen, wenn sich die Liste der Shell-Dateien ändert. Alte `minetool-*`-Caches werden beim Aktivieren gelöscht.
- Als Datei geöffnet (`file://`) gibt es keinen Service Worker. Die Seite läuft dann wie bisher.

## Änderungen gegenüber `companion-prototyp.html`

- Kopf: Titel „MineTool · Minecraft Companion“, Manifest, App-Icons, `apple-mobile-web-app-title`
- Abschnitt **9z · PWA**: Service Worker registrieren (nur über http(s))
- `init()`: Hinweis „Board nicht erreichbar – nur Demo-Daten“, wenn die gespeicherte Board-Verbindung zu dieser Adresse gehört, das Board aber nicht antwortet

Alles andere (Bereiche, Regeln, Mock, Board-Verbindung) ist unverändert. Technische Einzelheiten dazu stehen in `companion/README.md` im Repo `flexibel-visionboard`.

## Noch nicht übernommen

- **Welt-Import (Biome)**: `biom-dekoder.js`, `biom-welt.js`, `biom-ids.js`, `vendor/` und `tools/` der Companion. Die Seite nutzt sie noch nicht; sie kommen mit dem Upload-Feld (Strang C im Plan).
- **Companion-Tests** (Banner, Portale, Sammelobjekte, Rüstung, Board, Live): Sie laufen weiter im Repo `flexibel-visionboard` gegen `companion/`.
- **Offline mit echten Daten** (IndexedDB, Warteschlange, Accounts): Strang B im Plan `planung/PLAN.md`. Bis dahin ist offline nur die Demo möglich.
