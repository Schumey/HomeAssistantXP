/*
 * HomeAssistantXP – Startmenü mit Untermenüs für Home Assistant
 * Version: 1.4.0
 * Laden:   Integration HomeAssistantXP, Option "Startmenü"
 * Menüs:   /config/www/xp-startmenu.json (Beispiel im Repo unter
 *          examples/startmenu/xp-startmenu.json)
 *
 * Ein Eintrag der Seitenleiste bekommt ein Untermenü, wenn er das Attribut
 * data-xp-menu="<id>" trägt. Mit Custom Sidebar geht das so:
 *   - new_item: true
 *     item: Werkzeuge
 *     icon: mdi:tools
 *     attributes:
 *       data-xp-menu: werkzeuge
 *     on_click:
 *       action: javascript
 *       code: ""
 *
 * Einträge im Menü (JSON):
 *   { "name": "…", "icon": "mdi:…", "path": "/config/…" }   Seite öffnen
 *   { "name": "…", "file": "configuration.yaml" }           Datei im File editor öffnen
 *   { "name": "…", "action": "restart" }                    Home Assistant neu starten (mit Rückfrage),
 *                                                           danach "Home Assistant wird heruntergefahren …" bis HA wieder da ist
 *   { "name": "…", "action": "run" }                        Schnellsuche als Dialog "Ausführen" öffnen
 *   { "name": "…", "action": "check-updates" }              Sucht überall nach Updates (Core, Apps, System, HACS …)
 *   { "name": "…", "action": "bsod" }                       Bluescreen ansehen (Klick schließt)
 *   { "name": "…", "action": "clock" }                      "Eigenschaften von Datum/Uhrzeit" öffnen
 *   { "name": "…", "action": "minesweeper" }                Minesweeper öffnen (xp-minesweeper.js)
 *   { "name": "…", "action": "solitaire" }                  Solitaire öffnen (xp-solitaire.js)
 *   { "name": "…", "action": "screensaver" }                Bildschirmschoner sofort starten (xp-screensaver.js)
 *   { "name": "…", "url": "https://…" }                     Adresse in neuem Tab öffnen
 *   { "name": "…", "items": [ … ] }                         weiteres Untermenü
 *   { "divider": true }                                     Trennlinie
 *
 * Startmenü-Look (Optionen in derselben JSON-Datei, beides standardmäßig an):
 *   "banner": true          senkrechter Streifen links mit "HomeAssistantXP"
 *   "banner_text": "…"      eigener Text; Ziffern am Ende werden hervorgehoben
 *   "color_icons": true     bunte XP-Icons in Seitenleiste und Menüs
 *                           (für Icons, die es bunt gibt, sonst das normale)
 *   "busy_cursor": true     Sanduhr als Mauszeiger, solange HA arbeitet
 *                           (Anfrage dauert länger, Seitenwechsel, Neustart)
 *   "bsod": false           Bluescreen, wenn die Verbindung zu HA länger als
 *                           20 Sekunden weg ist (ein Neustart zeigt weiter den
 *                           schwarzen Bildschirm); verschwindet von selbst
 *   "sounds": false         kleine selbst erzeugte Klänge (Menü, Meldung, Neustart,
 *                           Bluescreen, Minesweeper, Solitaire); aus, solange nicht true
 *   "clock": true           Doppelklick (Touch: Tippen) auf den Titel mit der
 *                           Uhr öffnet "Eigenschaften von Datum/Uhrzeit"
 *                           (lädt xp-clock.js aus demselben Ordner)
 *   "clock_calendars": []   Kalender-Entitäten, deren Termine der Dialog zeigt
 */

const CONFIG_URL = "/local/xp-startmenu.json";
// Wer von HomeAssistant95 kommt, behält seine Menüdatei und das Attribut data-ha95-menu
const LEGACY_CONFIG_URL = "/local/ha95-startmenu.json";
const MENU_ATTRS = ["data-xp-menu", "data-ha95-menu"];
const MENU_SELECTOR = MENU_ATTRS.map((a) => `[${a}]`).join(", ");
const menuId = (el) => MENU_ATTRS.map((a) => el.getAttribute?.(a)).find((v) => v != null);
const DEFAULTS = {
  file_editor_panel: "core_configurator",
  file_editor_base: "/homeassistant",
  banner: true,
  banner_text: "HomeAssistantXP",
  color_icons: true,
  busy_cursor: true,
  sounds: false,
  bsod: false,
  clock: true,
  clock_calendars: [],
  menus: {},
};

let config = null;
const openMenus = []; // Stapel offener Menüs: { el, anchor }
let closeTimer = null;
const GUARD_LIMIT = 30; // höchstens so oft pro Sekunde die Seitenleiste schmücken

// ---------- Bunte Icons (Startmenü) ----------

