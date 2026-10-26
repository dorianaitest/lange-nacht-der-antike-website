# Antike Riddle-Game Pipeline

Zwei Vue-3 / Vite-Projekte für eine die Rätselprojekte für die Veranstaltung "Lange Nacht der Antike".
Der Editor erzeugt Projektkonfiguration, der Viewer spielt ihn ab.
Es gibt kein Backend und keine Server-Komponente, beide Projekte laufen rein im Browser.

## Architektur-Überblick

- `antike-editor/`: browserbasierter SVG-Karten-Editor.
  Ein Autor lädt ein Hintergrund-SVG hoch, markiert Elemente als Rätsel oder Dekoration und konfiguriert die Rätselinhalte.
- `antike-viewer/`: lädt das vom Editor exportierte Zip Dateipaket (`background.svg` + `riddle-config.json` + Icon-/Symbol-Assets).
  Rendert die spielbare Karte und übernimmt Rätsel-Freischaltung sowie Antwortprüfung.
- `shared/`: gemeinsamer Code beider Projekte, kein eigenes npm-Paket.
  Enthält die Spiellogik (`gameLogic.js`), die Spielkarte (`SvgGameMap.vue`), den Spielbildschirm (`GameScreen.vue`), `BaseButton.vue` und die CSS-Klassen der Kartenzustände (`svgGameMap.css`).
  Die Editor-Vorschau und der Viewer spielen das Rätsel über denselben `GameScreen`.

Die beiden Projekte sind über das Zip-/Config-Format und den Ordner `shared/` gekoppelt.
Es gibt keine gemeinsame Datenbank.
Beide binden `shared/` über den Vite-Alias `@shared` ein und bauen weiterhin jeweils ein eigenes statisches `dist/`.
Beide Anwendungen teilen sich dasselbe `elementsData`-Konfigurationsschema und denselben SVG-Rendering-Ansatz. `v-html`-Injection, DOM-Queries auf `svg [id]`-Elemente und CSS-Klassen für Highlight-/Preview-Zustände (die Preview-Zustände liegen in `shared/svgGameMap.css`).

## Setup

Node-Version: `^20.19.0` oder `>=22.12.0`.

Beide Subprojekte werden separat installiert:

```bash
cd antike-editor && npm install
cd antike-viewer && npm install
```

`shared/` braucht nur für die Tests eine eigene Installation:

```bash
cd shared && npm install
npm test
```

## Nutzung

**Editor:**

```bash
cd antike-editor
npm run dev
```

1. SVG-Hintergrund hochladen
2. Elemente als Rätsel oder Dekoration markieren
3. Rätselinhalte konfigurieren
4. Über das `ExportModal` als Zip exportieren (`riddle-config.json` + Icons/Symbole)

**Viewer:**

```bash
cd antike-viewer
npm run dev
```

Das exportierte Zip im Viewer laden, danach ist die Karte inklusive Rätsel-Freischaltung und Antwortprüfung spielbar.

Rätselkonfiguration während der Entwicklung laden:<br>
Datei unter antike-viewer/public/current/riddle.zip ablegen.
Vite serviert alles aus public/ unverändert unter der Root, npm run dev liest sie dann von dort.

Rätselkonfiguration auf dem Webserver laden:<br>
Rätselpaket unter `dist/current/` als `riddle.zip` legen, relativ zum Ort, an dem die gebaute index.html liegt.
Schritt-für-Schritt-Anleitung für Autorinnen und Autoren (Upload mit FileZilla): [`docs/autoren-anleitung/anleitung.pdf`](docs/autoren-anleitung/anleitung.pdf)

## Tech-Stack

- Vue 3 (`^3.5.x`), Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `fflate` für Zip-Erstellung/-Entpacken
- Formatierung: Prettier

## Projektstruktur

```
antike-editor/       Editor-Subprojekt
|-- src/
|   |-- components/
|   |     |-- ...
|   |-- App.vue
|   |-- style.css
|   |-- injectionKeys.js
|   |-- main.js
|   |-- utils/
|         |-- ...
antike-viewer/        Viewer-Subprojekt
|-- src/
|   |-- components/
|   |     |-- ...
|   |-- App.vue
|   |-- style.css
|   |-- main.js
|   |-- utils/
|         |-- ...
|-- public/current/riddle.zip       aktuelles Rätselprojekt
shared/               gemeinsamer Code beider Subprojekte
|-- components/
|   |-- BaseButton.vue
|   |-- GameScreen.vue
|   |-- SvgGameMap.vue
|-- gameLogic.js
|-- gameLogic.test.js
|-- svgGameMap.css
```

## Bekannte Einschränkungen / Bereiche der Weiterentwicklung

- Kein JSON-Schema
- Tests nur für die Spiellogik in `shared/`, nicht für die Komponenten
- Keine Zykluserkennung in Validierung
- Keine DOM-Sanierung Keine DOM-Sanierung
