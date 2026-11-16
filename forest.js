/* 我慢貯金 — 森とキャラクターの絵（SVG）。我慢の森のデザインを移植・再構成 */
(() => {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------- キャラクター ----------
  const CHAR_STAGES = [[1, "あかちゃん"], [5, "こども"], [15, "おとな"], [30, "マスター"], [50, "レジェンド"]];
  const CHARACTERS = [
    { id: "mori", name: "もりっこ", color: "#86cf7f", dark: "#3f8c4a", how: "最初から一緒", desc: "森で生まれたなかま。いつも前向き。" },
    { id: "sakura", name: "さくらん", color: "#f7b6c8", dark: "#d9668b", how: "Lv.10になる", desc: "春のようにやさしい。コツコツ派。" },
    { id: "yoru", name: "よるのこ", color: "#8796db", dark: "#3d4a8f", how: "スマホ断ちタイマーを合計300分", desc: "夜ふかしをしない、早寝の達人。" },
    { id: "kin", name: "きんぴか", color: "#f4d35e", dark: "#b8861b", rare: true, how: "実際に移した額が3万円", desc: "本物の貯金でかがやく、金色のなかま。" },
    { id: "hoshi", name: "ほしぞら", color: "#4b3f8f", dark: "#211a52", rare: true, how: "どれかのゲームで「ウルトラ最強」に勝つ", desc: "星のように強い、勝負の天才。" },
    { id: "niji", name: "にじまる", color: "rainbow", dark: "#7b4bb8", rare: true, how: "Lv.40になる", desc: "すべてをきわめた人だけに会える。" },
  ];
  const stageIndex = (list, L) => { let idx = 0; list.forEach(([n], i) => { if (L >= n) idx = i; }); return idx; };
  const stageName = (L) => CHAR_STAGES[stageIndex(CHAR_STAGES, L)][1];
  let seq = 0;
  const charById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  function charSvg(charId, level, opts = {}) {
    const c = charById(charId);
    const st = stageIndex(CHAR_STAGES, level);
    const gid = "cg" + ++seq;
    const fill = c.color === "rainbow" ? "url(#" + gid + ")" : c.color;
    const defs = c.color === "rainbow" ? '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a9e"/><stop offset="0.3" stop-color="#fad0c4"/><stop offset="0.55" stop-color="#a1e3a1"/><stop offset="0.8" stop-color="#8fd3f4"/><stop offset="1" stop-color="#c3a6f2"/></linearGradient></defs>' : "";
    const rx = 28 + st * 1.6, ry = 26 + st * 1.6, eyeY = 66 - st;
    const sprout = [
      '<path d="M50 40 C50 34 50 30 50 27" stroke="#3f8c4a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="27" rx="6" ry="3.5" fill="#6cc070" transform="rotate(-25 44 27)"/><ellipse cx="56" cy="27" rx="6" ry="3.5" fill="#6cc070" transform="rotate(25 56 27)"/>',
      '<path d="M50 40 C50 32 52 26 54 22" stroke="#3f8c4a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 22 C66 12 78 18 74 26 C68 32 58 28 54 22Z" fill="#5db865"/><path d="M54 22 C46 14 36 18 38 25 C42 30 50 27 54 22Z" fill="#7bd17f"/>',
      '<path d="M50 38 C50 30 50 24 50 18" stroke="#3f8c4a" stroke-width="3" fill="none"/><path d="M50 20 C62 6 80 14 74 24 C68 30 56 26 50 20Z" fill="#5db865"/><path d="M50 20 C38 6 20 14 26 24 C32 30 44 26 50 20Z" fill="#7bd17f"/><circle cx="50" cy="16" r="5" fill="#ffd1dc"/><circle cx="50" cy="16" r="2" fill="#f6a5b8"/>',
      "<g>" + [0, 1, 2, 3, 4].map((i) => '<circle cx="' + (32 + i * 9) + '" cy="' + (40 - (i === 2 ? 4 : i % 2 ? 2 : 0)) + '" r="5.5" fill="' + ["#ffb3c7", "#ffe08a", "#ff9fb5", "#ffe08a", "#ffb3c7"][i] + '"/>').join("") + '<path d="M28 44 Q50 36 72 44" stroke="#5db865" stroke-width="3" fill="none"/></g>',
      '<g><path d="M33 40 L36 24 L44 34 L50 20 L56 34 L64 24 L67 40 Z" fill="#ffd34d" stroke="#c99a1c" stroke-width="2"/><circle cx="50" cy="31" r="3" fill="#ff6b8a"/><circle cx="38" cy="35" r="2" fill="#6bd1ff"/><circle cx="62" cy="35" r="2" fill="#6bd1ff"/></g>',
    ][st];
    const aura = st >= 4 || c.rare ? '<circle cx="50" cy="68" r="' + (rx + 10) + '" fill="none" stroke="' + (st >= 4 ? "#ffd34d" : "rgba(255,230,140,0.6)") + '" stroke-width="2" stroke-dasharray="3 6" opacity="0.8"/>' : "";
    const stars = c.id === "hoshi" ? '<circle cx="38" cy="80" r="1.6" fill="#fff"/><circle cx="62" cy="84" r="1.2" fill="#fff"/><circle cx="56" cy="52" r="1.4" fill="#fff"/>' : "";
    const gray = opts.locked ? ' filter="url(#lk' + gid + ')"' : "";
    const lockDef = opts.locked ? '<defs><filter id="lk' + gid + '"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer></filter></defs>' : "";
    const size = opts.size || 80;
    return '<svg class="char-svg" ' + (opts.ns ? 'xmlns="http://www.w3.org/2000/svg" ' : "") + 'viewBox="0 0 100 110" width="' + size + '" height="' + Math.round(size * 1.1) + '" aria-hidden="true">' + defs + lockDef + "<g" + gray + ">" +
      '<ellipse cx="50" cy="102" rx="' + rx * 0.8 + '" ry="5" fill="rgba(20,40,30,0.18)"/>' + aura +
      '<ellipse cx="38" cy="96" rx="9" ry="5" fill="' + c.dark + '"/><ellipse cx="62" cy="96" rx="9" ry="5" fill="' + c.dark + '"/>' +
      '<ellipse cx="50" cy="70" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" stroke="' + c.dark + '" stroke-width="2.5"/>' +
      '<ellipse cx="42" cy="58" rx="9" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-20 42 58)"/>' + stars +
      '<circle cx="40" cy="' + eyeY + '" r="4.4" fill="#1d2a24"/><circle cx="60" cy="' + eyeY + '" r="4.4" fill="#1d2a24"/>' +
      '<circle cx="41.5" cy="' + (eyeY - 1.6) + '" r="1.5" fill="#fff"/><circle cx="61.5" cy="' + (eyeY - 1.6) + '" r="1.5" fill="#fff"/>' +
      '<ellipse cx="32" cy="' + (eyeY + 8) + '" rx="5" ry="3" fill="rgba(255,120,140,0.45)"/><ellipse cx="68" cy="' + (eyeY + 8) + '" rx="5" ry="3" fill="rgba(255,120,140,0.45)"/>' +
      '<path d="M45 ' + (eyeY + 9) + " Q50 " + (eyeY + 14) + " 55 " + (eyeY + 9) + '" stroke="#1d2a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>' + sprout + "</g></svg>";
  }
  const imgCache = {};
  function charImage(charId, level) {
    const key = charId + ":" + stageIndex(CHAR_STAGES, level);
    if (imgCache[key]) return imgCache[key];
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(charSvg(charId, level, { size: 100, ns: true }));
    imgCache[key] = img;
    return img;
  }

  // ---------- 森 ----------
  // 森の成長は「我慢した合計額」で決まる
  const FOREST_STAGES = [[0, "芽"], [3000, "苗木"], [15000, "若木"], [50000, "大木"], [150000, "巨木"], [500000, "世界樹"]];
  const YEN_PER_TREE = 1000;
  const MAX_TREES = 22;
  function forestStage(total) {
    let i = 0; FOREST_STAGES.forEach(([n], k) => { if (total >= n) i = k; });
    const next = FOREST_STAGES[i + 1];
    return { idx: i, name: FOREST_STAGES[i][1], next: next ? next[0] : null, nextName: next ? next[1] : null, from: FOREST_STAGES[i][0] };
  }
  function symbolTreeSvg(st) {
    if (st === 0) return '<path d="M60 140 L60 112" stroke="#6b4a2b" stroke-width="4"/><ellipse cx="50" cy="108" rx="11" ry="6" fill="#6cc070" transform="rotate(-25 50 108)"/><ellipse cx="70" cy="108" rx="11" ry="6" fill="#5db865" transform="rotate(25 70 108)"/>';
    const trunkW = [0, 6, 10, 14, 18, 22][st], top = [0, 92, 72, 52, 34, 18][st], crown = [0, 22, 32, 42, 50, 56][st];
    const col = st >= 5 ? ["#3e9a5c", "#57b873", "#7fd394"] : ["#2f7d4a", "#40916c", "#5fb57d"];
    const sparkle = st >= 5 ? '<g fill="#fff3b0">' + [[30, 30], [92, 40], [60, 12], [40, 70], [84, 74]].map(([x, y]) => '<path d="M' + x + " " + (y - 5) + " L" + (x + 1.5) + " " + (y - 1.5) + " L" + (x + 5) + " " + y + " L" + (x + 1.5) + " " + (y + 1.5) + " L" + x + " " + (y + 5) + " L" + (x - 1.5) + " " + (y + 1.5) + " L" + (x - 5) + " " + y + " L" + (x - 1.5) + " " + (y - 1.5) + 'Z"/>').join("") + "</g>" : "";
    const fruit = st >= 4 ? '<circle cx="44" cy="' + (top + crown * 0.9) + '" r="4" fill="#ffd34d"/><circle cx="76" cy="' + (top + crown * 0.7) + '" r="4" fill="#ff9fb5"/><circle cx="60" cy="' + (top + crown * 0.4) + '" r="4" fill="#ffd34d"/>' : "";
    return '<path d="M' + (60 - trunkW / 2) + " 140 L" + (60 - trunkW / 3) + " " + (top + crown) + " L" + (60 + trunkW / 3) + " " + (top + crown) + " L" + (60 + trunkW / 2) + ' 140Z" fill="#7a4e2e"/>' +
      '<circle cx="60" cy="' + (top + crown * 0.9) + '" r="' + crown + '" fill="' + col[0] + '"/>' +
      '<circle cx="' + (60 - crown * 0.55) + '" cy="' + (top + crown * 1.05) + '" r="' + crown * 0.7 + '" fill="' + col[1] + '"/>' +
      '<circle cx="' + (60 + crown * 0.55) + '" cy="' + (top + crown * 1.05) + '" r="' + crown * 0.7 + '" fill="' + col[1] + '"/>' +
      '<circle cx="' + (60 - crown * 0.2) + '" cy="' + (top + crown * 0.6) + '" r="' + crown * 0.55 + '" fill="' + col[2] + '" opacity="0.9"/>' + fruit + sparkle;
  }
  const SH = '<ellipse cx="40" cy="104" rx="16" ry="3.5" fill="rgba(20,30,20,0.22)"/>';
  function treeInner(kind) {
    if (kind === "pine") return SH + '<path d="M36 108 L36 78 L44 78 L44 108 Z" fill="#7a4e2e"/><path d="M40 34 L62 62 L18 62 Z" fill="#1f4f32"/><path d="M40 48 L66 78 L14 78 Z" fill="#2f6d45"/><path d="M40 64 L70 92 L10 92 Z" fill="#1f4f32"/>';
    if (kind === "sakura") return SH + '<path d="M37 108 C37 78 38 60 40 52 C42 60 43 78 43 108 Z" fill="#8d5a38"/><ellipse cx="28" cy="50" rx="18" ry="16" fill="#ee8aa3"/><ellipse cx="52" cy="50" rx="17" ry="15" fill="#ee8aa3"/><ellipse cx="40" cy="36" rx="18" ry="16" fill="#f4a5b8"/><ellipse cx="40" cy="54" rx="15" ry="12" fill="#f4a5b8"/><circle cx="28" cy="38" r="2.2" fill="#fff"/><circle cx="46" cy="30" r="2.4" fill="#fff"/><circle cx="58" cy="48" r="2" fill="#fff"/><circle cx="22" cy="54" r="1.8" fill="#fff"/>';
    if (kind === "apple") return SH + '<path d="M37 108 C37 80 38 64 40 54 C42 64 43 80 43 108 Z" fill="#8d5a38"/><ellipse cx="40" cy="46" rx="22" ry="20" fill="#2f6d3c"/><ellipse cx="28" cy="50" rx="14" ry="13" fill="#3f8c4a"/><ellipse cx="52" cy="50" rx="14" ry="13" fill="#3f8c4a"/><circle cx="30" cy="50" r="3.2" fill="#e2553c"/><circle cx="50" cy="46" r="3" fill="#d44530"/><circle cx="42" cy="58" r="2.8" fill="#e2553c"/>';
    if (kind === "moon") return SH + '<path d="M37 108 C36 78 34 62 32 52 C38 60 44 78 43 108 Z" fill="#6a4e72"/><ellipse cx="38" cy="48" rx="18" ry="20" fill="#4e5e99"/><ellipse cx="30" cy="58" rx="12" ry="16" fill="#6b7bb8"/><ellipse cx="48" cy="56" rx="11" ry="15" fill="#6b7bb8"/><path d="M54 34 a8 8 0 1 0 0 14 a6.5 6.5 0 1 1 0-14" fill="#f6f0c8"/>';
    if (kind === "gold") return SH + '<path d="M36 108 L37 70 L43 70 L44 108 Z" fill="#7a4e2e"/><circle cx="40" cy="50" r="24" fill="#e6b422"/><circle cx="28" cy="58" r="15" fill="#f3cd4c"/><circle cx="53" cy="58" r="15" fill="#f3cd4c"/><circle cx="35" cy="42" r="10" fill="#ffe38a"/><path d="M58 28 L60 33 L65 35 L60 37 L58 42 L56 37 L51 35 L56 33Z" fill="#fff"/>';
    if (kind === "maple") return SH + '<path d="M37 108 C37 80 38 64 40 54 C42 64 43 80 43 108 Z" fill="#8d5a38"/><ellipse cx="40" cy="46" rx="22" ry="20" fill="#c2542d"/><ellipse cx="27" cy="52" rx="13" ry="12" fill="#e07b39"/><ellipse cx="53" cy="52" rx="13" ry="12" fill="#e07b39"/><ellipse cx="40" cy="36" rx="12" ry="10" fill="#f0a04b"/>';
    return SH + '<path d="M37 108 C37 80 38 64 40 54 C42 64 43 80 43 108 Z" fill="#8d5a38"/><ellipse cx="40" cy="46" rx="22" ry="20" fill="#2f6d3c"/><ellipse cx="26" cy="50" rx="13" ry="12" fill="#4c9a5e"/><ellipse cx="54" cy="50" rx="13" ry="12" fill="#4c9a5e"/>';
  }
  const TREE_SLOTS = [
    { x: 20, y: 52, s: 0.58 }, { x: 38, y: 49, s: 0.54 }, { x: 56, y: 51, s: 0.57 }, { x: 74, y: 50, s: 0.55 }, { x: 88, y: 54, s: 0.52 },
    { x: 14, y: 64, s: 0.78 }, { x: 30, y: 60, s: 0.74 }, { x: 48, y: 65, s: 0.8 }, { x: 66, y: 61, s: 0.76 }, { x: 83, y: 64, s: 0.78 },
    { x: 22, y: 69, s: 0.72 }, { x: 72, y: 69, s: 0.73 }, { x: 16, y: 78, s: 1.02 }, { x: 34, y: 81, s: 1.08 }, { x: 52, y: 76, s: 1.0 },
    { x: 70, y: 80, s: 1.06 }, { x: 86, y: 77, s: 0.98 }, { x: 25, y: 83, s: 1.1 }, { x: 58, y: 82, s: 1.06 }, { x: 44, y: 84, s: 1.12 },
    { x: 78, y: 83, s: 1.08 }, { x: 10, y: 81, s: 1.0 },
  ];
  const SLOT_FILL = [13, 15, 7, 9, 2, 14, 16, 5, 8, 0, 17, 18, 6, 11, 1, 19, 12, 3, 20, 10, 4, 21];
  const ANIMAL_SPOTS = [[30, 92], [72, 93], [52, 95], [88, 90], [12, 74], [62, 74], [40, 76], [82, 72]];

  // trees: [{kind}], animals: [emoji], dark: bool
  function forestSvg(opts) {
    const W = 390, H = 250;
    const st = forestStage(opts.total || 0);
    const dark = !!opts.dark;
    const sky = dark ? ["#0f1d2e", "#1b3144", "#24433f"] : ["#9ccfe0", "#cfe7dc", "#eef3d2"];
    const hills = dark ? ["#2c4a3e", "#1f3a30", "#16302a"] : ["#a6cd9d", "#6aa274", "#3f7a52"];
    let h = '<svg class="forest-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(opts.label || "我慢の森") + '">' +
      '<defs><linearGradient id="fsky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset=".6" stop-color="' + sky[1] + '"/><stop offset="1" stop-color="' + sky[2] + '"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#fsky)"/>';
    h += dark ? '<circle cx="330" cy="40" r="16" fill="#f6f0c8"/><circle cx="337" cy="35" r="14" fill="' + sky[0] + '"/>' + [[40, 30], [90, 55], [160, 22], [240, 48], [290, 18], [360, 80]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="1.3" fill="#fff" opacity=".8"/>').join("")
      : '<circle cx="330" cy="42" r="20" fill="#ffe9a8" opacity=".95"/><g fill="#fff" opacity=".85"><ellipse cx="80" cy="40" rx="26" ry="9"/><ellipse cx="98" cy="34" rx="16" ry="9"/><ellipse cx="220" cy="62" rx="22" ry="7"/></g>';
    h += '<path d="M0,135 C40,95 90,105 140,125 C190,145 230,85 300,110 C350,127 370,115 390,105 L390,250 L0,250 Z" fill="' + hills[0] + '"/>';
    // シンボルツリー（中央奥）
    const symH = 150, symW = 128;
    h += '<svg x="' + (W / 2 - symW / 2) + '" y="' + (150 - symH + 20) + '" width="' + symW + '" height="' + symH + '" viewBox="0 0 120 140">' + symbolTreeSvg(st.idx) + "</svg>";
    h += '<path d="M0,165 C60,125 110,160 170,150 C240,138 280,175 340,155 C370,145 380,150 390,158 L390,250 L0,250 Z" fill="' + hills[1] + '"/>';
    // 木（奥から手前へ）
    const trees = (opts.trees || []).slice(0, MAX_TREES);
    const placed = trees.map((t, i) => {
      const slot = TREE_SLOTS[SLOT_FILL[i % TREE_SLOTS.length]];
      const hh = hash("t" + i);
      return { t, x: slot.x + (((hh >> 3) % 7) - 3) * 0.35, y: slot.y + (((hh >> 13) % 5) - 2) * 0.35, s: slot.s };
    }).sort((a, b) => a.y - b.y);
    placed.forEach((p) => {
      const tw = 52 * p.s, th = tw * 110 / 80;
      const cx = (p.x / 100) * W, by = (p.y / 100) * H + 20;
      h += '<svg x="' + (cx - tw / 2).toFixed(1) + '" y="' + (by - th).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="' + th.toFixed(1) + '" viewBox="0 0 80 110">' + treeInner(p.t.kind) + "</svg>";
    });
    h += '<path d="M0,215 C50,195 90,223 150,211 C210,199 260,225 320,209 C360,199 380,203 390,207 L390,250 L0,250 Z" fill="' + hills[2] + '"/>';
    (opts.animals || []).slice(0, ANIMAL_SPOTS.length).forEach((e, i) => {
      const [x, y] = ANIMAL_SPOTS[i];
      h += '<text x="' + (x / 100 * W).toFixed(1) + '" y="' + (y / 100 * H).toFixed(1) + '" font-size="20" text-anchor="middle">' + esc(e) + "</text>";
    });
    if (opts.char) {
      h += '<svg x="' + (W * 0.62) + '" y="' + (H - 78) + '" width="60" height="66" viewBox="0 0 100 110">' + charSvg(opts.char, opts.level || 1, { size: 60 }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + "</svg>";
    }
    if (!trees.length && !(opts.total > 0)) h += '<g><rect x="30" y="178" width="150" height="40" rx="10" fill="rgba(255,255,255,.86)"/><text x="105" y="203" text-anchor="middle" font-size="13" fill="#2c3a33">最初の我慢で森が育ちます</text></g>';
    return h + "</svg>";
  }

  window.GCArt = { CHARACTERS, CHAR_STAGES, stageIndex, stageName, charSvg, charImage, charById, FOREST_STAGES, YEN_PER_TREE, MAX_TREES, forestStage, forestSvg };
})();
