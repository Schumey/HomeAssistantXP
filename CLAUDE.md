# Notes for Claude: Home Assistant theme project

This repo builds **HomeAssistantXP**, a Windows XP (Luna) design for Home Assistant (theme + JS/CSS modules), shipped through HACS as an **integration**. It started from the template [ha-theme-kit](https://github.com/Schumey/ha-theme-kit) and carries over the feature set of [HomeAssistant95](https://github.com/Schumey/HomeAssistant95): window look, start menu, taskbar, clock, panels, desktop icons, screensaver, Minesweeper, Solitaire and the `xp:` pixel icon set.


## Layout

| Path | Content |
|---|---|
| `src/xp.src.yaml` | **The theme source.** Palette variables, HA theme keys, UIX/card-mod rules, variants. Edit this, never the generated files. |
| `src/blocks/*.css` | CSS snippets pulled in with a line `@include name`. Blocks can include blocks. Shared CSS lives once. |
| `tools/build.py` | Resolves includes, anchors and merge keys and writes one file per theme to `custom_components/<domain>/themes/`. `--check` only verifies. |
| `tools/check.py` | Pre-release check: themes current, JSON/Python/`node --check`, versions and changelog (`python tools/check.py x.y.z`). |
| `tools/init.py` | One-time rename of the template. |
| `custom_components/<domain>/` | The integration. `__init__.py` copies the chosen themes to `/config/themes/<domain>/`, serves `www/` under `/<domain>/`, registers modules with `add_extra_js_url(...?v=<manifest version>)`. `config_flow.py` is the options UI. `const.py` lists modules and defaults. |
| `custom_components/<domain>/www/` | Optional JS/CSS (font, cursor, scrollbars, anything variables cannot do). |
| `docs/` | `workflow.md` (live tuning in a browser), `frontend-pitfalls.md` (HA/UIX/card-mod knowledge), `integration-patterns.md` (modules and options, user files that are never overwritten, talking to HA from a module, fixed bars), `publishing.md` (HACS, releases). |

Generated files (`custom_components/*/themes/*.yaml`) are overwritten by `build.py`. Never edit them by hand; run `python tools/build.py` after every change to `src/`.

## Rules for working here

- **All colors go through palette variables** (`<domain>-*`) at the top of the source. New rules use `var(--<domain>-…)`, not hex values, so all variants follow. A variant = YAML anchor `&base` + `<<: *base` + overridden palette values.
- `rgb-*-color` keys need the same colors as comma-separated numbers: HA only derives them from hex values, not from `var()`.
- Prefer plain theme variables. Only use UIX/card-mod for what variables cannot reach. Read `docs/frontend-pitfalls.md` **before** writing a UIX path or a card-mod rule: selectors guessed from memory usually miss the real DOM.
- Tune rules **live** (see `docs/workflow.md`): inject the CSS into the real shadow roots of a running HA, look at it, adjust, and only then move it into `src/`. Read the HA frontend / UIX sources on GitHub before guessing selectors.
- Do not touch the user's Home Assistant (config, dashboards, files) without asking; make a backup copy first. The HA MCP, if connected, is typically read-only.
- Comments in source files: short, in the language the user writes in, matching the existing density.

## Release routine

1. `git pull --ff-only`, `git status`.
2. Make the change in `src/` (and `www/`), run `python tools/build.py`.
3. Set the same `Version: x.y.z` in the header of every `www/*.js` and `www/*.css`, and `version` in `manifest.json`. The integration appends the manifest version as `?v=` itself, so users never edit cache parameters.
4. Add a section `## x.y.z` to `CHANGELOG.md` (and the translated file if the project keeps one).
5. `python tools/check.py x.y.z`.
6. Commit with **explicit paths** (`git add -- file …`), never `git add -A`: several sessions may work in the same folder.
7. Annotated tag `vX.Y.Z`, push, GitHub release with the changelog section as notes.
8. SemVer: renaming a theme, a variable or a file path breaks users, so that is a major version.

HA wording: German UI says „Werkzeuge → YAML → **Designs** neu laden“ and „Profil → **Design**“; English says Developer tools → YAML → Reload themes, Profile → Theme.

## Key facts (details in docs/frontend-pitfalls.md)

- **card-mod 4.2.1 is unmaintained.** From HA 2026.8 it freezes the whole UI as soon as a theme contains any `card-mod-…-yaml` key. Use only simple `card-mod-*` keys for the basic look and put everything else in `uix-*-yaml`. **UIX** (UI eXtension) is the maintained successor; read order: `uix-X-yaml` > `card-mod-X-yaml` > `uix-X` > `card-mod-X`.
- UIX paths: spaces separate steps, no `>` and no `:scope`; middle steps take only the **first** element; `$` enters the shadow root of all hits, `$$` searches through all shadow roots. Paths start at the parent of the `uix-node`. Use `uix_style_path(element)` and `uix_tree(element)` in the browser console to find the path.
- A theme variable has no effect when the component sets it itself in `:host` (e.g. `--control-slider-*`). Then UIX on that element is needed.
- Never use `shadowRoot.querySelector(":scope > …")` inside a MutationObserver: it matches nothing and led to an endless loop that froze the UI.
- `ha-icon` is sized with `--mdc-icon-size`, not `--mdi-icon-size`.
- Components often set `width: 100%` themselves (media card `.background`, `ha-slider`), which defeats `inset` and negative margins: override with `width: auto !important`.
- The integration must never overwrite a file the user edits (menus, lists). Ship a default, copy it only if missing, and offer a one-shot merge in the options dialog for new entries (see `docs/integration-patterns.md`).
- Several sessions or PCs touch the same folder: commit with explicit paths, and after `git pull --rebase --autostash` look for conflict markers in generated or version-line files (`<<<<<<<`) before running `build.py`.

## HomeAssistantXP specifics

- Palette variables are `xp-*`. Bevels are box-shadow variables: `xp-raised` (button), `xp-sunken` (field, pressed button), `xp-frame` (blue window frame, width `xp-frame-width`). Rounding: `xp-radius` (3 px), `xp-radius-window` (`8px 8px 0 0`), `xp-radius-title` (`5px 5px 0 0`). The title bar is a gradient in `xp-title-bar`; the min/max/close buttons are one SVG in `xp-title-buttons` (67 x 21 px, width in `xp-title-buttons-width`).
- Themes: HomeAssistantXP (Luna blue), Olive, Silver, Royale Noir, Dark, Auto. A variant overrides palette values only (`<<: *xp`).
- Fonts: system Tahoma / Trebuchet MS (no webfont). Taskbar, start button and menus live in `www/xp-taskbar.js` and `www/xp-startmenu.js`; they read `xp-taskbar`, `xp-start`, `xp-banner`.
- `www/xp-icons.js` and the colour icon block in `xp-startmenu.js` are the **Windows 95 pixel icons** carried over from HomeAssistant95; they are generated there (`local/icon-generator/`) and not rebuilt here. Redraw them in XP style (smooth, 32 px) for a full conversion.
- The look was derived from the HomeAssistant95 structure with XP values and previewed in a static mock, not yet tuned live in a running HA. Tune with `docs/workflow.md` and fix selectors where the DOM differs.
