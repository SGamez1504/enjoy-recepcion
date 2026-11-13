// Specs de memorias RAM: [MT/s, CL] desde el título; si falta, desde SKU/MPN del fabricante
export function ramSpecs(title, ...codes) {
  const t = title.replace(/[®™]/g, " ").replace(/\s+/g, " ");
  let mts = "", cl = "", m;
  if ((m = /\b(\d{4,5})\s*(?:MHz|MT\/?s)\b/i.exec(t)) || (m = /DDR[345]X?[-\s]?(\d{4,5})\b/i.exec(t)) ||
      (m = /PC[345]-?(\d{5,6})\b/i.exec(t)) && null) mts = m[1];
  if ((m = /\bC(?:L|AS)\s?-?(\d{2})\b/i.exec(t))) cl = m[1];

  for (const raw of codes) {
    if (mts && cl) break;
    const c = (raw || "").toUpperCase();
    if (!c) continue;
    let a = "", b = "";
    if ((m = /F[345]-(\d{4,5})[A-Z](\d{2})/.exec(c))) [a, b] = [m[1], m[2]];             // G.Skill F5-6000J3036...
    else if ((m = /^CM\w*?[A-Z](\d{4})[CZ](\d{2})/.exec(c))) [a, b] = [m[1], m[2]];     // Corsair ...B6000C30
    else if ((m = /^KF(\d)(\d{2})[A-Z]{1,2}(\d{2})/.exec(c))) [a, b] = [m[2] + "00", m[3]]; // Kingston KF556C40
    else if ((m = /^CT\d*K?\d+G(\d{2})C(\d{2})/.exec(c)) || (m = /^CP\d*K?\d+G(\d{2})C(\d{2})/.exec(c))) [a, b] = [m[1] + "00", m[2]]; // Crucial
    else if ((m = /(\d{4})HC(\d{2})/.exec(c))) [a, b] = [m[1], m[2]];                  // TeamGroup ...6400HC38
    else if ((m = /^P\w*?\d+G(\d{2,3})C(\d{2})/.exec(c))) [a, b] = [m[1].length === 2 ? m[1] + "00" : m[1] + "0", m[2]]; // Patriot
    if (!mts && a) mts = a;
    if (!cl && b) cl = b;
  }
  if (mts && (+mts < 1333 || +mts > 12000)) mts = "";
  return [mts ? mts + " MT/s" : "", cl ? "CL" + cl : ""];
}
