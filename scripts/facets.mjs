// Facetas (marca / gama / ref) por seccion para el selector Seccion > Marca > Gama > Referencia.
// facets(sec, nombreCompleto) -> [marca, gama, ref]  ("" si se desconoce)
// Funciona igual para nombres del catalogo y para lineas de inventario (texto informal).

export function norm(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[™®]/g, "").replace(/[–—]/g, "-").replace(/[″”“]/g, '"').replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ").trim();
}

// ---- Marcas (nivel 1: nombre explicito; la mas temprana en el texto gana) ----
const BRANDS = [
  ["ASUS", /\bASUS\b/i], ["MSI", /\bMSI\b/i], ["Gigabyte", /\b(?:Gigabyte|Aorus)\b/i], ["Zotac", /\bZotac\b/i],
  ["PNY", /\bPNY\b/i], ["Palit", /\bPalit\b/i], ["Gainward", /\bGainward\b/i], ["Inno3D", /\bInno3D\b/i],
  ["Sapphire", /\bSapphire\b/i], ["XFX", /\bXFX\b/i], ["PowerColor", /\bPower\s?Color\b/i], ["ASRock", /\bASRock\b/i],
  ["Acer", /\bAcer\b/i], ["Sparkle", /\bSparkle\b/i], ["Colorful", /\bColorful\b/i], ["Galax", /\b(?:Galax|KFA2)\b/i],
  ["EVGA", /\bEVGA\b/i], ["Yeston", /\bYeston\b/i], ["Manli", /\bManli\b/i], ["Maxsun", /\bMaxsun\b/i],
  ["Onix", /\bOnix\b/i], ["Leadtek", /\bLeadtek\b/i], ["Biostar", /\bBiostar\b/i], ["Supermicro", /\bSupermicro\b/i],
  ["Lenovo", /\bLenovo\b/i], ["HP", /\bHP\b/i], ["Dell", /\bDell\b/i], ["Alienware", /\bAlienware\b/i],
  ["Razer", /\bRazer\b/i], ["Samsung", /\bSamsung\b/i], ["Apple", /\bApple\b/i],
  ["Corsair", /\bCorsair\b/i], ["G.Skill", /\bG\.?\s?Skill\b/i], ["Kingston", /\bKingston\b/i],
  ["V-Color", /\bV-?\s?Color\b/i], ["XPG", /\bXPG\b/i], ["ADATA", /\bADATA\b/i],
  ["TeamGroup", /\b(?:Team\s?Group|T-?\s?Force|T-?\s?Create)\b/i], ["Patriot", /\bPatriot\b/i],
  ["Klevv", /\bKlevv\b/i], ["Crucial", /\bCrucial\b/i], ["Micron", /\bMicron\b/i], ["Lexar", /\bLexar\b/i],
  ["SanDisk", /\bSanDisk\b/i], ["WD", /\b(?:WD(?:_?BLACK)?|Western Digital)\b/i], ["Seagate", /\bSeagate\b/i],
  ["Solidigm", /\bSolidigm\b/i], ["Sabrent", /\bSabrent\b/i], ["Silicon Power", /\bSilicon\s?Power\b/i],
  ["KingSpec", /\bKingSpec\b/i], ["VisionTek", /\bVisionTek\b/i], ["Netac", /\bNetac\b/i],
  ["Transcend", /\bTranscend\b/i], ["Mushkin", /\bMushkin\b/i], ["Biwin", /\bBiwin\b/i], ["Apacer", /\bApacer\b/i],
  ["Thermaltake", /\bThermaltake\b/i], ["Cooler Master", /\bCooler\s?Master\b/i], ["NZXT", /\bNZXT\b/i],
  ["be quiet!", /\bbe\s?quiet\b/i], ["Noctua", /\bNoctua\b/i], ["Arctic", /\bArctic\b/i], ["DeepCool", /\bDeepCool\b/i],
  ["Lian Li", /\bLian\s?Li\b/i], ["Fractal Design", /\bFractal\b/i], ["Phanteks", /\bPhanteks\b/i],
  ["Antec", /\bAntec\b/i], ["Cougar", /\bCougar\b/i], ["SilverStone", /\bSilverStone\b/i], ["Seasonic", /\bSeasonic\b/i],
  ["FSP", /\bFSP\b/i], ["Super Flower", /\bSuper\s?Flower\b/i], ["Thermalright", /\bThermalright\b/i],
  ["TRYX", /\bTRYX\b/i], ["Gamdias", /\bGamdias\b/i], ["Montech", /\bMontech\b/i], ["Hyte", /\bHyte\b/i],
  ["Zalman", /\bZalman\b/i], ["Sama", /\bSama\b/i], ["Sudokoo", /\bSudokoo\b/i], ["Alseye", /\bAlseye\b/i],
  ["Dynatron", /\bDynatron\b/i], ["Jonsbo", /\bJonsbo\b/i], ["ID-Cooling", /\bID-?\s?Cooling\b/i],
  ["Scythe", /\bScythe\b/i], ["Enermax", /\bEnermax\b/i], ["Tecware", /\bTecware\b/i], ["Aerocool", /\bAerocool\b/i],
  ["Xigmatek", /\bXigmatek\b/i], ["Gamemax", /\bGamemax\b/i], ["Darkflash", /\bDarkflash\b/i], ["Raidmax", /\bRaidmax\b/i],
  ["Redragon", /\bRedragon\b/i], ["Logitech", /\bLogitech\b/i], ["SteelSeries", /\bSteelSeries\b/i],
  ["HyperX", /\bHyperX\b/i], ["ViewSonic", /\bViewSonic\b/i], ["LG", /\bLG\b/i], ["BenQ", /\bBenQ\b/i],
  ["AOC", /\bAOC\b/i], ["Astro", /\bAstro\b/i], ["Sony", /\bSony\b/i], ["Microsoft", /\bMicrosoft\b/i],
  ["Nintendo", /\bNintendo\b/i], ["Valve", /\bValve\b/i], ["Meta", /\bMeta\b/i], ["Elgato", /\bElgato\b/i],
  ["Glorious", /\bGlorious\b/i], ["Keychron", /\bKeychron\b/i], ["Philips", /\bPhilips\b/i], ["Gigabyte", /\bGigabyte\b/i],
  ["Gigastone", /\bGigastone\b/i], ["GeIL", /\bGeIL\b/i], ["Black Diamond", /\bBlack Diamond\b/i], ["AYN", /\b(?:AYN|Odin)\b/i],
  ["Evercade", /\bEvercade\b/i], ["Anbernic", /\bAnbernic\b/i], ["Retroid", /\bRetroid\b/i], ["Analogue", /\bAnalogue\b/i],
  ["Pocket", /\bPocket\s*AIR\b/i], ["8BitDo", /\b8BitDo\b/i], ["Turtle Beach", /\bTurtle\s*Beach\b/i], ["Nacon", /\bNacon\b/i],
  ["PDP", /\bPDP\b/i], ["PowerA", /\bPowerA\b/i], ["Hori", /\bHori\b/i],
];
const GENERIC = [["NVIDIA", /\bNVIDIA\b/i], ["AMD", /\bAMD\b/i], ["Intel", /\bIntel\b/i]];

