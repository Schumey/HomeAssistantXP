"""Konstanten der Integration HomeAssistantXP."""

DOMAIN = "xp"
URL_BASE = "/xp"

CONF_THEMES = "themes"
CONF_CSS = "css"
CONF_STARTMENU = "startmenu"
CONF_ICONS = "icons"
CONF_PANELS = "panels"
CONF_CLOCK = "clock"
CONF_SCREENSAVER = "screensaver"
CONF_MINESWEEPER = "minesweeper"
CONF_SOLITAIRE = "solitaire"
CONF_DESKTOP = "desktop"
CONF_TASKBAR = "taskbar"
CONF_UPDATE_STARTMENU = "update_startmenu"  # nur im Optionen-Dialog, wird nicht gespeichert

# Werte der Auswahl "Pixel-Icons" (siehe docs/pixel-icons.md)
ICONS_OFF = "off"
ICONS_ADD = "add"
ICONS_REPLACE = "replace"
ICONS_PIXELATE = "pixelate"
ICONS_BOTH = "both"
ICONS_QUERY = {
    ICONS_ADD: "",
    ICONS_REPLACE: "replace&",
    # Pixeln gibt es im XP-Design nicht mehr; alte Einstellungen werden wie "ersetzen" bzw. "ergänzen" behandelt
    ICONS_PIXELATE: "",
    ICONS_BOTH: "replace&",
}

# Modul-Schalter -> Datei in www/
MODULES = {
    CONF_CSS: "xp-css.js",
    CONF_STARTMENU: "xp-startmenu.js",
    CONF_PANELS: "xp-panels.js",
    CONF_CLOCK: "xp-clock.js",
    CONF_SCREENSAVER: "xp-screensaver.js",
    CONF_MINESWEEPER: "xp-minesweeper.js",
    CONF_SOLITAIRE: "xp-solitaire.js",
    CONF_DESKTOP: "xp-desktop.js",
    CONF_TASKBAR: "xp-taskbar.js",
}

DEFAULT_OPTIONS = {
    CONF_CSS: True,
    CONF_STARTMENU: True,
    CONF_ICONS: ICONS_ADD,
    CONF_PANELS: True,
    CONF_CLOCK: True,
    CONF_SCREENSAVER: False,
    CONF_MINESWEEPER: True,
    CONF_SOLITAIRE: True,
    CONF_DESKTOP: True,
    CONF_TASKBAR: False,
}
