// Stable per-tag banner styling so the same subject always looks the same, without
// reproducing any real brand's logo or trademarked mark - just an abstract gradient + glyph.
const BANNERS = [
  { gradient: "from-indigo-500 to-blue-600", glyph: "‹/›" },
  { gradient: "from-emerald-500 to-teal-600", glyph: "{ }" },
  { gradient: "from-violet-600 to-fuchsia-600", glyph: "◆" },
  { gradient: "from-slate-800 to-slate-950", glyph: "▲" },
  { gradient: "from-sky-500 to-cyan-600", glyph: "☁" },
  { gradient: "from-amber-500 to-orange-600", glyph: "★" },
];

export function bannerFor(tag) {
  let hash = 0;
  for (const ch of tag || "") hash = (hash * 31 + ch.charCodeAt(0)) % BANNERS.length;
  return BANNERS[hash];
}