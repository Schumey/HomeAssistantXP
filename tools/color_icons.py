"""Zeichnet die bunten XP-Icons (Startmenü, Desktop) und schreibt sie in xp-startmenu.js.

  python tools/color_icons.py                 # Block zwischen // <color-icons> und // </color-icons> neu schreiben
  python tools/color_icons.py --sheet out.html  # zusätzlich eine Vorschau-Seite (Kontaktbogen)

Jedes Icon ist ein 32×32-Vektor ohne Verläufe (url(#id) geht nicht über Shadow-Roots):
Flächen in zwei Tönen, dunkler Umriss in der Farbe des Objekts, weißer Glanz mit Deckkraft.
"""
import re
import sys
from math import cos, radians, sin
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "custom_components" / "xp" / "www" / "xp-startmenu.js"

# Palette: Fläche / dunkel (Umriss) / hell
BL, BLd, BLl = "#4a8be8", "#1b4fb0", "#a9cdfa"
GR, GRd, GRl = "#52b64f", "#23701f", "#b4ec9a"
RD, RDd, RDl = "#e5502e", "#9a2410", "#ff9f82"
YL, YLd, YLl = "#ffd43b", "#a87c00", "#fff1a0"
OR, ORd = "#f59a23", "#a85a00"
GY, GYd, GYl = "#c9c9d6", "#5e5e72", "#f1f1f8"
BR, BRd, BRl = "#b07a3e", "#6a4418", "#e0b878"
WH, DK = "#ffffff", "#33333f"
SKIN = "#ffd9a8"


def P(d, f="none", s=None, w=1.4):
    st = f' stroke="{s}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"' if s else ""
    return f'<path d="{d}" fill="{f}"{st}/>'


def R(x, y, w, h, r, f, s=None, sw=1.4):
    st = f' stroke="{s}" stroke-width="{sw}" stroke-linejoin="round"' if s else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{f}"{st}/>'


def C(cx, cy, r, f, s=None, sw=1.4):
    st = f' stroke="{s}" stroke-width="{sw}"' if s else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}"{st}/>'


def E(cx, cy, rx, ry, f, s=None, sw=1.4):
    st = f' stroke="{s}" stroke-width="{sw}"' if s else ""
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{f}"{st}/>'


def L(d, s, w=2, op=None):
    o = f' stroke-opacity="{op}"' if op else ""
    return f'<path d="{d}" fill="none" stroke="{s}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"{o}/>'


def G(d, op=0.45):
    """Glanz: weiße Fläche mit Deckkraft."""
    return f'<path d="{d}" fill="#fff" fill-opacity="{op}"/>'


def stroke2(d, dark, light, w):
    """Linie mit Umriss: dunkle breite Linie darunter, helle schmalere darüber."""
    return L(d, dark, w + 2) + L(d, light, w)


def person(x, y, s, body, bodyd):
    """Kopf und Schultern; (x, y) = Kopfmitte, s = Maßstab."""
    return (
        f'<g transform="translate({x} {y}) scale({s})">'
        + C(0, 0, 5.2, SKIN, BRd, 1.3)
        + P("M-11 17.5c0-6.5 4.8-10 11-10s11 3.5 11 10z", body, bodyd, 1.4)
        + "</g>"
    )


def battery(level, color=None, glyph=""):
    color = color or (RD if level <= 20 else YL if level <= 30 else GR)
    dark = {RD: RDd, YL: YLd, GR: GRd}[color]
    w = 17 * level / 100
    out = R(3, 9.5, 22, 13, 2.8, GYl, GYd) + R(25, 13.5, 3.2, 5, 1.2, GYd)
    if level:
        out += R(5.5, 12, max(w, 2.5), 8, 1.4, color, dark, 1.1)
        out += G(f"M6.5 13h{max(w, 2.5) - 2}v2.4H6.5z", 0.5)
    return out + glyph


def arrow_glyph(up):
    d = "M14 24.5v-9M10 20l4-4.5 4 4.5" if up else "M14 14v9M10 18.5l4 4.5 4-4.5"
    d = "M14 22.5v-9M10.2 17.4l3.8-4.4 3.8 4.4" if up else "M14 13.5v9M10.2 18.6l3.8 4.4 3.8-4.4"
    return L(d, DK, 4.6) + L(d, WH, 2.4)


def clock_glyph():
    return C(14, 17.5, 8, WH, GYd, 1.3) + L("M14 12.5v5l3 2", DK, 1.8)


def sync_glyph():
    return (
        L("M9.5 16.5a5 5 0 0 1 8.7-2.6", DK, 4.2) + L("M18.5 18.5a5 5 0 0 1-8.7 2.6", DK, 4.2)
        + L("M9.5 16.5a5 5 0 0 1 8.7-2.6", WH, 2) + L("M18.5 18.5a5 5 0 0 1-8.7 2.6", WH, 2)
        + P("M19.8 11l.2 4.6-4.4-1.2z M8.2 24.5L8 19.9l4.4 1.2z", WH, DK, 1)
    )


