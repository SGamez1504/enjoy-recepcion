// Specs de laptops extraidas del titulo: [cpu, ram, ssd, pantalla]
export function lapSpecs(title) {
  const t = title.replace(/[®™]/g, " ").replace(/\s+/g, " ");
  let cpu = "", m;
  if ((m = /Snapdragon\s+X\s*(Elite|Plus)?(?:\s+X?[A-Z0-9-]{4,})?/i.exec(t))) cpu = "Snapdragon X" + (m[1] ? " " + m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : "");
  else if ((m = /\bApple\s+(M\d)(\s+(?:Pro|Max|Ultra))?/i.exec(t)) || (m = /\b(M[1-5])(\s+(?:Pro|Max|Ultra))?\b/.exec(t)))
    cpu = "Apple " + m[1].toUpperCase() + (m[2] ? " " + m[2].trim() : "");
  else if ((m = /Ryzen\s+AI\s+Max\+?\s*(\d{3})/i.exec(t))) cpu = "Ryzen AI Max+ " + m[1];
  else if ((m = /Ryzen\s+AI\s+(\d)\s+(?:Max\+?\s*)?(\d{3}\w*)/i.exec(t))) cpu = `Ryzen AI ${m[1]} ${m[2].toUpperCase()}`;
  else if ((m = /Ryzen\s+([3579])\s+(?:PRO\s+)?(\d{3,5}\w*)/i.exec(t))) cpu = `Ryzen ${m[1]} ${m[2].toUpperCase().replace(/(\d)([A-Z]+)$/, "$1$2")}`;
  else if ((m = /Core\s+Ultra\s+([3579])\s+(\d{3}\w*)/i.exec(t))) cpu = `Core Ultra ${m[1]} ${m[2].toUpperCase()}`;
  else if ((m = /Core\s+([3579])\s+(?:Processor\s+)?(\d{3}\w*)/i.exec(t)) && !/i[3579]/i.test(m[0])) cpu = `Core ${m[1]} ${m[2].toUpperCase()}`;
  else if ((m = /\bi([3579])[-\s]?(\d{4,5}\w{0,3})\b/i.exec(t))) cpu = `Core i${m[1]}-${m[2].toUpperCase()}`;
  else if ((m = /Celeron\s+(\w+)/i.exec(t))) cpu = "Celeron " + m[1].toUpperCase();
  else if ((m = /Athlon\s+(\w+)/i.exec(t))) cpu = "Athlon " + m[1];

  const sz = (n, u) => { n = Number(n); u = u.toUpperCase(); return u === "TB" ? n + "TB" : n >= 1024 ? n / 1024 + "TB" : n + "GB"; };
  const tt = t.replace(/\b(?:RTX|GTX|RX|Arc)\s*[\w ]{0,12}?\b\d{1,2}\s?GB\b/gi, " ");
  let ram = "", ssd = "";
  if ((m = /(\d{1,3})\s?GB\s*(?:de\s+)?(?:RAM|DDR\d\w*|LPDDR\d\w*|Memoria)/i.exec(tt)) || (m = /(?:RAM|DDR\d\w*|LPDDR\d\w*)\s*(?:de\s*)?(\d{1,3})\s?GB/i.exec(tt))) ram = m[1] + "GB";
  if ((m = /(\d+(?:\.\d+)?)\s?(TB|GB)\s*(?:de\s+)?(?:SSD|NVMe|M\.?2|PCIe|Disco|Almacenamiento|HDD)/i.exec(tt)) || (m = /(?:SSD|NVMe|M\.?2|Disco|HDD)\s*(?:de\s*)?(\d+(?:\.\d+)?)\s?(TB|GB)/i.exec(tt))) ssd = sz(m[1], m[2]);
  // forma "16GB/512GB" o "16GB + 512GB"
  if ((m = /\b(\d{1,3})\s?GB\s*[\/+,y]\s*(\d+(?:\.\d+)?)\s?(TB|GB)\b/i.exec(tt))) {
    if (!ram) ram = m[1] + "GB";
    if (!ssd) ssd = sz(m[2], m[3]);
  }
  if (!ssd && (m = /\b(\d(?:\.\d)?)\s?TB\b/i.exec(tt))) ssd = sz(m[1], "TB");
  if (!ram && (m = /\b(8|12|16|24|32|48|64|96|128)\s?GB\b/i.exec(tt)) && sz(m[1], "GB") !== ssd) ram = m[1] + "GB";
  if (!ssd && (m = /\b(256|512|1024)\s?GB\b/i.exec(tt)) && m[1] + "GB" !== ram) ssd = sz(m[1], "GB");
  let pan = "";
  if ((m = /\b(1[0-9](?:[.,]\d)?)\s?(?:["″”“'']{1,2}|-?\s?(?:inch|pulgadas|pulg|in)\b)/i.exec(t))) pan = m[1].replace(",", ".") + '"';
  if (pan) { const n = parseFloat(pan); if (n < 10 || n > 19) pan = ""; }
  return [cpu, ram, ssd, pan];
}
