# HomeAssistantXP – Roadmap

Stand: 2026-10-27, nach v1.5.0.

## Erledigt

- Sechs Themes: HomeAssistantXP (Luna Blau), Olive, Silver, Royale Noir, Dark, Auto.
- Fensterlook: blauer Rahmen mit runden oberen Ecken, Luna-Titelleiste, Minimieren/Maximieren/Schließen, XP-Knöpfe und -Felder, grüne Fortschrittsbalken, Luna-Reiter, orange Hover-Ringe.
- Kacheln und Button-Karten als XP-Knöpfe, flache Icon-Knöpfe, rote Schließen-Knöpfe in Dialogen.
- Taskleiste mit grünem Start-Knopf, themenfarbigen Knöpfen und Infobereich; Startmenü mit Ausklappmenüs.
- Medienkarte im Windows-Media-Player-Look.
- 84 bunte Vektor-Icons (`tools/color_icons.py`), geglätteter `xp:`-Icon-Satz.
- Zweispaltiges Startmenü (Start-Knopf der Taskleiste) und Brand-Icon im XP-Stil (1.4.0).
- Kompatibilität mit HomeAssistant95-Menüdateien (`data-ha95-menu`, `ha95-startmenu.json`, `ha95:`-Icons).
- Live-Durchsicht im Olive-Theme (1.5.0): Seitenleisten-Hover, leerer Menüknopf, doppelte Scrollleiste, Gruppenfelder für Karten ohne Titel, Unterseiten-Kopfleisten, „Alle Programme“, Taskleiste pro Bereich, Auswahl-Knöpfe, Olive-Ränder.

## Offen, nach Empfehlung

1. **Live-Abgleich der übrigen Themes.** Olive ist live geprüft (1.5.0); Luna Blau, Silver, Royale Noir, Dark und Auto noch durchgehen. Die Regeln aus 1.5.0 nach dem Update im echten HA nachprüfen (UIX-Pfade für Profil- und Einstellungsunterseiten).
2. **Update-Dialog prüfen** (1.3.4): liegt der Rahmen über der Fußzeile, ist er unten geschlossen?
3. **Kartenicons im XP-Stil.** Icons in Kacheln und Karten sind einfarbig mit zwei Tönen. Bunte Vektor-Icons dort einsetzen, ohne die Zustandsfarbe zu verlieren. Größerer Umbau.
4. **Startpanel live prüfen** (1.4.0): Position über der Taskleiste, Flyout „Alle Programme“, Abmelden.
5. **Kleinkram:** Reiter auf Einstellungsseiten, die anders gebaut sind (Kontrollkästchen der Aufgabenliste sind schon XP-Kästchen).

## Nicht geplant

- XP-Klänge und das Windows-Logo am Start-Knopf (Urheberrecht).
- Schriften mitliefern: Tahoma und Trebuchet MS kommen vom System.

## Hinweise

- Nach einem Update Home Assistant neu starten (nicht nur die Integration neu laden) und den Browser hart neu laden, sonst bleibt die alte `?v=`-Version der Module im Cache.
- Releases laufen nach [CLAUDE.md](CLAUDE.md): `python tools/check.py x.y.z`, Commit mit expliziten Pfaden, Tag, GitHub-Release.
