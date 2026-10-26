# Changelog

## 1.4.2

- Title buttons (minimize, maximize) take the colours of the theme: olive, silver and noir no longer show blue buttons in the window title. The close X is bolder.
- Dialogs without their own theme rule (calendar entries, the options dialog of the integration): close button is the red XP button with a bold white X, the toolbar buttons (help) are flat.
- The scrollbar in dialogs sits inside the window frame instead of over it.
- Markdown cards without a title, and button-card / mushroom cards, look like the other tiles (XP button) instead of a framed window.

## 1.4.1

- Close buttons of dialogs (info dialog, update dialog, editors): bold white X on the red button; before, the icon colour of the inner button stayed black.
- Dialog footer (update dialog): the slotted footer is reset to the full window width, no offset, so it no longer sticks out of the frame.
- Brand icon: Luna title bar and window frame drawn as one piece, with a small house, title text and larger title buttons.

## 1.4.0

- Two-column Start menu like Windows XP: the Start button of the taskbar opens a panel with a blue header (user name and picture), the pages of the sidebar on the left, Settings, Developer tools, Profile, "Check for updates" and "Run ..." on the right, "All Programs" with the fly-out menus from `xp-startmenu.json`, and "Log Off" / "Restart" in the footer. Lists, user name and programs can be set under `start_panel` in `xp-startmenu.json` (`pinned`, `places`, `programs`, `user`); `"taskbar": { "start_panel": false }` keeps the old behaviour (Start toggles the sidebar).
- New menu action `logoff` (with confirmation).
- The brand icon shown in HACS and Home Assistant is redrawn in Windows XP style (Luna window with house) instead of the Windows 95 window.

## 1.3.4

- Dialogs with a footer (for example the update dialog): the window frame lies above the footer again, the footer fills the window width and the window has a solid face colour, so the frame is closed at the bottom and no footer sticks out over the frame.

## 1.3.3

- Taskbar: the blue edge in front of the tray is a neutral dark edge, taskbar button borders are neutral black shades, so no blue shows in the olive, silver and noir themes.

## 1.3.2

- View tabs look like Luna tab pages: rounded top corners, light gradient, a taller active tab with a two-line orange top edge, orange edge on hover.

## 1.3.1

- Sidebar: the selected entry is a solid selection-colour bar with white text (it was a white block with invisible text).
- Dialogs: close buttons (info dialog, confirmation dialogs, edit dialogs) are red XP buttons; the toolbar buttons below the title bar are flat with an XP hover instead of angular raised boxes.
- Drop-down arrow of select fields and the calendar button are Luna-style tinted buttons; header bar buttons have rounded corners.

## 1.3.0

- Luna details: orange hover ring on buttons, tiles and button cards, blue default-button glow on dialog actions, view tabs with rounded top corners and an orange line on the active tab, red close button in the notification drawer.
- Smooth check marks (check boxes, panels) and a smooth history icon in card headers instead of pixel masks.
- The busy cursor is the blue XP ring instead of the hourglass; text is no longer drawn without smoothing in clock, Minesweeper and Solitaire; screensaver logos use XP colours.
- New palette variables `xp-hot` (hover, active tab) and `xp-glow` (default button).

## 1.2.2

- Start menu: the fly-out menus now also work with the attribute `data-ha95-menu` and the file `/config/www/ha95-startmenu.json` from HomeAssistant95 (menus of both files are merged, `xp-startmenu.json` wins). Icons named `ha95:` keep working.
- Icon buttons in cards (for example the three dots of a light card) are flat with an XP hover instead of an angular raised frame; inside the media card the round buttons no longer have a square border.
- The pixelate icon option is gone (it made every other icon blocky); old settings behave like "replace" or "add".
- Two-tone icons have a stronger fill.

## 1.2.1

- Taskbar buttons, active buttons, tray and taskbar text follow the theme (`xp-task-btn`, `xp-task-btn-on`, `xp-tray`, `xp-taskbar-text`): olive, silver, Royale Noir and dark no longer show blue buttons.

## 1.2.0

- Media card in the style of Windows Media Player 8: blue-violet skin (`xp-mp-skin`), black display with the title, thin silver seek bar with a round thumb, round silver-blue buttons and a big blue play button.

## 1.1.1

- Fixed the title bar buttons: the minimise, maximise and close glyphs were all drawn on the first button.
- Tile and button cards look like XP buttons (face gradient, raised border, rounded corners) instead of getting the blue window frame.
- The blue window frame of section windows, the timeflow card and dialogs now has rounded top corners like the title bar.

## 1.1.0

- New XP icons: about 90 coloured vector icons for the start menu, taskbar and desktop (generated by `tools/color_icons.py`, preview with `--sheet`), replacing the Windows 95 pixel icons.
- The monochrome `xp:` icon set is now rendered as smooth outlines (the pixel grids are traced and smoothed at runtime) instead of hard pixels.
- Title bars use Trebuchet MS with a soft text shadow, the Home Assistant logo in update rows is a smooth vector.

## 1.0.1

- Renamed the display name "HA XP" to "HomeAssistantXP" (integration and themes, e.g. "HomeAssistantXP Olive"). Domain `xp` and the `xp-*` variables are unchanged.

## 1.0.0

- First release: Windows XP (Luna) design for Home Assistant, built from [ha-theme-kit](https://github.com/Schumey/ha-theme-kit) with the features of HomeAssistant95.
- Themes: HomeAssistantXP (Luna blue), Olive, Silver, Royale Noir, Dark, Auto.
- Blue window frame with rounded top corners, Luna title bar gradient, min/max/close buttons, XP buttons, fields, progress bars (green blocks), check boxes, scrollbars.
- Modules: start menu (sidebar), taskbar with green Start button, clock and calendar, panels, desktop icons, screensaver, Minesweeper, Solitaire, retro pixel icons.