def flame():
    return (
        P("M16 3c1 5 8 8 8 16a8 8 0 0 1-16 0c0-3 1.5-5 3-6.5.3 2 1.2 3 2.3 3.5C13 12 14 7 16 3z", OR, RDd, 1.5)
        + P("M16 17.5c3 2.5 4 4.5 4 6.5a4 4 0 0 1-8 0c0-1.5 1-3 4-6.5z", YL)
        + G("M12 14c.3 2 1.2 3 2.3 3.5-1.6 1.8-2.3 3-2.3 5-1.6-1.4-2.2-3-1.7-5.2.5-1.4 1.1-2.4 1.7-3.3z", 0.35)
    )


def bulb(on=True):
    glass = YL if on else GYl
    edge = YLd if on else GYd
    return (
        P("M16 3a9 9 0 0 0-5 16.5V23h10v-3.5A9 9 0 0 0 16 3z", glass, edge, 1.5)
        + R(11.5, 23, 9, 2.8, 1.2, GY, GYd, 1.2)
        + R(12.7, 25.8, 6.6, 2.6, 1.2, GYd)
        + L("M13.5 17.5l2.5-4 2.5 4", OR if on else GYd, 1.5)
        + E(13, 9.5, 2.3, 3.6, "#fff", None).replace('fill="#fff"', 'fill="#fff" fill-opacity=".55"')
    )


def wrench(transform=""):
    d = "M24 4a6 6 0 0 0-5.6 8.2L5.5 25.1a2.8 2.8 0 0 0 4 4l12.9-12.9A6 6 0 0 0 28.5 9.5l-3.6 3.6-3.4-.6-.6-3.4 3.6-3.6A6 6 0 0 0 24 4z"
    g = P(d, GY, GYd, 1.5) + G("M20 6.2l-1.5 1.6.6 3.4 1.2.2z", 0.5) + C(7.6, 27, 1, GYd)
    return f'<g transform="{transform}">{g}</g>' if transform else g


def snow():
    out = ""
    for a in range(0, 360, 60):
        x, y = 16 + 12.5 * sin(radians(a)), 16 - 12.5 * cos(radians(a))
        out += stroke2(f"M16 16L{x:.1f} {y:.1f}", BLd, BLl, 2)
        bx, by = 16 + 8 * sin(radians(a)), 16 - 8 * cos(radians(a))
        for da in (-50, 50):
            ex = bx + 4.5 * sin(radians(a + da))
            ey = by - 4.5 * cos(radians(a + da))
            out += stroke2(f"M{bx:.1f} {by:.1f}L{ex:.1f} {ey:.1f}", BLd, BLl, 1.6)
    return out + C(16, 16, 2.6, WH, BLd, 1.2)


def sun(cx=16, cy=16, r=7.5, rays=8, rl=4.5, gap=3.2):
    out = ""
    for i in range(rays):
        a = radians(i * 360 / rays)
        x1, y1 = cx + (r + gap) * sin(a), cy - (r + gap) * cos(a)
        x2, y2 = cx + (r + gap + rl) * sin(a), cy - (r + gap + rl) * cos(a)
        out += L(f"M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}", ORd, 4) + L(f"M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}", YL, 2.2)
    return out + C(cx, cy, r, YL, ORd, 1.5) + G(f"M{cx - r * .6:.1f} {cy - r * .3:.1f}a{r * .7:.1f} {r * .6:.1f} 0 0 1 {r * .8:.1f}-{r * .4:.1f}", 0.0) + E(cx - r * .3, cy - r * .35, r * .35, r * .25, "#fff").replace('fill="#fff"', 'fill="#fff" fill-opacity=".55"')


def cog(dark=GYd, face=GY, hole=GYl):
    teeth = "".join(f'<rect x="13" y="2.5" width="6" height="27" rx="1.6" transform="rotate({a} 16 16)"/>' for a in (0, 45, 90, 135))
    return (
        f'<g fill="{dark}" stroke="{dark}" stroke-width="3" stroke-linejoin="round">{teeth}<circle cx="16" cy="16" r="9.5"/></g>'
        f'<g fill="{face}">{teeth}<circle cx="16" cy="16" r="9.5"/></g>'
        + C(16, 16, 4, hole, dark, 1.4)
        + G("M9 12a8 8 0 0 1 6-4.5c-3 1-5 3-6 6z", 0.5)
    )


def shield(extra=""):
    d = "M16 3l11 4v8c0 7-5 11-11 14C10 26 5 22 5 15V7z"
    return P(d, BL, BLd, 1.6) + P("M16 3v26C10 26 5 22 5 15V7z", "#7fb0f5") + G("M8 8.5l8-2.9v3.5l-8 3z", 0.5) + extra


