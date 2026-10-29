/*
 * HomeAssistantXP – Bildschirmschoner für Home Assistant
 * Version: 1.5.2
 * Wird von der Integration HomeAssistantXP geladen (Option "Bildschirmschoner").
 *
 * Startet nach einer Zeit ohne Eingabe, jede Eingabe (Maus, Tippen, Taste)
 * beendet ihn. Einstellungen in /config/www/xp-startmenu.json:
 *   "screensaver": {
 *     "minutes": 10,          Leerlauf in Minuten, 0 = nie von selbst
 *     "mode": "random",       bliss | mystify | stars | random
 *     "clock": true,          Uhrzeit und Datum einblenden
 *     "entities": []          Entitäten, deren Zustand unter der Uhr steht
 *   }
 * Der alte Wert "pipes" (aus HA 95) gilt weiter und entspricht "mystify";
 * "flag" und "logos" gibt es nicht mehr und wählen ein zufälliges Motiv.
 * Aus eigenem Code: window.xpScreensaver.start("bliss"), .stop()
 * Im Startmenü: { "name": "Bildschirmschoner", "action": "screensaver" }
 */

const CONFIG_URL = "/local/xp-startmenu.json";
const DEFAULTS = { minutes: 10, mode: "random", clock: true, entities: [] };
const MODES = ["bliss", "mystify", "stars"];
const ALIASES = { pipes: "mystify" };

const haRoot = () => document.querySelector("home-assistant");

let options = { ...DEFAULTS };
let timer = null;
let running = null; // { el, stop }
let lastMove = null;

// ---------- Motive ----------
// Jedes Motiv bekommt eine Zeichenfläche und liefert eine Funktion zum Beenden.