// ---- Alias (nivel 2: linea de producto -> marca; sirve sobre todo para inventario informal) ----
const GPU = /^(nv|amd|intel)$/;
const ALIASES = [
  ["ASUS", /\b(?:ROG|TUF|Zephyrus|Vivobook|Zenbook|ProArt|Pro\s?Art|ExpertBook)\b/i],
  ["ASUS", /\b(?:Prime|Dual|Phoenix)\b/i, /^(nv|amd|intel|mb|psu)$/],
  ["Gigabyte", /\b(?:Windforce|Eagle|Aero|Aorus)\b/i, /^(nv|amd|intel|mb|lap)$/],
  ["MSI", /\b(?:Ventus|Gaming Trio|Trio|Suprim|Shadow|Inspire|Vanguard|Katana|Cyborg|Raider|Stealth|Tomahawk|Mortar|Spatium)\b/i],
  ["Sapphire", /\b(?:Pulse|Nitro\+)/i, GPU], ["PowerColor", /\b(?:Hellhound|Reaper|Red Devil|Red Dragon|Fighter)\b/i, GPU],
  ["XFX", /\b(?:Quicksilver|Mercury|Swift|Speedster)\b/i, GPU], ["ASRock", /\b(?:Steel Legend|Taichi|Challenger|Phantom Gaming|Riptide)\b/i, /^(nv|amd|intel|mb|psu)$/],
  ["Zotac", /\b(?:Solid|Twin Edge|Amp|Trinity|Solo)\b/i, GPU],
  ["Lenovo", /\b(?:Legion|LOQ|IdeaPad|Yoga|ThinkPad|ThinkBook)\b/i], ["HP", /\b(?:Omen|Victus|Pavilion|OmniBook|EliteBook|ProBook)\b/i],
  ["Acer", /\b(?:Predator|Aspire|TravelMate|Nitro)\b/i, /^(lap|ext|con)$/],
  ["Dell", /\b(?:Inspiron|XPS|Latitude)\b/i], ["Razer", /\bBlade\b/i, /^lap$/], ["Samsung", /\bGalaxy\b/i, /^(lap|ext)$/],
  ["TeamGroup", /\b(?:tcreate|t-create|delta)\b/i, /^ram$/], ["Apple", /\b(?:MacBook|iPhone|iPad|iMac|Mac mini|Mac Studio)\b/i],
  ["Sony", /\b(?:PlayStation|PS5|PS4|DualSense)\b/i], ["Microsoft", /\b(?:Xbox|Surface)\b/i],
  ["Nintendo", /\bSwitch\b/i, /^con$/], ["Valve", /\bSteam Deck\b/i], ["MSI", /\bClaw\b/i, /^con$/],
  ["Corsair", /\b(?:Vengeance|Dominator)\b/i, /^ram$/], ["G.Skill", /\b(?:Trident|Ripjaws|Flare X5)\b/i, /^ram$/],
  ["Kingston", /\bFury\b/i, /^ram$/], ["Patriot", /\bViper\b/i, /^(ram|ssd)$/], ["Samsung", /\b(?:990|980|970|9100)\s?(?:pro|evo)/i, /^ssd$/],
  ["WD", /\b(?:SN\d{3,4}|WD_?BLACK|Black SN)/i, /^ssd$/], ["Corsair", /\b(?:RM\d*[a-z]*|CX\d*|HX\d*|MP\d{3})\b/i, /^(psu|ssd)$/],
];