def tile(x, y, w, h, c, d):
    return R(x, y, w, h, 2.2, c, d, 1.3) + G(f"M{x + 1.5} {y + 1.5}h{w - 3}v{min(h * .35, 4)}h-{w - 3}z", 0.4)


ICONS = {
    "account": lambda: person(16, 10.5, 1, BL, BLd),
    "account-group": lambda: person(25, 10, 0.72, GR, GRd) + person(7, 10, 0.72, OR, ORd) + person(16, 12, 0.95, BL, BLd),
    "bed": lambda: R(3, 8, 3.2, 20, 1.2, BR, BRd, 1.2) + R(3, 17, 26, 6, 2, WH, GYd) + R(10, 17, 19, 6, 2, BL, BLd) + R(6.5, 13.5, 8, 4, 2, WH, GYd) + R(3, 23, 3.2, 4.5, 1, BRd) + R(25.8, 23, 3.2, 4.5, 1, BRd),
    "bell": lambda: P("M16 4c-1.1 0-2 .8-2 1.8C10 7 8.5 10 8.5 14v4L6 22.5h20L23.5 18v-4C23.5 10 22 7 18 5.8 18 4.8 17.1 4 16 4z", YL, YLd, 1.5) + C(16, 26, 2.8, YL, YLd, 1.3) + G("M11 12c.3-2 1.5-3.5 3-4.2-1.5.5-2.5 2-2.8 4.2v5z", 0.6),
    "calendar": lambda: R(4, 6, 24, 22, 3, WH, GYd) + P("M4 9a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v4H4z", RD, RDd, 1.4) + R(9, 3, 2.6, 6, 1.2, GY, GYd, 1) + R(20.4, 3, 2.6, 6, 1.2, GY, GYd, 1) + "".join(R(7.5 + 5.6 * i, 16 + 5.4 * j, 4, 3.6, 0.8, BL if (i + j) % 2 else BLl, BLd, 0.8) for i in range(4) for j in range(2)),
    "camera": lambda: R(3, 9, 26, 17, 3, GY, GYd) + R(11, 5.5, 10, 4.5, 1.5, GY, GYd, 1.3) + C(16, 17.5, 6.6, GYd) + C(16, 17.5, 4.7, BL, BLd, 1.2) + C(14.3, 15.8, 1.5, "#fff") + R(23, 11.5, 3, 2, 0.6, YL),
    "car": lambda: P("M8 15l3-6c.4-.7 1.2-1 2-1h6c.8 0 1.6.3 2 1l3.5 6z", RD, RDd, 1.4) + P("M11 14.5l2-4h2.5v4zM18 14.5v-4h1.7l2.3 4z", BLl, BLd, 0.9) + R(3, 14.5, 26, 8.5, 3, RD, RDd) + G("M5 16h22v2H5z", 0.35) + C(9.5, 23.5, 3.4, DK) + C(9.5, 23.5, 1.4, GY) + C(22.5, 23.5, 3.4, DK) + C(22.5, 23.5, 1.4, GY),
    "ceiling-light": lambda: R(4, 3, 24, 3, 1, GY, GYd, 1.1) + L("M16 6v5", GYd, 1.6) + P("M7 19c0-5.5 4-9 9-9s9 3.5 9 9z", OR, ORd, 1.5) + E(16, 21, 3.6, 2.6, YLl, YLd, 1.1) + L("M9 25l-2 3M16 25.5v3.5M23 25l2 3", YL, 2.2) + G("M10 17c.4-2.6 2.4-4.8 5-5.5-2 1-3.5 3-4 5.5z", 0.5),
    "chart-box": lambda: R(4, 4, 24, 24, 3, WH, GYd) + R(8, 17, 4.4, 8, 0.8, BL, BLd, 1) + R(14, 10.5, 4.4, 14.5, 0.8, GR, GRd, 1) + R(20, 14, 4.4, 11, 0.8, OR, ORd, 1),
    "chart-line": lambda: R(4, 4, 24, 24, 3, WH, GYd) + L("M8 22l5-6.5 4 3L24 9.5", BLd, 4.2) + L("M8 22l5-6.5 4 3L24 9.5", BL, 2.2) + C(24, 9.5, 2, RD, RDd, 1),
    "clipboard-list": lambda: R(5, 5, 22, 24, 3, BR, BRd) + R(8, 9, 16, 17, 1.5, WH, GYd, 1.2) + R(11, 3, 10, 5.5, 1.6, GY, GYd, 1.2) + "".join(C(11.5, 14 + 4.3 * i, 1, BL) + L(f"M14.5 {14 + 4.3 * i}h7", GYd, 1.3) for i in range(3)),
    "code-braces": lambda: R(3, 5, 26, 22, 3, "#26304f", GYd) + R(3, 5, 26, 4, 2.5, BL, BLd, 1) + L("M13.5 12.5c-2.2 0-3 1-3 3v.8c0 1-.6 1.6-1.8 1.6 1.2 0 1.8.6 1.8 1.6v.8c0 2 .8 3 3 3", "#8fc4ff", 1.9) + L("M18.5 12.5c2.2 0 3 1 3 3v.8c0 1 .6 1.6 1.8 1.6-1.2 0-1.8.6-1.8 1.6v.8c0 2-.8 3-3 3", "#8fc4ff", 1.9),
    "coffee-to-go": lambda: P("M8.5 11h15L21.8 28H10.2z", WH, GYd, 1.4) + P("M9.3 16h13.4l-.7 7.5H10z", BR, BRd, 1.1) + R(7, 6.5, 18, 5, 2, BRd, DK, 1.1) + G("M10.5 12.5l1 14", 0.0) + G("M11 12.5h2l.9 14h-2z", 0.5),
    "cog": cog,
    "console": lambda: R(3, 6, 26, 20, 2.5, "#1c1f2b", GYd) + P("M3 8.5A2.5 2.5 0 0 1 5.5 6h21A2.5 2.5 0 0 1 29 8.5V10H3z", BL, BLd, 1.1) + L("M8 14.5l4.5 3-4.5 3", GR, 2) + L("M15 21h7", "#cfe0ff", 2),
    "desk-lamp": lambda: E(10, 27, 6.5, 2.4, GYd, DK, 1) + L("M10 25.5L14.5 13.5 22 8.5", GYd, 2.6) + C(14.5, 13.5, 1.6, GY, GYd, 1) + P("M17.5 5.5l9.5 3.2-3.5 8z", YL, YLd, 1.4) + L("M21 19.5l-1.5 3M25.5 18.5l.5 3", YL, 2.2),
    "devices": lambda: R(3, 6, 20, 14, 1.8, GY, GYd) + R(5.2, 8.2, 15.6, 9.6, 0.8, BLl, BLd, 0.9) + R(10, 20, 6, 3, 0.6, GY, GYd, 1) + R(7.5, 22.5, 11, 2.4, 1.1, GY, GYd, 1) + R(21.5, 12, 8, 16, 2, DK, DK) + R(22.8, 14, 5.4, 10, 0.6, BLl),
    "diet-assistant": lambda: P("M16 9c-3-2-9-1.5-9 5.5C7 22 11 28 14 28c1 0 1.5-.6 2-.6s1 .6 2 .6c3 0 7-6 7-13.5C25 7.5 19 7 16 9z", RD, RDd, 1.5) + P("M16 9c0-3 1.5-5 4.5-5.5 0 3-1.5 5-4.5 5.5z", GR, GRd, 1.2) + G("M10 13c.4-2 1.6-3 3-3.4-1.6.8-2.4 2.4-2.6 5z", 0.55),
    "dock-left": lambda: R(3, 5, 26, 22, 2.5, WH, GYd) + P("M5.5 5H12v22H5.5A2.5 2.5 0 0 1 3 24.5v-17A2.5 2.5 0 0 1 5.5 5z", BL, BLd, 1.2) + "".join(L(f"M5.5 {10 + 3.6 * i}h4.2", WH, 1.4) for i in range(4)),
    "door-closed": lambda: R(7, 3, 18, 26, 1.5, BRd) + R(9, 5, 14, 22, 0.8, BR, BRd, 1) + R(11, 8, 10, 7, 0.8, BRl, BRd, 0.9) + R(11, 17.5, 10, 7, 0.8, BRl, BRd, 0.9) + C(20, 16.5, 1.5, YL, YLd, 1),
    "fan": lambda: C(16, 16, 12.5, GYl, GYd, 1.4) + "".join(f'<g transform="rotate({a} 16 16)">{P("M16 16c-1.5-6 .5-10 4.3-11 3 2 2.7 6.4-4.3 11z", BL, BLd, 1.1)}</g>' for a in (0, 120, 240)) + C(16, 16, 2.6, GY, GYd, 1.1),
    "file-document": lambda: P("M7 3h12l7 7v19H7z", WH, GYd, 1.4) + P("M19 3v7h7z", GY, GYd, 1.2) + "".join(L(f"M10.5 {15 + 4 * i}h{11 - 2 * (i == 2)}", BL if i == 0 else GYd, 1.6) for i in range(3)),
    "fire": flame,
    "flash": lambda: P("M18 2L7 18h7l-2 12 13-17h-8z", YL, YLd, 1.5) + G("M17 5l-6 10h4z", 0.55),
    "flower": lambda: "".join(C(16 + 7.2 * sin(radians(a)), 14.5 - 7.2 * cos(radians(a)), 4.6, "#ff8fb8", "#b83a6a", 1.2) for a in range(0, 360, 72)) + C(16, 14.5, 4.2, YL, ORd, 1.3) + L("M16 20v9", GRd, 2.4) + P("M16 26c0-3 2-4.5 5-4.5 0 3-2 4.5-5 4.5z", GR, GRd, 1),
    "folder-open": lambda: P("M3 7c0-1 .8-2 2-2h7l3 3h11c1.2 0 2 .8 2 2v3H3z", "#e6b422", YLd, 1.4) + P("M6 13h25l-4 14H3z", YL, YLd, 1.4) + G("M7.5 14.5h20l-.6 2H7z", 0.55),
    "format-list-bulleted": lambda: R(4, 5, 24, 22, 3, WH, GYd) + "".join(C(9.5, 11 + 5.2 * i, 1.7, BL, BLd, 0.8) + L(f"M14 {11 + 5.2 * i}h9", GYd, 1.7) for i in range(3)),
    "garage": lambda: P("M3 14L16 5l13 9v14H3z", BRl, BRd, 1.4) + P("M3 14L16 5l13 9z", RD, RDd, 1.4) + R(7, 15, 18, 13, 1, GY, GYd, 1.2) + "".join(L(f"M7.5 {18.5 + 3.2 * i}h17", GYd, 1.1) for i in range(3)),
    "hacs": lambda: P("M4 11l12-6 12 6-12 6z", BRl, BRd, 1.3) + P("M4 11l12 6v13L4 24z", BR, BRd, 1.3) + P("M28 11L16 17v13l12-6z", "#8a5a28", BRd, 1.3) + P("M10 8l12 6", BL, BLd, 1.3).replace('fill="none"', 'fill="none"') + L("M10 8l12 6", BLd, 3.2) + L("M10 8l12 6", BL, 1.6),
    "help": lambda: C(16, 16, 13, BL, BLd, 1.6) + G("M6.5 12a10 10 0 0 1 19 0c-4-2.5-14-2.5-19 0z", 0.4) + L("M12 12.7c0-2.6 1.8-4.2 4-4.2s4 1.5 4 3.5c0 3-4 3-4 6", WH, 2.8) + C(16, 23.2, 1.9, WH),
    "history": lambda: C(16, 16, 9, WH, GYd, 1.4) + L("M16 11v5l3.5 2", GYd, 1.9) + L("M4.2 15A12 12 0 0 1 22 5.4", BLd, 4.6) + L("M4.2 15A12 12 0 0 1 22 5.4", BL, 2.6) + P("M19.6 1.6l7.4 4.4-6.6 4.6z", BL, BLd, 1.2),
    "home": lambda: R(7, 15, 18, 13, 1.5, YLl, BRd) + R(21, 5.5, 3.6, 7.5, 0.8, BRl, BRd, 1) + P("M2.5 16.5L16 4l13.5 12.5z", RD, RDd, 1.5) + R(13.4, 20, 5.2, 8, 0.8, BR, BRd, 1) + R(9, 18, 3.6, 3.6, 0.5, BLl, BLd, 0.8) + G("M7 14.5L16 6l-1.5-.4z", 0.5),
    "information": lambda: C(16, 16, 13, BL, BLd, 1.6) + G("M6.5 12a10 10 0 0 1 19 0c-4-2.5-14-2.5-19 0z", 0.4) + C(16, 9.3, 2.1, WH) + R(14, 13.2, 4, 10, 1.3, WH),
    "key": lambda: stroke2("M14 14l13 13", YLd, YL, 3.4) + stroke2("M22 22l3-3.2M25.5 25.5l2.7-2.8", YLd, YL, 2) + C(10.5, 10.5, 6.8, YL, YLd, 1.6) + C(9, 9, 2.3, WH, YLd, 1) + G("M5.5 8a5.5 5.5 0 0 1 4-3.3c-2 1-3.2 2.5-3.7 4.5z", 0.5),
    "lamps": lambda: P("M9 4h14l3.5 11h-21z", YL, ORd, 1.5) + L("M16 15v10", GYd, 2.4) + E(16, 27, 6.5, 2.2, GYd, DK, 1) + G("M10.5 6.5l3-.5-2 6z", 0.5),
    "lightbulb": lambda: bulb(True),
    "lock": lambda: L("M10 14V10.5a6 6 0 0 1 12 0V14", GYd, 4.6) + L("M10 14V10.5a6 6 0 0 1 12 0V14", GY, 2.6) + R(6, 14, 20, 15, 3, YL, YLd, 1.5) + C(16, 20.2, 2.3, DK) + R(15, 21, 2, 4.5, 0.8, DK) + G("M8 16h16v2H8z", 0.4),
    "lock-open": lambda: L("M10 14V9a6 6 0 0 1 12 0v1", GYd, 4.6) + L("M10 14V9a6 6 0 0 1 12 0v1", GY, 2.6) + R(6, 14, 20, 15, 3, YL, YLd, 1.5) + C(16, 20.2, 2.3, DK) + R(15, 21, 2, 4.5, 0.8, DK) + G("M8 16h16v2H8z", 0.4),
    "map": lambda: P("M3 8l8-3v19l-8 3z", GRl, GRd, 1.3) + P("M11 5l10 3v19l-10-3z", GR, GRd, 1.3) + P("M21 8l8-3v19l-8 3z", GRl, GRd, 1.3) + P("M18 10.5c-2 0-3.4 1.5-3.4 3.3 0 2.3 3.4 5.6 3.4 5.6s3.4-3.3 3.4-5.6c0-1.8-1.4-3.3-3.4-3.3z", RD, RDd, 1.1) + C(18, 13.7, 1.2, WH),
    "math-log": lambda: R(5, 4, 22, 24, 2.5, WH, GYd) + L("M9 10h14", BL, 1.8) + "".join(L(f"M9 {15 + 3.8 * i}h{14 - 3 * (i % 2)}", GYd, 1.5) for i in range(3)) + L("M9 27", GYd, 0),
    "menu": lambda: R(3, 5, 26, 22, 3, BL, BLd, 1.5) + G("M5 7h22v4H5z", 0.35) + "".join(L(f"M8 {11.5 + 4.5 * i}h16", WH, 2.2) for i in range(3)),
    "music-note": lambda: P("M12.5 6.5l13-3v16.5H22.5V8.4l-7 1.6V22H12.5z", BL, BLd, 1.3) + E(9, 23.5, 4.5, 3.5, BL, BLd, 1.4) + E(19.5, 21, 4.5, 3.5, BL, BLd, 1.4) + G("M13 7l11-2.5v2.5L13 9.5z", 0.5),
    "palette": lambda: P("M16 4C8.5 4 3 9 3 15.5S8.5 28 14 28c2.5 0 3-1.5 2-3-1.2-1.8.2-3.5 2.3-3.5H24c3 0 5-1.7 5-5C29 9 23.5 4 16 4z", BRl, BRd, 1.5) + C(9.5, 14, 2.3, RD, RDd, 0.9) + C(13, 9.5, 2.3, YL, YLd, 0.9) + C(19.5, 9, 2.3, GR, GRd, 0.9) + C(24, 13.5, 2.3, BL, BLd, 0.9) + C(12.5, 21, 2, WH, BRd, 0.9),
    "play-box": lambda: R(3, 5, 26, 22, 3, "#26304f", GYd) + P("M13 10.5l9 5.5-9 5.5z", GR, GRl, 1.3) + G("M5 7h22v3H5z", 0.2),
    "power": lambda: L("M10 9.2a10.5 10.5 0 1 0 12 0", RDd, 6) + L("M16 4v12", RDd, 6) + L("M10 9.2a10.5 10.5 0 1 0 12 0", RD, 3.4) + L("M16 4v12", RD, 3.4),
    "printer-3d-nozzle": lambda: R(9, 4.5, 14, 9, 1, WH, GYd, 1.2) + R(4, 12, 24, 12, 3, GY, GYd) + R(9, 20, 14, 8.5, 1, WH, GYd, 1.2) + C(23.5, 16, 1.2, GR) + P("M13.5 20.5h5l-2.5 3.5z", OR, ORd, 0.9) + L("M11 24.5h4", GYd, 1.3),
    "radiator": lambda: R(4, 5.5, 24, 3.2, 1.4, GYd, DK, 1) + R(4, 23.3, 24, 3.2, 1.4, GYd, DK, 1) + "".join(R(6 + 4.6 * i, 8, 3.4, 15.5, 1.6, GYl, GYd, 1.1) + G(f"M{6.8 + 4.6 * i} 9h1.2v13h-1.2z", 0.7) for i in range(5)) + R(26, 12, 4, 5, 1.3, RD, RDd, 1),
    "restart": lambda: L("M25 12.5A10 10 0 1 0 26 18", GRd, 6.2) + L("M25 12.5A10 10 0 1 0 26 18", GR, 3.8) + P("M27.5 4.5v10.5H17z", GR, GRd, 1.2),
    "robot": lambda: L("M16 9V5", GYd, 1.8) + C(16, 4.3, 2, RD, RDd, 1) + R(7, 9, 18, 15, 4, GY, GYd) + R(3.8, 14, 3.2, 6, 1.2, GYd, DK, 0.8) + R(25, 14, 3.2, 6, 1.2, GYd, DK, 0.8) + C(12, 15.5, 3, BL, BLd, 1) + C(20, 15.5, 3, BL, BLd, 1) + C(11.2, 14.6, 0.9, "#fff") + C(19.2, 14.6, 0.9, "#fff") + R(12, 20.2, 8, 1.8, 0.9, GYd) + G("M9 11h14v2.4H9z", 0.4),
    "robot-vacuum": lambda: C(16, 16, 13, GY, GYd, 1.5) + C(16, 16, 8.5, GYl, GYd, 1.2) + C(16, 16, 2.8, GR, GRd, 1.2) + L("M5 10a13 13 0 0 1 8-6", GYd, 1.6) + G("M8 9a10 10 0 0 1 6-4c-3 1.5-5 3-6 4z", 0.5),
    "script-text": lambda: R(7, 6, 18, 21, 1.5, "#f6e8b9", BRd, 1.2) + R(4.8, 3.2, 22.4, 4.6, 2.3, BRl, BRd, 1.2) + R(4.8, 24.2, 22.4, 4.6, 2.3, BRl, BRd, 1.2) + "".join(L(f"M10.5 {11 + 3.3 * i}h{11 - (i % 2) * 3}", BRd, 1.3) for i in range(4)),
    "shape-outline": lambda: C(21.5, 10.5, 6.5, BL, BLd, 1.4) + R(3.5, 16.5, 11.5, 11.5, 1.8, RD, RDd, 1.4) + P("M23.5 16.5l6 11.5H17.5z", GR, GRd, 1.4) + G("M17 6.5a5 5 0 0 1 4-2c-2.4.8-3.6 2.2-4 2z", 0.5),
    "shield": shield,
    "shield-home": lambda: shield(P("M16 10.5l-6 5.2h2v6h8v-6h2z", WH, "#c9dcfa", 0.8) + R(14.6, 18, 2.8, 3.7, 0.4, BL)),
    "snowflake": snow,
    "sofa": lambda: R(6, 7.5, 20, 12, 4, BL, BLd) + R(3, 12.5, 5.5, 12, 2.8, "#3f7be0", BLd, 1.4) + R(23.5, 12.5, 5.5, 12, 2.8, "#3f7be0", BLd, 1.4) + R(7.5, 16.5, 17, 8, 2.4, BLl, BLd, 1.3) + R(6, 24.5, 2.6, 3.4, 0.8, DK) + R(23.4, 24.5, 2.6, 3.4, 0.8, DK),
    "speaker": lambda: R(7, 3, 18, 26, 3, GY, GYd) + C(16, 19, 6.8, DK) + C(16, 19, 4, GYd, GY, 1) + C(16, 8.5, 2.8, DK) + C(14.7, 17.3, 1.3, "#fff") ,
    "sprout": lambda: E(16, 27.5, 8, 2.4, BR, BRd, 1.2) + L("M16 27V16", GRd, 3) + P("M16 17C16 10 11 7.5 4.5 8.5c0 6.5 4.5 9.5 11.5 8.5z", GR, GRd, 1.3) + P("M16 14.5c0-6.5 4.5-9.5 11.5-9.5 0 6.5-4.5 10.5-11.5 9.5z", GRl, GRd, 1.3),
    "television": lambda: L("M12 7.5L8 2.5M20 7.5l4-5", GYd, 1.8) + R(3, 7.5, 26, 19, 3, "#7a7a8e", DK) + R(5.5, 10, 16.5, 14, 2, BLl, GYd, 1.2) + G("M7 11.5h13v3H7z", 0.5) + C(25.5, 14, 1.4, GY) + C(25.5, 19, 1.4, GY),
    "thermometer": lambda: R(11.8, 3, 8.4, 20, 4.2, WH, GYd, 1.4) + C(16, 24, 5.6, RD, RDd, 1.4) + R(14.6, 9.5, 2.8, 14.5, 1.4, RD) + L("M22 7h3M22 11h2M22 15h3", GYd, 1.4) + G("M13.5 6c0-.6.3-1 .9-1v10h-.9z", 0.6),
    "thermostat": lambda: C(16, 16, 13, GYl, GYd, 1.5) + C(16, 16, 9.6, WH, GYd, 1) + L("M8.6 21.4a9.6 9.6 0 1 1 14.8 0", BL, 2.4) + L("M16 16l4.8-5.2", RD, 2.4) + C(16, 16, 2.1, GYd) + L("M12 24h8", GYd, 1.6),
    "tools": lambda: wrench() + stroke2("M5 5l5 5", OR, OR, 0) .replace("stroke-width=\"2\"", "stroke-width=\"0\"") + L("M4.8 4.8l6.2 6.2", ORd, 7.4) + L("M4.8 4.8l6.2 6.2", OR, 5.2) + L("M11 11l15 15", GYd, 4) + L("M11 11l15 15", GY, 2),
    "view-dashboard": lambda: tile(3, 3, 12, 16, BL, BLd) + tile(17, 3, 12, 9, GR, GRd) + tile(17, 14, 12, 15, OR, ORd) + tile(3, 21, 12, 8, RD, RDd),
    "view-grid": lambda: tile(3, 3, 12, 12, BL, BLd) + tile(17, 3, 12, 12, GR, GRd) + tile(3, 17, 12, 12, OR, ORd) + tile(17, 17, 12, 12, RD, RDd),
    "washing-machine": lambda: R(5, 3, 22, 26, 2.5, WH, GYd) + L("M5 9.5h22", GYd, 1.2) + C(9.5, 6.3, 1.3, BL) + C(13.5, 6.3, 1.3, GR) + R(18, 5, 6, 2.6, 1.2, GYl, GYd, 0.9) + C(16, 19, 7.8, GY, GYd, 1.4) + C(16, 19, 5.6, BLl, BLd, 1.1) + G("M11.5 17a5 5 0 0 1 4-2.6c-2 .8-3.4 2-3.8 3.6z", 0.7),
    "water": lambda: P("M16 3C12 10 6.5 14.5 6.5 20a9.5 9.5 0 0 0 19 0C25.5 14.5 20 10 16 3z", BL, BLd, 1.6) + G("M11 19a5 5 0 0 0 3.5 4.8c-2.3-1.6-3.2-3.6-3.5-4.8z", 0.0) + E(12.6, 19, 1.7, 3.6, "#fff").replace('fill="#fff"', 'fill="#fff" fill-opacity=".55" transform="rotate(12 12.6 19)"'),
    "weather-partly-cloudy": lambda: sun(11.5, 11.5, 5.8, 8, 3.2, 2.2) + P("M9.5 27a5 5 0 0 1 .2-10 7 7 0 0 1 13.3 1.5A4.3 4.3 0 0 1 23 27z", WH, GYd, 1.4) + G("M12 20a5 5 0 0 1 4-2.4c-2.2.7-3.5 1.7-4 2.4z", 0.0),
    "weather-sunny": lambda: sun(16, 16, 7.5, 8, 4.2, 2.8),
    "window-closed": lambda: R(5, 3, 22, 26, 2, "#e8e8f0", GYd) + "".join(R(8 + 8 * i, 6 + 10 * j, 7, 8.5, 0.8, BLl, BLd, 1) + G(f"M{9 + 8 * i} {7 + 10 * j}h5v2h-5z", 0.5) for i in range(2) for j in range(2)),
    "wrench": lambda: wrench(),
}

