/*
 * HomeAssistantXP – Feinschliff für Stellen, die das Theme nicht erreicht
 * Version: 1.3.1
 * Wird von der Integration HomeAssistantXP geladen (Option "Feinschliff").
 * Optional: Ohne das Modul bleibt das Design an wenigen Stellen unfertig
 * (Logbuch: Hinweisfeld, Kontrollkästchen, runde Symbole, Pfeilknöpfe beim
 * Zeitraum; überall: Scrollleisten im XP-Look). Alles andere im Design
 * läuft ohne.
 *
 * 1. Scrollleisten: XP-Look mit Pfeilknöpfen und gerastertem Schacht.
 *    Das geht nur mit ::-webkit-scrollbar, und das muss in jedem Shadow-Root
 *    stehen. Darum hängt das Modul ein Stylesheet an alle vorhandenen und
 *    alle künftigen Shadow-Roots (auch wenn Lit deren Liste neu setzt).
 * 2. Einzelne Bauteile (BAUTEIL_CSS): Regeln, die beim Anlegen des jeweiligen
 *    Bauteils in dessen Shadow-Root kommen (Suchfeld, Schiebeschalter,
 *    Symbolknöpfe, Zurück-Pfeil, Hauptknopf). Greift auch auf Fehlerseiten
 *    und in den Einstellungen, wohin das Theme keinen Pfad hat.
 * 3. Logbuch (siehe PANELS unten).
 *
 * Warum: UIX kennt für das Logbuch keinen Einstiegspunkt, die Bauteile
 * liegen tief in Shadow-Roots. Dieses Modul legt darum in die Shadow-Roots
 * der betroffenen Bauteile ein <style> mit Regeln, die die xp-*-Variablen
 * des Designs nutzen (folgt also allen Farbschemata).
 *
 * Bewusst einfach: kein MutationObserver (der hat die Oberfläche schon
 * einmal eingefroren), sondern ein ruhiger Takt, der nur läuft, solange das
 * Logbuch offen ist. Neue Regeln für weitere Seiten: PANELS ergänzen.
 */

const TAKT = 800; // ms zwischen zwei Durchläufen

const KNOPF_OHNE_KREIS = `
  /* kein runder Hover-Kreis hinter dem eckigen Knopf */
  ha-button::after {
    display: none !important;
  }
`;

const PANELS = [
  {
    pfad: /^\/logbook(\/|$)/,
    host: "ha-panel-logbook",
    regeln: {
      // Hinweisfeld "Alle Aktivitäten werden angezeigt …" mit Rahmen
      "ha-sources-picker": `
        .description {
          box-sizing: border-box;
          padding: 8px 10px;
          background: var(--xp-window);
          color: var(--xp-window-text);
          box-shadow: var(--xp-sunken);
        }
      `,
      // Pfeile beim Zeitraum und andere Symbolknöpfe
      "ha-icon-button": KNOPF_OHNE_KREIS,
      // Zeitraum-Auswahl: kein runder Außenrahmen um Pfeile und Datumsfeld
      "ha-date-range-nav": `
        .date-range-inputs {
          gap: 3px !important;
          overflow: visible !important;
          border: none !important;
          border-radius: 0 !important;
        }
        /* rechts schmilzt die helle Kante des Feldes mit der des Knopfs
           optisch zusammen, darum dort etwas mehr Luft */
        ha-icon-button-next {
          margin-inline-start: 2px;
        }
        .range {
          border-inline: none !important;
        }
      `,
      // Kontrollkästchen in den Filterlisten wie im Rest des Designs
      "ha-checkbox": `
        :host {
          --checked-icon-color: var(--xp-window-text);
        }
        [part~="control"],
        [part~="control"]:has(:checked, :indeterminate) {
          width: 13px;
          height: 13px;
          border: none !important;
          border-radius: 0 !important;
          background: var(--xp-window) !important;
          color: var(--xp-window-text) !important;
          box-shadow: var(--xp-sunken) !important;
        }
      `,
      // Zeitleiste: eckige statt runde Symbole
      "ha-logbook-entry": `
        .node-glyph,
        .node-glyph::before,
        .node-badge {
          border-radius: 0 !important;
        }
      `,
    },
  },
];