function brandOf(sec, t) {
  let best = null;
  for (const [name, rx] of BRANDS) {
    const m = rx.exec(t);
    if (m && (!best || m.index < best.i)) best = { n: name, i: m.index, len: m[0].length };
  }
  if (best) return best;
  for (const [name, rx, secs] of ALIASES) {
    if (secs && !secs.test(sec)) continue;
    const m = rx.exec(t);
    if (m && (!best || m.index < best.i)) best = { n: name, i: m.index, len: m[0].length };
  }
  if (best) return best;
  if (GPU.test(sec) || sec === "ssd") {
    for (const [name, rx] of GENERIC) {
      const m = rx.exec(t);
      if (m) return { n: name, i: m.index, len: m[0].length };
    }
    if (sec === "nv" && /Founders/i.test(t)) return { n: "NVIDIA", i: 0, len: 0 };
  }
  return { n: "", i: -1, len: 0 };
}

// ---- utilidades ----
function tc(w) {
  if (/[a-z]/.test(w) && /[A-Z]/.test(w.slice(1))) return w;        // MasterLiquid
  if (/\d/.test(w)) return w.toUpperCase();
  if (w.length <= 2 || /^(?:rgb|lcd|gpu|ssd|rog|tuf|mag|mpg|meg|oled|evo|xt)$/i.test(w)) return w.toUpperCase();
  return w[0].toUpperCase() + w.slice(1).toLowerCase();
}
const title = (s) => s.split(/\s+/).filter(Boolean).map(tc).join(" ");
function table(rows, t, sec) {
  for (const [rx, v] of rows) {
    const m = rx.exec(t);
    if (m) return typeof v === "function" ? v(m, t) : v;
  }
  return "";
}
const STOP = /^(?:-|--|\(|\)|,|black|white|negro|blanco|plata|silver|gris|rgb|argb|pwm|cpu|gen\d?|pcie|pci-express|m\.2|nvme|ssd|sata|con|with|de|para|for|hasta|radiador|kit|ddr[345]|\d+\s?(?:gb|tb|w|mm))$/i;
// Linea de producto tras la marca: palabras hasta un separador/color/numero.
function lineAfter(t, b, { digits = false, max = 3 } = {}) {
  let rest = b.i >= 0 ? t.slice(b.i + b.len) : t;
  rest = rest.replace(/^[\s\-:!]+/, "");
  const out = [];
  for (const w of rest.split(/\s+/)) {
    if (!w || STOP.test(w) || /[,(\[]/.test(w[0]) || /[,)]$/.test(w) && out.length) { if (/[,)]$/.test(w) && w.length > 1 && !STOP.test(w)) out.push(w.replace(/[,)]$/, "")); break; }
    if (!digits && /\d/.test(w)) break;
    out.push(w);
    if (out.length >= max) break;
  }
  if (!out.length && !digits) return lineAfter(t, b, { digits: true, max: 2 });
  return title(out.join(" ").replace(/[-\s]+$/, ""));
}