for pct in range(10, 100, 10):
    ICONS[f"battery-{pct}"] = lambda p=pct: battery(p)
ICONS["battery"] = lambda: battery(100)
ICONS["battery-arrow-down"] = lambda: battery(100, GR, arrow_glyph(False))
ICONS["battery-arrow-up"] = lambda: battery(100, GR, arrow_glyph(True))
ICONS["battery-clock"] = lambda: battery(70, GR, clock_glyph())
ICONS["battery-sync"] = lambda: battery(70, GR, sync_glyph())


def render():
    return {name: fn() for name, fn in sorted(ICONS.items())}


def svg(inner, size=32):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="{size}" height="{size}">{inner}</svg>'


def write_js():
    text = JS.read_text(encoding="utf-8")
    start = text.index("// <color-icons>")
    end = text.index("// </color-icons>")
    block = text[start:end]
    aliases = re.search(r"const COLOR_ALIASES = \{.*?\n\};", block, re.S).group(0)
    rows = "".join(f'  "{n}": `{s}`,\n' for n, s in render().items())
    new = (
        "// <color-icons> (erzeugt von tools/color_icons.py, nicht von Hand ändern)\n"
        "// 32×32-Vektoren, Farben stehen in den Zeichnungen\n"
        f"const COLOR_ICONS = {{\n{rows}}};\n{aliases}\n"
    )
    JS.write_text(text[:start] + new + text[end:], encoding="utf-8", newline="\n")
    print(f"{len(ICONS)} icons written")


def sheet(path):
    cells = "".join(
        f'<div class="c">{svg(s, 64)}<small>{n}</small></div>' for n, s in render().items()
    )
    Path(path).write_text(
        '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#ece9d8;font:11px Tahoma;'
        'display:flex;flex-wrap:wrap;gap:6px;padding:8px}.c{width:92px;text-align:center;background:#fff;'
        'padding:6px 0;border-radius:4px}.c svg{display:block;margin:0 auto 2px}</style>' + cells,
        encoding="utf-8",
    )


if __name__ == "__main__":
    if "--sheet" in sys.argv:
        sheet(sys.argv[sys.argv.index("--sheet") + 1])
    else:
        write_js()