const haRoot = () => document.querySelector("home-assistant");

// Tiefensuche durch alle Shadow-Roots nach dem ersten Element mit diesem Tag
const finde = (root, tag) => {
  const direkt = root.querySelector(tag);
  if (direkt) return direkt;
  for (const el of root.querySelectorAll("*")) {
    if (el.shadowRoot) {
      const treffer = finde(el.shadowRoot, tag);
      if (treffer) return treffer;
    }
  }
  return null;
};

// Regeln in alle passenden Bauteile unterhalb von root einspielen
const einspielen = (root, regeln) => {
  for (const el of root.querySelectorAll("*")) {
    const sr = el.shadowRoot;
    if (!sr) continue;
    const css = regeln[el.localName];
    // Nicht nach ":scope" suchen: das hat die Oberfläche schon einmal eingefroren
    if (css && !sr.querySelector("style[data-xp-panels]")) {
      const s = document.createElement("style");
      s.dataset.xpPanels = "";
      s.textContent = css;
      sr.appendChild(s);
    }
    einspielen(sr, regeln);
  }
};

let panelEl = null;

const takt = () => {
  const panel = PANELS.find((p) => p.pfad.test(location.pathname));
  if (!panel) {
    panelEl = null;
    return;
  }
  if (!panelEl || !panelEl.isConnected || panelEl.localName !== panel.host) {
    const ha = haRoot();
    panelEl = ha?.shadowRoot ? finde(ha.shadowRoot, panel.host) : null;
  }
  if (panelEl?.shadowRoot) einspielen(panelEl.shadowRoot, panel.regeln);
};

if (!window.__xpPanels) {
  window.__xpPanels = setInterval(takt, TAKT);
}

// ---------------------------------------------------------------------
// Scrollleisten im XP-Look
// ---------------------------------------------------------------------

// Pfeil aus 1-Pixel-Streifen, Farbe = Textfarbe des Designs
const pfeil = (richtung) => {
  const f = "linear-gradient(var(--xp-text, #000), var(--xp-text, #000))";
  const stufen = richtung === "up" || richtung === "left" ? [1, 3, 5, 7] : [7, 5, 3, 1];
  return stufen
    .map((n, i) => {
      const versatz = 7 - (n - 1) / 2;
      return richtung === "up" || richtung === "down"
        ? `${f} ${versatz}px ${6 + i}px / ${n}px 1px no-repeat`
        : `${f} ${6 + i}px ${versatz}px / 1px ${n}px no-repeat`;
    })
    .join(", ");
};

const SCROLL_CSS = `
  /* sonst schalten scrollbar-color/-width die ::-webkit-scrollbar-Regeln ab */
  * { scrollbar-color: auto !important; }
  .ha-scrollbar { scrollbar-width: auto !important; }
  ::-webkit-scrollbar {
    width: 16px !important;
    height: 16px !important;
    background-color: var(--xp-light, #f7f6ee) !important;
  }
  ::-webkit-scrollbar-track {
    border-radius: 0 !important;
    background: var(--xp-light, #f7f6ee) !important;
    box-shadow: inset 1px 0 var(--xp-shadow, #aca899), inset 0 1px var(--xp-shadow, #aca899) !important;
  }
  ::-webkit-scrollbar-thumb {
    border: none !important;
    border-radius: 3px !important;
    background: linear-gradient(90deg, color-mix(in srgb, var(--xp-select, #316ac5) 30%, var(--xp-window, #fff)), color-mix(in srgb, var(--xp-select, #316ac5) 55%, var(--xp-window, #fff))) !important;
    box-shadow: inset 0 0 0 1px var(--xp-select, #316ac5), inset 0 0 0 2px rgba(255, 255, 255, 0.5) !important;
  }
  ::-webkit-scrollbar-corner {
    background: var(--xp-face, #ece9d8) !important;
  }
  ::-webkit-scrollbar-button:single-button {
    display: block !important;
    width: 16px !important;
    height: 16px !important;
    background-color: color-mix(in srgb, var(--xp-select, #316ac5) 25%, var(--xp-window, #fff)) !important;
    background-repeat: no-repeat !important;
    border-radius: 3px !important;
    box-shadow: inset 0 0 0 1px var(--xp-select, #316ac5), inset 0 0 0 2px rgba(255, 255, 255, 0.5) !important;
  }
  ::-webkit-scrollbar-button:single-button:active {
    box-shadow: var(--xp-sunken) !important;
  }
  ::-webkit-scrollbar-button:vertical:start:decrement { background: ${pfeil("up")}, color-mix(in srgb, var(--xp-select, #316ac5) 25%, var(--xp-window, #fff)) !important; }
  ::-webkit-scrollbar-button:vertical:end:increment { background: ${pfeil("down")}, color-mix(in srgb, var(--xp-select, #316ac5) 25%, var(--xp-window, #fff)) !important; }
  ::-webkit-scrollbar-button:horizontal:start:decrement { background: ${pfeil("left")}, color-mix(in srgb, var(--xp-select, #316ac5) 25%, var(--xp-window, #fff)) !important; }
  ::-webkit-scrollbar-button:horizontal:end:increment { background: ${pfeil("right")}, color-mix(in srgb, var(--xp-select, #316ac5) 25%, var(--xp-window, #fff)) !important; }
  ::-webkit-scrollbar-button:vertical:start:increment,
  ::-webkit-scrollbar-button:vertical:end:decrement,
  ::-webkit-scrollbar-button:horizontal:start:increment,
  ::-webkit-scrollbar-button:horizontal:end:decrement {
    display: none !important;
  }
`;

