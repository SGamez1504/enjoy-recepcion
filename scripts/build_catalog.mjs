// Genera catalogo.json (catalogo reducido + productos frecuentes).
// Uso: node scripts/build_catalog.mjs
// Entrada: data/catalogo.csv (UTF-8 con BOM), data/inventarios/inventario-*.txt
// Salida:  catalogo.json  {"v":2,"p":[[id,nombre_corto,sku,mpn,sec,marca,gama,ref],...],"f":{sec:[...]},"w":{sec:{"m:x":n,"g:x":n,"r:x":n}}}
// Port de scripts/build_catalog.py (misma logica).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { facets, valueRegex, norm, EXTRACT_ONLY_GAMA, EXTRACT_ONLY_REF } from "./facets.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = join(ROOT, "data", "catalogo.csv");
const INV_DIR = join(ROOT, "data", "inventarios");
const OUT_PATH = join(ROOT, "catalogo.json");

const SECTIONS = ["nv", "amd", "intel", "lap", "mb", "cpu", "ram", "ssd", "rl", "rt",
  "fan", "psu", "chasis", "con", "apple", "ext"];
const MAX_FREQ = 12;
const MAX_NAME = 70;

// ---- Categorias Woo -> seccion ----
const CAT_SEC = {
  "Motherboards": "mb", "Procesadores": "cpu", "Memorias RAM": "ram",
  "Almacenamiento": "ssd", "Fuentes de poder": "psu", "CPU Liquid Cooler": "rl",
  "CPU Air cooler": "rt", "Ventiladores": "fan", "Chasis": "chasis",
};
const COOLER_CATS = new Set(["Refrigeración", "Accesorios de Refrigeración"]);
const LAP_CATS = new Set(["Laptops", "Gaming Laptops"]);
const EXT_CATS = new Set(["Monitores", "Mouse Gamer", "Teclado Gamer"]);
const UNSORTED = new Set(["Sin categorizar", "Hardware"]);

const APPLE_RE = /MacBook|iPhone|iPad|Apple/i;
const CON_RE = /PlayStation|Xbox|Nintendo|Switch\b|Handheld|Legion Go|ROG Ally|\bClaw\b/i;
const CPU_RE = /Procesador|Ryzen|Core i\d|Core Ultra/i;

const NAME_RULES = [
  [/Memoria RAM|\bDDR[345]\b/i, "ram"],
  [/\bSSD\b|\bNVMe\b/i, "ssd"],
  [/Placa Base|Motherboard/i, "mb"],
  [/Fuente de poder|\bPSU\b/i, "psu"],
  [/Chasis/i, "chasis"],
  [/Refrigeración Líquida|Liquid|Radiador|\b(240|280|360|420)\s?mm\b/i, "rl"],
  [/Disipador|Air Cooler|Spirit|Assassin|Phantom|Noctua|Peerless|Dark Rock/i, "rt"],
  [/Ventilador|\bFans?\b/i, "fan"],
  [CPU_RE, "cpu"],
  [/GeForce|RTX|GTX|Nvidia/i, "nv"],
  [/Radeon|\bRX\s/i, "amd"],
  [/\bArc\b/i, "intel"],
];
const COOLER_NAME_RULES = [
  [/Líquida|Liquid|Radiador|\b(240|280|360|420)\s?mm\b/i, "rl"],
  [/Disipador|Air|Spirit|Assassin|Phantom|Noctua|Peerless|Dark Rock|Torre/i, "rt"],
  [/Ventilador|\bFans?\b/i, "fan"],
];

const GENERIC_PREFIXES = [
  "Fuente de Poder", "Refrigeración Líquida", "Disipador", "Tarjeta de Video",
  "Procesador", "Memoria RAM", "Placa Base", "Motherboard", "SSD", "Chasis",
  "Monitor Gamer", "Teclado Gamer", "Mouse Gamer", "Ventiladores", "Ventilador",
];
const GENERIC_LOW = new Set([...GENERIC_PREFIXES.map((g) => g.toLowerCase()),
  "fuente de poder", "tarjeta de video"]);
const GENERIC_LEAD = [...GENERIC_LOW].sort((a, b) => b.length - a.length);
const SEP = /\s+[-–]\s+/;

function pyStrip(s, chars) {
  let a = 0, b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}
function pyRstrip(s, chars) {
  let b = s.length;
  while (b > 0 && chars.includes(s[b - 1])) b--;
  return s.slice(0, b);
}