// <color-icons> (erzeugt von tools/color_icons.py, nicht von Hand ändern)
// 32×32-Vektoren, Farben stehen in den Zeichnungen
const COLOR_ICONS = {
  "account": `<g transform="translate(16 10.5) scale(1)"><circle cx="0" cy="0" r="5.2" fill="#ffd9a8" stroke="#6a4418" stroke-width="1.3"/><path d="M-11 17.5c0-6.5 4.8-10 11-10s11 3.5 11 10z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></g>`,
  "account-group": `<g transform="translate(25 10) scale(0.72)"><circle cx="0" cy="0" r="5.2" fill="#ffd9a8" stroke="#6a4418" stroke-width="1.3"/><path d="M-11 17.5c0-6.5 4.8-10 11-10s11 3.5 11 10z" fill="#52b64f" stroke="#23701f" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></g><g transform="translate(7 10) scale(0.72)"><circle cx="0" cy="0" r="5.2" fill="#ffd9a8" stroke="#6a4418" stroke-width="1.3"/><path d="M-11 17.5c0-6.5 4.8-10 11-10s11 3.5 11 10z" fill="#f59a23" stroke="#a85a00" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></g><g transform="translate(16 12) scale(0.95)"><circle cx="0" cy="0" r="5.2" fill="#ffd9a8" stroke="#6a4418" stroke-width="1.3"/><path d="M-11 17.5c0-6.5 4.8-10 11-10s11 3.5 11 10z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></g>`,
  "battery": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="17.0" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h15.0v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-10": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="2.5" height="8" rx="1.4" fill="#e5502e" stroke="#9a2410" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h0.5v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-20": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="3.4" height="8" rx="1.4" fill="#e5502e" stroke="#9a2410" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h1.4v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-30": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="5.1" height="8" rx="1.4" fill="#ffd43b" stroke="#a87c00" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h3.0999999999999996v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-40": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="6.8" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h4.8v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-50": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="8.5" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h6.5v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-60": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="10.2" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h8.2v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-70": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="11.9" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h9.9v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-80": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="13.6" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h11.6v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-90": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="15.3" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h13.3v2.4H6.5z" fill="#fff" fill-opacity="0.5"/>`,
  "battery-arrow-down": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="17.0" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h15.0v2.4H6.5z" fill="#fff" fill-opacity="0.5"/><path d="M14 13.5v9M10.2 18.6l3.8 4.4 3.8-4.4" fill="none" stroke="#33333f" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 13.5v9M10.2 18.6l3.8 4.4 3.8-4.4" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  "battery-arrow-up": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="17.0" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h15.0v2.4H6.5z" fill="#fff" fill-opacity="0.5"/><path d="M14 22.5v-9M10.2 17.4l3.8-4.4 3.8 4.4" fill="none" stroke="#33333f" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 22.5v-9M10.2 17.4l3.8-4.4 3.8 4.4" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  "battery-clock": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="11.9" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h9.9v2.4H6.5z" fill="#fff" fill-opacity="0.5"/><circle cx="14" cy="17.5" r="8" fill="#ffffff" stroke="#5e5e72" stroke-width="1.3"/><path d="M14 12.5v5l3 2" fill="none" stroke="#33333f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  "battery-sync": `<rect x="3" y="9.5" width="22" height="13" rx="2.8" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="25" y="13.5" width="3.2" height="5" rx="1.2" fill="#5e5e72"/><rect x="5.5" y="12" width="11.9" height="8" rx="1.4" fill="#52b64f" stroke="#23701f" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.5 13h9.9v2.4H6.5z" fill="#fff" fill-opacity="0.5"/><path d="M9.5 16.5a5 5 0 0 1 8.7-2.6" fill="none" stroke="#33333f" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 18.5a5 5 0 0 1-8.7 2.6" fill="none" stroke="#33333f" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 16.5a5 5 0 0 1 8.7-2.6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 18.5a5 5 0 0 1-8.7 2.6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.8 11l.2 4.6-4.4-1.2z M8.2 24.5L8 19.9l4.4 1.2z" fill="#ffffff" stroke="#33333f" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>`,
  "bed": `<rect x="3" y="8" width="3.2" height="20" rx="1.2" fill="#b07a3e" stroke="#6a4418" stroke-width="1.2" stroke-linejoin="round"/><rect x="3" y="17" width="26" height="6" rx="2" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="10" y="17" width="19" height="6" rx="2" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round"/><rect x="6.5" y="13.5" width="8" height="4" rx="2" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="23" width="3.2" height="4.5" rx="1" fill="#6a4418"/><rect x="25.8" y="23" width="3.2" height="4.5" rx="1" fill="#6a4418"/>`,
  "bell": `<path d="M16 4c-1.1 0-2 .8-2 1.8C10 7 8.5 10 8.5 14v4L6 22.5h20L23.5 18v-4C23.5 10 22 7 18 5.8 18 4.8 17.1 4 16 4z" fill="#ffd43b" stroke="#a87c00" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="16" cy="26" r="2.8" fill="#ffd43b" stroke="#a87c00" stroke-width="1.3"/><path d="M11 12c.3-2 1.5-3.5 3-4.2-1.5.5-2.5 2-2.8 4.2v5z" fill="#fff" fill-opacity="0.6"/>`,
  "calendar": `<rect x="4" y="6" width="24" height="22" rx="3" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 9a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v4H4z" fill="#e5502e" stroke="#9a2410" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><rect x="9" y="3" width="2.6" height="6" rx="1.2" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1" stroke-linejoin="round"/><rect x="20.4" y="3" width="2.6" height="6" rx="1.2" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1" stroke-linejoin="round"/><rect x="7.5" y="16.0" width="4" height="3.6" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="7.5" y="21.4" width="4" height="3.6" rx="0.8" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="13.1" y="16.0" width="4" height="3.6" rx="0.8" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="13.1" y="21.4" width="4" height="3.6" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="18.7" y="16.0" width="4" height="3.6" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="18.7" y="21.4" width="4" height="3.6" rx="0.8" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="24.299999999999997" y="16.0" width="4" height="3.6" rx="0.8" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><rect x="24.299999999999997" y="21.4" width="4" height="3.6" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/>`,
  "camera": `<rect x="3" y="9" width="26" height="17" rx="3" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="11" y="5.5" width="10" height="4.5" rx="1.5" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.3" stroke-linejoin="round"/><circle cx="16" cy="17.5" r="6.6" fill="#5e5e72"/><circle cx="16" cy="17.5" r="4.7" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.2"/><circle cx="14.3" cy="15.8" r="1.5" fill="#fff"/><rect x="23" y="11.5" width="3" height="2" rx="0.6" fill="#ffd43b"/>`,
  "car": `<path d="M8 15l3-6c.4-.7 1.2-1 2-1h6c.8 0 1.6.3 2 1l3.5 6z" fill="#e5502e" stroke="#9a2410" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 14.5l2-4h2.5v4zM18 14.5v-4h1.7l2.3 4z" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round"/><rect x="3" y="14.5" width="26" height="8.5" rx="3" fill="#e5502e" stroke="#9a2410" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 16h22v2H5z" fill="#fff" fill-opacity="0.35"/><circle cx="9.5" cy="23.5" r="3.4" fill="#33333f"/><circle cx="9.5" cy="23.5" r="1.4" fill="#c9c9d6"/><circle cx="22.5" cy="23.5" r="3.4" fill="#33333f"/><circle cx="22.5" cy="23.5" r="1.4" fill="#c9c9d6"/>`,
  "ceiling-light": `<rect x="4" y="3" width="24" height="3" rx="1" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M16 6v5" fill="none" stroke="#5e5e72" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 19c0-5.5 4-9 9-9s9 3.5 9 9z" fill="#f59a23" stroke="#a85a00" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="16" cy="21" rx="3.6" ry="2.6" fill="#fff1a0" stroke="#a87c00" stroke-width="1.1"/><path d="M9 25l-2 3M16 25.5v3.5M23 25l2 3" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 17c.4-2.6 2.4-4.8 5-5.5-2 1-3.5 3-4 5.5z" fill="#fff" fill-opacity="0.5"/>`,
  "chart-box": `<rect x="4" y="4" width="24" height="24" rx="3" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="8" y="17" width="4.4" height="8" rx="0.8" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><rect x="14" y="10.5" width="4.4" height="14.5" rx="0.8" fill="#52b64f" stroke="#23701f" stroke-width="1" stroke-linejoin="round"/><rect x="20" y="14" width="4.4" height="11" rx="0.8" fill="#f59a23" stroke="#a85a00" stroke-width="1" stroke-linejoin="round"/>`,
  "chart-line": `<rect x="4" y="4" width="24" height="24" rx="3" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 22l5-6.5 4 3L24 9.5" fill="none" stroke="#1b4fb0" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 22l5-6.5 4 3L24 9.5" fill="none" stroke="#4a8be8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="9.5" r="2" fill="#e5502e" stroke="#9a2410" stroke-width="1"/>`,
  "clipboard-list": `<rect x="5" y="5" width="22" height="24" rx="3" fill="#b07a3e" stroke="#6a4418" stroke-width="1.4" stroke-linejoin="round"/><rect x="8" y="9" width="16" height="17" rx="1.5" fill="#ffffff" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><rect x="11" y="3" width="10" height="5.5" rx="1.6" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><circle cx="11.5" cy="14.0" r="1" fill="#4a8be8"/><path d="M14.5 14.0h7" fill="none" stroke="#5e5e72" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.5" cy="18.3" r="1" fill="#4a8be8"/><path d="M14.5 18.3h7" fill="none" stroke="#5e5e72" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.5" cy="22.6" r="1" fill="#4a8be8"/><path d="M14.5 22.6h7" fill="none" stroke="#5e5e72" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  "code-braces": `<rect x="3" y="5" width="26" height="22" rx="3" fill="#26304f" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="5" width="26" height="4" rx="2.5" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><path d="M13.5 12.5c-2.2 0-3 1-3 3v.8c0 1-.6 1.6-1.8 1.6 1.2 0 1.8.6 1.8 1.6v.8c0 2 .8 3 3 3" fill="none" stroke="#8fc4ff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 12.5c2.2 0 3 1 3 3v.8c0 1 .6 1.6 1.8 1.6-1.2 0-1.8.6-1.8 1.6v.8c0 2-.8 3-3 3" fill="none" stroke="#8fc4ff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
  "coffee-to-go": `<path d="M8.5 11h15L21.8 28H10.2z" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M9.3 16h13.4l-.7 7.5H10z" fill="#b07a3e" stroke="#6a4418" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/><rect x="7" y="6.5" width="18" height="5" rx="2" fill="#6a4418" stroke="#33333f" stroke-width="1.1" stroke-linejoin="round"/><path d="M10.5 12.5l1 14" fill="#fff" fill-opacity="0.0"/><path d="M11 12.5h2l.9 14h-2z" fill="#fff" fill-opacity="0.5"/>`,
  "cog": `<g fill="#5e5e72" stroke="#5e5e72" stroke-width="3" stroke-linejoin="round"><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(0 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(45 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(90 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(135 16 16)"/><circle cx="16" cy="16" r="9.5"/></g><g fill="#c9c9d6"><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(0 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(45 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(90 16 16)"/><rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate(135 16 16)"/><circle cx="16" cy="16" r="9.5"/></g><circle cx="16" cy="16" r="4" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4"/><path d="M9 12a8 8 0 0 1 6-4.5c-3 1-5 3-6 6z" fill="#fff" fill-opacity="0.5"/>`,
  "console": `<rect x="3" y="6" width="26" height="20" rx="2.5" fill="#1c1f2b" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h21A2.5 2.5 0 0 1 29 8.5V10H3z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 14.5l4.5 3-4.5 3" fill="none" stroke="#52b64f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 21h7" fill="none" stroke="#cfe0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  "desk-lamp": `<ellipse cx="10" cy="27" rx="6.5" ry="2.4" fill="#5e5e72" stroke="#33333f" stroke-width="1"/><path d="M10 25.5L14.5 13.5 22 8.5" fill="none" stroke="#5e5e72" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14.5" cy="13.5" r="1.6" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1"/><path d="M17.5 5.5l9.5 3.2-3.5 8z" fill="#ffd43b" stroke="#a87c00" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M21 19.5l-1.5 3M25.5 18.5l.5 3" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  "devices": `<rect x="3" y="6" width="20" height="14" rx="1.8" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="5.2" y="8.2" width="15.6" height="9.6" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.9" stroke-linejoin="round"/><rect x="10" y="20" width="6" height="3" rx="0.6" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1" stroke-linejoin="round"/><rect x="7.5" y="22.5" width="11" height="2.4" rx="1.1" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1" stroke-linejoin="round"/><rect x="21.5" y="12" width="8" height="16" rx="2" fill="#33333f" stroke="#33333f" stroke-width="1.4" stroke-linejoin="round"/><rect x="22.8" y="14" width="5.4" height="10" rx="0.6" fill="#a9cdfa"/>`,
  "diet-assistant": `<path d="M16 9c-3-2-9-1.5-9 5.5C7 22 11 28 14 28c1 0 1.5-.6 2-.6s1 .6 2 .6c3 0 7-6 7-13.5C25 7.5 19 7 16 9z" fill="#e5502e" stroke="#9a2410" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 9c0-3 1.5-5 4.5-5.5 0 3-1.5 5-4.5 5.5z" fill="#52b64f" stroke="#23701f" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 13c.4-2 1.6-3 3-3.4-1.6.8-2.4 2.4-2.6 5z" fill="#fff" fill-opacity="0.55"/>`,
  "dock-left": `<rect x="3" y="5" width="26" height="22" rx="2.5" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 5H12v22H5.5A2.5 2.5 0 0 1 3 24.5v-17A2.5 2.5 0 0 1 5.5 5z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M5.5 10.0h4.2" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 13.6h4.2" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 17.2h4.2" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 20.8h4.2" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  "door-closed": `<rect x="7" y="3" width="18" height="26" rx="1.5" fill="#6a4418"/><rect x="9" y="5" width="14" height="22" rx="0.8" fill="#b07a3e" stroke="#6a4418" stroke-width="1" stroke-linejoin="round"/><rect x="11" y="8" width="10" height="7" rx="0.8" fill="#e0b878" stroke="#6a4418" stroke-width="0.9" stroke-linejoin="round"/><rect x="11" y="17.5" width="10" height="7" rx="0.8" fill="#e0b878" stroke="#6a4418" stroke-width="0.9" stroke-linejoin="round"/><circle cx="20" cy="16.5" r="1.5" fill="#ffd43b" stroke="#a87c00" stroke-width="1"/>`,
  "fan": `<circle cx="16" cy="16" r="12.5" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.4"/><g transform="rotate(0 16 16)"><path d="M16 16c-1.5-6 .5-10 4.3-11 3 2 2.7 6.4-4.3 11z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/></g><g transform="rotate(120 16 16)"><path d="M16 16c-1.5-6 .5-10 4.3-11 3 2 2.7 6.4-4.3 11z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/></g><g transform="rotate(240 16 16)"><path d="M16 16c-1.5-6 .5-10 4.3-11 3 2 2.7 6.4-4.3 11z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/></g><circle cx="16" cy="16" r="2.6" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.1"/>`,
  "file-document": `<path d="M7 3h12l7 7v19H7z" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M19 3v7h7z" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.5 15h11" fill="none" stroke="#4a8be8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 19h11" fill="none" stroke="#5e5e72" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 23h9" fill="none" stroke="#5e5e72" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  "fire": `<path d="M16 3c1 5 8 8 8 16a8 8 0 0 1-16 0c0-3 1.5-5 3-6.5.3 2 1.2 3 2.3 3.5C13 12 14 7 16 3z" fill="#f59a23" stroke="#9a2410" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 17.5c3 2.5 4 4.5 4 6.5a4 4 0 0 1-8 0c0-1.5 1-3 4-6.5z" fill="#ffd43b"/><path d="M12 14c.3 2 1.2 3 2.3 3.5-1.6 1.8-2.3 3-2.3 5-1.6-1.4-2.2-3-1.7-5.2.5-1.4 1.1-2.4 1.7-3.3z" fill="#fff" fill-opacity="0.35"/>`,
  "flash": `<path d="M18 2L7 18h7l-2 12 13-17h-8z" fill="#ffd43b" stroke="#a87c00" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M17 5l-6 10h4z" fill="#fff" fill-opacity="0.55"/>`,
  "flower": `<circle cx="16.0" cy="7.3" r="4.6" fill="#ff8fb8" stroke="#b83a6a" stroke-width="1.2"/><circle cx="22.847606917325106" cy="12.275077640500378" r="4.6" fill="#ff8fb8" stroke="#b83a6a" stroke-width="1.2"/><circle cx="20.232053816505807" cy="20.32492235949962" r="4.6" fill="#ff8fb8" stroke="#b83a6a" stroke-width="1.2"/><circle cx="11.767946183494194" cy="20.324922359499624" r="4.6" fill="#ff8fb8" stroke="#b83a6a" stroke-width="1.2"/><circle cx="9.152393082674894" cy="12.27507764050038" r="4.6" fill="#ff8fb8" stroke="#b83a6a" stroke-width="1.2"/><circle cx="16" cy="14.5" r="4.2" fill="#ffd43b" stroke="#a85a00" stroke-width="1.3"/><path d="M16 20v9" fill="none" stroke="#23701f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 26c0-3 2-4.5 5-4.5 0 3-2 4.5-5 4.5z" fill="#52b64f" stroke="#23701f" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>`,
  "folder-open": `<path d="M3 7c0-1 .8-2 2-2h7l3 3h11c1.2 0 2 .8 2 2v3H3z" fill="#e6b422" stroke="#a87c00" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M6 13h25l-4 14H3z" fill="#ffd43b" stroke="#a87c00" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M7.5 14.5h20l-.6 2H7z" fill="#fff" fill-opacity="0.55"/>`,
  "format-list-bulleted": `<rect x="4" y="5" width="24" height="22" rx="3" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9.5" cy="11.0" r="1.7" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8"/><path d="M14 11.0h9" fill="none" stroke="#5e5e72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="16.2" r="1.7" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8"/><path d="M14 16.2h9" fill="none" stroke="#5e5e72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="21.4" r="1.7" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.8"/><path d="M14 21.4h9" fill="none" stroke="#5e5e72" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`,
  "garage": `<path d="M3 14L16 5l13 9v14H3z" fill="#e0b878" stroke="#6a4418" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M3 14L16 5l13 9z" fill="#e5502e" stroke="#9a2410" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><rect x="7" y="15" width="18" height="13" rx="1" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><path d="M7.5 18.5h17" fill="none" stroke="#5e5e72" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 21.7h17" fill="none" stroke="#5e5e72" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 24.9h17" fill="none" stroke="#5e5e72" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`,
  "hacs": `<path d="M4 11l12-6 12 6-12 6z" fill="#e0b878" stroke="#6a4418" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M4 11l12 6v13L4 24z" fill="#b07a3e" stroke="#6a4418" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 11L16 17v13l12-6z" fill="#8a5a28" stroke="#6a4418" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 8l12 6" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 8l12 6" fill="none" stroke="#1b4fb0" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8l12 6" fill="none" stroke="#4a8be8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  "help": `<circle cx="16" cy="16" r="13" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.6"/><path d="M6.5 12a10 10 0 0 1 19 0c-4-2.5-14-2.5-19 0z" fill="#fff" fill-opacity="0.4"/><path d="M12 12.7c0-2.6 1.8-4.2 4-4.2s4 1.5 4 3.5c0 3-4 3-4 6" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="23.2" r="1.9" fill="#ffffff"/>`,
  "history": `<circle cx="16" cy="16" r="9" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4"/><path d="M16 11v5l3.5 2" fill="none" stroke="#5e5e72" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 15A12 12 0 0 1 22 5.4" fill="none" stroke="#1b4fb0" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.2 15A12 12 0 0 1 22 5.4" fill="none" stroke="#4a8be8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.6 1.6l7.4 4.4-6.6 4.6z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>`,
  "home": `<rect x="7" y="15" width="18" height="13" rx="1.5" fill="#fff1a0" stroke="#6a4418" stroke-width="1.4" stroke-linejoin="round"/><rect x="21" y="5.5" width="3.6" height="7.5" rx="0.8" fill="#e0b878" stroke="#6a4418" stroke-width="1" stroke-linejoin="round"/><path d="M2.5 16.5L16 4l13.5 12.5z" fill="#e5502e" stroke="#9a2410" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="13.4" y="20" width="5.2" height="8" rx="0.8" fill="#b07a3e" stroke="#6a4418" stroke-width="1" stroke-linejoin="round"/><rect x="9" y="18" width="3.6" height="3.6" rx="0.5" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="0.8" stroke-linejoin="round"/><path d="M7 14.5L16 6l-1.5-.4z" fill="#fff" fill-opacity="0.5"/>`,
  "information": `<circle cx="16" cy="16" r="13" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.6"/><path d="M6.5 12a10 10 0 0 1 19 0c-4-2.5-14-2.5-19 0z" fill="#fff" fill-opacity="0.4"/><circle cx="16" cy="9.3" r="2.1" fill="#ffffff"/><rect x="14" y="13.2" width="4" height="10" rx="1.3" fill="#ffffff"/>`,
  "key": `<path d="M14 14l13 13" fill="none" stroke="#a87c00" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 14l13 13" fill="none" stroke="#ffd43b" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22l3-3.2M25.5 25.5l2.7-2.8" fill="none" stroke="#a87c00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 22l3-3.2M25.5 25.5l2.7-2.8" fill="none" stroke="#ffd43b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10.5" cy="10.5" r="6.8" fill="#ffd43b" stroke="#a87c00" stroke-width="1.6"/><circle cx="9" cy="9" r="2.3" fill="#ffffff" stroke="#a87c00" stroke-width="1"/><path d="M5.5 8a5.5 5.5 0 0 1 4-3.3c-2 1-3.2 2.5-3.7 4.5z" fill="#fff" fill-opacity="0.5"/>`,
  "lamps": `<path d="M9 4h14l3.5 11h-21z" fill="#ffd43b" stroke="#a85a00" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 15v10" fill="none" stroke="#5e5e72" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="16" cy="27" rx="6.5" ry="2.2" fill="#5e5e72" stroke="#33333f" stroke-width="1"/><path d="M10.5 6.5l3-.5-2 6z" fill="#fff" fill-opacity="0.5"/>`,
  "lightbulb": `<path d="M16 3a9 9 0 0 0-5 16.5V23h10v-3.5A9 9 0 0 0 16 3z" fill="#ffd43b" stroke="#a87c00" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="11.5" y="23" width="9" height="2.8" rx="1.2" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><rect x="12.7" y="25.8" width="6.6" height="2.6" rx="1.2" fill="#5e5e72"/><path d="M13.5 17.5l2.5-4 2.5 4" fill="none" stroke="#f59a23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="13" cy="9.5" rx="2.3" ry="3.6" fill="#fff" fill-opacity=".55"/>`,
  "lock": `<path d="M10 14V10.5a6 6 0 0 1 12 0V14" fill="none" stroke="#5e5e72" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14V10.5a6 6 0 0 1 12 0V14" fill="none" stroke="#c9c9d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="14" width="20" height="15" rx="3" fill="#ffd43b" stroke="#a87c00" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="20.2" r="2.3" fill="#33333f"/><rect x="15" y="21" width="2" height="4.5" rx="0.8" fill="#33333f"/><path d="M8 16h16v2H8z" fill="#fff" fill-opacity="0.4"/>`,
  "lock-open": `<path d="M10 14V9a6 6 0 0 1 12 0v1" fill="none" stroke="#5e5e72" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14V9a6 6 0 0 1 12 0v1" fill="none" stroke="#c9c9d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="6" y="14" width="20" height="15" rx="3" fill="#ffd43b" stroke="#a87c00" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="20.2" r="2.3" fill="#33333f"/><rect x="15" y="21" width="2" height="4.5" rx="0.8" fill="#33333f"/><path d="M8 16h16v2H8z" fill="#fff" fill-opacity="0.4"/>`,
  "map": `<path d="M3 8l8-3v19l-8 3z" fill="#b4ec9a" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 5l10 3v19l-10-3z" fill="#52b64f" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M21 8l8-3v19l-8 3z" fill="#b4ec9a" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 10.5c-2 0-3.4 1.5-3.4 3.3 0 2.3 3.4 5.6 3.4 5.6s3.4-3.3 3.4-5.6c0-1.8-1.4-3.3-3.4-3.3z" fill="#e5502e" stroke="#9a2410" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/><circle cx="18" cy="13.7" r="1.2" fill="#ffffff"/>`,
  "math-log": `<rect x="5" y="4" width="22" height="24" rx="2.5" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 10h14" fill="none" stroke="#4a8be8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 15.0h14" fill="none" stroke="#5e5e72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 18.8h11" fill="none" stroke="#5e5e72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22.6h14" fill="none" stroke="#5e5e72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 27" fill="none" stroke="#5e5e72" stroke-width="0" stroke-linecap="round" stroke-linejoin="round"/>`,
  "menu": `<rect x="3" y="5" width="26" height="22" rx="3" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 7h22v4H5z" fill="#fff" fill-opacity="0.35"/><path d="M8 11.5h16" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 16.0h16" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 20.5h16" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  "music-note": `<path d="M12.5 6.5l13-3v16.5H22.5V8.4l-7 1.6V22H12.5z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="9" cy="23.5" rx="4.5" ry="3.5" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4"/><ellipse cx="19.5" cy="21" rx="4.5" ry="3.5" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4"/><path d="M13 7l11-2.5v2.5L13 9.5z" fill="#fff" fill-opacity="0.5"/>`,
  "palette": `<path d="M16 4C8.5 4 3 9 3 15.5S8.5 28 14 28c2.5 0 3-1.5 2-3-1.2-1.8.2-3.5 2.3-3.5H24c3 0 5-1.7 5-5C29 9 23.5 4 16 4z" fill="#e0b878" stroke="#6a4418" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="9.5" cy="14" r="2.3" fill="#e5502e" stroke="#9a2410" stroke-width="0.9"/><circle cx="13" cy="9.5" r="2.3" fill="#ffd43b" stroke="#a87c00" stroke-width="0.9"/><circle cx="19.5" cy="9" r="2.3" fill="#52b64f" stroke="#23701f" stroke-width="0.9"/><circle cx="24" cy="13.5" r="2.3" fill="#4a8be8" stroke="#1b4fb0" stroke-width="0.9"/><circle cx="12.5" cy="21" r="2" fill="#ffffff" stroke="#6a4418" stroke-width="0.9"/>`,
  "play-box": `<rect x="3" y="5" width="26" height="22" rx="3" fill="#26304f" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M13 10.5l9 5.5-9 5.5z" fill="#52b64f" stroke="#b4ec9a" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M5 7h22v3H5z" fill="#fff" fill-opacity="0.2"/>`,
  "power": `<path d="M10 9.2a10.5 10.5 0 1 0 12 0" fill="none" stroke="#9a2410" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4v12" fill="none" stroke="#9a2410" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 9.2a10.5 10.5 0 1 0 12 0" fill="none" stroke="#e5502e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4v12" fill="none" stroke="#e5502e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  "printer-3d-nozzle": `<rect x="9" y="4.5" width="14" height="9" rx="1" fill="#ffffff" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><rect x="4" y="12" width="24" height="12" rx="3" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="9" y="20" width="14" height="8.5" rx="1" fill="#ffffff" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><circle cx="23.5" cy="16" r="1.2" fill="#52b64f"/><path d="M13.5 20.5h5l-2.5 3.5z" fill="#f59a23" stroke="#a85a00" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 24.5h4" fill="none" stroke="#5e5e72" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  "radiator": `<rect x="4" y="5.5" width="24" height="3.2" rx="1.4" fill="#5e5e72" stroke="#33333f" stroke-width="1" stroke-linejoin="round"/><rect x="4" y="23.3" width="24" height="3.2" rx="1.4" fill="#5e5e72" stroke="#33333f" stroke-width="1" stroke-linejoin="round"/><rect x="6.0" y="8" width="3.4" height="15.5" rx="1.6" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.8 9h1.2v13h-1.2z" fill="#fff" fill-opacity="0.7"/><rect x="10.6" y="8" width="3.4" height="15.5" rx="1.6" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M11.399999999999999 9h1.2v13h-1.2z" fill="#fff" fill-opacity="0.7"/><rect x="15.2" y="8" width="3.4" height="15.5" rx="1.6" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M16.0 9h1.2v13h-1.2z" fill="#fff" fill-opacity="0.7"/><rect x="19.799999999999997" y="8" width="3.4" height="15.5" rx="1.6" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M20.599999999999998 9h1.2v13h-1.2z" fill="#fff" fill-opacity="0.7"/><rect x="24.4" y="8" width="3.4" height="15.5" rx="1.6" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.1" stroke-linejoin="round"/><path d="M25.2 9h1.2v13h-1.2z" fill="#fff" fill-opacity="0.7"/><rect x="26" y="12" width="4" height="5" rx="1.3" fill="#e5502e" stroke="#9a2410" stroke-width="1" stroke-linejoin="round"/>`,
  "restart": `<path d="M25 12.5A10 10 0 1 0 26 18" fill="none" stroke="#23701f" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 12.5A10 10 0 1 0 26 18" fill="none" stroke="#52b64f" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.5 4.5v10.5H17z" fill="#52b64f" stroke="#23701f" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>`,
  "robot": `<path d="M16 9V5" fill="none" stroke="#5e5e72" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="4.3" r="2" fill="#e5502e" stroke="#9a2410" stroke-width="1"/><rect x="7" y="9" width="18" height="15" rx="4" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="3.8" y="14" width="3.2" height="6" rx="1.2" fill="#5e5e72" stroke="#33333f" stroke-width="0.8" stroke-linejoin="round"/><rect x="25" y="14" width="3.2" height="6" rx="1.2" fill="#5e5e72" stroke="#33333f" stroke-width="0.8" stroke-linejoin="round"/><circle cx="12" cy="15.5" r="3" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1"/><circle cx="20" cy="15.5" r="3" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1"/><circle cx="11.2" cy="14.6" r="0.9" fill="#fff"/><circle cx="19.2" cy="14.6" r="0.9" fill="#fff"/><rect x="12" y="20.2" width="8" height="1.8" rx="0.9" fill="#5e5e72"/><path d="M9 11h14v2.4H9z" fill="#fff" fill-opacity="0.4"/>`,
  "robot-vacuum": `<circle cx="16" cy="16" r="13" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.5"/><circle cx="16" cy="16" r="8.5" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.2"/><circle cx="16" cy="16" r="2.8" fill="#52b64f" stroke="#23701f" stroke-width="1.2"/><path d="M5 10a13 13 0 0 1 8-6" fill="none" stroke="#5e5e72" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 9a10 10 0 0 1 6-4c-3 1.5-5 3-6 4z" fill="#fff" fill-opacity="0.5"/>`,
  "script-text": `<rect x="7" y="6" width="18" height="21" rx="1.5" fill="#f6e8b9" stroke="#6a4418" stroke-width="1.2" stroke-linejoin="round"/><rect x="4.8" y="3.2" width="22.4" height="4.6" rx="2.3" fill="#e0b878" stroke="#6a4418" stroke-width="1.2" stroke-linejoin="round"/><rect x="4.8" y="24.2" width="22.4" height="4.6" rx="2.3" fill="#e0b878" stroke="#6a4418" stroke-width="1.2" stroke-linejoin="round"/><path d="M10.5 11.0h11" fill="none" stroke="#6a4418" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 14.3h8" fill="none" stroke="#6a4418" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 17.6h11" fill="none" stroke="#6a4418" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 20.9h8" fill="none" stroke="#6a4418" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  "shape-outline": `<circle cx="21.5" cy="10.5" r="6.5" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4"/><rect x="3.5" y="16.5" width="11.5" height="11.5" rx="1.8" fill="#e5502e" stroke="#9a2410" stroke-width="1.4" stroke-linejoin="round"/><path d="M23.5 16.5l6 11.5H17.5z" fill="#52b64f" stroke="#23701f" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M17 6.5a5 5 0 0 1 4-2c-2.4.8-3.6 2.2-4 2z" fill="#fff" fill-opacity="0.5"/>`,
  "shield": `<path d="M16 3l11 4v8c0 7-5 11-11 14C10 26 5 22 5 15V7z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 3v26C10 26 5 22 5 15V7z" fill="#7fb0f5"/><path d="M8 8.5l8-2.9v3.5l-8 3z" fill="#fff" fill-opacity="0.5"/>`,
  "shield-home": `<path d="M16 3l11 4v8c0 7-5 11-11 14C10 26 5 22 5 15V7z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 3v26C10 26 5 22 5 15V7z" fill="#7fb0f5"/><path d="M8 8.5l8-2.9v3.5l-8 3z" fill="#fff" fill-opacity="0.5"/><path d="M16 10.5l-6 5.2h2v6h8v-6h2z" fill="#ffffff" stroke="#c9dcfa" stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round"/><rect x="14.6" y="18" width="2.8" height="3.7" rx="0.4" fill="#4a8be8"/>`,
  "snowflake": `<path d="M16 16L16.0 3.5" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L16.0 3.5" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 8.0L12.6 5.1" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 8.0L12.6 5.1" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 8.0L19.4 5.1" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 8.0L19.4 5.1" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L26.8 9.7" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L26.8 9.7" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 12.0L23.7 7.6" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 12.0L23.7 7.6" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 12.0L27.2 13.5" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 12.0L27.2 13.5" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L26.8 22.2" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L26.8 22.2" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 20.0L27.2 18.5" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 20.0L27.2 18.5" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 20.0L23.7 24.4" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.9 20.0L23.7 24.4" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L16.0 28.5" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L16.0 28.5" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 24.0L19.4 26.9" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 24.0L19.4 26.9" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 24.0L12.6 26.9" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 24.0L12.6 26.9" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L5.2 22.3" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L5.2 22.3" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 20.0L8.3 24.4" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 20.0L8.3 24.4" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 20.0L4.8 18.5" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 20.0L4.8 18.5" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L5.2 9.7" fill="none" stroke="#1b4fb0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16L5.2 9.7" fill="none" stroke="#a9cdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 12.0L4.8 13.5" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 12.0L4.8 13.5" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 12.0L8.3 7.6" fill="none" stroke="#1b4fb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.1 12.0L8.3 7.6" fill="none" stroke="#a9cdfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.6" fill="#ffffff" stroke="#1b4fb0" stroke-width="1.2"/>`,
  "sofa": `<rect x="6" y="7.5" width="20" height="12" rx="4" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round"/><rect x="3" y="12.5" width="5.5" height="12" rx="2.8" fill="#3f7be0" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round"/><rect x="23.5" y="12.5" width="5.5" height="12" rx="2.8" fill="#3f7be0" stroke="#1b4fb0" stroke-width="1.4" stroke-linejoin="round"/><rect x="7.5" y="16.5" width="17" height="8" rx="2.4" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1.3" stroke-linejoin="round"/><rect x="6" y="24.5" width="2.6" height="3.4" rx="0.8" fill="#33333f"/><rect x="23.4" y="24.5" width="2.6" height="3.4" rx="0.8" fill="#33333f"/>`,
  "speaker": `<rect x="7" y="3" width="18" height="26" rx="3" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><circle cx="16" cy="19" r="6.8" fill="#33333f"/><circle cx="16" cy="19" r="4" fill="#5e5e72" stroke="#c9c9d6" stroke-width="1"/><circle cx="16" cy="8.5" r="2.8" fill="#33333f"/><circle cx="14.7" cy="17.3" r="1.3" fill="#fff"/>`,
  "sprout": `<ellipse cx="16" cy="27.5" rx="8" ry="2.4" fill="#b07a3e" stroke="#6a4418" stroke-width="1.2"/><path d="M16 27V16" fill="none" stroke="#23701f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17C16 10 11 7.5 4.5 8.5c0 6.5 4.5 9.5 11.5 8.5z" fill="#52b64f" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 14.5c0-6.5 4.5-9.5 11.5-9.5 0 6.5-4.5 10.5-11.5 9.5z" fill="#b4ec9a" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>`,
  "television": `<path d="M12 7.5L8 2.5M20 7.5l4-5" fill="none" stroke="#5e5e72" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="7.5" width="26" height="19" rx="3" fill="#7a7a8e" stroke="#33333f" stroke-width="1.4" stroke-linejoin="round"/><rect x="5.5" y="10" width="16.5" height="14" rx="2" fill="#a9cdfa" stroke="#5e5e72" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 11.5h13v3H7z" fill="#fff" fill-opacity="0.5"/><circle cx="25.5" cy="14" r="1.4" fill="#c9c9d6"/><circle cx="25.5" cy="19" r="1.4" fill="#c9c9d6"/>`,
  "thermometer": `<rect x="11.8" y="3" width="8.4" height="20" rx="4.2" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><circle cx="16" cy="24" r="5.6" fill="#e5502e" stroke="#9a2410" stroke-width="1.4"/><rect x="14.6" y="9.5" width="2.8" height="14.5" rx="1.4" fill="#e5502e"/><path d="M22 7h3M22 11h2M22 15h3" fill="none" stroke="#5e5e72" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 6c0-.6.3-1 .9-1v10h-.9z" fill="#fff" fill-opacity="0.6"/>`,
  "thermostat": `<circle cx="16" cy="16" r="13" fill="#f1f1f8" stroke="#5e5e72" stroke-width="1.5"/><circle cx="16" cy="16" r="9.6" fill="#ffffff" stroke="#5e5e72" stroke-width="1"/><path d="M8.6 21.4a9.6 9.6 0 1 1 14.8 0" fill="none" stroke="#4a8be8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16l4.8-5.2" fill="none" stroke="#e5502e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.1" fill="#5e5e72"/><path d="M12 24h8" fill="none" stroke="#5e5e72" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  "tools": `<path d="M24 4a6 6 0 0 0-5.6 8.2L5.5 25.1a2.8 2.8 0 0 0 4 4l12.9-12.9A6 6 0 0 0 28.5 9.5l-3.6 3.6-3.4-.6-.6-3.4 3.6-3.6A6 6 0 0 0 24 4z" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 6.2l-1.5 1.6.6 3.4 1.2.2z" fill="#fff" fill-opacity="0.5"/><circle cx="7.6" cy="27" r="1" fill="#5e5e72"/><path d="M5 5l5 5" fill="none" stroke="#f59a23" stroke-width="0" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5l5 5" fill="none" stroke="#f59a23" stroke-width="0" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.8 4.8l6.2 6.2" fill="none" stroke="#a85a00" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.8 4.8l6.2 6.2" fill="none" stroke="#f59a23" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 11l15 15" fill="none" stroke="#5e5e72" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 11l15 15" fill="none" stroke="#c9c9d6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  "view-dashboard": `<rect x="3" y="3" width="12" height="16" rx="2.2" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 4.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/><rect x="17" y="3" width="12" height="9" rx="2.2" fill="#52b64f" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round"/><path d="M18.5 4.5h9v3.15h-9z" fill="#fff" fill-opacity="0.4"/><rect x="17" y="14" width="12" height="15" rx="2.2" fill="#f59a23" stroke="#a85a00" stroke-width="1.3" stroke-linejoin="round"/><path d="M18.5 15.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/><rect x="3" y="21" width="12" height="8" rx="2.2" fill="#e5502e" stroke="#9a2410" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 22.5h9v2.8h-9z" fill="#fff" fill-opacity="0.4"/>`,
  "view-grid": `<rect x="3" y="3" width="12" height="12" rx="2.2" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 4.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/><rect x="17" y="3" width="12" height="12" rx="2.2" fill="#52b64f" stroke="#23701f" stroke-width="1.3" stroke-linejoin="round"/><path d="M18.5 4.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/><rect x="3" y="17" width="12" height="12" rx="2.2" fill="#f59a23" stroke="#a85a00" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 18.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/><rect x="17" y="17" width="12" height="12" rx="2.2" fill="#e5502e" stroke="#9a2410" stroke-width="1.3" stroke-linejoin="round"/><path d="M18.5 18.5h9v4h-9z" fill="#fff" fill-opacity="0.4"/>`,
  "washing-machine": `<rect x="5" y="3" width="22" height="26" rx="2.5" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 9.5h22" fill="none" stroke="#5e5e72" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="6.3" r="1.3" fill="#4a8be8"/><circle cx="13.5" cy="6.3" r="1.3" fill="#52b64f"/><rect x="18" y="5" width="6" height="2.6" rx="1.2" fill="#f1f1f8" stroke="#5e5e72" stroke-width="0.9" stroke-linejoin="round"/><circle cx="16" cy="19" r="7.8" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.4"/><circle cx="16" cy="19" r="5.6" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1.1"/><path d="M11.5 17a5 5 0 0 1 4-2.6c-2 .8-3.4 2-3.8 3.6z" fill="#fff" fill-opacity="0.7"/>`,
  "water": `<path d="M16 3C12 10 6.5 14.5 6.5 20a9.5 9.5 0 0 0 19 0C25.5 14.5 20 10 16 3z" fill="#4a8be8" stroke="#1b4fb0" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 19a5 5 0 0 0 3.5 4.8c-2.3-1.6-3.2-3.6-3.5-4.8z" fill="#fff" fill-opacity="0.0"/><ellipse cx="12.6" cy="19" rx="1.7" ry="3.6" fill="#fff" fill-opacity=".55" transform="rotate(12 12.6 19)"/>`,
  "weather-partly-cloudy": `<path d="M11.5 3.5L11.5 0.3" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 3.5L11.5 0.3" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.2 5.8L19.4 3.6" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.2 5.8L19.4 3.6" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 11.5L22.7 11.5" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 11.5L22.7 11.5" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.2 17.2L19.4 19.4" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.2 17.2L19.4 19.4" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 19.5L11.5 22.7" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 19.5L11.5 22.7" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.8 17.2L3.6 19.4" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.8 17.2L3.6 19.4" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 11.5L0.3 11.5" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 11.5L0.3 11.5" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.8 5.8L3.6 3.6" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.8 5.8L3.6 3.6" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11.5" cy="11.5" r="5.8" fill="#ffd43b" stroke="#a85a00" stroke-width="1.5"/><path d="M8.0 9.8a4.1 3.5 0 0 1 4.6-2.3" fill="#fff" fill-opacity="0.0"/><ellipse cx="9.76" cy="9.47" rx="2.03" ry="1.45" fill="#fff" fill-opacity=".55"/><path d="M9.5 27a5 5 0 0 1 .2-10 7 7 0 0 1 13.3 1.5A4.3 4.3 0 0 1 23 27z" fill="#ffffff" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20a5 5 0 0 1 4-2.4c-2.2.7-3.5 1.7-4 2.4z" fill="#fff" fill-opacity="0.0"/>`,
  "weather-sunny": `<path d="M16.0 5.7L16.0 1.5" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 5.7L16.0 1.5" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.3 8.7L26.3 5.7" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.3 8.7L26.3 5.7" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.3 16.0L30.5 16.0" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.3 16.0L30.5 16.0" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.3 23.3L26.3 26.3" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.3 23.3L26.3 26.3" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 26.3L16.0 30.5" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0 26.3L16.0 30.5" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.7 23.3L5.7 26.3" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.7 23.3L5.7 26.3" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.7 16.0L1.5 16.0" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.7 16.0L1.5 16.0" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.7 8.7L5.7 5.7" fill="none" stroke="#a85a00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.7 8.7L5.7 5.7" fill="none" stroke="#ffd43b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="7.5" fill="#ffd43b" stroke="#a85a00" stroke-width="1.5"/><path d="M11.5 13.8a5.2 4.5 0 0 1 6.0-3.0" fill="#fff" fill-opacity="0.0"/><ellipse cx="13.75" cy="13.375" rx="2.625" ry="1.875" fill="#fff" fill-opacity=".55"/>`,
  "window-closed": `<rect x="5" y="3" width="22" height="26" rx="2" fill="#e8e8f0" stroke="#5e5e72" stroke-width="1.4" stroke-linejoin="round"/><rect x="8" y="6" width="7" height="8.5" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><path d="M9 7h5v2h-5z" fill="#fff" fill-opacity="0.5"/><rect x="8" y="16" width="7" height="8.5" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><path d="M9 17h5v2h-5z" fill="#fff" fill-opacity="0.5"/><rect x="16" y="6" width="7" height="8.5" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><path d="M17 7h5v2h-5z" fill="#fff" fill-opacity="0.5"/><rect x="16" y="16" width="7" height="8.5" rx="0.8" fill="#a9cdfa" stroke="#1b4fb0" stroke-width="1" stroke-linejoin="round"/><path d="M17 17h5v2h-5z" fill="#fff" fill-opacity="0.5"/>`,
  "wrench": `<path d="M24 4a6 6 0 0 0-5.6 8.2L5.5 25.1a2.8 2.8 0 0 0 4 4l12.9-12.9A6 6 0 0 0 28.5 9.5l-3.6 3.6-3.4-.6-.6-3.4 3.6-3.6A6 6 0 0 0 24 4z" fill="#c9c9d6" stroke="#5e5e72" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 6.2l-1.5 1.6.6 3.4 1.2.2z" fill="#fff" fill-opacity="0.5"/><circle cx="7.6" cy="27" r="1" fill="#5e5e72"/>`,
};
const COLOR_ALIASES = {
  "account-outline": "account",
  "application-outline": "console",
  "battery-high": "battery-80",
  "bell-outline": "bell",
  "bell-ring": "bell",
  "bell-ring-outline": "bell",
  "calendar-blank": "calendar",
  "calendar-month": "calendar",
  "calendar-month-outline": "calendar",
  "camera-outline": "camera",
  "cctv": "camera",
  "ceiling-light-outline": "ceiling-light",
  "chart-line-variant": "chart-line",
  "cog-outline": "cog",
  "console-line": "console",
  "diet": "diet-assistant",
  "door": "door-closed",
  "file-cog": "file-document",
  "file-cog-outline": "file-document",
  "file-document-edit": "file-document",
  "file-document-edit-outline": "file-document",
  "file-document-outline": "file-document",
  "flower-outline": "flower",
  "flower-tulip": "flower",
  "flower-tulip-outline": "flower",
  "folder-open-outline": "folder-open",
  "food-apple": "diet-assistant",
  "food-apple-outline": "diet-assistant",
  "format-list-bulleted-type": "format-list-bulleted",
  "hammer": "tools",
  "help-circle": "help",
  "help-circle-outline": "help",
  "home-outline": "home",
  "home-variant": "home",
  "home-variant-outline": "home",
  "information-outline": "information",
  "key-outline": "key",
  "key-variant": "key",
  "lightbulb-outline": "lightbulb",
  "lightning-bolt": "flash",
  "lightning-bolt-outline": "flash",
  "lock-open-outline": "lock-open",
  "lock-open-variant": "lock-open",
  "lock-open-variant-outline": "lock-open",
  "lock-outline": "lock",
  "map-outline": "map",
  "mydietassistant": "diet-assistant",
  "nutrition": "diet-assistant",
  "package-variant": "hacs",
  "package-variant-closed": "hacs",
  "palette-outline": "palette",
  "play-box-outline": "play-box",
  "robot-outline": "robot",
  "robot-vacuum-variant": "robot-vacuum",
  "script-text-outline": "script-text",
  "security": "shield",
  "shield-outline": "shield",
  "sprout-outline": "sprout",
  "television-classic": "television",
  "text-box-outline": "math-log",
  "text-long": "math-log",
  "thermometer-lines": "thermostat",
  "thermostat-box": "thermostat",
  "vacuum": "robot-vacuum",
  "video": "camera",
  "view-dashboard-outline": "view-dashboard",
  "view-grid-outline": "view-grid",
  "view-grid-plus": "view-grid",
  "view-grid-plus-outline": "view-grid",
  "water-outline": "water",
  "water-percent": "water",
  "white-balance-sunny": "weather-sunny",
  "window-closed-variant": "window-closed",
};
// </color-icons>