// ---- GPU ----
function gpuModel(sec, t) {
  let m;
  if (sec === "nv") {
    if ((m = /RTX\s*PRO\s*(\d{4})/i.exec(t))) return "RTX PRO " + m[1];
    if ((m = /RTX\s*(A\d{4})/i.exec(t))) return "RTX " + m[1].toUpperCase();
    const re = /(?<![\d.])(50[5-9]0|40[5-9]0|30[5-9]0|20[5-8]0|16[3-6]0|10[3-8]0)(?!\d)(?:\s*(Ti)(?![a-z]))?(?:\s*(Super)(?![a-z]))?/i;
    if ((m = re.exec(t))) {
      const n = m[1], pre = /^(10|16)/.test(n) ? "GTX" : "RTX";
      return `${pre} ${n}${m[2] ? " Ti" : ""}${m[3] ? " Super" : ""}`;
    }
  } else if (sec === "amd") {
    if ((m = /\bAI\s*PRO\s*(R\d{4})/i.exec(t)) || (m = /\b(R9700)\b/i.exec(t))) return "AI PRO " + m[1].toUpperCase();
    if ((m = /\bW(\d{4})\b/.exec(t))) return "Radeon PRO W" + m[1];
    if ((m = /(?<![\d.])(9070|9060|7900|7800|7700|7600|6950|6900|6800|6750|6700|6650|6600|6500|6400|5700|5600|5500)(?!\d)(?:\s*(XTX|XT|GRE)(?![a-z]))?/i.exec(t)))
      return `RX ${m[1]}${m[2] ? " " + m[2].toUpperCase() : ""}`;
    if ((m = /\bRX\s*(5[78]0|4[78]0)\b/i.exec(t))) return "RX " + m[1];
  } else {
    if ((m = /Arc\s*Pro\s*([AB]\d{2,3})/i.exec(t))) return "Arc Pro " + m[1].toUpperCase();
    if ((m = /\b(?:Arc\s*)?([AB]\d{3})\b/i.exec(t)) || (m = /Arc\s*([AB]\d{2})\b/i.exec(t))) return "Arc " + m[1].toUpperCase();
  }
  return "";
}
const GPU_REF = [
  [/ROG\s*Astral|\bAstral\b/i, "ROG Astral"], [/ROG\s*Strix|\bStrix\b/i, "ROG Strix"], [/ROG\s*Matrix|\bMatrix\b/i, "ROG Matrix"],
  [/\bTUF\b/i, "TUF"], [/Pro\s?Art/i, "ProArt"], [/\bPrime\b/i, "Prime"], [/\bDual\b/i, "Dual"], [/\bPhoenix\b/i, "Phoenix"],
  [/Ventus\s*(2X|3X)/i, (m) => "Ventus " + m[1].toUpperCase()], [/\bVentus\b/i, "Ventus"],
  [/Gaming\s*(?:OC\s*)?Trio|\bTrio\b/i, "Gaming Trio"], [/\bShadow\b/i, "Shadow"], [/\bInspire\b/i, "Inspire"],
  [/\bVanguard\b/i, "Vanguard"], [/\bSuprim\b/i, "Suprim"], [/\bExpert\b/i, "Expert"], [/\bMech\b/i, "Mech"],
  [/Aorus\s*(Master|Elite|Xtreme|Infinity|Waterforce)/i, (m) => "Aorus " + title(m[1])], [/\bAorus\b/i, "Aorus"],
  [/Windforce/i, "Windforce"], [/\bEagle\b/i, "Eagle"], [/\bAero\b/i, "Aero"],
  [/Solid\s*Core|\bSolid\b/i, "Solid"], [/\bSolo\b/i, "Solo"], [/Twin\s*Edge/i, "Twin Edge"], [/AMP\s*Extreme/i, "AMP Extreme"],
  [/\bAMP\b/i, "AMP"], [/\bTrinity\b/i, "Trinity"], [/\bInfinity\b/i, "Infinity"],
  [/\bPulse\b/i, "Pulse"], [/Nitro\+?/i, "Nitro+"], [/\bMercury\b/i, "Mercury"], [/\bSwift\b/i, "Swift"],
  [/Quicksilver/i, "Quicksilver"], [/Speedster/i, "Speedster"], [/Hellhound/i, "Hellhound"], [/\bReaper\b/i, "Reaper"],
  [/Red\s*Devil/i, "Red Devil"], [/Red\s*Dragon/i, "Red Dragon"], [/\bFighter\b/i, "Fighter"],
  [/\bChallenger\b/i, "Challenger"], [/Steel\s*Legend/i, "Steel Legend"], [/\bTaichi\b/i, "Taichi"],
  [/Phantom\s*Gaming/i, "Phantom Gaming"], [/Frieren/i, "Frieren Edition"], [/\bCreator\b/i, "Creator"],
  [/Limited\s*Edition/i, "Limited Edition"], [/\bOdyssey\b/i, "Odyssey"], [/Gaming\s*Pro/i, "GamingPro"],
  [/Jetstream/i, "JetStream"], [/StormX/i, "StormX"], [/Epic-?X/i, "Epic-X"], [/\bVerto\b/i, "Verto"],
  [/iChill/i, "iChill"], [/Twin\s*X2/i, "Twin X2"], [/\bTitan\b/i, "Titan"], [/\bGuardian\b/i, "Guardian"],
  [/Vulcan/i, "Vulcan"], [/Battle-?AX/i, "Battle-AX"], [/Founders/i, "Founders Edition"], [/\bGaming\s*OC\b|\bGaming\b/i, "Gaming OC"],
  [/\bOC\b/i, ""],
];

