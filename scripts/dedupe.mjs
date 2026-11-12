// Deduplicacion de productos dentro de una misma seccion (union-find por nombre completo y MPN).
export const normName = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ").trim();

// items: [{p:[...], full, estado, stock}] -> {out: items representantes, groups: [[items]]}
const head = (it) => normName(it.full).split(" ").slice(0, 2).join(" ") + "|" + (it.guard || "");
export function dedupe(items) {
  const bySec = new Map();
  for (const it of items) (bySec.get(it.p[4]) ?? bySec.set(it.p[4], []).get(it.p[4])).push(it);
  const out = [], merged = {}, groups = [];
  for (const [sec, list] of bySec) {
    const par = list.map((_, i) => i);
    const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
    const byName = new Map(), byMpn = new Map();
    list.forEach((it, i) => {
      const n = normName(it.full);
      if (n) { if (byName.has(n)) uni(i, byName.get(n)); else byName.set(n, i); }
      const m = normName(it.p[3]).replace(/ /g, "");
      if (m.length >= 4 && /[a-z]/.test(m)) (byMpn.get(m) ?? byMpn.set(m, []).get(m)).push(i);
    });
    for (const idxs of byMpn.values()) if (idxs.length <= 4) for (const j of idxs.slice(1)) if (head(list[j]) === head(list[idxs[0]])) uni(idxs[0], j);
    const g = new Map();
    list.forEach((it, i) => (g.get(find(i)) ?? g.set(find(i), []).get(find(i))).push(it));
    for (const members of g.values()) {
      const rank = (x) => [x.estado === "publish" ? 1 : 0, x.stock > 0 ? 1 : 0, x.p[0]];
      members.sort((a, b) => { const ra = rank(a), rb = rank(b); for (let k = 0; k < 3; k++) if (ra[k] !== rb[k]) return rb[k] - ra[k]; return 0; });
      const rep = members[0];
      if (members.length > 1) {
        const skus = [...new Set(members.map((x) => x.p[2]).filter(Boolean))];
        rep.p[2] = skus.join(" · ");
        merged[sec] = (merged[sec] || 0) + members.length - 1;
        groups.push(members);
      }
      out.push(rep);
    }
  }
  return { out, merged, groups };
}