// Eingebaute Einträge der Seitenleiste haben kein Icon mit Namen
const BUILTIN_ICONS = {
  "/config": "cog",
  "/logbook": "format-list-bulleted",
  "/history": "chart-box",
  "/energy": "flash",
  "/map": "map",
  "/media-browser": "play-box",
  "/todo": "clipboard-list",
  "/calendar": "calendar",
  "/developer-tools": "tools",
  "/lovelace": "view-dashboard",
};

const colorName = (icon) => {
  // Präfix weg (mdi:, xp:, hacs: …), dann zählt nur der Name
  const name = String(icon || "").replace(/^[a-z0-9_-]+:/, "");
  const real = COLOR_ALIASES[name] || name;
  return real in COLOR_ICONS ? real : null;
};

// Vektor-Icon (32×32) mit eigenen Farben
const colorSvg = (name) =>
  name ? `<svg class="xp-cicon" viewBox="0 0 32 32" aria-hidden="true">${COLOR_ICONS[name]}</svg>` : "";

// Für die Desktop-Karte (xp-desktop.js): buntes SVG zu einem Icon-Namen, sonst leer
window.xpColorIcon ??= (icon) => colorSvg(colorName(icon));

// ---------- Hilfsfunktionen ----------

const haRoot = () => document.querySelector("home-assistant");
const hass = () => haRoot()?.hass;