// Regeln für einzelne Bauteile, nach Tag des Bauteils (stehen in dessen eigenem
// Shadow-Root, also auch dort, wo kein UIX-Pfad hinkommt, z. B. Fehlerseiten)
const BAUTEIL_CSS = {
  // Zurück-Pfeil in Kopfleisten: klein und grau wie die anderen Knöpfe
  "ha-icon-button-arrow-prev": `
    :host {
      --ha-icon-button-size: 22px;
      --mdc-icon-size: 16px;
      --ha-button-box-shadow: none;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 22px;
      color: var(--xp-text) !important;
      background: var(--xp-face);
      box-shadow: var(--xp-raised); border-radius: var(--xp-radius, 3px);
    }
    :host(:active) {
      box-shadow: var(--xp-sunken);
    }
    /* Block statt Inline-Box: sonst sitzt der Pfeil um die Zeilenhöhe zu tief */
    ha-icon-button {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }
  `,
  // Gruppenüberschriften der Tabellen: etwas Luft zwischen Knopf und Text
  "ha-data-table": `
    .group-header ha-icon-button {
      margin-inline-end: 6px;
    }
  `,
  // Reiterzeile der Einstellungsseiten (Automationen, Szenen, …): Register-
  // karten statt Text mit Unterstrich; die aktive ist höher
  "hass-tabs-subpage": `
    .toolbar-content {
      padding: 0 6px !important;
      align-items: flex-end !important;
    }
    .toolbar-content ha-icon-button-arrow-prev {
      align-self: center;
    }
    #toolbar-icon {
      align-self: center;
    }
    #tabbar:not(.bottom-bar) {
      justify-content: flex-start;
      align-items: flex-end;
      align-self: stretch;
      margin-inline-start: 6px;
    }
    #tabbar > a {
      display: flex;
      align-items: flex-end;
      max-width: none;
    }
    .toolbar {
      box-shadow: inset 0 -1px var(--xp-highlight);
      position: relative;
    }
    /* Blaue Titelleiste über der Reiterzeile: HA reserviert dafür oben Platz
       (--safe-area-inset-top), Toolbar und Inhalt rücken entsprechend nach unten */
    :host {
      --safe-area-inset-top: 24px;
    }
    .toolbar::before {
      content: var(--xp-seitentitel, "Settings");
      position: absolute;
      top: 3px;
      left: 3px;
      right: 3px;
      height: 18px;
      box-sizing: border-box;
      padding: 0 60px 0 4px;
      background: var(--xp-title-bar); border-radius: var(--xp-radius-title, 5px 5px 0 0);
      color: var(--xp-title-text);
      font-family: var(--xp-font);
      font-size: 13px;
      font-weight: bold;
      line-height: 18px;
    }
    :host(:lang(de)) .toolbar::before {
      content: var(--xp-seitentitel, "Einstellungen");
    }
    .toolbar::after {
      content: "";
      position: absolute;
      top: 4px;
      right: 5px;
      width: var(--xp-title-buttons-width, 50px);
      height: 16px;
      background: var(--xp-title-buttons) no-repeat;
    }
  `,
  "ha-tab": `
    :host {
      color: var(--xp-text) !important;
      display: flex;
      align-items: flex-end;
    }
    div {
      box-sizing: border-box;
      width: auto;
      height: 24px;
      margin-bottom: 2px;
      padding: 0 10px !important;
      background: var(--xp-face);
      color: var(--xp-text);
      box-shadow: inset 1px 1px var(--xp-highlight), inset 2px 2px var(--xp-light), inset -1px 0 var(--xp-dark), inset -2px 0 var(--xp-shadow);
      clip-path: polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 0 100%, 0 2px);
    }
    :host([active]) {
      position: relative;
      z-index: 1;
      margin-inline: -2px;
    }
    :host([active]) div,
    :host(:not([narrow])[active]) div {
      height: 30px;
      margin-bottom: 0;
      padding: 0 12px 3px !important;
      border-bottom: none !important;
    }
    div:focus-visible::before {
      display: none;
    }
  `,
  // Reiterzeile unter der Titelleiste (Werkzeuge): nur für Gruppen im Unterzeilen-
  // Platz der Kopfleiste, damit die Dashboard-Reiter (UIX) unberührt bleiben
  "ha-tab-group": `
    :host([slot="subRow"]) {
      --track-width: 0px;
      --indicator-color: transparent;
    }
    :host([slot="subRow"]) .nav-container {
      padding: 0 !important;
    }
  `,
  // Dieselbe Registerkarten-Optik wie die Dashboard-Reiter (kopfleiste.css), hier
  // von innen, damit sie auch unter der Titelleiste (Werkzeuge) greift
  "ha-tab-group-tab": `
    :host {
      opacity: 1 !important;
      color: var(--xp-text) !important;
      display: inline-flex !important;
      align-items: flex-end;
    }
    .tab {
      box-sizing: border-box;
      height: 24px;
      margin-bottom: 2px;
      padding: 0 10px;
      border: none;
      background: var(--xp-face);
      color: var(--xp-text) !important;
      font-weight: normal;
      box-shadow: inset 1px 1px var(--xp-highlight), inset 2px 2px var(--xp-light), inset -1px 0 var(--xp-dark), inset -2px 0 var(--xp-shadow);
      clip-path: polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 0 100%, 0 2px);
      transition: none;
    }
    :host([active]) {
      position: relative;
      z-index: 1;
      margin-inline: -2px;
    }
    :host([active]) .tab {
      height: 30px;
      margin-bottom: 0;
      padding: 0 12px 3px;
    }
  `,
  // Kontrollkästchen überall als XP-Kästchen
  "ha-checkbox": `
    :host {
      --checked-icon-color: var(--xp-window-text);
    }
    [part~="control"],
    [part~="control"]:has(:checked, :indeterminate) {
      width: 13px;
      height: 13px;
      border: none !important;
      border-radius: 0 !important;
      background: var(--xp-window) !important;
      color: var(--xp-window-text) !important;
      box-shadow: var(--xp-sunken) !important;
    }
  `,
  // Timeflow-Karte (custom:timeflow-card): Kreis-Zähler als XP-Fortschrittsbalken
  "timeflow-card": `
    .content:has(> .progress-section) {
      display: block !important;
      height: auto !important;
    }
    .progress-section {
      width: 100% !important;
    }
  `,
  "progress-circle": `
    :host-context(.progress-section) {
      display: block;
      width: 100%;
      height: 24px;
      box-sizing: border-box;
      padding: 2px;
      background: var(--xp-window);
      box-shadow: var(--xp-sunken);
    }
    :host-context(.progress-section) .progress-wrapper {
      display: none !important;
    }
    /* ganze Blöcke, Anteil kommt aus --xp-p (siehe fortschrittFuellen) */
    :host-context(.progress-section)::before {
      content: "";
      display: block;
      height: 100%;
      width: round(down, var(--xp-p, 0%), 10px);
      background: repeating-linear-gradient(90deg, var(--xp-select) 0 8px, transparent 8px 10px);
    }
  `,
  // Werkzeuge → Zustände: Trennlinien zwischen den Entitäten
  "tools-state-renderer": `
    lit-virtualizer .row .cell {
      box-shadow: inset 0 -1px var(--xp-shadow);
    }
  `,
  // Auswahlfelder (Aktion, Entität, Gerät, …): weißes, eingelassenes Feld mit 3D-Pfeil
  "ha-picker-field": `
    :host-context(ha-generic-picker) ha-combo-box-item {
      --md-list-item-one-line-container-height: 26px;
      --md-list-item-top-space: 0px;
      --md-list-item-bottom-space: 0px;
      --md-list-item-leading-space: 6px;
      --md-list-item-trailing-space: 22px;
      min-height: 0;
      border-radius: 0 !important;
      background: var(--xp-window) !important;
      box-shadow: var(--xp-sunken);
    }
    :host-context(ha-generic-picker) span[slot="headline"] {
      color: var(--xp-window-text);
      font-family: var(--xp-font);
      font-size: 13px;
      line-height: 22px;
    }
    :host-context(ha-generic-picker) .arrow {
      position: absolute;
      top: 2px;
      right: 2px;
      bottom: 2px;
      width: 16px !important;
      height: auto !important;
      margin: 0 !important;
      --mdc-icon-size: 16px;
      background: var(--xp-face);
      box-shadow: var(--xp-raised); border-radius: var(--xp-radius, 3px);
      color: var(--xp-text) !important;
    }
    /* mit Beschriftung im Feld (zwei Zeilen): nicht 56 px hoch, der Pfeil
       bleibt ein kleiner Knopf statt eines hohen Streifens */
    :host-context(ha-generic-picker) ha-combo-box-item {
      --md-list-item-two-line-container-height: 40px;
      --md-list-item-trailing-space: 44px;
    }
    :host-context(ha-generic-picker) .arrow {
      top: 50% !important;
      bottom: auto !important;
      height: 22px !important;
      transform: translateY(-50%);
    }
    /* Löschen-Knopf (×): klein und ohne eigenen Rahmen, links vom Pfeil */
    :host-context(ha-generic-picker) ha-icon-button.clear {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      display: block;
      width: 16px;
      height: 16px;
      margin: 0 !important; /* HA setzt -8px, dadurch lag das × unter dem Pfeil */
      --ha-icon-button-size: 16px;
      --mdc-icon-size: 12px;
      --ha-button-box-shadow: none;
      color: var(--xp-window-text);
    }
  `,
  // Auswahlfenster der Felder: Rahmen wie ein XP-Menü
  "ha-generic-picker": `
    wa-popover::part(dialog),
    wa-popover::part(body) {
      border-radius: 0 !important;
    }
    wa-popover::part(body) {
      border: none !important;
      background: var(--xp-face) !important;
      box-shadow: var(--xp-frame) !important;
    }
  `,
  // Liste im Auswahlfenster (wie das Ausführen-Fenster): Bereiche als Knöpfe,
  // eingelassenes Listenfeld, eckige Symbole, Pixel-Schrift
  "ha-picker-combo-box": `
    .sections {
      margin: 8px 8px 4px !important;
      padding: 0 !important;
      gap: 4px !important;
    }
    .sections .separator {
      display: none;
    }
    ha-filter-chip::part(base) {
      height: 23px;
      border: none !important;
      border-radius: 0 !important;
      background: var(--xp-face) !important;
      color: var(--xp-text) !important;
      box-shadow: var(--xp-raised) !important;
      transition: none;
    }
    ha-filter-chip[selected]::part(base) {
      background: var(--xp-light) !important;
      box-shadow: var(--xp-sunken) !important;
    }
    .section-title-wrapper {
      background: var(--xp-face) !important;
      color: var(--xp-text-dim) !important;
    }
    .list-wrapper {
      margin: 4px 8px 8px !important;
      padding: 2px;
      background: var(--xp-window);
      box-shadow: var(--xp-sunken);
    }
    .title,
    .section-title,
    .section-title-wrapper {
      font-family: var(--xp-font) !important;
      font-size: 13px !important;
      font-weight: bold !important;
      letter-spacing: 0 !important;
      color: var(--xp-text) !important;
    }
    ha-combo-box-item {
      border-radius: 0 !important;
      font-family: var(--xp-font);
    }
    ha-combo-box-item [slot="headline"],
    ha-combo-box-item [slot="supporting-text"] {
      font-family: var(--xp-font) !important;
      font-size: 13px;
    }
    ha-combo-box-item div[slot="start"] {
      border-radius: 0 !important;
      padding: 3px !important;
    }
    ha-combo-box-item[selected],
    ha-combo-box-item:hover,
    ha-combo-box-item:focus-visible {
      background: var(--xp-select) !important;
      color: var(--xp-select-text) !important;
      --md-list-item-label-text-color: var(--xp-select-text);
      --md-list-item-supporting-text-color: var(--xp-select-text);
      --md-list-item-trailing-supporting-text-color: var(--xp-select-text);
      --mdc-icon-color: var(--xp-select-text);
    }
  `,
  // Hinweisfeld in der Filterspalte (Logbuch, Verlauf): eingelassen mit Rahmen
  "ha-sources-picker": `
    .description {
      box-sizing: border-box;
      padding: 8px 10px;
      background: var(--xp-window);
      color: var(--xp-window-text);
      box-shadow: var(--xp-sunken);
    }
  `,
  // Helligkeitsregler im Dialog: waagerecht statt als hohe Säule (die Drehung
  // selbst erledigt schieberDrehen unten, hier nur die Maße)
  "ha-state-control-light-brightness": `
    :host {
      display: block;
      width: 260px;
      max-width: 100%;
    }
    ha-control-slider {
      --control-slider-thickness: 48px;
      width: 100% !important;
      height: 48px !important;
      min-height: 0 !important;
      max-height: none !important;
    }
  `,
  // Symbolknöpfe: kein runder Hover-Kreis hinter dem eckigen Knopf
  "ha-icon-button": `
    ha-button::after {
      display: none !important;
    }
    /* Knopf als Block statt Inline-Box: sonst macht die Zeilenhöhe den Knopf
       höher als sein Rahmen und das Symbol sitzt zu tief */
    ha-button {
      display: block;
    }
    ha-button::part(base) {
      display: flex !important;
      align-items: center;
      justify-content: center;
      vertical-align: top !important;
    }
    /* Licht-Karte: das Symbol in der Mitte des runden Reglers ohne Rahmen */
    :host(.light-button) ha-button::part(base) {
      box-shadow: none !important;
      background: transparent !important;
    }
    /* ausgegraute Knöpfe (z. B. Rückgängig/Wiederholen): graues Symbol mit
       weißem Schatten wie eingeprägte Schrift, sonst unsichtbar auf Grau */
    :host([disabled]) ha-svg-icon {
      color: var(--xp-shadow) !important;
      filter: drop-shadow(1px 1px 0 var(--xp-highlight));
    }
    /* Hilfe-Knopf rechts in der Reiterzeile der Einstellungsseiten und in
       der Symbolleiste von Dialogen (z. B. "Karte bearbeiten") */
    :host([slot="toolbar-icon"]),
    :host([slot="headerActionItems"]),
    :host([slot="actionItems"]) {
      --ha-icon-button-size: 22px;
      --mdc-icon-size: 16px;
      --ha-button-box-shadow: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 22px;
      color: var(--xp-text);
      background: var(--xp-face);
      box-shadow: var(--xp-raised); border-radius: var(--xp-radius, 3px);
    }
    :host([slot="toolbar-icon"]) ha-button,
    :host([slot="headerActionItems"]) ha-button,
    :host([slot="actionItems"]) ha-button {
      display: block;
    }
    /* Schließen-Knopf jedes Dialogs (ha-dialog, ha-adaptive-dialog,
       ha-dialog-header): 16 x 16 wie überall, auch in Dialogen, für die es
       keine eigene Theme-Regel gibt */
    :host([data-dialog="close"]),
    :host([slot="headerNavigationIcon"]),
    :host([slot="navigationIcon"]) {
      --ha-icon-button-size: 16px;
      --mdc-icon-size: 10px;
      --ha-button-box-shadow: none;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 16px !important;
      height: 16px !important;
      color: var(--xp-text) !important;
      background: var(--xp-face);
      box-shadow: var(--xp-raised); border-radius: var(--xp-radius, 3px);
    }
    :host([data-dialog="close"]) ha-button,
    :host([slot="headerNavigationIcon"]) ha-button,
    :host([slot="navigationIcon"]) ha-button,
    :host([data-dialog="close"]) ha-button::part(base),
    :host([slot="headerNavigationIcon"]) ha-button::part(base),
    :host([slot="navigationIcon"]) ha-button::part(base) {
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
    }
  `,
  // Hauptknopf (z. B. "Automation erstellen"): 3D-Rahmen statt weichem Schatten
  "ha-button": `
    :host([appearance="accent"]) .button {
      border-radius: 0 !important;
      box-shadow: var(--xp-raised) !important;
    }
  `,
  // Suchfeld (Einstellungslisten): weiß, eingelassen, Pixel-Schrift
  "ha-input-search": `
    wa-input::part(base) {
      background: var(--xp-window) !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: var(--xp-sunken) !important;
    }
    wa-input::part(base)::after {
      display: none !important;
    }
    wa-input,
    wa-input::part(base),
    wa-input::part(input) {
      font-family: var(--xp-font) !important;
      font-size: 13px !important;
    }
  `,
  // Schiebeschalter als XP-Kontrollkästchen (wie in den Entitätszeilen)
  "ha-switch": `
    .switch {
      width: 13px !important;
      height: 13px !important;
      border: none !important;
      border-radius: 0 !important;
      background: var(--xp-window) !important;
      box-shadow: var(--xp-sunken) !important;
      transition: none !important;
    }
    .switch .thumb {
      display: none !important;
    }
    .checked .switch::after {
      content: "";
      position: absolute;
      left: 3px;
      top: 3px;
      width: 7px;
      height: 7px;
      background: var(--xp-window-text);
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='7' height='7' viewBox='0 0 7 7'%3E%3Cpath d='M.9 3.7l1.8 1.8L6.1 1.3' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='7' height='7' viewBox='0 0 7 7'%3E%3Cpath d='M.9 3.7l1.8 1.8L6.1 1.3' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat;
    }
    label.disabled .switch {
      opacity: 1 !important;
      background: var(--xp-face) !important;
    }
    label.disabled.checked .switch::after {
      background: var(--xp-disabled);
    }
  `,
};

