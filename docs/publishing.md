# Publishing through the Marketplace (HACS)

Since Home Assistant 2026.11 HACS is built in as the **Marketplace** (integration `marketplace`, panel `/marketplace`, reached from Settings, not shown in the sidebar). It reads the same `hacs.json`, releases and `hacs/default` list, so the steps below apply to both; `/hacs` links and the My link `hacs_repository` are redirected to it.

1. Create a **public** GitHub repo, push this project.
2. `hacs.json` in the root already says `"render_readme": true`. Set `name`.
3. Add repository topics (`home-assistant`, `hacs`, `theme`, …). The repo needs a description and a README.
4. Tag a release (`vX.Y.Z`, annotated) and create a GitHub release. The Marketplace (like HACS) shows releases, not the default branch, when releases exist.
5. For HACS **default** listing (so people find it in the Marketplace search without adding it from a link), submit a PR to `hacs/default`. Read their current rules first: the integration needs a valid `manifest.json`, a `hacs.json`, a release, brand images in `custom_components/<domain>/brand/` (or the `home-assistant/brands` repo) and a passing HACS action. Until then users add it via *Settings → Marketplace → Add from link*, type *Integration* (before 2026.11: *HACS → ⋮ → Custom repositories → Integration*).
6. Tell users in the README to add to `configuration.yaml`:

   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
   ```

Checklist before each release: `python tools/check.py x.y.z`, test dashboard looked at in light and dark, `CHANGELOG.md` section, annotated tag.