const deepQuery = (selector, root = document) => {
  let found = null;
  const walk = (node) => {
    for (const el of node.querySelectorAll("*")) {
      if (found) return;
      if (el.matches(selector)) {
        found = el;
        return;
      }
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(root);
  return found;
};

const sidebar = () =>
  haRoot()
    ?.shadowRoot?.querySelector("home-assistant-main")
    ?.shadowRoot?.querySelector("ha-sidebar");

// Menüs hängen in der Seitenleiste: Ist sie als modale Schublade aufgeklappt
// (Handy, schmale Fenster), wäre alles außerhalb davon gesperrt.
const layer = () => {
  const sb = sidebar();
  return sb?.shadowRoot && sb.checkVisibility?.() ? sb.shadowRoot : document.body;
};

const navigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadConfig() {
  if (config) return config;
  // Alternativ ohne Datei: window.xpStartmenuConfig = { menus: { … } }
  if (window.xpStartmenuConfig) return (config = { ...DEFAULTS, ...window.xpStartmenuConfig });
  try {
    const read = async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };
    const [own, legacy] = await Promise.allSettled([read(CONFIG_URL), read(LEGACY_CONFIG_URL)]);
    if (own.status === "rejected" && legacy.status === "rejected") throw own.reason;
    const a = legacy.value || {};
    const b = own.value || {};
    // Menüs beider Dateien, die neue Datei hat bei gleicher Kennung Vorrang
    config = { ...DEFAULTS, ...a, ...b, menus: { ...a.menus, ...b.menus } };
  } catch (err) {
    // Nicht merken: Ein Fehlschlag (404 beim Neustart, kurze Netzstörung)
    // soll beim nächsten Öffnen erneut versucht werden, nicht bis zum Neuladen bleiben.
    console.warn("HomeAssistantXP Startmenü: Konfiguration nicht lesbar", err);
    return { ...DEFAULTS };
  }
  return config;
}

// ---------- Aktionen ----------

async function openFile(file) {
  const cfg = await loadConfig();
  const full = file.startsWith("/") ? file : `${cfg.file_editor_base}/${file}`;
  const name = full.split("/").pop();
  if (location.pathname !== `/${cfg.file_editor_panel}`) navigate(`/${cfg.file_editor_panel}`);
  // Warten, bis der File editor im iframe geladen ist, dann die Datei öffnen
  for (let i = 0; i < 60; i++) {
    const frame = deepQuery("iframe");
    const win = frame?.contentWindow;
    if (win && typeof win.loadfile === "function" && win.document.readyState === "complete") {
      win.loadfile(full, name);
      return;
    }
    await sleep(250);
  }
  console.warn("HomeAssistantXP Startmenü: File editor nicht gefunden", cfg.file_editor_panel);
}

const TEXT = {
  de: {
    title: "Home Assistant neu starten",
    question: "Soll Home Assistant jetzt neu gestartet werden?",
    note: "Die Oberfläche ist danach kurz nicht erreichbar.",
    yes: "Ja",
    no: "Nein",
    close: "Schließen",
    logoff_title: "Abmelden",
    logoff_question: "Soll die Abmeldung jetzt erfolgen?",
    logoff_note: "Auf diesem Gerät musst du dich danach neu anmelden.",
    sp_programs: "Alle Programme",
    sp_logoff: "Abmelden",
    sp_restart: "Neustart",
    sp_settings: "Einstellungen",
    sp_dev: "Entwicklerwerkzeuge",
    sp_profile: "Profil",
    sp_updates: "Nach Updates suchen",
    sp_run: "Ausführen …",
    safe: "Home Assistant wird heruntergefahren …",
    safe_note: "Home Assistant startet neu. Dieser Bildschirm verschwindet von selbst.",
    bsod_title: "HomeAssistantXP",
    bsod_head: "Die Verbindung zu Home Assistant ist abgebrochen.",
    bsod_1: "Das Netzwerk oder Home Assistant antwortet nicht mehr.",
    bsod_2: "Dieser Bildschirm verschwindet von selbst, sobald die Verbindung wieder da ist.",
    bsod_3: "Eine beliebige Taste oder ein Klick versucht es sofort noch einmal.",
    bsod_key: "Beliebige Taste drücken, um fortzufahren",
  },
  en: {
    title: "Restart Home Assistant",
    question: "Do you want to restart Home Assistant now?",
    note: "The interface will be unavailable for a moment.",
    yes: "Yes",
    no: "No",
    close: "Close",
    logoff_title: "Log Off",
    logoff_question: "Do you want to log off now?",
    logoff_note: "You will have to sign in again on this device.",
    sp_programs: "All Programs",
    sp_logoff: "Log Off",
    sp_restart: "Restart",
    sp_settings: "Settings",
    sp_dev: "Developer tools",
    sp_profile: "Profile",
    sp_updates: "Check for updates",
    sp_run: "Run …",
    safe: "Home Assistant is shutting down …",
    safe_note: "Home Assistant is restarting. This screen will close by itself.",
    bsod_title: "HomeAssistantXP",
    bsod_head: "The connection to Home Assistant was lost.",
    bsod_1: "The network or Home Assistant is no longer answering.",
    bsod_2: "This screen goes away by itself as soon as the connection is back.",
    bsod_3: "Press any key or click to try again right away.",
    bsod_key: "Press any key to continue",
  },
};
const t = () => TEXT[(hass()?.language || "en").slice(0, 2)] || TEXT.en;

function confirmRestart(opts = {}) {
  const s = t();
  const o = { title: s.title, question: s.question, note: s.note, icon: "mdi:restart", ok: restartHa, ...opts };
  const overlay = document.createElement("div");
  overlay.className = "xp-modal";
  overlay.innerHTML = `
    <div class="xp-window" role="dialog" aria-modal="true" aria-labelledby="xp-restart-title">
      <div class="xp-titlebar">
        <span id="xp-restart-title">${o.title}</span>
        <button class="xp-close" aria-label="${s.close}">×</button>
      </div>
      <div class="xp-body">
        <ha-icon icon="${o.icon}"></ha-icon>
        <p>${o.question}<br>${o.note}</p>
      </div>
      <div class="xp-buttons">
        <button class="xp-button" data-ok>${s.yes}</button>
        <button class="xp-button" data-cancel>${s.no}</button>
      </div>
    </div>`;
  const close = () => overlay.remove();
  overlay.querySelector("[data-cancel]").onclick = close;
  overlay.querySelector(".xp-close").onclick = close;
  overlay.addEventListener("keydown", (e) => e.key === "Escape" && close());
  overlay.querySelector("[data-ok]").onclick = () => {
    close();
    o.ok();
  };
  overlay.popover = "manual";
  layer().appendChild(overlay);
  overlay.showPopover?.();
  overlay.querySelector("[data-cancel]").focus();
}

function restartHa() {
  const conn = hass()?.connection;
  hass()?.callService("homeassistant", "restart");
  if (conn) showSafeScreen(conn);
}

async function logOff() {
  try {
    await hass().auth.revoke();
    location.href = "/";
  } catch {
    navigate("/profile"); // dort steht der Abmelden-Knopf von HA selbst
  }
}

// Schwarzer Bildschirm mit oranger Schrift wie beim Herunterfahren von
// Windows XP. Er bleibt, bis die Verbindung zu HA einmal weg und wieder da
// ist (Neustart fertig). Klick oder Escape schließt ihn vorher.
function showSafeScreen(conn) {
  const s = t();
  const screen = document.createElement("div");
  screen.className = "xp-safe";
  screen.setAttribute("role", "status");
  screen.innerHTML = "<p></p><small></small>";
  screen.querySelector("p").textContent = s.safe;
  screen.querySelector("small").textContent = s.safe_note;

  let wasDown = false;
  const onDown = () => (wasDown = true);
  const onReady = () => wasDown && close();
  const onKey = (e) => e.key === "Escape" && close();
  const timer = setTimeout(() => close(), 15 * 60 * 1000);
  function close() {
    clearTimeout(timer);
    conn.removeEventListener("disconnected", onDown);
    conn.removeEventListener("ready", onReady);
    document.removeEventListener("keydown", onKey);
    screen.remove();
  }
  conn.addEventListener("disconnected", onDown);
  conn.addEventListener("ready", onReady);
  document.addEventListener("keydown", onKey);
  screen.addEventListener("click", close);

  screen.popover = "manual";
  layer().appendChild(screen);
  screen.showPopover?.();
  playSound("shutdown");
}

// Bluescreen, wenn die Verbindung zu HA länger als BSOD_DELAY weg ist (Option
// "bsod": true). Der Neustart-Bildschirm hat Vorrang. Verschwindet von selbst.
const BSOD_DELAY = 20000;
const bsodOpen = () => layer().querySelector(".xp-bsod") || document.querySelector(".xp-bsod");
const safeOpen = () => layer().querySelector(".xp-safe") || document.querySelector(".xp-safe");

function showBsod(conn) {
  if (bsodOpen()) return;
  const s = t();
  const screen = document.createElement("div");
  screen.className = "xp-bsod";
  screen.setAttribute("role", "alert");
  screen.innerHTML = "<b></b><p></p><p></p><p></p><p></p><p class=key></p>";
  const [title, head, one, two, three, key] = screen.children;
  title.textContent = s.bsod_title;
  head.textContent = s.bsod_head;
  one.textContent = "*  " + s.bsod_1;
  two.textContent = "*  " + s.bsod_2;
  three.textContent = "*  " + s.bsod_3;
  key.textContent = s.bsod_key + " _";
  const close = () => {
    document.removeEventListener("keydown", retry);
    screen.remove();
  };
  const retry = () => {
    try {
      conn?.reconnect?.(true);
    } catch {
      // der nächste Versuch kommt von selbst
    }
    if (!conn) close();
  };
  document.addEventListener("keydown", retry);
  screen.addEventListener("click", retry);
  screen.close = close;
  screen.popover = "manual";
  layer().appendChild(screen);
  screen.showPopover?.();
  playSound("error");
}

function watchBsod(conn) {
  if (!conn || conn.__xpbsod || config?.bsod !== true) return;
  conn.__xpbsod = true;
  let timer = null;
  conn.addEventListener("disconnected", () => {
    clearTimeout(timer);
    timer = setTimeout(() => !safeOpen() && showBsod(conn), BSOD_DELAY);
  });
  conn.addEventListener("ready", () => {
    clearTimeout(timer);
    bsodOpen()?.close?.();
  });
}

// "Ausführen …": die Schnellsuche von HA mit allen Bereichen. Ist sie noch
// nicht geladen, lädt HA sie über die Taste "e" (dann mit Entitäten).
function openRun() {
  const bar = haRoot()?.shadowRoot?.querySelector("ha-quick-bar");
  if (bar?.showDialog) return bar.showDialog({});
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "e", code: "KeyE", bubbles: true, composed: true }));
}

