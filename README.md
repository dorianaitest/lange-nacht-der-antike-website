# Antike Riddle-Game Pipeline

Zwei Vue-3 / Vite-Projekte für eine die Rätselprojekte für die Veranstaltung "Lange Nacht der Antike".
Der Editor erzeugt Projektkonfiguration, der Viewer spielt ihn ab.
Es gibt kein Backend und keine Server-Komponente, beide Projekte laufen rein im Browser.

## Architektur-Überblick

- `antike-editor/`: browserbasierter SVG-Karten-Editor.
  Ein Autor lädt ein Hintergrund-SVG hoch, markiert Elemente als Rätsel oder Dekoration und konfiguriert die Rätselinhalte.
- `antike-viewer/`: lädt das vom Editor exportierte Zip Dateipaket (`background.svg` + `riddle-config.json` + Icon-/Symbol-Assets).
  Rendert die spielbare Karte und übernimmt Rätsel-Freischaltung sowie Antwortprüfung.

Die beiden Projekte sind ausschließlich über das Zip-/Config-Format gekoppelt. Es gibt derzeit keinen gemeinsamen Code und keine gemeinsame Datenbank.
Beide Anwendungen teilen sich dasselbe `elementsData`-Konfigurationsschema und denselben SVG-Rendering-Ansatz. `v-html`-Injection, DOM-Queries auf `svg [id]`-Elemente und CSS-Klassen in `style.css` für Highlight-/Preview-Zustände.

## Setup

Node-Version: `^20.19.0` oder `>=22.12.0`.

Beide Subprojekte werden separat installiert:

```bash
cd antike-editor && npm install
cd antike-viewer && npm install
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
```

## Bekannte Einschränkungen / Bereiche der Weiterentwicklung

- Kein JSON-Schema
- Kein geteilter Code --> Dopplungen in der Logik
- Keine Testsuite
- Keine Zykluserkennung in Validierung
- Keine DOM-Sanierung Keine DOM-Sanierung
