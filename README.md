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
  Außerdem liegt hier das JSON-Schema des Config-Formats (`riddle-config.schema.json`) mit seinem Validator (`validateRiddleConfig.js`).
  Der Viewer prüft damit jede geladene `riddle-config.json`, der Editor jede importierte und jede exportierte.
  Bei einem Fehler zeigen beide auf Deutsch, was genau falsch ist, z. B. welches Feld bei welchem Rätsel fehlt oder einen unerlaubten Wert hat.
  Beim Laden eines Zips prüft `validateRiddleZip.js` außerdem, ob `background.svg` und `riddle-config.json` vorhanden und lesbar sind und ob alle in der Config genannten Icons und Symbole im Zip liegen.

Die beiden Projekte sind über das Zip-/Config-Format und den Ordner `shared/` gekoppelt.
Es gibt keine gemeinsame Datenbank.
Beide binden `shared/` über den Vite-Alias `@shared` ein und bauen weiterhin jeweils ein eigenes statisches `dist/`.
Beide Anwendungen teilen sich dasselbe `elementsData`-Konfigurationsschema und denselben SVG-Rendering-Ansatz. `v-html`-Injection, DOM-Queries auf `svg [id]`-Elemente und CSS-Klassen für Highlight-/Preview-Zustände (die Preview-Zustände liegen in `shared/svgGameMap.css`).

## Setup

Node-Version: `^20.19.0` oder `>=22.12.0`.

`shared/` und beide Subprojekte werden separat installiert.
`shared/` muss zuerst installiert sein, sonst schlagen `npm run dev` und `npm run build` beider Apps fehl, weil der Validator `ajv` und der SVG-Bereiniger `dompurify` aus `shared/node_modules` geladen werden:

```bash
cd shared && npm install
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
Schritt-für-Schritt-Anleitung für Autorinnen und Autoren (Upload mit FileZilla): [`docs/autoren-anleitung/anleitung.pdf`](docs/autoren-anleitung/anleitung.pdf)
Vorgaben für die Gestaltung der SVG-Karte (für externe Designerinnen und Designer): [`docs/designer-vorgaben/vorgaben.pdf`](docs/designer-vorgaben/vorgaben.pdf)

## Tests

Die Spiellogik in `shared/gameLogic.js` ist mit Vitest getestet, die Tests liegen in `shared/gameLogic.test.js`.
Sie prüfen Antwortprüfung, Freischaltregeln, Karten- und Dekorationszustände, Zeitformat und Symbolvergabe.
Außerdem prüfen sie `checkUnlockGraph`, das Rätsel findet, die nie freigeschaltet werden können, weil keine ihrer Voraussetzungen von einem Start-Rätsel aus erreichbar ist.
Der Editor zeigt solche Rätsel als Fehler und blockiert den Export, die zugehörigen Meldungen sind in `shared/editorValidateConfig.test.js` getestet.
Das JSON-Schema ist in `shared/validateRiddleConfig.test.js` getestet.
Diese Tests prüfen gültige und ungültige Configs beider Modi und erzeugen außerdem Configs mit dem `buildRiddleConfig` des Editors, damit Schema und Export nicht auseinanderlaufen.
Außerdem prüfen sie den genauen Wortlaut der deutschen Fehlermeldungen für jede Fehlerart.
Die Zip-Prüfung ist in `shared/validateRiddleZip.test.js` getestet, mit `happy-dom` als Browser-Umgebung für den SVG-Parser.
Die Vue-Komponenten und die Darstellung im Browser sind nicht abgedeckt.

```bash
cd shared
npm install                              # einmalig
npm test                                 # alle Tests einmal ausführen
npx vitest run --reporter=verbose        # eine Zeile pro Test
npx vitest                               # Watch-Modus, führt die Tests bei jeder Änderung neu aus
```

Jede Zeile der Ausgabe hat die Form `Datei > Funktion > erwartetes Verhalten`.
`✓` bedeutet bestanden, `×` fehlgeschlagen.
Bei einem Fehler zeigt Vitest den erwarteten Wert (`Expected`), den tatsächlichen Wert (`Received`) und die Zeile des fehlgeschlagenen `expect`.

## Tech-Stack

- Vue 3 (`^3.5.x`), Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `fflate` für Zip-Erstellung/-Entpacken
- `ajv` für die Schema-Validierung der `riddle-config.json`
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
|-- editorValidateConfig.test.js
|-- gameLogic.js
|-- gameLogic.test.js
|-- makeTestConfig.js
|-- riddle-config.schema.json
|-- svgGameMap.css
|-- validateRiddleConfig.js
|-- validateRiddleConfig.test.js
|-- validateRiddleZip.js
|-- validateRiddleZip.test.js
|-- vitest.config.js
```

## Bekannte Einschränkungen / Bereiche der Weiterentwicklung

- Tests nur für die Spiellogik in `shared/`, nicht für die Komponenten
- Keine Zykluserkennung in Validierung
- Die Karten-SVG wird beim Laden mit DOMPurify bereinigt (keine Skripte, keine externen Verweise), es gibt aber keine Content Security Policy