// "Eigenschaften von Datum/Uhrzeit" aus xp-clock.js (gleicher Ordner,
// gleiche ?v=-Version wie dieses Modul)
async function openClock() {
  closeAll();
  const url = new URL("xp-clock.js", import.meta.url);
  url.search = new URL(import.meta.url).search;
  try {
    const mod = await import(url.href);
    mod.showDateTime({ calendars: config?.clock_calendars });
  } catch (err) {
    console.warn("HomeAssistantXP Startmenü: xp-clock.js nicht ladbar", url.href, err);
  }
}

// Minesweeper und Bildschirmschoner: eigene Module im selben Ordner
async function openModule(file, run) {
  closeAll();
  const url = new URL(file, import.meta.url);
  url.search = new URL(import.meta.url).search;
  try {
    run(await import(url.href));
  } catch (err) {
    console.warn(`HomeAssistantXP Startmenü: ${file} nicht ladbar`, url.href, err);
  }
}

// "Nach Updates suchen": jede Update-Entität (Core, Apps, System, HACS,
// Geräte) fragt neu nach, dazu lädt der Supervisor seine Quellen neu.
const UPDATE_TEXT = {
  de: {
    start: "Suche nach Updates …",
    none: "Suche beendet: alles ist aktuell.",
    some: (n, names) => `Suche beendet: ${n} ${n === 1 ? "Update" : "Updates"} verfügbar (${names}).`,
  },
  en: {
    start: "Checking for updates …",
    none: "Check finished: everything is up to date.",
    some: (n, names) => `Check finished: ${n} ${n === 1 ? "update" : "updates"} available (${names}).`,
  },
};

