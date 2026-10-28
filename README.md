# HomeAssistantXP

<img src="https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/custom_components/xp/brand/icon.png" alt="" width="96" align="right">

🇬🇧 **English** · 🇩🇪 [Deutsch](README.de.md)

A **Windows XP (Luna)** design for Home Assistant, installed through HACS as an integration. Same feature set as [HomeAssistant95](https://github.com/Schumey/HomeAssistant95), built from [ha-theme-kit](https://github.com/Schumey/ha-theme-kit).

![HomeAssistantXP (Luna blue)](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/dashboard.png)

| | |
|---|---|
| ![Two-column Start menu (taskbar Start button)](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/startmenu.png)<br>Two-column Start menu (taskbar Start button) | ![Sidebar as Start menu](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/sidebar.png)<br>Sidebar as Start menu |
| ![Settings, sliders and message boxes](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/controls.png)<br>Settings, sliders and message boxes | ![Olive](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/olive.png)<br>Olive |
| ![Silver](https://raw.githubusercontent.com/Schumey/HomeAssistantXP/master/docs/screenshots/silver.png)<br>Silver | |

## Themes

| Theme | Look |
|---|---|
| **HomeAssistantXP** | Luna blue: blue frame and title bars, Bliss-style desktop, green Start button |
| **HomeAssistantXP Olive** | Luna olive green |
| **HomeAssistantXP Silver** | Luna silver |
| **HomeAssistantXP Royale Noir** | black title bars, light windows |
| **HomeAssistantXP Dark** | dark colour scheme |
| **HomeAssistantXP Auto** | follows the light/dark mode (HomeAssistantXP / HomeAssistantXP Dark) |

## Features

- **Window look** (needs [UIX](https://github.com/Lint-Free-Technology/uix) or card-mod): cards and dialogs as XP windows with rounded blue title bars and minimise/maximise/close buttons, section views as windows, view tabs as tab pages, XP message boxes, toasts, "Run" quick bar, thermostat buttons, check boxes instead of switches, green progress bars.
- **Start menu** (`xp-startmenu.js`): sidebar as Start menu with banner, colour icons, fly-out menus from `/config/www/xp-startmenu.json`, "Run...", shutdown screen, hourglass cursor.
- **Taskbar** (`xp-taskbar.js`): green Start button with a two-column XP Start menu (pages, places, All Programs, Log Off / Restart), task buttons, tray with clock and notifications.
- **Clock and calendar** (`xp-clock.js`), **panels** (`xp-panels.js`, scrollbars and settings pages), **desktop icons** (`xp-desktop.js`), **screensaver**, **Minesweeper**, **Solitaire**.
- **Mouse cursor and scrollbars** (`xp.css`), **retro pixel icons** (`xp:` set, carried over from HomeAssistant95).

Options are under *Settings → Devices & services → HomeAssistantXP → Configure*.

## Install

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Schumey&repository=HomeAssistantXP&category=integration)

or by hand:

1. HACS → three dots → *Custom repositories* → `https://github.com/Schumey/HomeAssistantXP`, type *Integration* → download.
2. Restart Home Assistant, add the integration *HomeAssistantXP*, choose themes and modules.
3. `configuration.yaml` needs:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

4. *Profile → Theme* → **HomeAssistantXP**.

## Develop

```bash
pip install pyyaml
python tools/build.py          # src/xp.src.yaml + src/blocks -> custom_components/xp/themes
python tools/check.py 1.3.4    # pre-release check
```

See [CLAUDE.md](CLAUDE.md) and [docs/](docs/). Fonts: Tahoma and Trebuchet MS come from the system, nothing is downloaded.

## Status

Built from the HomeAssistant95 structure with XP values; the icons are drawn for XP. Fine tuning in a running Home Assistant is ongoing.

## License

MIT. Fonts, cursors and logos of Windows XP have their own licenses; colours and shapes here are a recreation.