function animate(step) {
  let id = 0;
  let last = 0;
  const loop = (t) => {
    step(t / 1000, Math.min(0.05, (t - last) / 1000 || 0.016));
    last = t;
    id = requestAnimationFrame(loop);
  };
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

// Bliss: die grüne Hügelwiese unter blauem Himmel, Wolken ziehen langsam vorbei
function bliss(ctx, w, h) {
  const u = Math.min(w, h);
  const horizon = h * 0.62;
  const clouds = Array.from({ length: 7 }, () => cloud(true));
  function cloud(anywhere) {
    const size = u * (0.05 + Math.random() * 0.07);
    return {
      x: anywhere ? Math.random() * w : -size * 4,
      y: h * (0.05 + Math.random() * 0.4),
      v: u * (0.008 + Math.random() * 0.016),
      size,
      puffs: Array.from({ length: 7 }, (_, i) => ({
        dx: (i - 3) * 0.75 + (Math.random() - 0.5) * 0.4,
        dy: -Math.abs(Math.sin(i * 0.9)) * 0.55 + (Math.random() - 0.5) * 0.25,
        r: 0.7 + Math.random() * 0.6,
      })),
    };
  }
  const sky = ctx.createLinearGradient(0, 0, 0, horizon + h * 0.1);
  sky.addColorStop(0, "#1f56c4");
  sky.addColorStop(0.55, "#4f93e6");
  sky.addColorStop(1, "#bfe0fa");
  const hill = ctx.createLinearGradient(0, horizon - h * 0.12, 0, h);
  hill.addColorStop(0, "#7bc22b");
  hill.addColorStop(0.35, "#4c9b14");
  hill.addColorStop(1, "#2a6a0c");
  const light = ctx.createRadialGradient(w * 0.3, horizon, 0, w * 0.3, horizon, w * 0.7);
  light.addColorStop(0, "rgba(255,255,200,0.35)");
  light.addColorStop(1, "rgba(255,255,200,0)");

  function drawHill() {
    ctx.fillStyle = hill;
    ctx.beginPath();
    ctx.moveTo(0, horizon + h * 0.05);
    ctx.bezierCurveTo(w * 0.22, horizon - h * 0.16, w * 0.55, horizon - h * 0.1, w * 0.72, horizon + h * 0.02);
    ctx.bezierCurveTo(w * 0.85, horizon + h * 0.1, w * 0.95, horizon + h * 0.06, w, horizon + h * 0.03);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  return animate((t, dt) => {
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
    for (const c of clouds) {
      c.x += c.v * dt;
      if (c.x - c.size * 5 > w) Object.assign(c, cloud(false));
      for (const p of c.puffs) {
        const x = c.x + p.dx * c.size;
        const y = c.y + p.dy * c.size;
        const r = p.r * c.size;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.6, "rgba(255,255,255,0.55)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawHill();
  });
}

// Mystify: zwei vielfarbige Vielecke wandern mit Schweif über den Schirm
function mystify(ctx, w, h) {
  const SHAPES = 2;
  const TRAIL = 9;
  const shapes = Array.from({ length: SHAPES }, (_, i) => ({
    pts: Array.from({ length: 4 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 90) * (w / 1200),
      vy: (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 90) * (h / 800),
    })),
    hue: i * 180,
    trail: [],
  }));
  let acc = 0;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  return animate((t, dt) => {
    for (const s of shapes) {
      for (const p of s.pts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx = -p.vx;
        if (p.y < 0 || p.y > h) p.vy = -p.vy;
      }
    }
    acc += dt;
    if (acc < 0.06) return;
    acc = 0;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = Math.max(1.5, Math.min(w, h) / 360);
    ctx.lineJoin = "round";
    for (const s of shapes) {
      s.hue = (s.hue + 2.5) % 360;
      s.trail.push({ hue: s.hue, pts: s.pts.map((p) => [p.x, p.y]) });
      if (s.trail.length > TRAIL) s.trail.shift();
      s.trail.forEach((snap, i) => {
        ctx.strokeStyle = `hsla(${snap.hue},90%,60%,${(i + 1) / s.trail.length})`;
        ctx.beginPath();
        snap.pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.stroke();
      });
    }
  });
}

// Sternenfeld: Flug durch den Weltraum, die Sterne ziehen Striche
function stars(ctx, w, h) {
  const stars = Array.from({ length: 420 }, () => spawn(true));
  function spawn(anywhere) {
    return { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: anywhere ? Math.random() : 1 };
  }
  const scale = Math.max(w, h) / 4;
  const project = (s, z) => [w / 2 + (s.x / z) * scale, h / 2 + (s.y / z) * scale];
  return animate((t, dt) => {
    ctx.fillStyle = "#02061a";
    ctx.fillRect(0, 0, w, h);
    for (const s of stars) {
      const [x0, y0] = project(s, s.z + dt * 0.5);
      s.z -= dt * 0.5;
      const [x, y] = project(s, Math.max(s.z, 0.01));
      if (s.z <= 0.01 || x < 0 || x >= w || y < 0 || y >= h) {
        Object.assign(s, spawn(false));
        continue;
      }
      const g = Math.round(150 + (1 - s.z) * 105);
      ctx.strokeStyle = `rgb(${g - 30},${g - 10},${g + (255 - g) * 0.3})`;
      ctx.lineWidth = Math.max(1, (1 - s.z) * 3);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  });
}

const RENDER = { bliss, mystify, stars };

// ---------- Start und Ende ----------

const pad = (n) => String(n).padStart(2, "0");

function overlayInfo(hass) {
  const now = new Date();
  const lang = hass?.locale?.language || navigator.language;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const date = now.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
  const states = (options.entities || [])
    .map((id) => hass?.states?.[id])
    .filter(Boolean)
    .map((s) => `${s.attributes.friendly_name || s.entity_id}: ${s.state}${s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : ""}`);
  return { time, date, states };
}

export function start(mode) {
  if (running) return;
  let pick = mode || options.mode;
  pick = ALIASES[pick] || pick;
  if (!RENDER[pick]) pick = MODES[Math.floor(Math.random() * MODES.length)];

  const el = document.createElement("div");
  el.popover = "manual";
  el.setAttribute("data-xp-screensaver", "");
  el.style.cssText =
    "position:fixed;inset:0;margin:0;padding:0;border:0;width:100%;height:100%;max-width:none;max-height:none;background:#000;cursor:none;overflow:hidden;";
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(window.innerWidth * dpr);
  canvas.height = Math.ceil(window.innerHeight * dpr);
  canvas.style.cssText = "display:block;width:100%;height:100%";
  el.appendChild(canvas);

  let tick = null;
  if (options.clock) {
    const box = document.createElement("div");
    box.style.cssText =
      "position:absolute;right:5vmin;bottom:5vmin;text-align:right;color:#fff;font-family:var(--xp-font,Tahoma,sans-serif);text-shadow:0 1px 3px rgba(0,0,0,.7),1px 1px 0 rgba(0,0,0,.6);pointer-events:none";
    el.appendChild(box);
    const update = () => {
      const { time, date, states } = overlayInfo(haRoot()?.hass);
      box.innerHTML =
        `<div style="font-size:9vmin;font-weight:bold;line-height:1">${time}</div>` +
        `<div style="font-size:3vmin">${date}</div>` +
        states.map((s) => `<div style="font-size:2.4vmin">${s.replace(/[&<>]/g, "")}</div>`).join("");
    };
    update();
    tick = setInterval(update, 10000);
  }

  document.body.appendChild(el);
  el.showPopover?.();
  const stopMotif = RENDER[pick](canvas.getContext("2d"), canvas.width, canvas.height);
  running = {
    el,
    stop() {
      stopMotif();
      clearInterval(tick);
      el.remove();
      running = null;
    },
  };
  running.since = performance.now();
  lastMove = null;
}

export function stop() {
  running?.stop();
  restart();
}

function restart() {
  clearTimeout(timer);
  if (options.minutes > 0) timer = setTimeout(() => start(), options.minutes * 60 * 1000);
}

function onInput(ev) {
  if (running) {
    // Kleine Mausbewegungen in der ersten Sekunde sind noch kein Aufwecken
    if (ev.type === "pointermove") {
      if (performance.now() - running.since < 1000) return;
      if (lastMove && Math.hypot(ev.clientX - lastMove[0], ev.clientY - lastMove[1]) < 6) return;
      if (!lastMove) return void (lastMove = [ev.clientX, ev.clientY]);
    }
    ev.stopPropagation();
    if (ev.type !== "pointermove") ev.preventDefault();
    stop();
    return;
  }
  restart();
}

async function init() {
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-cache" });
    if (res.ok) options = { ...DEFAULTS, ...((await res.json()).screensaver || {}) };
  } catch {
    // ohne Datei gelten die Standardwerte
  }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((type) =>
    window.addEventListener(type, onInput, { capture: true, passive: false })
  );
  restart();
}

window.xpScreensaver ??= { start, stop };
init();