// ---- Laptops ----
const LAP_FAM = [
  [/ROG\s*Strix\s*(?:Scar\s*)?G?(\d{2})/i, (m, t) => (/Scar/i.test(m[0]) ? "ROG Strix Scar " : "ROG Strix G") + m[1]],
  [/Strix\s*(Scar\s*)?G?(\d{2})\b/i, (m) => (m[1] ? "ROG Strix Scar " : "ROG Strix G") + m[2]],
  [/Zephyrus\s*(G14|G16|Duo\s*\d*|M16|G15)/i, (m) => "ROG Zephyrus " + title(m[1].replace(/\s+/g, " ")).trim()],
  [/ROG\s*Flow\s*(\w+)/i, (m) => "ROG Flow " + m[1].toUpperCase()], [/TUF\s*(?:Gaming|Dash)?/i, "TUF"],
  [/Vivobook/i, "Vivobook"], [/Zenbook/i, "Zenbook"], [/Pro\s?Art/i, "ProArt"], [/ExpertBook/i, "ExpertBook"],
  [/Legion/i, "Legion"], [/\bLOQ\b/i, "LOQ"], [/IdeaPad/i, "IdeaPad"], [/\bYoga\b/i, "Yoga"], [/ThinkPad/i, "ThinkPad"], [/ThinkBook/i, "ThinkBook"],
  [/OMEN/i, "Omen"], [/Victus/i, "Victus"], [/OmniBook/i, "OmniBook"], [/Pavilion/i, "Pavilion"], [/EliteBook/i, "EliteBook"], [/ProBook/i, "ProBook"],
  [/Gaming\s*(A16|A18|A\d{2})/i, (m) => "Gaming " + m[1].toUpperCase()], [/\bAero\b/i, "Aero"], [/Aorus/i, "Aorus"],
  [/Dell\s*(?:Pro\s*(Max|Rugged|Plus)|Pro\b|\d{2}\s*Plus|Plus)/i, (m) => /Plus/i.test(m[0]) && !/Pro/i.test(m[0]) ? "Dell Plus" : "Dell Pro" + (m[1] ? " " + title(m[1]) : "")],
  [/\bHP\s*(?:Laptop|\d{2}")/i, "HP Laptop"],
  [/Alienware\s*(\d{2})x?\s*(Aurora|Area-?51)?/i, (m) => "Alienware " + m[1] + (m[2] ? " " + title(m[2]) : "")],
  [/Alienware/i, "Alienware"], [/Dell\s*(?:Gaming\s*)?G(\d{2})/i, (m) => "Dell G" + m[1]], [/Inspiron/i, "Inspiron"], [/XPS/i, "XPS"], [/Latitude/i, "Latitude"],
  [/Predator\s*(Helios|Triton)?/i, (m) => "Predator" + (m[1] ? " " + m[1] : "")], [/Nitro/i, "Nitro"], [/Aspire/i, "Aspire"],
  [/Swift/i, "Swift"], [/TravelMate/i, "TravelMate"], [/Chromebook/i, "Chromebook"],
  [/Katana/i, "Katana"], [/Cyborg/i, "Cyborg"], [/\bThin\b/i, "Thin"], [/Raider/i, "Raider"], [/Stealth/i, "Stealth"],
  [/Vector/i, "Vector"], [/Titan/i, "Titan"], [/Modern/i, "Modern"], [/Prestige/i, "Prestige"], [/Creator/i, "Creator"], [/Sword/i, "Sword"],
  [/Blade\s*(\d{2})?/i, (m) => "Blade" + (m[1] ? " " + m[1] : "")], [/Galaxy\s*Book/i, "Galaxy Book"], [/Surface/i, "Surface"],
];
function lapGpu(t) {
  let m = /(?:RTX\s*)?(?<![\d.])(50[5-9]0|40[5-9]0|30[5-9]0)(?!\d)(?:\s*(Ti)(?![a-z]))?/i.exec(t);
  if (m && (/RTX/i.test(m[0]) || !/\d{2,4}\s*(?:gb|tb)/i.test(m[0]))) return `RTX ${m[1]}${m[2] ? " Ti" : ""}`;
  if ((m = /RTX\s*PRO\s*(\d{3,4})/i.exec(t))) return "RTX PRO " + m[1];
  if ((m = /RTX\s*(\d{4})/i.exec(t))) return "RTX " + m[1];
  return "Gráficos integrados";
}

// ---- CPU ----
const CPU_FAM = [
  [/Threadripper/i, "Threadripper"], [/Ryzen\s*AI\s*(?:Max\+?\s*)?(\d)/i, (m) => "Ryzen AI " + m[1]], [/Ryzen\s*([3579])/i, (m) => "Ryzen " + m[1]],
  [/\bR([3579])\b/i, (m) => "Ryzen " + m[1]], [/Core\s*Ultra\s*([3579])/i, (m) => "Core Ultra " + m[1]],
  [/\bU([3579])\b/i, (m) => "Core Ultra " + m[1]], [/Core\s*i([3579])/i, (m) => "Core i" + m[1]],
  [/\bi([3579])\b/i, (m) => "Core i" + m[1]], [/Core\s*([3579])\s+\d/i, (m) => "Core " + m[1]],
  [/Xeon/i, "Xeon"], [/EPYC/i, "EPYC"], [/Athlon/i, "Athlon"], [/Pentium/i, "Pentium"], [/Celeron/i, "Celeron"],
];
function cpuFam(t) {
  for (const [rx, v] of CPU_FAM) {
    const m = rx.exec(t);
    if (m) return { v: typeof v === "function" ? v(m) : v, end: m.index + m[0].length };
  }
  return null;
}
function cpuRef(t, fam) {
  const rest = t.slice(fam ? fam.end : 0);
  let m = /^[\s-]*(?:(?:PRO|AI|MAX|Ultra)\s+)*(\d{3,5}(?:X3D|[A-Z]{0,3}))(?![A-Za-z0-9])/i.exec(rest);
  if (m) return m[1].toUpperCase();
  if ((m = /(?<![A-Za-z0-9])(\d{4}X3D|\d{4}(?:XT|GT|X|G|F|E)|\d{5}[A-Z]{0,2}|\d{3}[KF]{1,2}S?)(?![A-Za-z0-9])/i.exec(rest))) return m[1].toUpperCase();
  return "";
}

// ---- RAM ----
function ramKit(t) {
  let m;
  if ((m = /(\d{1,3})\s*GB\s*\(\s*(\d)\s*x\s*(\d{1,3})\s*GB\s*\)/i.exec(t))) return `${m[1]}GB (${m[2]}x${m[3]})`;
  if ((m = /(\d{1,3})\s*GB\s*\(\s*(\d{1,3})\s*GB\s*x\s*(\d)\s*\)/i.exec(t))) return `${m[1]}GB (${m[3]}x${m[2]})`;
  if ((m = /(?<![\d])(\d)\s*x\s*(\d{1,3})\s*GB/i.exec(t))) return `${m[1] * m[2]}GB (${m[1]}x${m[2]})`;
  if ((m = /(?<![\d.])(\d{1,3})\s*GB\b/i.exec(t))) return `${m[1]}GB (1x${m[1]})`;
  return "";
}
const RAM_REF = [
  [/Vengeance\s*RGB/i, "Vengeance RGB"], [/Vengeance/i, "Vengeance"], [/Dominator/i, "Dominator"],
  [/Trident\s*Z5\s*Royal/i, "Trident Z5 Royal"], [/Trident\s*Z5\s*Neo/i, "Trident Z5 Neo"], [/Trident\s*Z5/i, "Trident Z5"],
  [/Trident\s*Z\w*/i, "Trident Z"], [/Flare\s*X5/i, "Flare X5"], [/Ripjaws/i, "Ripjaws"], [/Aegis/i, "Aegis"],
  [/X\s?sky/i, "Xsky"], [/X\s?finity/i, "Xfinity"], [/Manta/i, "Manta"], [/Fury\s*Beast/i, "Fury Beast"], [/Fury\s*Renegade/i, "Fury Renegade"],
  [/Fury\s*Impact/i, "Fury Impact"], [/Viper\s*Venom/i, "Viper Venom"], [/Viper\s*Elite\s*5/i, "Viper Elite 5"], [/Viper\s*Steel/i, "Viper Steel"],
  [/Viper\s*Xtreme/i, "Viper Xtreme"], [/Viper/i, "Viper"], [/Delta\s*RGB/i, "Delta RGB"], [/\bDelta\b/i, "Delta"],
  [/Expert/i, "Expert"], [/Lancer/i, "Lancer"], [/Spectrix/i, "Spectrix"], [/Fit\s*V/i, "Fit V"], [/Bolt\s*(V|XR)/i, (m) => "Bolt " + m[1].toUpperCase()],
  [/Cras\s*\w*/i, "Cras"], [/\bPro\b/i, "Pro"], [/Elite/i, "Elite"], [/Dark\s*Z\s*\w*/i, "Dark Z"], [/Hyperion|Savage|Ballistix|Value\s*RAM|ValueRAM|Black Diamond|Signature/i, (m) => title(m[0])],
];

// ---- SSD ----
function ssdCap(t) {
  const m = /(?<![\d.])(\d+(?:\.\d+)?)\s*(TB|GB|T|G)\b/i.exec(t);
  if (!m) return "";
  let n = parseFloat(m[1]);
  const tb = /^t/i.test(m[2]);
  let gb = tb ? n * 1000 : n;
  if (gb >= 1000) return `${Math.round(gb / 1000 * 10) / 10}TB`.replace(".0", "");
  if (gb === 1024) return "1TB";
  return `${Math.round(gb)}GB`;
}
const SSD_NOISE = /Disco Duro S[oó]lido|Unidad de Estado S[oó]lido|\bSSD\b|\bNVMe\b|\bInterno\b|\bInternal\b|\bExterno\b|Portable/gi;
function ssdRef(t, b) {
  let s = t.replace(SSD_NOISE, " ").replace(/\s+/g, " ").trim();
  if (b.n) {
    const m = BRANDS.find((x) => x[0] === b.n)[1].exec(s);
    if (m) s = s.slice(m.index + m[0].length);
  }
  s = s.replace(/^[\s_\-:]+/, "");
  s = s.replace(/^(?:Black\s+)?(?=SN\d)/i, "");
  s = s.replace(/(?<![\d.])\d+(?:\.\d+)?\s*(?:TB|GB|T|G)\b/gi, " ").replace(/\s+/g, " ").trim();
  s = s.split(/\bGaming\b|Solid State|\bDrive\b|\bPCI|\bM\.2|\bGen\b|\bSATA\b|\bcon\b|\bhasta\b|\bcon\b|[,(\-]|\d+\s*MB\/s|\b\d{4}\s*MB/i)[0];
  s = s.replace(/\b(?:Black|Negro|Blanco|White|with|Heatsink)\b.*$/i, "").trim();
  const ws = s.split(/\s+/).filter((w) => w && !/^(?:1|2|4|8|512|256|500|\d+TB|\d+GB)$/i.test(w)).slice(0, 4);
  return title(ws.join(" "));
}

// ---- MB ----
const MB_REF = [
  [/ROG\s*Maximus/i, "ROG Maximus"], [/ROG\s*Crosshair/i, "ROG Crosshair"], [/ROG\s*Strix|\bStrix\b/i, "ROG Strix"], [/\bTUF\b/i, "TUF Gaming"],
  [/Pro\s?Art/i, "ProArt"], [/\bPrime\b/i, "Prime"], [/Aorus\s*(Elite|Pro|Master|Xtreme|Ultra|Tachyon)/i, (m) => "Aorus " + title(m[1])],
  [/Aorus/i, "Aorus"], [/Gaming\s*X\b/i, "Gaming X"], [/Gaming\s*Plus/i, "Gaming Plus"], [/\bEagle\b/i, "Eagle"], [/\bAero\b/i, "Aero"],
  [/\bUD\b/i, "UD"], [/Tomahawk/i, "Tomahawk"], [/Mortar/i, "Mortar"], [/Carbon/i, "Carbon"], [/Phantom\s*Gaming/i, "Phantom Gaming"],
  [/Challenger/i, "Challenger"], [/Steel\s*Legend/i, "Steel Legend"], [/Taichi/i, "Taichi"], [/Riptide/i, "Riptide"], [/Nova/i, "Nova"],
  [/Lightning/i, "Lightning"], [/Terminator/i, "Terminator"], [/iCraft/i, "iCraft"], [/\bEdge\b/i, "Edge"], [/\bPro\b/i, "Pro"],
  [/\bMAG\b/i, "MAG"], [/\bMPG\b/i, "MPG"], [/\bMEG\b/i, "MEG"], [/\bGaming\b/i, "Gaming"], [/\bWS\b/i, "WS"], [/Pro\s*RS/i, "Pro RS"],
];
function mbChipset(t) {
  const m = /(?<![A-Za-z0-9])([XBZHAWQ]\d{3})(E?)(?=[A-Z]?(?:[^A-Za-z0-9]|$))/i.exec(t);
  return m ? (m[1] + m[2]).toUpperCase() : "";
}

// ---- PSU ----
const WATTS = new Set([300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 1000, 1050, 1100, 1200, 1250, 1300, 1500, 1600, 2000]);
function psuWatts(t) {
  let m = /(?<![\d.])(\d{3,4})\s*W\b/i.exec(t);
  if (m) return m[1] + "W";
  for (const x of t.matchAll(/\d{3,4}/g)) if (WATTS.has(+x[0])) return x[0] + "W";
  return "";
}
const PSU_REF = [
  [/\b(MPG|MAG)\s*(A\d{3,4}\w*)/i, (m) => m[1].toUpperCase() + " " + m[2].toUpperCase()], [/Steel\s*Legend/i, "Steel Legend"],
  [/\bRM[xie]?\d*/i, "RM"], [/\bCX\d*[mM]?/i, "CX"], [/\bCV\d*/i, "CV"], [/\bHX\d*/i, "HX"], [/\bSF\d*/i, "SF"], [/\bUD\d*|GP-UD/i, "UD"],
  [/Toughpower\s*(GF\s*A3|GF\d*|PF\d*)?/i, (m) => "Toughpower" + (m[1] ? " " + m[1].toUpperCase() : "")], [/Smart\s*BX/i, "Smart BX"],
  [/TUF\s*Gaming/i, "TUF Gaming"], [/ROG\s*(Thor|Strix|Loki)/i, (m) => "ROG " + title(m[1])], [/\bPrime\b/i, "Prime"],
  [/Katana/i, "Katana Chroma"], [/Focus/i, "Focus"], [/Vertex/i, "Vertex"], [/\bPRO\s*Series/i, "Pro Series"], [/\bGAMING\b/i, "Gaming"],
];

// ---- RL / FAN / CHASIS / RT ----
function radSize(t) {
  const m = /(?<![\d.])(120|140|240|280|360|420)\s*mm/i.exec(t) || /(?<![A-Za-z0-9])(240|280|360|420)(?![A-Za-z0-9])/.exec(t);
  return m ? m[1] + "mm" : "";
}
function fanSize(t) {
  const m = /(?<![\d.])(80|92|120|140|200)\s*mm/i.exec(t) || /(?<![A-Za-z0-9])(120|140)(?![A-Za-z0-9])/.exec(t);
  return m ? m[1] + "mm" : "";
}
function caseForm(t) {
  const m = /(Full|Mid|Mini|Super|Micro)[\s-]*Tower|\b(Cubo|Cube|SFF|ITX)\b/i.exec(t);
  return m ? title(m[0].replace(/[\s-]+/g, " ")) : "";
}

// ---- Consolas ----
const CON_FAM = [
  [/PlayStation\s*5\s*Pro|PS5\s*Pro/i, "PS5"], [/PlayStation\s*5|\bPS5\b/i, "PS5"], [/PlayStation\s*4|\bPS4\b/i, "PS4"],
  [/PS\s*VR2|PSVR2/i, "PS VR2"], [/PS\s*Portal|PlayStation\s*Portal/i, "PS Portal"],
  [/Xbox\s*Series\s*S\s*[|\/]\s*X|Xbox\s*Series\s*X\s*[|\/]\s*S/i, "Xbox Series X|S"], [/Xbox\s*Series\s*X/i, "Xbox Series X"],
  [/Xbox\s*Series\s*S/i, "Xbox Series S"], [/Xbox\s*One/i, "Xbox One"], [/Xbox/i, "Xbox"],
  [/Switch\s*2/i, "Switch 2"], [/Switch/i, "Switch"], [/Steam\s*Deck/i, "Steam Deck"], [/ROG\s*Xbox\s*Ally|ROG\s*Ally|\bAlly\b/i, "ROG Ally"],
  [/Legion\s*Go/i, "Legion Go"], [/\bClaw\b/i, "MSI Claw"], [/Quest/i, "Meta Quest"], [/Retro|Portable/i, "Retro"],
];
const CON_REF = [
  [/DualSense\s*Edge/i, "DualSense Edge"], [/DualSense/i, "DualSense"], [/Elite\s*Series\s*2/i, "Elite Series 2"], [/Joy-?\s?Con\s*2/i, "Joy-Con 2"],
  [/Joy-?\s?Con/i, "Joy-Con"], [/Pro\s*Controller/i, "Pro Controller"], [/Ally\s*X/i, "Ally X"], [/Legion\s*Go\s*(S|2)\b/i, (m) => "Go " + m[1]],
  [/\bPro\b/i, "Pro"], [/\bSlim\b/i, "Slim"], [/Digital/i, "Digital"], [/OLED/i, "OLED"], [/\bLite\b/i, "Lite"], [/Standard/i, "Standard"],
  [/Z1\s*Extreme/i, "Z1 Extreme"], [/Open\s*Box/i, "Open Box"], [/Bundle/i, "Bundle"],
];

// ---- Apple ----
const APPLE_FAM = [
  [/MacBook\s*(Air|Pro)\s*(\d{2})/i, (m) => `MacBook ${title(m[1])} ${m[2]}`], [/MacBook\s*(Air|Pro)/i, (m) => `MacBook ${title(m[1])}`],
  [/iPhone\s*(\d{1,2}[a-z]?)\s*(Pro\s*Max|Pro|Plus|Air|e)?/i, (m) => `iPhone ${m[1]}` + (m[2] ? " " + title(m[2].replace(/\s+/g, " ")) : "")],
  [/iPad\s*(Pro|Air|mini)/i, (m) => "iPad " + (m[1].toLowerCase() === "mini" ? "mini" : title(m[1]))], [/iPad/i, "iPad"],
  [/iMac/i, "iMac"], [/Mac\s*mini/i, "Mac mini"], [/Mac\s*Studio/i, "Mac Studio"], [/Apple\s*Watch/i, "Apple Watch"], [/AirPods/i, "AirPods"],
  [/Apple\s*Pencil/i, "Apple Pencil"], [/Magic\s*(Keyboard|Mouse|Trackpad)/i, (m) => "Magic " + m[1]],
];
function appleRef(t) {
  let m = /\b(M[1-9])(?:\s*(Pro|Max|Ultra))?\b/.exec(t) || /\b(A\d{2})\b(?:\s*Pro)?/.exec(t);
  if (m) return m[1].toUpperCase() + (m[2] ? " " + m[2] : "");
  if ((m = /(?<![\d.])(\d{2,4})\s*(GB|G|TB|T)\b/i.exec(t))) return m[1] + (/^t/i.test(m[2]) ? "TB" : "GB");
  return "";
}

// ---- Extras ----
function extType(t) {
  if (/Monitor|\d{2}(?:\.\d)?"|\bHz\b.*\b(?:FHD|QHD|UHD|4K)\b/i.test(t)) return "Monitor";
  if (/Teclado|Keyboard|Mec[a]nico|\bK\d{2,3}\b/i.test(t)) return "Teclado";
  if (/Mouse|DPI|Raton/i.test(t)) return "Mouse";
  if (/Headset|Diadema|Audifono|Auricular|Headphone/i.test(t)) return "Headset";
  if (/Mousepad|Pad\b/i.test(t)) return "Mousepad";
  if (/Silla|Chair/i.test(t)) return "Silla";
  return "";
}

// ---- API ----
export const EXTRACT_ONLY_GAMA = new Set(["nv", "amd", "intel", "cpu", "ram", "ssd"]);
export const EXTRACT_ONLY_REF = new Set(["lap"]);

export function facets(sec, name) {
  let t = norm(name).replace(/HyperX\s+Omen/i, "HP Omen").replace(/\bT-Create\b/gi, "T-Create");
  let b = brandOf(sec, t);
  let m = b.n, g = "", r = "";
  switch (sec) {
    case "nv": case "amd": case "intel":
      g = gpuModel(sec, t); r = table(GPU_REF, t);
      if (r === "Gaming OC" && b.n !== "Gigabyte") r = "";
      if (r === "Infinity" && b.n === "Gigabyte") r = "Aorus Infinity";
      break;
    case "lap": g = table(LAP_FAM, t); r = lapGpu(t); break;
    case "cpu": {
      const f = cpuFam(t);
      g = f ? f.v : ""; r = cpuRef(t, f);
      m = /Intel|Core|\bU[3579]\b|\bi[3579]\b|Xeon|Pentium|Celeron/i.test(t) && !/Ryzen|AMD/i.test(t) ? "Intel" : /AMD|Ryzen|Threadripper|EPYC|Athlon|\bR[3579]\b/i.test(t) ? "AMD" : m;
      break;
    }
    case "ram": g = ramKit(t); r = table(RAM_REF, t); break;
    case "ssd": g = ssdCap(t); r = ssdRef(t, b); break;
    case "mb": g = mbChipset(t); r = table(MB_REF, t); break;
    case "psu": g = psuWatts(t); r = table(PSU_REF, t) || lineAfter(t, b, { digits: false, max: 3 }); break;
    case "rl": g = radSize(t); r = lineAfter(t, b); break;
    case "fan": g = fanSize(t); r = lineAfter(t, b); break;
    case "chasis": g = caseForm(t); r = lineAfter(t.replace(/^Gamer\s*-\s*/i, ""), brandOf(sec, t.replace(/^Gamer\s*-\s*/i, "")), { digits: true, max: 3 }); break;
    case "rt": g = lineAfter(t, b, { max: 2 }); r = lineAfter(t, b, { digits: true, max: 4 }); if (r === g) r = ""; break;
    case "con":
      g = table(CON_FAM, t); r = table(CON_REF, t);
      if (/Xbox.*Ally/i.test(t)) m = "ASUS";
      break;
    case "apple":
      g = table(APPLE_FAM, t); r = appleRef(t);
      if (g && /Mac|iPhone|iPad|Watch|AirPods/.test(g)) m = "Apple";
      break;
    case "ext": g = extType(t); break;
  }
  return [m, g, r];
}

// regex para buscar un valor de faceta dentro del texto (sin importar espacios/guiones/caso)
export function valueRegex(value) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = value.split(/[\s\-_]+/).filter(Boolean).map(esc).join("[\\s\\-_]*");
  return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, "i");
}