// Secciones donde el equipo necesita el título completo de Woo (todas las specs)
const FULL_NAME_SECS = new Set(["lap"]);

function shortName(nombre, sec) {
  let s = nombre.replace(/\s+/g, " ").trim();
  if (FULL_NAME_SECS.has(sec)) return s;
  let parts = s.split(SEP);
  if (parts.length > 1 && GENERIC_LOW.has(parts[0].toLowerCase())) parts = parts.slice(1);
  s = parts.join(" - ");
  const low = s.toLowerCase();
  for (const g of GENERIC_LEAD) {
    if (low.startsWith(g + " ")) { s = s.slice(g.length + 1); break; }
  }
  s = s.split(SEP).slice(0, 3).join(" - ");
  const chars = [...s];
  if (chars.length > MAX_NAME) s = pyRstrip(chars.slice(0, MAX_NAME).join(""), " -–");
  return s;
}

function nameSection(name) {
  for (const [rx, sec] of NAME_RULES) if (rx.test(name)) return sec;
  return null;
}

function classify(nombre, cats) {
  const cs = new Set(cats);
  if ([...cs].some((c) => c === "MacBooks" || c === "iPad") || APPLE_RE.test(nombre)) return "apple";
  if (cats.some((c) => /^(PlayStation|Xbox|Nintendo|Consolas)/.test(c)) || CON_RE.test(nombre)) return "con";
  if ([...cs].some((c) => LAP_CATS.has(c))) return "lap";
  for (const c of cats) if (c in CAT_SEC) return CAT_SEC[c];
  if (cs.has("Nvidia")) return "nv";
  if (cs.has("AMD") || cs.has("Intel")) {
    if (CPU_RE.test(nombre)) return "cpu";
    return cs.has("AMD") ? "amd" : "intel";
  }
  if ([...cs].some((c) => COOLER_CATS.has(c))) {
    for (const [rx, sec] of COOLER_NAME_RULES) if (rx.test(nombre)) return sec;
  }
  if ([...cs].some((c) => EXT_CATS.has(c)) || cats.some((c) => c.startsWith("Accesorios"))) return "ext";
  const sec = nameSection(nombre);
  if (sec) return sec;
  if ([...cs].some((c) => !UNSORTED.has(c))) return "ext";
  return null;
}

// ---- Inventarios ----
const HEADER_RULES = [
  [/GPU\s*NVIDIA/i, "nv"],
  [/GPU\s*AMD/i, "amd"],
  [/GPU\s*INTEL/i, "intel"],
  [/Port[aá]tiles/i, "lap"],
  [/Componentes/i, "comp"],
  [/Consolas/i, "con"],
  [/Extras/i, "ext"],
  [/Apple/i, "apple"],
];
const SUB_PREFIX = /^(MB|CPU|SSD|RL|RT|FAN|PSU|PS|Chasis)(?!\w)\s*/i;
const SUB_MAP = { mb: "mb", cpu: "cpu", ssd: "ssd", rl: "rl", rt: "rt",
  fan: "fan", psu: "psu", ps: "psu", chasis: "chasis" };
const RAM_PREFIX = /^(Kit\s+RAM|RAM)(?!\w)/i;
const QTY_RE = /\s*(?:-\s*\d+\s*unidades?|\(\s*\d+\s*unidades?\s*\))\s*$/i;
const WEIGHT_RE = /\bkg\b/i;
const PORT_HDR = /^Port[aá]tiles$/i;

function headerSec(line) {
  for (const [rx, sec] of HEADER_RULES) if (rx.test(line)) return sec;
  return null;
}

function guessComp(t) {
  if (/\bddr[345]\b|\bcl\s?\d{2}\b|\b\d{1,2}\s?x\s?\d{1,2}\b|mt\/s/i.test(t)) return "ram";
  if (/\bssd\b/i.test(t) || (/\b[gt]b\b/i.test(t) && /mb\/s/i.test(t))) return "ssd";
  if (/\bryzen\b|\bR\s?[3579]\b|\bi[3579]\b|\bultra\b/i.test(t)) return "cpu";
  return null;
}

function parseInventoryLine(line, header) {
  let text = line.slice(1).trim();
  text = pyStrip(text.replace(QTY_RE, ""), " -");
  if (!text || PORT_HDR.test(text) || WEIGHT_RE.test(text)) return null;
  const m = SUB_PREFIX.exec(text);
  if (m) return [SUB_MAP[m[1].toLowerCase()], text.slice(m[0].length).trim()];
  if (RAM_PREFIX.test(text)) return ["ram", text];
  if (header === "comp") {
    const sec = guessComp(text);
    return sec ? [sec, text] : null;
  }
  if (header) return [header, text];
  return null;
}

