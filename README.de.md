# HomeAssistantXP

🇬🇧 [English](README.md) · 🇩🇪 **Deutsch**

Ein **Windows-XP-Design (Luna)** für Home Assistant, über HACS als Integration. Gleicher Funktionsumfang wie [HomeAssistant95](https://github.com/Schumey/HomeAssistant95), gebaut aus dem [ha-theme-kit](https://github.com/Schumey/ha-theme-kit).

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
- **Taskleiste** (`xp-taskbar.js`): grüner Start-Knopf, Aufgaben-Knöpfe, Infobereich mit Uhr und Benachrichtigungen.
- **Uhr und Kalender**, **Panels** (Scrollleisten, Einstellungsseiten), **Desktop-Symbole**, **Bildschirmschoner**, **Minesweeper**, **Solitaire**.
- **Mauszeiger und Scrollleisten** (`xp.css`), **Retro-Pixel-Icons** (Satz `xp:`, aus HomeAssistant95 übernommen).

Optionen: *Einstellungen → Geräte & Dienste → HomeAssistantXP → Konfigurieren*.

## Installation

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
python tools/check.py 1.2.1    # Prüfung vor dem Release
```

Siehe [CLAUDE.md](CLAUDE.md) und [docs/](docs/). Schriften: Tahoma und Trebuchet MS kommen vom System, es wird nichts geladen.

## Stand

Aus der HomeAssistant95-Struktur mit XP-Werten gebaut, die Icons sind für XP gezeichnet. Die Feinabstimmung in einem laufenden Home Assistant läuft.

## Lizenz

MIT. Schriften, Mauszeiger und Logos von Windows XP haben eigene Lizenzen; Farben und Formen sind hier eine Nachbildung.