function notify(message, duration = 6000) {
  haRoot()?.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message, duration } }));
}

async function checkUpdates() {
  const h = hass();
  if (!h) return;
  const t = UPDATE_TEXT[(h.language || "en").slice(0, 2)] || UPDATE_TEXT.en;
  const ids = Object.keys(h.states).filter((id) => id.startsWith("update."));
  notify(t.start, 3000);
  const jobs = [];
  if (ids.length) jobs.push(h.callService("homeassistant", "update_entity", { entity_id: ids }));
  // Nur mit Supervisor (HAOS, Supervised) vorhanden; ohne schlägt es leise fehl
  for (const endpoint of ["/refresh_updates", "/store/reload"]) {
    jobs.push(h.callWS({ type: "supervisor/api", endpoint, method: "post", timeout: null }).catch(() => {}));
  }
  await Promise.allSettled(jobs);
  await new Promise((resolve) => setTimeout(resolve, 3000)); // die Entitäten brauchen einen Moment
  const states = hass()?.states || {};
  const open = ids.concat(Object.keys(states).filter((id) => id.startsWith("update.") && !ids.includes(id))).filter((id) => states[id]?.state === "on");
  const name = (id) => (states[id].attributes.title || states[id].attributes.friendly_name || id).replace(/\s+update$/i, "");
  notify(open.length ? t.some(open.length, open.slice(0, 4).map(name).join(", ") + (open.length > 4 ? " …" : "")) : t.none, 10000);
}

function runItem(item) {
  closeAll();
  playSound("click");
  if (item.action === "restart") return confirmRestart();
  if (item.action === "logoff") return confirmRestart({ title: t().logoff_title, question: t().logoff_question, note: t().logoff_note, icon: "mdi:logout", ok: logOff });
  if (item.action === "run") return openRun();
  if (item.action === "bsod") return showBsod(null);
  if (item.action === "check-updates") return checkUpdates();
  if (item.action === "clock") return openClock();
  if (item.action === "minesweeper") return openModule("xp-minesweeper.js", (m) => m.showMinesweeper());
  if (item.action === "solitaire") return openModule("xp-solitaire.js", (m) => m.showSolitaire());
  if (item.action === "screensaver") return openModule("xp-screensaver.js", (m) => m.start());
  if (item.file) return openFile(item.file);
  if (item.url) return window.open(item.url, "_blank", "noopener");
  if (item.path) return navigate(item.path);
}

// ---------- Menüs ----------

function closeFrom(level) {
  while (openMenus.length > level) {
    const m = openMenus.pop();
    m.el.remove();
    if (m.el.classList.contains("xp-sp")) window.dispatchEvent(new CustomEvent("xp-startpanel", { detail: { open: false } }));
    m.anchor?.classList?.remove("xp-open");
  }
}
const closeAll = () => closeFrom(0);

const scheduleClose = () => {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(closeAll, 400);
};
const cancelClose = () => clearTimeout(closeTimer);

// Darüberfahren öffnet und schließt Menüs nur mit der Maus. Beim Tippen
// schickt der Browser vor dem Klick ein nachgemachtes mouseover; das öffnete
// das Menü, und der Klick gleich danach schloss es wieder.
const mouseOnly = (fn) => (ev) => {
  if (ev.pointerType === "mouse") fn(ev);
};

function showMenu(items, anchorRect, level, anchorEl) {
  closeFrom(level);
  const menu = document.createElement("div");
  menu.className = "xp-menu";
  menu.setAttribute("role", "menu");

  for (const item of items) {
    if (item.divider) {
      const hr = document.createElement("div");
      hr.className = "xp-divider";
      menu.appendChild(hr);
      continue;
    }
    const row = document.createElement("button");
    row.className = "xp-item";
    row.setAttribute("role", "menuitem");
    const icon = item.icon || (item.file ? "mdi:file-document-outline" : "");
    const color = config?.color_icons ? colorSvg(colorName(icon)) : "";
    row.innerHTML = `
      <span class="xp-icon">${color || (icon ? `<ha-icon icon="${icon}"></ha-icon>` : "")}</span>
      <span class="xp-label"></span>
      <span class="xp-arrow">${item.items ? "▶" : ""}</span>`;
    row.querySelector(".xp-label").textContent = item.name ?? item.file ?? "";

    if (item.items) {
      const open = () => {
        if (openMenus[level + 1]?.anchor === row) return;
        showMenu(item.items, row.getBoundingClientRect(), level + 1, row);
        row.classList.add("xp-open");
      };
      row.addEventListener("pointerenter", mouseOnly(open));
      row.addEventListener("click", open);
    } else {
      row.addEventListener("pointerenter", mouseOnly(() => closeFrom(level + 1)));
      row.addEventListener("click", () => runItem(item));
    }
    menu.appendChild(row);
  }

  menu.addEventListener("pointerenter", mouseOnly(cancelClose));
  menu.addEventListener("pointerleave", mouseOnly(scheduleClose));
  // Als Popover in die oberste Ebene, damit es auch über der
  // aufgeklappten Seitenleiste (Handy, schmale Fenster) liegt
  menu.popover = "manual";
  layer().appendChild(menu);
  menu.showPopover?.();

  // Rechts neben dem Anker, nicht über den unteren Rand hinaus.
  // Das erste Menü setzt bündig an den Rand der Seitenleiste an.
  // Passt es rechts nicht hin (Handy), rückt es nach links ins Bild;
  // ein Untermenü geht dann links neben das Elternmenü oder, wenn auch
  // dort kein Platz ist, leicht eingerückt unter den Eintrag.
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;
  let left = level === 0 ? sidebar()?.getBoundingClientRect().right ?? anchorRect.right : anchorRect.right - 3;
  let top = anchorRect.top - 3;
  if (left + w > innerWidth) {
    if (level === 0) left = innerWidth - w;
    else if (anchorRect.left + 3 - w >= 0) left = anchorRect.left + 3 - w;
    else {
      left = anchorRect.left + 24;
      top = anchorRect.bottom - 3;
    }
  }
  left = Math.max(0, Math.min(left, innerWidth - w));
  // Über der Taskleiste (xp-taskbar.js) enden, nicht darüber hinaus
  const taskbar = document.querySelector("xp-taskbar")?.offsetHeight || 0;
  top = Math.max(0, Math.min(top, innerHeight - taskbar - h));
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
  openMenus.push({ el: menu, anchor: anchorEl });
}

async function openRootMenu(anchor) {
  playSound("menu");
  const cfg = await loadConfig();
  const id = menuId(anchor);
  const items = cfg.menus?.[id];
  if (!items) {
    console.warn(`HomeAssistantXP Startmenü: Menü "${id}" fehlt in ${CONFIG_URL}`);
    return;
  }
  if (openMenus[0]?.anchor === anchor) return;
  showMenu(items, anchor.getBoundingClientRect(), 0, anchor);
}

// ---------- Startmenü-Look der Seitenleiste ----------

function decorate(root) {
  if (!config) return;
  // Senkrechter Streifen wie "Windows XP" im echten Startmenü
  // (":scope" passt in einem Shadow-Root auf nichts, darum ohne)
  if (config.banner && !root.querySelector(".xp-banner")) {
    const banner = document.createElement("div");
    banner.className = "xp-banner";
    const [, main, accent] = /^(.*?)(\d*)$/.exec(String(config.banner_text));
    banner.innerHTML = "<b></b><span></span>";
    banner.querySelector("b").textContent = main;
    banner.querySelector("span").textContent = accent;
    root.appendChild(banner);
    root.host.classList.add("xp-has-banner");
  }
  if (!config.color_icons) return;
  root.querySelectorAll("ha-list-item-button").forEach((item) => {
    const orig = item.querySelector(":scope > ha-icon, :scope > ha-svg-icon");
    if (!orig) return;
    const href = item.getAttribute("href") || item.href || "";
    const name =
      orig.localName === "ha-icon"
        ? colorName(orig.icon || orig.getAttribute("icon"))
        : item.classList.contains("notifications")
          ? "bell"
          : BUILTIN_ICONS[href] || null;
    let wrap = item.querySelector(":scope > .xp-cicon-wrap");
    if (!name) {
      wrap?.remove();
      orig.classList.remove("xp-hidden");
      return;
    }
    if (wrap?.dataset.name === name && orig.classList.contains("xp-hidden")) return;
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "xp-cicon-wrap";
      if (orig.slot) wrap.slot = orig.slot;
      item.insertBefore(wrap, orig);
    }
    wrap.dataset.name = name;
    wrap.innerHTML = colorSvg(name);
    orig.classList.add("xp-hidden");
  });
}