function readInventories() {
  const lines = [];
  const stats = new Map(); // "sec|key" -> {count, last, text, sec}
  let idx = 0;
  const files = readdirSync(INV_DIR).filter((f) => /^inventario-.*\.txt$/.test(f)).sort();
  for (const f of files) {
    const txt = readFileSync(join(INV_DIR, f), "utf8").replace(/^﻿/, "");
    let header = null;
    for (const raw of txt.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      if (!line.startsWith("-")) { header = headerSec(line); continue; }
      const parsed = parseInventoryLine(line, header);
      if (!parsed) continue;
      const [sec, text] = parsed;
      idx += 1;
      lines.push([sec, text]);
      const key = sec + "|" + text.replace(/\s+/g, " ").toLowerCase();
      const e = stats.get(key);
      if (e) { e.count += 1; e.last = idx; e.text = text; }
      else stats.set(key, { sec, count: 1, last: idx, text });
    }
  }
  const freq = Object.fromEntries(SECTIONS.map((s) => [s, []]));
  const bySec = {};
  for (const e of stats.values()) (bySec[e.sec] ??= []).push(e);
  for (const [sec, items] of Object.entries(bySec)) {
    items.sort((a, b) => b.count - a.count || b.last - a.last);
    freq[sec] = items.slice(0, MAX_FREQ).map((e) => e.text);
  }
  return { freq, lines };
}

// ---- CSV (RFC 4180: comillas dobles, "" escapadas, saltos dentro de campos) ----
function parseCsv(s) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---- Main ----
const csvText = readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
const [header, ...body] = parseCsv(csvText);
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const products = [];
const dbg = [];
let skipped = 0;
for (const r of body) {
  if (r.length < header.length) continue;
  const cats = (r[col.categorias] || "").split("|").map((c) => c.trim()).filter(Boolean);
  const sec = classify(r[col.nombre], cats);
  if (sec === null) { skipped++; continue; }
  products.push([Number(r[col.id]), shortName(r[col.nombre], sec),
    (r[col.sku] || "").trim(), (r[col.mpn] || "").trim(), sec, ...facets(sec, r[col.nombre])]);
  if (process.env.FACETS_DEBUG) dbg.push([sec, r[col.nombre], ...products[products.length - 1].slice(5)].join("	"));
}

const inv = readInventories();
// w: lineas de inventario por seccion que contienen cada marca/gama/ref
const KIND = ["m", "g", "r"];
const w = {};
const vals = {}; // sec -> kind -> Map(value -> regex)
for (const p of products) for (let k = 0; k < 3; k++) {
  const v = p[5 + k];
  if (!v) continue;
  const mp = ((vals[p[4]] ??= {})[KIND[k]] ??= new Map());
  if (!mp.has(v)) mp.set(v, valueRegex(v));
}
for (const [sec, text] of inv.lines) {
  const t = norm(text);
  const f = facets(sec, text);
  const hit = new Set();
  for (let k = 0; k < 3; k++) {
    if (f[k]) hit.add(KIND[k] + ":" + f[k]);
    if ((k === 1 && EXTRACT_ONLY_GAMA.has(sec)) || (k === 2 && EXTRACT_ONLY_REF.has(sec))) continue;
    for (const [v, rx] of vals[sec]?.[KIND[k]] ?? []) if (rx.test(t)) hit.add(KIND[k] + ":" + v);
  }
  const ws = (w[sec] ??= {});
  for (const h of hit) ws[h] = (ws[h] || 0) + 1;
}
const data = { v: 2, p: products, f: inv.freq, w };
const text = JSON.stringify(data);
JSON.parse(text); // validacion
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, text, "utf8");

const counts = {};
for (const p of products) counts[p[4]] = (counts[p[4]] || 0) + 1;
for (const sec of SECTIONS) console.log(`${sec}: ${counts[sec] || 0} productos, ${data.f[sec].length} frecuentes`);
if (process.env.FACETS_DEBUG) writeFileSync(process.env.FACETS_DEBUG, dbg.join(String.fromCharCode(10)), "utf8");
console.log(`total: ${products.length} productos, omitidos: ${skipped}`);
console.log(`tamano: ${(Buffer.byteLength(text, "utf8") / 1024).toFixed(1)} KB -> ${OUT_PATH}`);