// Regler, die der Dialog senkrecht anlegt und die hier waagerecht werden
const SCHIEBER_WAAGERECHT = new Set(["ha-state-control-light-brightness"]);

// "vertical" entfernen, sobald der Regler da ist (er wird erst nach dem ersten
// Rendern eingefügt, darum ein paar Bildwiederholungen lang nachsehen)
const schieberDrehen = (root, versuche = 120) => {
  const regler = root.querySelector("ha-control-slider[vertical]");
  if (regler) {
    regler.removeAttribute("vertical");
    regler.vertical = false;
    return;
  }
  if (versuche > 0) requestAnimationFrame(() => schieberDrehen(root, versuche - 1));
};

// Der Kreis-Zähler der Timeflow-Karte kennt seinen Anteil nur als Eigenschaft
// "progress", nicht als CSS-Wert: einmal pro Sekunde nach --xp-p übertragen,
// solange das Bauteil auf der Seite ist
const fortschrittFuellen = (host) => {
  const setze = () => {
    if (!host.isConnected) return clearInterval(id);
    host.style.setProperty("--xp-p", `${Math.max(0, Math.min(100, Number(host.progress) || 0))}%`);
  };
  const id = setInterval(setze, 1000);
  setze();
};

const startScrollleisten = () => {
  if (window.__xpScroll) return;
  window.__xpScroll = true;
  const blatt = new CSSStyleSheet();
  blatt.replaceSync(SCROLL_CSS);
  const bauteilBlaetter = {};
  for (const [tag, css] of Object.entries(BAUTEIL_CSS)) {
    bauteilBlaetter[tag] = new CSSStyleSheet();
    bauteilBlaetter[tag].replaceSync(css);
  }
  // Welche Blätter gehören an diesen Shadow-Root (Dokument: nur die Scrollleisten)?
  const benoetigt = (root) => {
    const eigenes = bauteilBlaetter[root.host?.localName];
    return eigenes ? [blatt, eigenes] : [blatt];
  };
  const ergaenzt = (root, liste) => {
    const fehlt = benoetigt(root).filter((b) => !liste.includes(b));
    return fehlt.length ? [...liste, ...fehlt] : liste;
  };
  const beschreibung = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets");
  const anhaengen = (root) => {
    const liste = root.adoptedStyleSheets;
    const neu = ergaenzt(root, liste);
    if (neu !== liste) root.adoptedStyleSheets = neu;
  };
  // Künftige Shadow-Roots: gleich beim Anlegen, und wenn Lit die Liste neu setzt
  if (beschreibung?.set) {
    Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
      configurable: true,
      enumerable: beschreibung.enumerable,
      get() {
        return beschreibung.get.call(this);
      },
      set(liste) {
        beschreibung.set.call(this, ergaenzt(this, liste));
      },
    });
    const anlegen = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (...args) {
      const root = anlegen.apply(this, args);
      if (SCHIEBER_WAAGERECHT.has(this.localName)) schieberDrehen(root);
      if (this.localName === "progress-circle") fortschrittFuellen(this);
      try {
        anhaengen(root);
      } catch (e) {
        /* geschlossene oder gesperrte Roots einfach auslassen */
      }
      return root;
    };
  }
  // Vorhandene Shadow-Roots einmal durchgehen
  const durchgehen = (root) => {
    anhaengen(root);
    for (const el of root.querySelectorAll("*")) {
      if (el.localName === "progress-circle") fortschrittFuellen(el);
      if (el.shadowRoot) durchgehen(el.shadowRoot);
    }
  };
  try {
    durchgehen(document);
  } catch (e) {
    console.warn("xp-panels: Scrollleisten konnten nicht überall angelegt werden", e);
  }
};