const SIDEBAR_CSS = `
  .xp-sb-arrow { font-size: 10px; padding-inline-end: 4px; pointer-events: none; }
  :host(:not([expanded])) .xp-sb-arrow { display: none; }
  /* über der Markierungsfläche, die Custom Sidebar beim Darüberfahren zeichnet */
  .xp-cicon-wrap, .xp-sb-arrow { position: relative; z-index: 1; }
  [data-xp-menu]:hover .xp-sb-arrow, [data-xp-menu].xp-open .xp-sb-arrow,
  [data-ha95-menu]:hover .xp-sb-arrow, [data-ha95-menu].xp-open .xp-sb-arrow {
    color: var(--xp-select-text, #fff);
  }
  .xp-hidden { display: none !important; }
  .xp-cicon-wrap { display: inline-flex; width: 24px; height: 24px; flex: none; }
  .xp-cicon { width: 24px; height: 24px; }
  .xp-banner { display: none; }
  :host(.xp-has-banner) { position: relative; }
  :host([expanded]) .xp-banner {
    display: flex; flex-direction: column; justify-content: flex-end;
    position: absolute; z-index: 1; left: 0; bottom: 0;
    top: var(--header-height, 36px); width: 24px;
    box-sizing: border-box; padding: 6px 0; overflow: hidden;
    background: var(--xp-banner, var(--xp-shadow, #aca899));
    pointer-events: none;
  }
  .xp-banner b, .xp-banner span {
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-family: var(--xp-font, Tahoma, sans-serif);
    font-size: 20px; line-height: 24px; letter-spacing: 1px; white-space: nowrap;
  }
  .xp-banner b { color: var(--xp-banner-text, var(--xp-face, #ece9d8)); font-weight: bold; }
  .xp-banner span { order: -1; color: var(--xp-banner-accent, var(--xp-highlight, #fff)); font-weight: normal; }
  :host(.xp-has-banner[expanded]) .panels-list { margin-inline-start: 24px; }
`;

// ---------- Anbindung an die Seitenleiste ----------

const findAnchor = (ev) =>
  ev.composedPath().find((el) => el instanceof Element && MENU_ATTRS.some((a) => el.hasAttribute?.(a)));

function attach(sb) {
  if (!sb?.shadowRoot || sb.__xpmenu) return;
  sb.__xpmenu = true;
  const root = sb.shadowRoot;

  const style = document.createElement("style");
  style.textContent = SIDEBAR_CSS + MENU_CSS;
  root.appendChild(style);
  loadConfig().then(() => decorate(root));

  const addArrows = () =>
    root.querySelectorAll(MENU_SELECTOR).forEach((el) => {
      if (el.querySelector(":scope > .xp-sb-arrow")) return;
      const a = document.createElement("span");
      a.className = "xp-sb-arrow";
      a.slot = "end";
      a.textContent = "▶";
      el.appendChild(a);
    });
  addArrows();
  // Höchstens einmal pro Frame, damit eigene Änderungen keine Kette auslösen.
  // Schutz: Läuft es trotzdem drei Sekunden am Stück mehr als GUARD_LIMIT-mal
  // pro Sekunde (eine Schleife mit dem Observer), schaltet sich das Schmücken
  // ab, statt die ganze Oberfläche einzufrieren. Die Menüs funktionieren weiter.
  let queued = false;
  let runs = 0;
  let busySeconds = 0;
  let windowStart = performance.now();
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const now = performance.now();
      if (now - windowStart > 1000) {
        busySeconds = runs > GUARD_LIMIT && now - windowStart < 2000 ? busySeconds + 1 : 0;
        windowStart = now;
        runs = 0;
      }
      runs++;
      if (busySeconds >= 3) {
        observer.disconnect();
        console.warn(
          `HomeAssistantXP Startmenü: Seitenleiste ändert sich mehr als ${GUARD_LIMIT}-mal pro Sekunde, ` +
            "Streifen und bunte Icons werden nicht mehr nachgeführt (Schutz vor Endlosschleife)."
        );
        return;
      }
      try {
        addArrows();
        decorate(root);
      } catch (err) {
        console.warn("HomeAssistantXP Startmenü: Fehler beim Schmücken der Seitenleiste", err);
      }
    });
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: [...MENU_ATTRS, "icon", "href"] });

  root.addEventListener(
    "pointerover",
    mouseOnly((ev) => {
      const anchor = findAnchor(ev);
      if (anchor) {
        cancelClose();
        openRootMenu(anchor);
      }
    })
  );
  root.addEventListener(
    "pointerout",
    mouseOnly((ev) => {
      if (findAnchor(ev) && !findAnchor({ composedPath: () => [ev.relatedTarget] })) scheduleClose();
    })
  );
  // Doppelklick auf den Titel mit der Uhr wie auf die Uhr der Taskleiste,
  // auf Touch-Bildschirmen reicht einmal Tippen
  const onTitle = (ev) => ev.composedPath().some((el) => el.classList?.contains("title"));
  root.addEventListener("dblclick", (ev) => config?.clock && onTitle(ev) && openClock());
  root.addEventListener("pointerup", (ev) => {
    if (ev.pointerType === "touch" && config?.clock && onTitle(ev)) openClock();
  });
  // Klick/Tippen öffnet das Menü (für Touch), statt zu navigieren. Mit der
  // Maus hat schon das Darüberfahren das Menü geöffnet, der Klick schließt
  // es dann nicht wieder (nur Tippen schaltet um).
  root.addEventListener(
    "click",
    (ev) => {
      const anchor = findAnchor(ev);
      if (!anchor) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.pointerType === "mouse") openRootMenu(anchor);
      else if (openMenus[0]?.anchor === anchor) closeAll();
      else openRootMenu(anchor);
    },
    true
  );
}

// ---------- Startpanel (zweispaltig, wie das Startmenü von XP) ----------

// Ohne eigene Angaben: die Seiten der Seitenleiste links, Einstellungen & Co. rechts.
// Eigene Listen unter "start_panel" in der Menüdatei: pinned, places, programs, user.
const PANEL_SKIP = new Set(["config", "developer-tools", "profile", "notfound", "hassio"]);

function defaultPinned() {
  const h = hass();
  const panels = Object.values(h?.panels || {}).filter((p) => p.title && !PANEL_SKIP.has(p.url_path));
  const first = panels.findIndex((p) => p.url_path === h?.defaultPanel);
  if (first > 0) panels.unshift(...panels.splice(first, 1));
  return panels.slice(0, 9).map((p) => ({
    name: h.localize?.(`panel.${p.title}`) || p.title,
    icon: p.icon || "mdi:view-dashboard",
    path: `/${p.url_path}`,
  }));
}

function defaultPlaces() {
  const s = t();
  return [
    { name: s.sp_settings, icon: "mdi:cog", path: "/config" },
    { name: s.sp_dev, icon: "mdi:tools", path: "/developer-tools" },
    { name: s.sp_profile, icon: "mdi:account", path: "/profile" },
    { divider: true },
    { name: s.sp_updates, icon: "mdi:shield", action: "check-updates" },
    { name: s.sp_run, icon: "mdi:console", action: "run" },
  ];
}

const spIcon = (icon) => {
  const color = config?.color_icons === false ? "" : colorSvg(colorName(icon));
  return color || (icon ? `<ha-icon icon="${icon}"></ha-icon>` : "");
};

function spRow(item, cls) {
  if (item.divider) {
    const hr = document.createElement("div");
    hr.className = "xp-sp-divider";
    return hr;
  }
  const row = document.createElement("button");
  row.className = `xp-sp-item ${cls}`;
  row.setAttribute("role", "menuitem");
  row.innerHTML = `<span class="xp-icon">${spIcon(item.icon)}</span><span class="xp-label"></span>`;
  row.querySelector(".xp-label").textContent = item.name ?? "";
  if (item.items) {
    const open = () => {
      if (openMenus[1]?.anchor === row) return;
      showMenu(item.items, row.getBoundingClientRect(), 1, row);
      row.classList.add("xp-open");
    };
    row.addEventListener("pointerenter", mouseOnly(open));
    row.addEventListener("click", open);
  } else {
    row.addEventListener("pointerenter", mouseOnly(() => closeFrom(1)));
    row.addEventListener("click", () => runItem(item));
  }
  return row;
}

let spOutside = null;

async function toggleStartPanel() {
  if (openMenus[0]?.el.classList.contains("xp-sp")) return closeAll();
  const cfg = await loadConfig();
  closeAll();
  playSound("menu");
  const s = t();
  const sp = cfg.start_panel || {};
  const programs =
    sp.programs ||
    Object.entries(cfg.menus || {}).map(([id, items]) => ({
      name: sp.names?.[id] || id.charAt(0).toUpperCase() + id.slice(1),
      icon: "mdi:folder-open",
      items,
    }));

  const panel = document.createElement("div");
  panel.className = "xp-sp";
  panel.setAttribute("role", "menu");
  panel.innerHTML = `
    <div class="xp-sp-head"><span class="xp-sp-avatar">${colorSvg("account")}</span><b></b></div>
    <div class="xp-sp-cols"><div class="xp-sp-left"></div><div class="xp-sp-right"></div></div>
    <div class="xp-sp-foot"></div>`;
  panel.querySelector(".xp-sp-head b").textContent = sp.user || hass()?.user?.name || "";
  const left = panel.querySelector(".xp-sp-left");
  const right = panel.querySelector(".xp-sp-right");
  for (const item of sp.pinned || defaultPinned()) left.appendChild(spRow(item, "xp-sp-big"));
  if (programs.length) {
    const all = spRow({ name: s.sp_programs, items: programs }, "xp-sp-all");
    all.querySelector(".xp-icon").innerHTML = '<span class="xp-sp-go">▶</span>';
    left.append(Object.assign(document.createElement("div"), { className: "xp-sp-divider xp-sp-push" }), all);
  }
  for (const item of sp.places || defaultPlaces()) right.appendChild(spRow(item, "xp-sp-place"));

  const foot = panel.querySelector(".xp-sp-foot");
  for (const [icon, label, action] of [
    ["key", s.sp_logoff, "logoff"],
    ["power", s.sp_restart, "restart"],
  ]) {
    const b = document.createElement("button");
    b.className = "xp-sp-foot-btn";
    b.innerHTML = `<span class="xp-icon">${colorSvg(icon)}</span><span></span>`;
    b.lastChild.textContent = label;
    b.addEventListener("pointerenter", mouseOnly(() => closeFrom(1)));
    b.addEventListener("click", () => runItem({ action }));
    foot.appendChild(b);
  }

  panel.addEventListener("pointerenter", mouseOnly(cancelClose));
  panel.popover = "manual";
  layer().appendChild(panel);
  panel.showPopover?.();
  panel.style.bottom = `${document.querySelector("xp-taskbar")?.offsetHeight || 0}px`;
  openMenus.push({ el: panel, anchor: null });
  window.dispatchEvent(new CustomEvent("xp-startpanel", { detail: { open: true } }));

  if (!spOutside) {
    spOutside = (ev) => {
      if (!openMenus[0]?.el.classList.contains("xp-sp")) return;
      // Ein Klick auf den Start-Knopf schaltet selbst um
      if (ev.composedPath().some((el) => openMenus.some((m) => m.el === el) || el.classList?.contains("start"))) return;
      closeAll();
    };
    window.addEventListener("pointerdown", spOutside, true);
    window.addEventListener("keydown", (ev) => ev.key === "Escape" && openMenus[0]?.el.classList.contains("xp-sp") && closeAll());
  }
}
window.xpStartPanel = { toggle: toggleStartPanel };

// ---------- Sanduhr ----------

// Zählt laufende Anfragen an HA. Dauert eine länger als BUSY_DELAY (z. B.
// Speichern, Dienstaufruf), ohne Verbindung (Neustart) und kurz nach einem
// Seitenwechsel zeigt der Mauszeiger die Sanduhr.
const BUSY_DELAY = 300;
let busyPending = 0;
let busyOffline = false;
let busyNavUntil = 0;
let busyTimer = null;

const updateBusy = () => {
  const busy = busyPending > 0 || busyOffline || performance.now() < busyNavUntil;
  document.documentElement.classList.toggle("xp-busy", busy && config?.busy_cursor !== false);
};
const busySoon = () => {
  clearTimeout(busyTimer);
  busyTimer = setTimeout(updateBusy, BUSY_DELAY);
};

