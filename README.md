# HA XP

🇬🇧 **English** · 🇩🇪 [Deutsch](README.de.md)

A **Windows XP (Luna)** design for Home Assistant, installed through HACS as an integration. Same feature set as [HomeAssistant95](https://github.com/Schumey/HomeAssistant95), built from [ha-theme-kit](https://github.com/Schumey/ha-theme-kit).

## Themes

| Theme | Look |
|---|---|
| **HA XP** | Luna blue: blue frame and title bars, Bliss-style desktop, green Start button |
| **HA XP Olive** | Luna olive green |
| **HA XP Silver** | Luna silver |
| **HA XP Royale Noir** | black title bars, light windows |
| **HA XP Dark** | dark colour scheme |
| **HA XP Auto** | follows the light/dark mode (HA XP / HA XP Dark) |

## Features

- **Window look** (needs [UIX](https://github.com/Lint-Free-Technology/uix) or card-mod): cards and dialogs as XP windows with rounded blue title bars and minimise/maximise/close buttons, section views as windows, view tabs as tab pages, XP message boxes, toasts, "Run" quick bar, thermostat buttons, check boxes instead of switches, green progress bars.
- **Start menu** (`xp-startmenu.js`): sidebar as Start menu with banner, colour icons, fly-out menus from `/config/www/xp-startmenu.json`, "Run...", shutdown screen, hourglass cursor.
- **Taskbar** (`xp-taskbar.js`): green Start button, task buttons, tray with clock and notifications.
- **Clock and calendar** (`xp-clock.js`), **panels** (`xp-panels.js`, scrollbars and settings pages), **desktop icons** (`xp-desktop.js`), **screensaver**, **Minesweeper**, **Solitaire**.
- **Mouse cursor and scrollbars** (`xp.css`), **retro pixel icons** (`xp:` set, carried over from HomeAssistant95).

Options are under *Settings → Devices & services → HA XP → Configure*.

## Install

1. HACS → three dots → *Custom repositories* → `https://github.com/Schumey/HomeAssistantXP`, type *Integration* → download.
2. Restart Home Assistant, add the integration *HA XP*, choose themes and modules.
3. `configuration.yaml` needs:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

4. *Profile → Theme* → **HA XP**.

## Develop

```bash
pip install pyyaml
python tools/build.py          # src/xp.src.yaml + src/blocks -> custom_components/xp/themes
python tools/check.py 1.0.0    # pre-release check
```

See [CLAUDE.md](CLAUDE.md) and [docs/](docs/). Fonts: Tahoma and Trebuchet MS come from the system, nothing is downloaded.

## Status

Built from the HomeAssistant95 structure with XP values and previewed in a static mock, not yet tuned live in a running Home Assistant. The pixel icons are still the Windows 95 set.

## License

MIT. Fonts, cursors and logos of Windows XP have their own licenses; colours and shapes here are a recreation.