startScrollleisten();

// ---------------------------------------------------------------------
// Titel der Einstellungsseiten: wie die Kacheln auf dem Einstellungs-Dashboard
// ---------------------------------------------------------------------

// Pfad-Anfang unter /config/ -> [deutsch, englisch]
const SEITEN = [
  [/^(cloud)(\/|$)/, "Home Assistant Cloud", "Home Assistant Cloud"],
  [/^(integrations|devices|entities|helpers)(\/|$)/, "Geräte & Dienste", "Devices & services"],
  [/^(automation|scene|script|blueprint)(\/|$)/, "Automationen & Szenen", "Automations & scenes"],
  [/^(areas|labels|zone)(\/|$)/, "Bereiche, Labels & Zonen", "Areas, labels & zones"],
  [/^(apps|app)(\/|$)/, "Apps", "Apps"],
  [/^(lovelace)(\/|$)/, "Dashboards", "Dashboards"],
  [/^(connectivity|network|bluetooth|zha|zwave_js|matter|thread)(\/|$)/, "Konnektivität", "Connectivity"],
  [/^(voice-assistants)(\/|$)/, "Sprachassistenten", "Voice assistants"],
  [/^(person|users)(\/|$)/, "Personen", "People"],
  [/^(system|backup|logs|hardware|updates|analytics|storage)(\/|$)/, "System", "System"],
  [/^(tools)(\/|$)/, "Werkzeuge", "Tools"],
  [/^(info)(\/|$)/, "Über", "About"],
];

const setzeSeitentitel = () => {
  const wurzel = document.documentElement;
  const treffer = location.pathname.match(/^\/config\/(.*)$/);
  const eintrag = treffer && SEITEN.find(([muster]) => muster.test(treffer[1]));
  if (!eintrag) {
    wurzel.style.removeProperty("--xp-seitentitel");
    return;
  }
  const deutsch = (wurzel.lang || navigator.language || "").toLowerCase().startsWith("de");
  wurzel.style.setProperty("--xp-seitentitel", JSON.stringify(deutsch ? eintrag[1] : eintrag[2]));
};

if (!window.__xpTitel) {
  window.__xpTitel = true;
  window.addEventListener("location-changed", () => setTimeout(setzeSeitentitel, 0));
  window.addEventListener("popstate", () => setTimeout(setzeSeitentitel, 0));
  setzeSeitentitel();
}
