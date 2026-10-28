# HomeAssistantXP

<img src="https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/custom_components/xp/brand/icon.png" alt="" width="96" align="right">

🇬🇧 [English](README.md) · 🇩🇪 **Deutsch**

Ein **Windows-XP-Design (Luna)** für Home Assistant, über HACS als Integration. Gleicher Funktionsumfang wie [HomeAssistant95](https://github.com/Schumey/HomeAssistant95), gebaut aus dem [ha-theme-kit](https://github.com/Schumey/ha-theme-kit).

![HomeAssistantXP (Luna Blau)](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/dashboard.png)

| | |
|---|---|
| ![Zweispaltiges Startmenü (Start-Knopf der Taskleiste)](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/startmenu.png)<br>Zweispaltiges Startmenü (Start-Knopf der Taskleiste) | ![Seitenleiste als Startmenü](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/sidebar.png)<br>Seitenleiste als Startmenü |
| ![Einstellungen, Schieberegler und Meldungen](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/controls.png)<br>Einstellungen, Schieberegler und Meldungen | ![Olive](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/olive.png)<br>Olive |
| ![Silver](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/silver.png)<br>Silver | |

## Designs

| Design | Look |
|---|---|
| **HomeAssistantXP** | Luna Blau: blauer Rahmen und Titelleisten, Bliss-Desktop, grüner Start-Knopf |
| **HomeAssistantXP Olive** | Luna Olivgrün |
| **HomeAssistantXP Silver** | Luna Silber |
| **HomeAssistantXP Royale Noir** | schwarze Titelleisten, helle Fenster |
| **HomeAssistantXP Dark** | dunkles Farbschema |
| **HomeAssistantXP Auto** | folgt dem Hell-/Dunkelmodus (HomeAssistantXP / HomeAssistantXP Dark) |

## Funktionen

- **Fenster-Look** (braucht [UIX](https://github.com/Lint-Free-Technology/uix) oder card-mod): Karten und Dialoge als XP-Fenster mit runder blauer Titelleiste und Minimieren/Maximieren/Schließen, Abschnitte als Fenster, Ansichten-Tabs als Registerkarten, XP-Meldungsfenster, Meldungen, „Ausführen“-Schnellsuche, Thermostat-Knöpfe, Kontrollkästchen statt Schalter, grüne Fortschrittsbalken.
- **Startmenü** (`xp-startmenu.js`): Seitenleiste als Startmenü mit Streifen, bunten Icons, Ausklappmenüs aus `/config/www/xp-startmenu.json`, „Ausführen ...“, Herunterfahren-Bildschirm, Sanduhr.
- **Taskleiste** (`xp-taskbar.js`): grüner Start-Knopf mit zweispaltigem XP-Startmenü (Seiten, Orte, Alle Programme, Abmelden / Neustart), Aufgaben-Knöpfe, Infobereich mit Uhr und Benachrichtigungen.
- **Uhr und Kalender**, **Panels** (Scrollleisten, Einstellungsseiten), **Desktop-Symbole**, **Bildschirmschoner**, **Minesweeper**, **Solitaire**.
- **Mauszeiger und Scrollleisten** (`xp.css`), **Retro-Pixel-Icons** (Satz `xp:`, aus HomeAssistant95 übernommen).

Optionen: *Einstellungen → Geräte & Dienste → HomeAssistantXP → Konfigurieren*.

## Installation

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Schumey&repository=HomeAssistantXP&category=integration)

oder von Hand:

1. HACS → Menü → *Benutzerdefinierte Repositories* → `https://github.com/Schumey/HomeAssistantXP`, Typ *Integration* → herunterladen.
2. Home Assistant neu starten, Integration *HomeAssistantXP* hinzufügen, Designs und Module wählen.
3. In der `configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

4. *Profil → Design* → **HomeAssistantXP**.

## Entwickeln

```bash
pip install pyyaml
python tools/build.py          # src/xp.src.yaml + src/blocks -> custom_components/xp/themes
python tools/check.py 1.3.4    # Prüfung vor dem Release
```

Siehe [CLAUDE.md](CLAUDE.md) und [docs/](docs/). Schriften: Tahoma und Trebuchet MS kommen vom System, es wird nichts geladen.

## Stand

Aus der HomeAssistant95-Struktur mit XP-Werten gebaut, die Icons sind für XP gezeichnet. Die Feinabstimmung in einem laufenden Home Assistant läuft.

## Lizenz

MIT. Schriften, Mauszeiger und Logos von Windows XP haben eigene Lizenzen; Farben und Formen sind hier eine Nachbildung.