function watchBusy(conn) {
  if (!conn || conn.__xpbusy || typeof conn.sendMessagePromise !== "function") return;
  conn.__xpbusy = true;
  const send = conn.sendMessagePromise.bind(conn);
  conn.sendMessagePromise = (...args) => {
    const done = () => {
      busyPending = Math.max(0, busyPending - 1);
      if (!busyPending) updateBusy();
    };
    busyPending++;
    busySoon();
    const p = send(...args);
    p.then(done, done);
    return p;
  };
  conn.addEventListener("disconnected", () => {
    busyOffline = true;
    updateBusy();
  });
  conn.addEventListener("ready", () => {
    busyOffline = false;
    busyPending = 0; // Antworten auf alte Anfragen kommen nach einem Neustart nicht mehr
    updateBusy();
  });
}

window.addEventListener("location-changed", () => {
  busyNavUntil = performance.now() + 600;
  updateBusy();
  setTimeout(updateBusy, 650);
});

// XP-Sanduhr, Hotspot in der Mitte
const BUSY_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23fff' stroke-width='8.5' stroke-opacity='.9'/%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%231d4fb8' stroke-width='6'/%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%2373a6ff' stroke-width='3.2' stroke-dasharray='34 35' transform='rotate(-70 16 16)'/%3E%3C/svg%3E") 16 16, wait`;

// ---------- Stil der Menüs (Farben aus dem HA-XP-Design) ----------

const MENU_CSS = `
  .xp-menu {
    position: fixed; z-index: 10000; min-width: 180px; padding: 2px;
    inset: auto; margin: 0; border: none; overflow: visible;
    background: var(--xp-window, #fff); border-radius: 4px;
    box-shadow: inset 0 0 0 1px var(--xp-shadow, #aca899), 3px 3px 4px rgba(0, 0, 0, 0.35);
    font-family: var(--xp-font, Tahoma, sans-serif); font-size: 14px;
    color: var(--xp-window-text, #000);
  }
  .xp-item {
    display: flex; align-items: center; gap: 8px; width: 100%;
    height: 26px; padding: 0 8px 0 4px; border: none; margin: 0; border-radius: 2px;
    background: transparent; color: inherit; font: inherit; text-align: left;
    cursor: default; white-space: nowrap;
  }
  .xp-item:hover, .xp-item:focus-visible, .xp-item.xp-open {
    background: var(--xp-select, #316ac5); color: var(--xp-select-text, #fff); outline: none;
  }
  .xp-icon { width: 24px; display: inline-flex; justify-content: center; }
  .xp-icon ha-icon { --mdc-icon-size: 18px; }
  .xp-icon .xp-cicon { width: 24px; height: 24px; }
  .xp-label { flex: 1; }
  .xp-arrow { font-size: 10px; padding-left: 16px; }
  .xp-divider {
    height: 0; margin: 3px 2px;
    border-top: 1px solid var(--xp-shadow, #aca899);
    border-bottom: 1px solid var(--xp-highlight, #fff);
  }
  .xp-sp {
    position: fixed; z-index: 10000; left: 0; top: auto; right: auto;
    width: min(380px, 100vw); max-height: 100vh; margin: 0; padding: 0; border: none;
    display: flex; flex-direction: column; overflow: visible; box-sizing: border-box;
    background: var(--xp-select, #316ac5); color: var(--xp-window-text, #000);
    border-radius: var(--xp-radius-window, 8px 8px 0 0);
    box-shadow: inset 0 0 0 1px var(--xp-border, #003c74), 3px 0 5px rgba(0, 0, 0, 0.4);
    font-family: var(--xp-font, Tahoma, sans-serif); font-size: 13px;
  }
  .xp-sp-head {
    display: flex; align-items: center; gap: 10px; flex: none; height: 54px; padding: 0 8px; box-sizing: border-box;
    background: var(--xp-title-bar, #0054e3); border-radius: var(--xp-radius-window, 8px 8px 0 0);
    color: var(--xp-title-text, #fff); font: bold 16px/1 var(--xp-font-title, "Trebuchet MS", Tahoma, sans-serif);
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
  }
  .xp-sp-avatar {
    display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: none;
    background: var(--xp-window, #fff); border: 2px solid #fff; border-radius: 4px; box-sizing: border-box;
  }
  .xp-sp-avatar .xp-cicon { width: 32px; height: 32px; }
  .xp-sp-cols { display: flex; flex: 1 1 auto; min-height: 0; margin: 0 2px; overflow: auto; }
  .xp-sp-left, .xp-sp-right { display: flex; flex-direction: column; padding: 6px 4px; box-sizing: border-box; }
  .xp-sp-left { flex: 1 1 55%; background: var(--xp-window, #fff); }
  .xp-sp-right {
    flex: 1 1 45%; font-weight: bold;
    background: color-mix(in srgb, var(--xp-select, #316ac5) 14%, var(--xp-window, #fff));
    border-left: 1px solid color-mix(in srgb, var(--xp-select, #316ac5) 35%, var(--xp-window, #fff));
  }
  .xp-sp-item {
    display: flex; align-items: center; gap: 8px; width: 100%; flex: none; margin: 0; padding: 0 6px 0 4px;
    border: none; border-radius: 2px; background: transparent; color: inherit; font: inherit;
    text-align: left; cursor: default; white-space: nowrap;
  }
  .xp-sp-item:hover, .xp-sp-item:focus-visible, .xp-sp-item.xp-open {
    background: var(--xp-select, #316ac5); color: var(--xp-select-text, #fff); outline: none;
  }
  .xp-sp-big { height: 40px; }
  .xp-sp-big .xp-icon, .xp-sp-big .xp-cicon { width: 32px; height: 32px; }
  .xp-sp-big .xp-icon ha-icon { --mdc-icon-size: 26px; }
  .xp-sp-big .xp-label, .xp-sp-place .xp-label { overflow: hidden; text-overflow: ellipsis; }
  .xp-sp-place { height: 30px; }
  .xp-sp-all { height: 28px; justify-content: center; font-weight: bold; }
  .xp-sp-all .xp-label { flex: none; }
  .xp-sp-all .xp-icon { width: auto; order: 2; }
  .xp-sp-go {
    display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px;
    border-radius: 50%; background: var(--xp-start, #3c9a3c); color: #fff; font-size: 9px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  }
  .xp-sp-divider { height: 0; flex: none; margin: 4px 6px; border-top: 1px solid color-mix(in srgb, var(--xp-select, #316ac5) 40%, var(--xp-window, #fff)); }
  .xp-sp-push { margin-top: auto; }
  .xp-sp-foot {
    display: flex; justify-content: flex-end; gap: 6px; flex: none; height: 40px; padding: 0 8px; align-items: center;
    background: var(--xp-title-bar, #0054e3); color: var(--xp-title-text, #fff);
  }
  .xp-sp-foot-btn {
    display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 6px; margin: 0; border: none; border-radius: 3px;
    background: transparent; color: inherit; font: inherit; cursor: default;
  }
  .xp-sp-foot-btn:hover { background: rgba(255, 255, 255, 0.22); }
  .xp-sp-foot-btn .xp-icon, .xp-sp-foot-btn .xp-cicon { width: 24px; height: 24px; }
  .xp-modal {
    position: fixed; inset: 0; z-index: 10001;
    width: auto; height: auto; max-width: none; max-height: none;
    margin: 0; padding: 0; border: none;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    font-family: var(--xp-font, Tahoma, sans-serif); font-size: 14px;
  }
  .xp-window {
    min-width: 320px; padding: 3px;
    background: var(--xp-face, #ece9d8); color: var(--xp-text, #000);
    box-shadow: var(--xp-frame, inset 0 0 0 3px #0831d9); border-radius: var(--xp-radius-window, 8px 8px 0 0);
  }
  .xp-titlebar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 2px 2px 2px 6px; font-weight: bold; min-height: 26px; box-sizing: border-box;
    font-family: var(--xp-font-title, "Trebuchet MS", Tahoma, sans-serif);
    background: var(--xp-title-bar, #0054e3); border-radius: var(--xp-radius-title, 5px 5px 0 0); color: var(--xp-title-text, #fff);
  }
  .xp-close {
    width: 21px; height: 21px; padding: 0; border: 1px solid #fff; border-radius: 3px; line-height: 17px; font-size: 14px; font-weight: bold;
    background: linear-gradient(180deg, #ee9a82, #c43a1a); color: #fff;
    box-shadow: none;
  }
  .xp-body { display: flex; gap: 16px; align-items: flex-start; padding: 16px 16px 8px; }
  .xp-body ha-icon { --mdc-icon-size: 32px; flex: none; }
  .xp-body p { margin: 0; line-height: 1.4; }
  .xp-buttons { display: flex; justify-content: center; gap: 8px; padding: 8px 16px 12px; }
  .xp-button {
    min-width: 75px; height: 23px; border: none; font: inherit;
    background: var(--xp-face, #ece9d8); color: var(--xp-text, #000);
    box-shadow: var(--xp-raised, inset 0 0 0 1px #003c74); border-radius: var(--xp-radius, 3px);
  }
  .xp-button:active { box-shadow: var(--xp-sunken, inset 0 0 0 1px #7f9db9); }
  .xp-button:focus-visible { outline: 1px dotted currentColor; outline-offset: -5px; }
  .xp-safe {
    position: fixed; inset: 0; z-index: 10002;
    width: auto; height: auto; max-width: none; max-height: none;
    margin: 0; padding: 24px; border: none; box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
    background: radial-gradient(ellipse at 50% 40%, #6a90e8 0%, #3a62c8 60%, #2a4aa8 100%); color: #fff; text-align: center; cursor: none;
    font-family: var(--xp-font-title, "Trebuchet MS", Tahoma, sans-serif);
  }
  .xp-safe p { margin: 0; font-size: clamp(20px, 4vw, 36px); line-height: 1.3; }
  .xp-safe small { font-size: 13px; color: #cfe0ff; }
  .xp-bsod {
    position: fixed; inset: 0; z-index: 10003;
    width: auto; height: auto; max-width: none; max-height: none;
    margin: 0; padding: 8vh 8vw; border: none; box-sizing: border-box;
    display: flex; flex-direction: column; gap: 14px; overflow: auto;
    background: #0000aa; color: #fff; cursor: none;
    font: 16px/1.5 "Lucida Console", "Courier New", monospace; -webkit-font-smoothing: none;
  }
  .xp-bsod b {
    align-self: center; padding: 0 10px; background: #aaa; color: #0000aa; font-weight: normal;
  }
  .xp-bsod p { margin: 0; }
  .xp-bsod p.key { margin-top: 10px; text-align: center; }
`;
const css = document.createElement("style");
css.textContent = MENU_CSS + `html.xp-busy, html.xp-busy body { cursor: ${BUSY_CURSOR} !important; }`;
document.head.appendChild(css);

// ---------- Klänge ----------
// Selbst erzeugt mit WebAudio, keine Dateien. Nur mit "sounds": true.
let audio = null;
function playSound(kind) {
  if (config?.sounds !== true) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const notes = {
      click: [[880, 0, 0.03, "square", 0.04]],
      menu: [[660, 0, 0.04, "square", 0.04]],
      ding: [[1175, 0, 0.25, "sine", 0.18], [1568, 0.12, 0.4, "sine", 0.18]],
      error: [[160, 0, 0.18, "sawtooth", 0.12], [110, 0.18, 0.3, "sawtooth", 0.12]],
      shutdown: [[784, 0, 0.3, "triangle", 0.15], [659, 0.3, 0.3, "triangle", 0.15], [523, 0.6, 0.6, "triangle", 0.15]],
      win: [[523, 0, 0.15, "triangle", 0.15], [659, 0.15, 0.15, "triangle", 0.15], [784, 0.3, 0.15, "triangle", 0.15], [1047, 0.45, 0.5, "triangle", 0.15]],
    }[kind];
    const now = audio.currentTime;
    for (const [freq, at, len, type, vol] of notes || []) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, now + at);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + at);
      osc.stop(now + at + len + 0.02);
    }
  } catch {
    // ohne Audio bleibt es still
  }
}
window.xpSound ??= playSound;
document.addEventListener("hass-notification", () => playSound("ding"), true);

// Schließen bei Klick daneben, Escape oder Seitenwechsel
document.addEventListener("pointerdown", (ev) => {
  if (!openMenus.length) return;
  const path = ev.composedPath();
  if (openMenus.some((m) => path.includes(m.el)) || findAnchor(ev)) return;
  closeAll();
});
document.addEventListener("keydown", (ev) => ev.key === "Escape" && closeAll());
window.addEventListener("location-changed", () => closeAll());

// Warten, bis die Seitenleiste da ist (und neu andocken, falls HA sie neu baut)
(async () => {
  for (;;) {
    const sb = sidebar();
    if (sb) attach(sb);
    watchBusy(hass()?.connection);
    watchBsod(hass()?.connection);
    await sleep(1000);
  }
})();
