/* 我慢貯金 v3.0.0 — データはすべてこの端末（localStorage）にだけ保存されます */
(() => {
  "use strict";

  const VERSION = "3.0.0";
  const SCHEMA = 3;
  const KEY = "gaman-chokin:v3";
  const OLD_KEYS = ["gaman-chokin:v1"]; // v1/v2 のデータ。読み込み後も消さずに残す（安全のため）
  const DAY = 86400000;

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const fmt = (n) => Math.round(n || 0).toLocaleString("ja-JP");
  const yen = (n) => fmt(n) + "円";
  const yenS = (n) => "¥" + fmt(n);
  const now = () => Date.now();
  const pad = (n) => String(n).padStart(2, "0");
  const dkey = (t) => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
  const weekStart = (t) => { const d = new Date(startOfDay(t)); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.getTime(); };
  const wkey = (t) => dkey(weekStart(t));
  const monthStart = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  const mdLabel = (t) => { const d = new Date(t); return (d.getMonth() + 1) + "/" + d.getDate(); };
  const mdwLabel = (t) => { const d = new Date(t); return (d.getMonth() + 1) + "月" + d.getDate() + "日（" + WD[d.getDay()] + "）"; };
  const hm = (t) => { const d = new Date(t); return d.getHours() + ":" + pad(d.getMinutes()); };
  const minLabel = (m) => { m = Math.round(m || 0); if (m < 60) return m + "分"; const h = Math.floor(m / 60), r = m % 60; return h + "時間" + (r ? r + "分" : ""); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- icons (inline SVG) ----------
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>',
    bank: '<path d="M3 10h18L12 4 3 10z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
    share: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m14 6 4 4"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19 13 11"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 21h4"/>',
    sound: '<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    vib: '<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
    tree: '<path d="M12 21v-5"/><path d="M12 3 6 11h3l-4 5h14l-4-5h3z"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    pin: '<path d="M9 4h6l-1 6 3 3H7l3-3z"/><path d="M12 13v8"/>',
  };
  const ic = (n, cls = "") => '<svg class="i ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + "</svg>";

  // ---------- presets ----------
  const PRESETS = [
    { pid: "conveni", emoji: "🏪", name: "コンビニのついで買い", price: 500, cap: 3, group: "food" },
    { pid: "coffee", emoji: "☕", name: "カフェ・コーヒー", price: 450, cap: 3, group: "drink" },
    { pid: "drink", emoji: "🥤", name: "自販機の飲み物", price: 160, cap: 5, group: "drink" },
    { pid: "snack", emoji: "🍰", name: "お菓子・スイーツ", price: 300, cap: 4, group: "food" },
    { pid: "lunch", emoji: "🍱", name: "外食・ランチ", price: 1000, cap: 2, group: "food" },
    { pid: "delivery", emoji: "🛵", name: "フードデリバリー", price: 2000, cap: 2, group: "food" },
    { pid: "impulse", emoji: "🛍️", name: "衝動買い・ネット通販", price: 3000, cap: 3, group: "shop" },
    { pid: "gacha", emoji: "🎮", name: "スマホ課金・ガチャ", price: 1500, cap: 3, group: "fun" },
    { pid: "taxi", emoji: "🚕", name: "タクシー", price: 1500, cap: 3, group: "other" },
    { pid: "phone", emoji: "📱", name: "スマホ・SNS（時間）", price: 0, minutes: 30, cap: 6, group: null },
    { pid: "tobacco", emoji: "🚬", name: "タバコ（1箱）", price: 600, cap: 3, adult: true, group: "tobacco" },
    { pid: "alcohol", emoji: "🍺", name: "お酒（家飲み・コンビニ）", price: 400, cap: 3, adult: true, group: "drink" },
    { pid: "nomikai", emoji: "🍻", name: "飲み会・二次会", price: 4000, cap: 1, adult: true, group: "drink" },
  ];
  // ---------- groups（記録は「グループ → 金額」の2タップ） ----------
  const GROUPS = [
    { id: "food", e: "🍫", n: "食べ物・お菓子", s: "食べ物", tree: "apple", labels: ["お菓子", "コンビニ", "外食・ランチ", "デリバリー", "スイーツ", "アイス"], cap: 15 },
    { id: "drink", e: "☕", n: "飲み物", s: "飲み物", tree: "sakura", labels: ["コーヒー", "ジュース", "自販機", "カフェ"], adultLabels: ["お酒"], cap: 15 },
    { id: "tobacco", e: "🚬", n: "タバコ", s: "タバコ", tree: "pine", adult: true, labels: [], cap: 40 },
    { id: "shop", e: "🛍️", n: "買い物", s: "買い物", tree: "gold", labels: ["服", "雑貨", "ネット通販", "コスメ", "本"], cap: 10 },
    { id: "fun", e: "🎮", n: "娯楽", s: "娯楽", tree: "moon", labels: ["ゲーム課金", "ガチャ", "漫画", "サブスク"], cap: 10 },
    { id: "other", e: "🚕", n: "その他", s: "その他", tree: "maple", labels: ["タクシー", "駐車場", "ついで買い"], cap: 10 },
  ];
  const PRICE_BTNS = [100, 300, 500, 1000, 3000];
  const PID_GROUP = {}; PRESETS.forEach((p) => { if (p.group) PID_GROUP[p.pid] = p.group; });
  const EMOJI_GROUP = { "☕": "drink", "🥤": "drink", "🧋": "drink", "🍺": "drink", "🍷": "drink", "🍰": "food", "🍩": "food", "🍫": "food", "🍟": "food", "🍔": "food", "🍜": "food", "🍱": "food", "🏪": "food", "🚬": "tobacco", "🛍️": "shop", "👗": "shop", "💄": "shop", "📚": "shop", "🧴": "shop", "🎁": "shop", "💊": "shop", "🐾": "shop", "🎮": "fun", "🎰": "fun", "📺": "fun", "🎫": "fun", "🚕": "other", "⛽": "other", "✈️": "other", "🛵": "other" };
  const groupById = (id) => GROUPS.find((g) => g.id === id) || GROUPS[GROUPS.length - 1];
  const SQUAT_XP = 25, SQUAT_DAILY = 3, WISH_XP = 20, WISH_WAIT = 86400000;
  const GAME_XP_CAP = 30;
  const GAME_WIN_XP = { easy: 3, normal: 6, hard: 12, ultra: 30 };
  const DIFFS = [{ id: "easy", name: "弱い" }, { id: "normal", name: "中" }, { id: "hard", name: "強い" }, { id: "ultra", name: "ウルトラ最強" }];
  const EMOJIS = ["🏪", "☕", "🥤", "🍰", "🍱", "🍜", "🍔", "🛵", "🛍️", "👗", "💄", "📚", "🎮", "🎰", "🚕", "⛽", "📱", "📺", "🍺", "🍷", "🚬", "🎫", "🧋", "🍩", "🍫", "🍟", "💊", "🎁", "🐾", "🧴", "✈️", "💸"];
  const TRIGGERS = ["ストレス", "疲れていた", "なんとなく・習慣", "ひまだった", "誘われた", "ご褒美のつもり", "お腹がすいていた", "セール・限定に弱い"];
  const ACTIONS = ["水かお茶を飲む", "5分だけ歩く", "深呼吸を3回する", "家にあるもので済ませる", "24時間カートに入れて待つ", "マイボトルを持って出る", "一言断って帰る", "アプリで我慢を1タップする"];
  const EQUIVS = [
    { e: "🍜", n: "ラーメン", p: 950 },
    { e: "🎬", n: "映画", p: 2000 },
    { e: "🍣", n: "回転寿司ランチ", p: 1800 },
    { e: "🥩", n: "焼肉ディナー", p: 6000 },
    { e: "🎧", n: "ワイヤレスイヤホン", p: 15000 },
    { e: "♨️", n: "温泉旅行1泊", p: 30000 },
    { e: "✈️", n: "国内旅行（2泊）", p: 60000 },
    { e: "🌏", n: "海外旅行", p: 200000 },
  ];

  // ---------- state ----------
  const defaultState = () => ({
    v: 1,
    onboarded: false,
    adult: null,
    createdAt: now(),
    settings: { sound: true, haptic: true, theme: "system", accent: "teal", hourly: 1000, goalBase: "saved", timerMin: 30, tobaccoBox: 600, tobaccoPer: 20 },
    items: [],
    records: [],
    transfers: [],
    goals: [],
    plans: [],
    badges: {},
    missionDone: {},
    flags: {},
    dismiss: {},
    timer: null,
    wishes: [],
    hiddenFavs: {},
    gameDay: {},
    games: {},
    selectedChar: "mori",
    seenChars: ["mori"],
  });
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return migrate(JSON.parse(raw));
      // 旧バージョン（v1）のデータを引き継ぐ。元のデータは消さずに残す
      for (const k of OLD_KEYS) {
        const old = localStorage.getItem(k);
        if (old) { const m = migrate(JSON.parse(old)); m.migratedFrom = k; try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} return m; }
      }
      return defaultState();
    } catch (e) {
      return defaultState();
    }
  }
  function guessGroup(it) {
    if (!it) return "other";
    if (it.group && GROUPS.some((g) => g.id === it.group)) return it.group;
    if (it.pid && PID_GROUP[it.pid]) return PID_GROUP[it.pid];
    return EMOJI_GROUP[it.emoji] || "other";
  }
  function migrate(s) {
    const d = defaultState();
    const out = Object.assign(d, s || {});
    out.settings = Object.assign(defaultState().settings, (s && s.settings) || {});
    ["items", "records", "transfers", "goals", "plans", "wishes", "seenChars"].forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    ["badges", "missionDone", "flags", "dismiss", "hiddenFavs", "gameDay", "games"].forEach((k) => { if (!out[k] || typeof out[k] !== "object" || Array.isArray(out[k])) out[k] = {}; });
    // v1 → v3: 項目と記録にグループを付ける（金額・日時・ID はそのまま）
    out.items.forEach((it) => { if (it && !(it.price === 0 && it.minutes) && !it.group) it.group = guessGroup(it); });
    const byId = {}; out.items.forEach((it) => { if (it) byId[it.id] = it; });
    out.records.forEach((r) => {
      if (!r || (r.type !== "save" && r.type !== "slip")) return;
      if (!r.group) r.group = r.itemId && byId[r.itemId] ? guessGroup(byId[r.itemId]) : "other";
    });
    if (!out.seenChars.includes("mori")) out.seenChars.unshift("mori");
    if (!window.GCArt || !GCArt.CHARACTERS.some((c) => c.id === out.selectedChar)) out.selectedChar = "mori";
    out.v = SCHEMA;
    return out;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast("保存できませんでした。端末の空き容量を確認してください。"); }
  }
  function validState(s) {
    return s && typeof s === "object" && Array.isArray(s.items) && Array.isArray(s.records) && s.items.every((i) => i && typeof i.name === "string" && typeof i.price === "number");
  }

  const itemById = (id) => state.items.find((i) => i.id === id);
  const activeItems = () => state.items.filter((i) => !i.archived && (!i.adult || state.adult === true));
  const visibleGroups = () => GROUPS.filter((g) => !g.adult || state.adult === true);
  const recGroup = (r) => groupById(r.group || (itemById(r.itemId) ? guessGroup(itemById(r.itemId)) : "other"));
  const recLabel = (r) => r.label || (itemById(r.itemId) ? itemById(r.itemId).name : r.name || recGroup(r).n);
  const recEmoji = (r) => (itemById(r.itemId) ? itemById(r.itemId).emoji : recGroup(r).e);
  const tobaccoPer = () => Math.max(1, Math.round((state.settings.tobaccoBox || 600) / Math.max(1, state.settings.tobaccoPer || 20)));
  const saves = () => state.records.filter((r) => r.type === "save" || r.type === "timer");
  const moneySaves = () => state.records.filter((r) => r.type === "save");
  const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);

  // ---------- computations ----------
  function verifyMap() {
    // 週ごとに「実際に移した額」を古い記録から順に割り当て、届いた記録に✅
    const map = {};
    const byWeek = {};
    moneySaves().forEach((r) => { (byWeek[wkey(r.t)] = byWeek[wkey(r.t)] || []).push(r); });
    Object.keys(byWeek).forEach((wk) => {
      let budget = sum(state.transfers.filter((x) => x.week === wk), (x) => x.amount);
      byWeek[wk].sort((a, b) => a.t - b.t).forEach((r) => {
        if (r.amount <= 0) { map[r.id] = true; return; }
        if (budget >= r.amount - 0.5) { map[r.id] = true; budget -= r.amount; } else map[r.id] = false;
      });
    });
    return map;
  }
  function totals() {
    const t = now();
    const ms = moneySaves();
    const sd = startOfDay(t), ws = weekStart(t), mst = monthStart(t);
    const total = sum(ms, (r) => r.amount);
    const vm = verifyMap();
    const verifiedSaved = sum(ms.filter((r) => vm[r.id]), (r) => r.amount);
    const transferred = sum(state.transfers, (x) => x.amount);
    const minutes = sum(saves(), (r) => r.minutes || 0);
    return {
      total, verifiedSaved, transferred, minutes,
      today: sum(ms.filter((r) => r.t >= sd), (r) => r.amount),
      week: sum(ms.filter((r) => r.t >= ws), (r) => r.amount),
      month: sum(ms.filter((r) => r.t >= mst), (r) => r.amount),
      count: saves().length,
      slips: state.records.filter((r) => r.type === "slip").length,
      vm,
    };
  }
  function weekSummary(wk) {
    const ws = parseKey(wk), we = addDays(ws, 7);
    const recs = moneySaves().filter((r) => r.t >= ws && r.t < we);
    const saved = sum(recs, (r) => r.amount);
    const moved = sum(state.transfers.filter((x) => x.week === wk), (x) => x.amount);
    return { wk, ws, we, saved, moved, remaining: Math.max(0, saved - moved), recs };
  }
  function pace() {
    // 直近28日（記録開始が最近なら開始日から）の1日あたり
    const ms = moneySaves();
    if (!ms.length) return { perDay: 0, days: 0 };
    const t = now();
    const first = Math.min(...ms.map((r) => r.t));
    const days = clamp(Math.floor((startOfDay(t) - startOfDay(first)) / DAY) + 1, 1, 28);
    const from = addDays(startOfDay(t), -(days - 1));
    const s = sum(ms.filter((r) => r.t >= from), (r) => r.amount);
    // 記録が少ない最初の数日は大きく出すぎないよう、最低7日で割る
    return { perDay: s / Math.max(days, 7), days };
  }
  function activeDays() {
    const set = new Set();
    saves().forEach((r) => set.add(dkey(r.t)));
    return set;
  }
  function streakInfo() {
    // 1日1回でもOK。週に1回の「おやすみチケット」で1日空いてもつながる
    const days = activeDays();
    const today = startOfDay(now());
    const restUsed = {};
    const restDays = new Set();
    let count = 0;
    let cur = days.has(dkey(today)) ? today : addDays(today, -1);
    let guard = 0;
    while (guard++ < 3650) {
      const k = dkey(cur);
      if (days.has(k)) { count++; cur = addDays(cur, -1); continue; }
      const wk = wkey(cur);
      // チケットはその週に1回。前の日に記録がある場合だけ橋渡し
      const prev = dkey(addDays(cur, -1));
      if (!restUsed[wk] && days.has(prev)) { restUsed[wk] = k; restDays.add(k); cur = addDays(cur, -1); continue; }
      break;
    }
    const thisWk = wkey(today);
    return { count, restDays, ticketLeft: restUsed[thisWk] ? 0 : 1, restUsed };
  }
  // XP: 実際に移した我慢は満額、未確認は3割、タイマー1分=1、ミッション
  function xpInfo() {
    const t = totals();
    const unverified = Math.max(0, t.total - t.verifiedSaved);
    const timerMin = sum(state.records.filter((r) => r.type === "timer"), (r) => r.minutes || 0);
    const missionXp = sum(Object.values(state.missionDone), (arr) => sum(arr, (m) => m.xp || 0));
    const gameXp = sum(Object.values(state.gameDay), (g) => (g && +g.xp) || 0);
    const xp = Math.floor(t.verifiedSaved / 10) + Math.floor((unverified / 10) * 0.3) + timerMin + missionXp + gameXp + squatXpTotal() + wishXpTotal();
    let lv = 1;
    while (lv < 50 && xp >= lvNeed(lv + 1)) lv++;
    const cur = lvNeed(lv), next = lv >= 50 ? cur : lvNeed(lv + 1);
    return { xp, lv, cur, next, pct: lv >= 50 ? 1 : (xp - cur) / (next - cur), title: titleFor(lv) };
  }
  function squatXpTotal() {
    const by = {};
    moneySaves().forEach((r) => { if (r.proof === "squat") by[dkey(r.t)] = (by[dkey(r.t)] || 0) + 1; });
    return sum(Object.values(by), (n) => Math.min(n, SQUAT_DAILY) * SQUAT_XP);
  }
  const wishXpTotal = () => moneySaves().filter((r) => r.src === "wish").length * WISH_XP;
  const gameWinsTotal = () => sum(Object.values(state.games), (g) => sum(Object.values(g || {}), (d) => (d && d.wins) || 0));
  const ultraWins = () => sum(Object.values(state.games), (g) => (g && g.ultra && g.ultra.wins) || 0);
  const lvNeed = (n) => (n <= 1 ? 0 : Math.round(40 * Math.pow(n - 1, 1.9)));
  const TITLES = [[1, "はじめの一歩"], [3, "小銭コレクター"], [5, "節約ビギナー"], [8, "やりくり上手"], [12, "我慢の職人"], [16, "堅実派"], [20, "貯金の達人"], [25, "マネーマスター"], [32, "鉄の意志"], [40, "伝説の倹約家"], [50, "我慢貯金の殿堂"]];
  const titleFor = (lv) => { let t = TITLES[0][1]; TITLES.forEach(([l, n]) => { if (lv >= l) t = n; }); return t; };

  // ---------- goals ----------
  function goalPool() {
    const t = totals();
    const base = state.settings.goalBase === "verified" ? t.transferred : t.total;
    const consumed = sum(state.goals.filter((g) => g.done), (g) => g.amount);
    return Math.max(0, base - consumed);
  }
  function goalProgress(g) {
    if (g.done) return { cur: g.amount, pct: 1, etaDays: 0 };
    const pool = goalPool();
    const cur = Math.min(g.amount, pool * (g.pct || 0) / 100);
    const p = pace();
    const perDay = p.perDay * (g.pct || 0) / 100;
    const remain = g.amount - cur;
    const etaDays = remain <= 0 ? 0 : perDay > 0 ? Math.ceil(remain / perDay) : null;
    return { cur, pct: g.amount ? cur / g.amount : 0, etaDays };
  }
  const activeGoals = () => state.goals.filter((g) => !g.done);
  function evenAlloc() {
    const a = activeGoals();
    if (!a.length) return;
    const each = Math.floor(100 / a.length);
    a.forEach((g, i) => { g.pct = each + (i === 0 ? 100 - each * a.length : 0); });
  }

  // ---------- missions ----------
  const MISSION_POOL = {
    a: [
      { id: "save1", t: "我慢を1回記録する", need: 1, xp: 20, prog: (d) => d.count },
      { id: "save3", t: "我慢を3回記録する", need: 3, xp: 30, prog: (d) => d.count },
    ],
    b: [
      { id: "yen500", t: "今日の我慢額を500円以上に", need: 500, xp: 30, prog: (d) => d.yen, yen: true },
      { id: "kinds2", t: "2種類のことを我慢する", need: 2, xp: 30, prog: (d) => d.kinds },
      { id: "yen1000", t: "今日の我慢額を1,000円以上に", need: 1000, xp: 40, prog: (d) => d.yen, yen: true },
    ],
    c: [
      { id: "timer15", t: "スマホ断ちタイマーを15分成功", need: 15, xp: 30, prog: (d) => d.timerMin, min: true },
      { id: "goals", t: "目標の進み具合を見る", need: 1, xp: 15, prog: (d) => d.flag("goals") },
      { id: "stats", t: "分析で今週の流れを見る", need: 1, xp: 15, prog: (d) => d.flag("stats") },
      { id: "plan", t: "「もし〜なら」作戦を見直す", need: 1, xp: 15, prog: (d) => d.flag("plan") },
      { id: "game1", t: "ゲームで1回勝つ", need: 1, xp: 15, prog: (d) => d.gameWins },
      { id: "forest", t: "森でなかまの様子を見る", need: 1, xp: 15, prog: (d) => d.flag("forest") },
    ],
  };
  function todayMissions() {
    const k = dkey(now());
    const h = hash("m" + k);
    const pick = (arr, salt) => arr[(h >>> salt) % arr.length];
    let c = pick(MISSION_POOL.c, 7);
    return [pick(MISSION_POOL.a, 0), pick(MISSION_POOL.b, 3), c];
  }
  function dayData(k) {
    const sd = parseKey(k), ed = addDays(sd, 1);
    const recs = saves().filter((r) => r.t >= sd && r.t < ed);
    const money = recs.filter((r) => r.type === "save");
    const flags = (state.flags[k] || {});
    return {
      count: recs.length,
      yen: sum(money, (r) => r.amount),
      kinds: new Set(money.map((r) => recGroup(r).id + "|" + recLabel(r))).size,
      gameWins: ((state.gameDay[k] || {}).wins) || 0,
      timerMin: sum(recs.filter((r) => r.type === "timer"), (r) => r.minutes || 0),
      flag: (n) => (flags[n] ? 1 : 0),
    };
  }
  function missionStatus() {
    const k = dkey(now());
    const d = dayData(k);
    const done = state.missionDone[k] || [];
    return todayMissions().map((m) => {
      const p = m.prog(d);
      return Object.assign({}, m, { p: Math.min(p, m.need), complete: p >= m.need, claimed: done.some((x) => x.id === m.id) });
    });
  }
  function setFlag(n) {
    const k = dkey(now());
    state.flags[k] = state.flags[k] || {};
    if (state.flags[k][n]) return;
    state.flags[k][n] = 1;
    // 古いフラグは掃除
    Object.keys(state.flags).forEach((x) => { if (parseKey(x) < addDays(now(), -14)) delete state.flags[x]; });
    save();
    afterChange({ silent: true });
  }

  // ---------- badges ----------
  const BADGES = [
    { id: "first", e: "🌱", n: "はじめての我慢", ok: (c) => c.t.count >= 1 },
    { id: "y1k", e: "🪙", n: "はじめての1,000円", ok: (c) => c.t.total >= 1000 },
    { id: "y10k", e: "💴", n: "1万円達成", ok: (c) => c.t.total >= 10000 },
    { id: "y50k", e: "💰", n: "5万円達成", ok: (c) => c.t.total >= 50000 },
    { id: "y100k", e: "🏦", n: "10万円達成", ok: (c) => c.t.total >= 100000 },
    { id: "y300k", e: "💎", n: "30万円達成", ok: (c) => c.t.total >= 300000 },
    { id: "y1m", e: "👑", n: "100万円達成", ok: (c) => c.t.total >= 1000000 },
    { id: "s3", e: "🔥", n: "3日つづいた", ok: (c) => c.s.count >= 3 },
    { id: "s7", e: "📅", n: "1週間つづいた", ok: (c) => c.s.count >= 7 },
    { id: "s30", e: "🗓️", n: "30日つづいた", ok: (c) => c.s.count >= 30 },
    { id: "s100", e: "🏔️", n: "100日つづいた", ok: (c) => c.s.count >= 100 },
    { id: "tr1", e: "✅", n: "はじめての入金", ok: (c) => c.t.transferred > 0 },
    { id: "tr10k", e: "🏛️", n: "1万円を実際に貯金", ok: (c) => c.t.transferred >= 10000 },
    { id: "goal1", e: "🎯", n: "目標を達成", ok: () => state.goals.some((g) => g.reachedAt) },
    { id: "time60", e: "⏳", n: "1時間を取り戻した", ok: (c) => c.t.minutes >= 60 },
    { id: "time600", e: "🕰️", n: "10時間を取り戻した", ok: (c) => c.t.minutes >= 600 },
    { id: "plan", e: "🧭", n: "作戦を立てた", ok: () => state.plans.length > 0 },
    { id: "tap100", e: "💯", n: "我慢100回", ok: (c) => c.t.count >= 100 },
    { id: "forest10", e: "🌲", n: "森に木が10本", ok: (c) => c.t.total >= 10000 },
    { id: "squat1", e: "🏋️", n: "スクワットで証明", ok: () => state.records.some((r) => r.proof === "squat") },
    { id: "wish1", e: "🧊", n: "欲しいを24時間がまん", ok: () => state.records.some((r) => r.src === "wish") },
    { id: "win1", e: "🎲", n: "ゲームで初勝利", ok: () => gameWinsTotal() > 0 },
    { id: "ultra1", e: "🌠", n: "ウルトラ最強に勝利", ok: () => ultraWins() > 0 },
    { id: "allgames", e: "🕹️", n: "13種類のゲームを遊んだ", ok: () => Object.values(state.games).filter((g) => sum(Object.values(g || {}), (d) => (d && d.plays) || 0) > 0).length >= 13 },
    { id: "char3", e: "🧸", n: "なかまが3人", ok: () => unlockedChars().length >= 3 },
  ];
  // ---------- rate limit ----------
  const MIN_GAP_MS = 15000;
  const DAILY_TOTAL_CAP = 60;
  function todayCount(itemId) {
    const sd = startOfDay(now());
    return state.records.filter((r) => r.type === "save" && r.itemId === itemId && r.t >= sd).length;
  }
  // 連打・水増し防止：項目ごとの上限、グループごとの1日上限、同じものは15秒あける、1日の合計60回まで
  const sameKey = (o) => (o.itemId ? "i:" + o.itemId : "g:" + o.group + "|" + (o.label || ""));
  function recordBlock(o) {
    const sd = startOfDay(now());
    const todays = state.records.filter((r) => r.type === "save" && r.t >= sd);
    if (o.itemId) {
      const item = itemById(o.itemId); const cap = (item && item.cap) || 3;
      if (todays.filter((r) => r.itemId === o.itemId).length >= cap) return "「" + esc(item.name) + "」は今日" + cap + "回記録しました。1日の上限は項目の編集で変えられます。";
    }
    const g = groupById(o.group);
    if (!o.skipGroupCap && todays.filter((r) => recGroup(r).id === g.id).length >= g.cap) return "「" + g.n + "」は今日" + g.cap + "回記録しました。続きはまた明日。";
    const key = sameKey(o);
    const last = state.records.filter((r) => r.type === "save" && sameKey({ itemId: r.itemId, group: recGroup(r).id, label: r.itemId ? null : r.label }) === key).reduce((a, r) => Math.max(a, r.t), 0);
    if (!o.skipGap && now() - last < MIN_GAP_MS) return "連続タップを防ぐため、同じ項目は少し間をあけてから記録してください。";
    if (todays.length >= DAILY_TOTAL_CAP) return "今日はもう十分に記録しました。続きはまた明日。";
    if (!(o.amount > 0) || o.amount > 1000000) return "金額は1〜1,000,000円で入力してください。";
    return null;
  }

  // ---------- tabs ----------
  const TABS = [
    { id: "home", n: "ホーム", i: "home" },
    { id: "stats", n: "分析", i: "chart" },
    { id: "goals", n: "目標", i: "target" },
    { id: "growth", n: "森", i: "tree" },
    { id: "games", n: "ゲーム", i: "game" },
    { id: "settings", n: "設定", i: "gear" },
  ];
  let curTab = "home";
  function renderTabbar() {
    $("#tabbar").innerHTML = TABS.map((t) => '<button type="button" class="tab" data-tab="' + t.id + '"' + (t.id === curTab ? ' aria-current="page"' : "") + ">" + ic(t.i) + "<span>" + t.n + "</span></button>").join("");
  }
  function go(tab) {
    curTab = tab;
    $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === tab));
    renderTabbar();
    renderView(tab);
    window.scrollTo(0, 0);
    if (tab === "goals") setFlag("goals");
    if (tab === "stats") setFlag("stats");
    if (tab === "growth") setFlag("forest");
  }
  function renderView(tab) {
    ({ home: renderHome, stats: renderStats, goals: renderGoals, growth: renderGrowth, games: renderGames, settings: renderSettings }[tab] || renderHome)();
  }
  function renderAll() {
    applyTheme();
    renderTop();
    renderTabbar();
    renderView(curTab);
  }
  function renderTop() {
    const x = xpInfo(), s = streakInfo();
    $("#lv-num").textContent = x.lv;
    $("#streak-num").textContent = s.count;
    $("#pill-level").setAttribute("aria-label", "レベル" + x.lv + "、" + x.title);
    $("#pill-streak").setAttribute("aria-label", s.count + "日連続");
  }

  // ---------- home ----------
  let shownTotal = null;
  function jarSVG(fill) {
    const f = clamp(fill, 0, 1);
    const h = 52 * f, y = 74 - h;
    return '<svg class="jar" id="jar" viewBox="0 0 74 86" aria-hidden="true">' +
      '<defs><clipPath id="jc"><path d="M14 22h46v4c6 4 8 10 8 18v26a10 10 0 0 1-10 10H16A10 10 0 0 1 6 70V44c0-8 2-14 8-18z"/></clipPath>' +
      '<linearGradient id="jg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3CF74"/><stop offset="1" stop-color="#C8952E"/></linearGradient></defs>' +
      '<rect x="18" y="8" width="38" height="12" rx="4" fill="var(--accent)" opacity=".9"/>' +
      '<rect x="30" y="11" width="14" height="3" rx="1.5" fill="var(--surface)" opacity=".8"/>' +
      '<g clip-path="url(#jc)"><rect x="0" y="0" width="74" height="86" fill="var(--bg2)"/>' +
      '<rect id="jar-fill" x="0" y="' + y.toFixed(1) + '" width="74" height="' + (h + 12).toFixed(1) + '" fill="url(#jg)" style="transition:y .8s ease,height .8s ease"/>' +
      '<circle cx="24" cy="' + (y + 10).toFixed(1) + '" r="5" fill="#FBE3A0" opacity="' + (f > 0.05 ? 0.7 : 0) + '"/><circle cx="44" cy="' + (y + 16).toFixed(1) + '" r="4" fill="#FBE3A0" opacity="' + (f > 0.1 ? 0.6 : 0) + '"/></g>' +
      '<path d="M14 22h46v4c6 4 8 10 8 18v26a10 10 0 0 1-10 10H16A10 10 0 0 1 6 70V44c0-8 2-14 8-18z" fill="none" stroke="var(--line2)" stroke-width="1.6"/>' +
      '<path d="M13 40c0-6 2-9 5-11" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
  }
  function jarFill(total) {
    // 次の目標（または次の節目）に対する割合
    const g = activeGoals()[0];
    if (g) return goalProgress(g).pct;
    const steps = [1000, 5000, 10000, 30000, 50000, 100000, 300000, 1000000, 3000000];
    const next = steps.find((x) => x > total) || 3000000;
    return total / next;
  }
  function renderHome() {
    const el = $("#view-home");
    const t = totals();
    const vPct = t.total ? Math.min(1, t.verifiedSaved / t.total) : 0;
    const items = activeItems();
    const p = pace();
    let h = "";

    h += '<section class="card hero" aria-label="我慢貯金の合計"><div class="hero-top"><div class="grow">' +
      '<div class="hero-label">' + ic("bank", "xs") + "これまでの我慢貯金</div>" +
      '<div class="hero-amount num" id="hero-amount" aria-live="polite"><span class="yen">¥</span><span id="hero-num">' + fmt(shownTotal == null ? t.total : shownTotal) + "</span></div>" +
      '<div class="hero-sub">記録 <b class="num">' + t.count + "</b> 回" + (t.minutes ? "　取り戻した時間 <b>" + minLabel(t.minutes) + "</b>" : "") + "</div>" +
      "</div>" + jarSVG(jarFill(t.total)) + "</div>" +
      '<div class="kpis"><div class="kpi"><div class="kpi-l">今日</div><div class="kpi-v num" id="kpi-today">' + yenS(t.today) + '</div></div>' +
      '<div class="kpi"><div class="kpi-l">今週</div><div class="kpi-v num">' + yenS(t.week) + '</div></div>' +
      '<div class="kpi"><div class="kpi-l">今月</div><div class="kpi-v num">' + yenS(t.month) + "</div></div></div>" +
      '<div class="verify-line"><span>実際に移した額 <b class="num" style="color:var(--text)">' + yenS(t.transferred) + '</b></span><span class="vbar" aria-hidden="true"><i style="width:' + (vPct * 100).toFixed(1) + '%"></i></span><span class="num">✅ ' + Math.round(vPct * 100) + "%</span></div>" +
      "</section>";

    if (isIOS() && !isStandalone() && !state.dismiss.a2hs) {
      h += '<div class="banner gold a2hs" id="a2hs"><div class="b-ico">' + ic("plus") + '</div><div class="grow"><p><b>ホーム画面に追加</b></p><p class="small muted">Safariの共有ボタン <span class="share-glyph">' + ic("share", "xs") + "</span> から「ホーム画面に追加」で、アプリとして使えます。</p></div>" +
        '<button type="button" class="item-more" data-act="dismiss-a2hs" aria-label="とじる">' + ic("x", "sm") + "</button></div>";
    }

    // 24時間たった「欲しいもの」
    h += wishDueHTML();
    // 時間帯のおすすめ
    h += suggestHTML();
    // グループ → 金額 の2タップ
    h += '<div class="sec-title"><span>我慢した？ 選んで金額をタップ</span><span class="small faint">2タップで貯金</span></div><div class="groups" id="groups">' +
      visibleGroups().map((g) => { const c = groupTodayCount(g.id); return '<button type="button" class="grp" data-act="group" data-g="' + g.id + '" aria-label="' + g.n + 'を我慢した"><span class="g-e" aria-hidden="true">' + g.e + '</span><span class="g-n">' + g.n + "</span>" + (c ? '<span class="g-c num">今日 ' + c + "</span>" : "") + "</button>"; }).join("") + "</div>";
    // いつもの（固定した項目＋よく使う組み合わせを自動で学習）
    const fv = favorites();
    h += '<div class="sec-title"><span>いつもの（1タップ）</span><button type="button" class="link" data-act="open-items">編集</button></div>';
    h += '<div class="items" id="items">';
    fv.pinned.forEach(({ item: it }) => {
      const c = todayCount(it.id);
      const limited = c >= (it.cap || 3);
      h += '<div class="item' + (limited ? " limited" : "") + '" data-item="' + it.id + '">' +
        '<button type="button" class="item-hit" data-act="tap" data-id="' + it.id + '" aria-label="' + esc(it.name) + "、" + yen(it.price) + 'を我慢した"></button>' +
        (c ? '<span class="item-count num">今日 ' + c + "</span>" : "") +
        '<button type="button" class="item-more" data-act="item-menu" data-id="' + it.id + '" aria-label="' + esc(it.name) + 'のメニュー">' + ic("more", "sm") + "</button>" +
        '<div class="item-emoji" aria-hidden="true">' + esc(it.emoji) + "</div>" +
        '<div><div class="item-name">' + esc(it.name) + (it.adult ? '<span class="item-tag">20+</span>' : "") + "</div>" +
        '<div class="item-price num">' + yen(it.price) + (it.minutes ? " ・ " + it.minutes + "分" : "") + "</div></div></div>";
    });
    fv.learned.forEach((x) => {
      h += '<div class="item learned" data-fav="' + esc(x.key) + '">' +
        '<button type="button" class="item-hit" data-act="fav" data-key="' + esc(x.key) + '" aria-label="' + esc(x.label) + "、" + yen(x.amount) + 'を我慢した"></button>' +
        '<span class="item-count num">' + x.n + "回</span>" +
        '<button type="button" class="item-more" data-act="fav-menu" data-key="' + esc(x.key) + '" aria-label="' + esc(x.label) + 'のメニュー">' + ic("more", "sm") + "</button>" +
        '<div class="item-emoji" aria-hidden="true">' + esc(x.e) + "</div>" +
        '<div><div class="item-name">' + esc(x.label) + '<span class="item-tag auto">自動</span></div><div class="item-price num">' + yen(x.amount) + "</div></div></div>";
    });
    h += '<button type="button" class="item add" data-act="add-item">' + ic("plus") + "<span>項目を固定</span></button></div>";
    if (!fv.learned.length) h += '<p class="small faint" style="margin:6px 4px 0">同じものを2回以上記録すると、ここに1タップボタンが自動で出てきます。</p>';
    h += '<div class="slip-row"><button type="button" class="btn sm ghost" data-act="slip">' + ic("refresh", "sm") + "使っちゃった…を記録</button></div>";
    // 入金の確認バナー
    const tb = transferPrompt();
    if (tb) {
      h += '<div class="banner" id="transfer-banner"><div class="b-ico">' + ic("bank") + '</div><div class="grow"><p><b>' + tb.label + "の我慢分 " + yen(tb.remaining) + "</b> を貯金口座や貯金箱に移しましたか？</p>" +
        '<p class="small muted">移した分だけ ✅ になり、アプリの数字が本物のお金になります。</p>' +
        '<div class="b-actions"><button type="button" class="btn sm primary" data-act="transfer-full" data-wk="' + tb.wk + '">' + yen(tb.remaining) + " 移した</button>" +
        '<button type="button" class="btn sm" data-act="open-transfer">金額を変える</button><button type="button" class="btn sm ghost" data-act="dismiss-transfer" data-wk="' + tb.wk + '">あとで</button></div></div></div>';
    }


    // 欲しいものリスト
    h += wishesHTML();
    // if-then 作戦
    const plans = state.plans.filter((x) => x.active !== false).slice(-3).reverse();
    if (plans.length) {
      h += '<div class="sec-title"><span>今日の作戦</span><button type="button" class="link" data-act="open-plans">見直す</button></div><div class="card">' +
        plans.map((x) => '<div class="plan"><div class="b-ico" style="width:34px;height:34px;border-radius:10px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:none">' + ic("bulb", "sm") + '</div><div><div class="plan-if">もし「' + esc(x.trigger) + "」になったら</div><div class=\"plan-then\">" + esc(x.action) + "</div></div></div>").join("") + "</div>";
    }
    // タイマー
    h += '<div class="sec-title"><span>スマホ断ちタイマー</span></div><div class="card"><div class="between"><div><b>画面を閉じずに置いておくだけ</b><div class="small muted">ほかのアプリを開いたり画面を閉じると失敗。成功すると取り戻した時間に加算。</div></div>' +
      '<button type="button" class="btn primary sm" data-act="timer">' + ic("timer", "sm") + "始める</button></div></div>";

    // ミッション
    h += missionsCard();

    // 予測・換算
    h += '<div class="sec-title"><span>このまま続けると</span></div><div class="card">';
    if (p.perDay > 0) {
      h += '<div class="projection"><div class="grow"><div class="small muted">このペースなら1年で約</div><div class="big num" id="projection">' + yen(roundNice(p.perDay * 365)) + '</div><div class="small faint">' + (p.days < 7 ? "記録" + p.days + "日分を7日で平均した" : "直近" + p.days + "日の平均") + "（1日 " + yen(p.perDay) + "）から計算した目安です</div></div></div>";
    } else {
      h += '<div class="small muted">我慢を記録すると、1年後にいくら貯まるかの目安が出ます。</div>';
    }
    if (t.total > 0) h += '<div class="equivs">' + equivalents(t.total).map((q) => '<span class="equiv">' + q.e + " " + esc(q.n) + " <b>" + q.v + "</b></span>").join("") + "</div>";
    h += "</div>";

    h += '<p class="foot">データはこの端末にだけ保存されます。<br>表示される金額は記録にもとづく目安で、投資や金融のアドバイスではありません。</p>';
    el.innerHTML = h;
    shownTotal = t.total;
  }
  function roundNice(n) { if (n >= 100000) return Math.round(n / 1000) * 1000; if (n >= 10000) return Math.round(n / 100) * 100; return Math.round(n / 10) * 10; }
  function equivalents(total) {
    const out = [];
    EQUIVS.forEach((q) => {
      const v = total / q.p;
      if (v >= 1) out.push({ e: q.e, n: q.n, v: (v >= 10 ? Math.floor(v) : Math.floor(v * 10) / 10) + (q.p >= 30000 ? "回分" : q.n === "ラーメン" ? "杯分" : "回分"), p: q.p });
    });
    if (!out.length) { const q = EQUIVS[0]; out.push({ e: q.e, n: q.n, v: Math.round((total / q.p) * 100) + "%", p: q.p }); }
    return out.slice(-3).reverse();
  }
  function missionsCard() {
    const ms = missionStatus();
    const done = ms.filter((m) => m.complete).length;
    return '<div class="sec-title"><span>今日のミッション</span><span class="small faint num">' + done + " / 3</span></div><div class=\"card\" id=\"missions\">" +
      ms.map((m) => '<div class="mission' + (m.complete ? " done" : "") + '" data-mission="' + m.id + '"><span class="check' + (m.complete ? " on" : "") + '">' + ic("check", "xs") + '</span><div class="grow"><div class="mission-t">' + esc(m.t) + '</div><div class="mission-p num">' + (m.yen ? yen(m.p) + " / " + yen(m.need) : m.min ? m.p + " / " + m.need + "分" : m.p + " / " + m.need) + '</div></div><span class="xp-tag">+' + m.xp + "XP</span></div>").join("") +
      '<div class="small faint" style="margin-top:6px">3つ全部で +30XP ボーナス。できなくても減るものはありません。</div></div>';
  }
  function transferPrompt() {
    // 先週の未入金分（月〜）／日曜は今週分も
    const t = now();
    const cands = [];
    const lastWk = dkey(addDays(weekStart(t), -7));
    cands.push({ wk: lastWk, label: "先週" });
    // 日曜は今週分も（ただし始めたばかりの人には出さない）
    if (new Date(t).getDay() === 0) {
      const s = weekSummary(wkey(t));
      const days = new Set(s.recs.map((r) => dkey(r.t))).size;
      if (days >= 2 && now() - (state.createdAt || 0) > 3 * DAY) cands.unshift({ wk: wkey(t), label: "今週" });
    }
    for (const c of cands) {
      const s = weekSummary(c.wk);
      if (s.remaining > 0 && !state.dismiss["tr-" + c.wk]) return Object.assign(s, c);
    }
    return null;
  }

  // ---------- stats ----------
  let statRange = 30;
  function renderStats() {
    const el = $("#view-stats");
    const t = totals();
    const vPct = t.total ? t.verifiedSaved / t.total : 0;
    let h = '<h1 class="h-title">分析</h1>';
    h += '<div class="stat-grid">' +
      '<div class="kpi card"><div class="kpi-l">合計</div><div class="kpi-v num">' + yenS(t.total) + "</div></div>" +
      '<div class="kpi card" style="margin-top:0"><div class="kpi-l">1年の見込み</div><div class="kpi-v num">' + yenS(roundNice(pace().perDay * 365)) + "</div></div>" +
      '<div class="kpi card" style="margin-top:0"><div class="kpi-l">取り戻した時間</div><div class="kpi-v">' + minLabel(t.minutes) + "</div></div>" +
      '<div class="kpi card" style="margin-top:0"><div class="kpi-l">時間の価値（時給' + fmt(state.settings.hourly) + '円換算）</div><div class="kpi-v num">' + yenS((t.minutes / 60) * state.settings.hourly) + "</div></div></div>";

    h += '<div class="sec-title"><span>アプリ上の我慢額と、実際に移した額</span></div><div class="card"><div class="compare">' +
      '<div class="box"><div class="kpi-l">アプリ上の我慢額</div><div class="kpi-v num">' + yenS(t.total) + "</div></div>" +
      '<div class="box ok"><div class="kpi-l">実際に移した額 ✅</div><div class="kpi-v num">' + yenS(t.transferred) + "</div></div></div>" +
      '<div class="verify-line"><span class="vbar"><i style="width:' + (vPct * 100).toFixed(1) + '%"></i></span><span class="num">' + Math.round(vPct * 100) + '%が本物のお金に</span></div>' +
      '<button type="button" class="btn block" style="margin-top:12px" data-act="open-transfer">' + ic("bank", "sm") + "週ごとの入金を記録する</button></div>";

    h += '<div class="sec-title"><span>毎日の我慢額</span><span class="seg" role="group" aria-label="期間">' + [7, 30, 90].map((n) => '<button type="button" data-act="range" data-n="' + n + '" aria-pressed="' + (statRange === n) + '">' + n + "日</button>").join("") + "</span></div>" +
      '<div class="card"><div class="chart-wrap"><canvas class="chart" id="chart-bars" height="180" role="img" aria-label="毎日の我慢額の棒グラフ"></canvas></div></div>';
    h += '<div class="sec-title"><span>貯金の伸び（累計）</span></div><div class="card"><canvas class="chart" id="chart-line" height="170" role="img" aria-label="累計の折れ線グラフ"></canvas></div>';
    h += '<div class="sec-title"><span>グループごとの内訳</span></div><div class="card"><div class="donut-row"><canvas id="chart-donut" width="132" height="132" role="img" aria-label="グループごとの割合"></canvas><div class="grow legend" id="legend"></div></div></div>';

    // 時間帯
    h += '<div class="sec-title"><span>記録</span><button type="button" class="link" data-act="report">今週のレポート</button></div><div class="card">' + historyHTML(t.vm) + "</div>";
    if (t.slips) h += '<p class="foot">「使っちゃった」と正直に記録できた回数：' + t.slips + "回。気づけたこと自体が前進です。</p>";
    el.innerHTML = h;
    requestAnimationFrame(() => { drawBars(); drawLine(); drawDonut(); });
  }
  function historyHTML(vm) {
    const recs = state.records.slice().sort((a, b) => b.t - a.t).slice(0, 60);
    if (!recs.length) return '<div class="small muted">まだ記録がありません。ホームで「我慢した」項目をタップしてみましょう。</div>';
    let h = "", lastDay = "";
    h += '<div class="small faint" style="margin-bottom:4px">✅ 実際に移した分　△ まだ移していない分　💪 スクワットで証明</div>';
    recs.forEach((r) => {
      const day = dkey(r.t);
      if (day !== lastDay) { if (lastDay) h += "</ul>"; h += '<div class="h-day">' + mdwLabel(r.t) + '</div><ul class="hist">'; lastDay = day; }
      const it = r.type === "timer" ? { emoji: "⏱️", name: "" } : { emoji: recEmoji(r), name: recLabel(r) };
      let name = esc(it.name), amt = "", mark = "";
      if (r.type === "save") { amt = "+" + yen(r.amount); mark = (r.proof === "squat" ? '<span class="mark ok" title="スクワットで証明">💪</span>' : "") + (r.amount > 0 ? (vm[r.id] ? '<span class="mark ok">✅</span>' : '<span class="mark tri">△</span>') : ""); if (!r.amount && r.minutes) amt = "+" + minLabel(r.minutes); if (r.src === "wish") name += '<span class="item-tag">欲しい→やめた</span>'; }
      else if (r.type === "timer") { name = "スマホ断ちタイマー"; amt = "+" + minLabel(r.minutes); mark = '<span class="mark ok">✅</span>'; }
      else if (r.type === "slip") { name = esc(it.name) + "（使っちゃった）"; amt = '<span class="faint">' + yen(r.amount || 0) + "</span>"; }
      h += '<li><span class="h-emoji" aria-hidden="true">' + esc(r.type === "timer" ? "⏱️" : it.emoji) + '</span><div class="h-main"><div class="h-name">' + name + '</div><div class="h-time">' + hm(r.t) + (r.trigger ? "・きっかけ：" + esc(r.trigger) : "") + '</div></div><div class="h-amt num">' + amt + mark + '</div><button type="button" class="item-more" style="position:static" data-act="del-record" data-id="' + r.id + '" aria-label="この記録を削除">' + ic("x", "xs") + "</button></li>";
    });
    return h + "</ul>";
  }

  // ---------- goals ----------
  function ringSVG(pct, done) {
    const r = 36, c = 2 * Math.PI * r;
    return '<svg viewBox="0 0 84 84" aria-hidden="true"><circle class="r-bg" cx="42" cy="42" r="' + r + '" fill="none" stroke-width="8"/><circle class="r-fg" cx="42" cy="42" r="' + r + '" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - clamp(pct, 0, 1))).toFixed(2) + '"/></svg>';
  }
  function etaLabel(d) {
    if (d === 0) return "達成！";
    if (d == null) return "記録が増えると到達日の目安が出ます";
    const dt = new Date(addDays(startOfDay(now()), d));
    return "このペースなら " + (d > 730 ? "約" + Math.round(d / 365) + "年後" : dt.getFullYear() + "年" + (dt.getMonth() + 1) + "月" + dt.getDate() + "日ごろ（あと" + d + "日）") + "に達成";
  }
  function renderGoals() {
    const el = $("#view-goals");
    const act = activeGoals(), done = state.goals.filter((g) => g.done);
    const sumPct = sum(act, (g) => g.pct || 0);
    let h = '<div class="between"><h1 class="h-title">目標</h1><button type="button" class="btn sm primary" data-act="add-goal">' + ic("plus", "sm") + "目標を追加</button></div>";
    h += '<div class="small muted" style="margin:-6px 2px 12px">' + (state.settings.goalBase === "verified" ? "実際に移した額" : "我慢した合計") + "を、目標ごとの割合で振り分けています（使える額 " + yen(goalPool()) + "）。</div>";
    if (!act.length && !done.length) {
      h += '<div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:40px">🎯</div><b>貯まったお金で、何をしますか？</b><p class="small muted">旅行、欲しかったもの、もしもの備え。目標があると我慢が「投資」に変わります。</p><button type="button" class="btn primary" data-act="add-goal">' + ic("plus", "sm") + "最初の目標をつくる</button></div>";
    }
    act.forEach((g) => {
      const p = goalProgress(g);
      const reached = p.pct >= 1;
      h += '<div class="card goal-card" data-goal="' + g.id + '"><div class="goal"><div class="ring' + (reached ? " done" : "") + '">' + ringSVG(p.pct, reached) + '<div class="ring-c">' + esc(g.emoji) + '</div><span class="ring-pct num">' + Math.floor(p.pct * 100) + '%</span></div><div class="grow"><div class="goal-name">' + esc(g.name) + '</div><div class="goal-amt num">' + yen(p.cur) + " / " + yen(g.amount) + '</div><div class="small faint">割り当て ' + (g.pct || 0) + '%</div><div class="goal-eta">' + etaLabel(p.etaDays) + "</div></div></div>" +
        '<div class="goal-actions">' + (reached ? '<button type="button" class="btn sm gold" data-act="goal-complete" data-id="' + g.id + '">' + ic("check", "sm") + "達成として完了にする</button>" : "") + '<button type="button" class="btn sm" data-act="edit-goal" data-id="' + g.id + '">' + ic("edit", "sm") + "編集</button></div></div>";
    });
    if (act.length) {
      h += '<button type="button" class="btn block" style="margin-top:12px" data-act="alloc">割り当てを調整（合計 ' + sumPct + "%）</button>";
      if (sumPct < 100) h += '<p class="small muted" style="margin:8px 4px">残り ' + (100 - sumPct) + "% はどの目標にも振り分けていない貯金です。</p>";
    }
    if (done.length) {
      h += '<div class="sec-title"><span>達成した目標</span></div><div class="card">' + done.map((g) => '<div class="plan"><div style="font-size:24px">' + esc(g.emoji) + '</div><div class="grow"><b>' + esc(g.name) + '</b><div class="small muted num">' + yen(g.amount) + "・" + (g.doneAt ? mdwLabel(g.doneAt) : "") + "</div></div><span class=\"mark ok\">達成</span></div>").join("") + "</div>";
    }
    h += '<div class="note">' + ic("bulb", "xs") + " 目標の進み方は設定で「我慢した合計」か「実際に移した額」から選べます。</div>";
    el.innerHTML = h;
  }

  // ---------- growth ----------
  function renderGrowth() {
    const el = $("#view-growth");
    const x = xpInfo(), s = streakInfo(), t = totals();
    const dark = document.documentElement.dataset.theme === "dark";
    const fs = GCArt.forestStage(t.total);
    const trees = forestTrees(t.total);
    const allTrees = Math.floor(t.total / GCArt.YEN_PER_TREE);
    const animals = ANIMALS.filter(([lv]) => x.lv >= lv).map(([, e]) => e);
    let h = '<h1 class="h-title">森</h1>';
    h += '<section class="card forest-card" aria-label="我慢の森"><div class="forest-wrap">' + GCArt.forestSvg({ total: t.total, trees, animals, dark, char: state.selectedChar, level: x.lv, label: "我慢の森。木" + allTrees + "本、シンボルツリーは" + fs.name }) + "</div>" +
      '<div class="forest-info"><div class="between"><div><div class="small muted">シンボルツリー</div><b style="font-size:18px">🌳 ' + fs.name + '</b></div><div style="text-align:right"><div class="small muted">森の木</div><b class="num" style="font-size:18px">' + fmt(allTrees) + "本</b></div></div>" +
      (fs.next ? '<div class="xpbar" style="margin-top:8px"><i style="width:' + (((t.total - fs.from) / (fs.next - fs.from)) * 100).toFixed(1) + '%"></i></div><div class="small muted num" style="margin-top:4px">あと ' + yen(fs.next - t.total) + " で「" + fs.nextName + "」に成長</div>" : '<div class="small" style="margin-top:6px;color:var(--gold)">最高の「世界樹」まで育ちました</div>') +
      '<div class="small faint" style="margin-top:6px">我慢した' + yen(GCArt.YEN_PER_TREE) + "ごとに1本。木の種類は我慢したグループで変わります" + (allTrees > GCArt.MAX_TREES ? "（" + fmt(allTrees - GCArt.MAX_TREES) + "本は森の奥に）" : "") + "。</div></div></section>";
    // キャラクター（なかま）とレベル
    const me = GCArt.charById(state.selectedChar);
    h += '<div class="card level-card char-card"><div class="char-big">' + GCArt.charSvg(me.id, x.lv, { size: 92 }) + '</div><div class="grow"><div class="small muted">' + esc(me.name) + "・" + GCArt.stageName(x.lv) + '</div><div class="row" style="gap:8px;align-items:baseline"><b class="num" style="font-size:26px">Lv.' + x.lv + '</b><span style="font-weight:700">' + esc(x.title) + '</span></div><div class="xpbar"><i style="width:' + (x.pct * 100).toFixed(1) + '%"></i></div><div class="small muted num" style="margin-top:4px">' + (x.lv >= 50 ? "最高レベル" : fmt(x.xp) + " / " + fmt(x.next) + " XP") + "</div></div></div>";
    h += '<div class="note">XPは<b>実際に移した我慢額</b>が満額（10円=1XP）、まだ移していない分は3割、タイマー1分=1XP、ミッション、スクワット証明（+' + SQUAT_XP + "）、欲しいもの我慢（+" + WISH_XP + "）、ゲーム（1日" + GAME_XP_CAP + "まで）で増えます。プレミアムでも強さは買えません。</div>";
    h += '<div class="sec-title"><span>なかま</span><span class="small faint num">' + unlockedChars().length + " / " + GCArt.CHARACTERS.length + '</span></div><div class="chars">' +
      GCArt.CHARACTERS.map((c) => { const ok = charUnlocked(c.id), sel = c.id === state.selectedChar; return '<button type="button" class="char' + (sel ? " sel" : "") + (ok ? "" : " locked") + '" data-act="char" data-id="' + c.id + '" aria-pressed="' + sel + '"' + (ok ? "" : ' aria-disabled="true"') + ">" + GCArt.charSvg(c.id, ok ? x.lv : 1, { size: 54, locked: !ok }) + '<span class="c-n">' + (ok ? esc(c.name) : "？？？") + '</span><span class="c-s">' + (ok ? (sel ? "いっしょにいる" : esc(c.desc)) : "🔒 " + esc(c.how)) + "</span></button>"; }).join("") + "</div>";
    h += '<div class="sec-title"><span>レベルによるゲームの有利</span><button type="button" class="link" data-act="go-games">ゲームへ</button></div><div class="card small adv-list">' +
      ["climb", "chess", "arena", "memory", "breakout", "mole", "runner", "coin"].map((id) => '<div class="adv-row"><span>' + gameById(id).e + " " + gameById(id).n + "</span><span>" + advText(id) + "</span></div>").join("") + '<div class="small faint" style="margin-top:6px">ほかのゲームもヒント・待ったなどが増えます。最大はLv.50。</div></div>';
    // streak
    const today = startOfDay(now()), ws = weekStart(today), days = activeDays();
    h += '<div class="sec-title"><span>連続記録</span><span class="small faint">1日1回でOK</span></div><div class="card"><div><span style="font-size:30px;font-weight:700" class="num">' + s.count + '</span> 日つづいています</div><div class="small ' + (s.ticketLeft ? "" : "faint") + '" id="ticket" style="margin-top:2px">🎫 おやすみチケット：' + (s.ticketLeft ? "今週あと1枚" : "今週は使用済み") + "</div>" +
      '<div class="streak-week">' + [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addDays(ws, i), k = dkey(d); const on = days.has(k), rest = s.restDays.has(k); return '<div class="sday">' + WD[new Date(d).getDay()] + '<i class="' + (on ? "on" : rest ? "rest" : "") + (d === today ? " today" : "") + '">' + (on ? "✓" : rest ? "🎫" : new Date(d).getDate()) + "</i></div>"; }).join("") + "</div>" +
      '<p class="small muted" style="margin:10px 0 0">記録できない日があっても、週に1回はチケットが自動で使われて連続がつながります。</p></div>';
    h += missionsCard();
    h += '<div class="sec-title"><span>週のレポート</span></div><div class="card"><div class="between"><div><b>今週の成績カード</b><div class="small muted">画像にして保存・シェアできます</div></div><button type="button" class="btn sm primary" data-act="report">' + ic("share", "sm") + "作る</button></div></div>";
    const unlocked = BADGES.filter((b) => state.badges[b.id]).length;
    h += '<div class="sec-title"><span>バッジ</span><span class="small faint num">' + unlocked + " / " + BADGES.length + '</span></div><div class="badges">' +
      BADGES.map((b) => '<div class="badge' + (state.badges[b.id] ? "" : " locked") + '" title="' + esc(b.n) + '"><div class="b-em">' + b.e + '</div><div class="b-n">' + esc(b.n) + "</div></div>").join("") + "</div>";
    el.innerHTML = h;
  }

  // ---------- settings ----------
  function sw(id, on, label) { return '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + ' aria-label="' + label + '"><span></span></label>'; }
  function renderSettings() {
    const el = $("#view-settings");
    const st = state.settings;
    let h = '<h1 class="h-title">設定</h1>';
    h += '<button type="button" class="card premium-hero" style="display:block;width:100%;border:1px solid var(--line);margin-bottom:6px;cursor:pointer;color:inherit" data-act="premium"><div class="soon">近日公開</div><h2 style="margin:8px 0 2px;font-size:19px">我慢貯金 プレミアム</h2><div class="small muted">くわしい分析・テーマ・バックアップ。強さではなく便利さを。</div></button>';
    h += '<div class="sec-title"><span>項目</span></div><div class="list">' +
      '<button type="button" class="li" data-act="open-items"><span class="li-ico">🧾</span><span class="li-t">いつもの項目と金額<span class="li-s">' + activeItems().length + "件・金額・グループ・1日の上限を編集</span></span>" + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="open-plans"><span class="li-ico">' + ic("bulb", "sm") + '</span><span class="li-t">「もし〜なら」作戦<span class="li-s">' + state.plans.length + "件</span></span>" + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="open-transfer"><span class="li-ico">' + ic("bank", "sm") + '</span><span class="li-t">実際の入金の記録</span>' + ic("chev", "sm chev") + "</button>" +
      '<label class="li"><span class="li-ico">' + ic("clock", "sm") + '</span><span class="li-t">時間の価値（時給換算）<span class="li-s">取り戻した時間をお金に換算する目安</span></span><span class="input-yen" style="width:120px"><input class="input" id="set-hourly" inputmode="numeric" value="' + st.hourly + '" aria-label="時給"></span></label>' +
      (state.adult ? '<label class="li"><span class="li-ico">🚬</span><span class="li-t">タバコ1箱の値段<span class="li-s">1本あたり 約' + yen(tobaccoPer()) + '（' + (st.tobaccoPer || 20) + '本入り）</span></span><span class="input-yen" style="width:110px"><input class="input" id="set-tbox" inputmode="numeric" value="' + (st.tobaccoBox || 600) + '" aria-label="タバコ1箱の値段"></span></label>' +
        '<label class="li"><span class="li-ico">🚬</span><span class="li-t">1箱の本数</span><input class="input" id="set-tper" type="number" min="1" max="40" inputmode="numeric" style="width:80px" value="' + (st.tobaccoPer || 20) + '" aria-label="1箱の本数"></label>' : "") +
      '<div class="li"><span class="li-ico">' + ic("target", "sm") + '</span><span class="li-t">目標の進み方</span><span class="seg" role="group"><button type="button" data-act="goalbase" data-v="saved" aria-pressed="' + (st.goalBase === "saved") + '">我慢した合計</button><button type="button" data-act="goalbase" data-v="verified" aria-pressed="' + (st.goalBase === "verified") + '">移した額</button></span></div>' +
      "</div>";
    h += '<div class="sec-title"><span>見た目と演出</span></div><div class="list">' +
      '<div class="li"><span class="li-ico">' + ic("palette", "sm") + '</span><span class="li-t">テーマ</span><span class="seg" role="group" aria-label="テーマ">' + [["system", "自動"], ["light", "ライト"], ["dark", "ダーク"]].map(([v, n]) => '<button type="button" data-act="theme" data-v="' + v + '" aria-pressed="' + (st.theme === v) + '">' + n + "</button>").join("") + "</span></div>" +
      '<div class="li"><span class="li-ico">' + ic("spark", "sm") + '</span><span class="li-t">アクセントカラー</span><span class="swatches">' +
      [["teal", "#1F5C55", "深緑"], ["navy", "#27406B", "紺"], ["terracotta", "#9C4A32", "テラコッタ"]].map(([v, c, n]) => '<button type="button" class="swatch" style="background:' + c + '" data-act="accent" data-v="' + v + '" aria-pressed="' + (st.accent === v) + '" aria-label="' + n + '"></button>').join("") +
      '<button type="button" class="swatch locked" style="background:linear-gradient(135deg,#C9A35C,#2B2B2B)" data-act="premium" aria-label="プレミアムテーマ（近日公開）"></button></span></div>' +
      '<label class="li"><span class="li-ico">' + ic("sound", "sm") + '</span><span class="li-t">効果音</span>' + sw("set-sound", st.sound, "効果音") + "</label>" +
      '<label class="li"><span class="li-ico">' + ic("vib", "sm") + '</span><span class="li-t">バイブレーション<span class="li-s">対応している端末のみ（iPhoneのSafariは非対応）</span></span>' + sw("set-haptic", st.haptic, "バイブレーション") + "</label>" +
      "</div>";
    h += '<div class="sec-title"><span>データ</span></div><div class="list">' +
      '<button type="button" class="li" data-act="export"><span class="li-ico">' + ic("download", "sm") + '</span><span class="li-t">バックアップを書き出す<span class="li-s">JSONファイルとして保存</span></span>' + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="import"><span class="li-ico">' + ic("upload", "sm") + '</span><span class="li-t">バックアップを読み込む</span>' + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="reset"><span class="li-ico" style="color:var(--danger);background:color-mix(in srgb,var(--danger) 12%,transparent)">' + ic("trash", "sm") + '</span><span class="li-t" style="color:var(--danger)">すべてのデータを消す</span></button>' +
      "</div><input type=\"file\" id=\"import-file\" accept=\"application/json,.json\" hidden>";
    h += '<div class="sec-title"><span>このアプリについて</span></div><div class="list">' +
      '<div class="li"><span class="li-ico">' + ic("shield", "sm") + '</span><span class="li-t">プライバシー<span class="li-s">記録はすべてこの端末の中だけに保存され、外部に送信されません。ログインも広告もありません。スクワットの動きのセンサーも端末の中だけで使います。</span></span></div>' +
      '<a class="li" href="./legal.html" style="color:inherit;text-decoration:none"><span class="li-ico">' + ic("doc", "sm") + '</span><span class="li-t">利用規約・プライバシーポリシー</span>' + ic("chev", "sm chev") + "</a>" +
      '<button type="button" class="li" data-act="age"><span class="li-ico">🔞</span><span class="li-t">年齢の設定<span class="li-s">' + (state.adult ? "20歳以上（タバコ・お酒の項目を表示）" : "20歳未満（タバコ・お酒の項目は非表示）") + "</span></span>" + ic("chev", "sm chev") + "</button>" +
      "</div>";
    h += '<p class="foot">我慢貯金 v' + VERSION + '<br>表示される金額は、あなたの記録にもとづく目安です。<br>投資・金融・健康に関するアドバイスではありません。</p>';
    el.innerHTML = h;
  }
  // ---------- toast ----------
  function toast(msg, opt = {}) {
    const root = $("#toast-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="t-msg">' + msg + "</span>" + (opt.action ? '<button type="button">' + esc(opt.action) + "</button>" : "");
    if (opt.action) el.classList.add("has-action");
    root.appendChild(el);
    // 「取り消す」付きのトーストは押し出さない
    while (root.children.length > 3) { const victim = Array.from(root.children).find((c) => !c.classList.contains("has-action") && c !== el) || root.firstChild; victim.remove(); }
    let done = false;
    const close = () => { if (done) return; done = true; el.classList.add("out"); setTimeout(() => el.remove(), 260); };
    if (opt.action) el.querySelector("button").addEventListener("click", () => { close(); opt.onAction && opt.onAction(); });
    setTimeout(close, opt.duration || 3200);
    return { close, el };
  }

  // ---------- sheets ----------
  let sheetStack = null;
  function openSheet(html, opt = {}) {
    closeSheet(true);
    const root = $("#sheet-root");
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const sh = document.createElement("div");
    sh.className = "sheet";
    sh.setAttribute("role", "dialog");
    sh.setAttribute("aria-modal", "true");
    if (opt.label) sh.setAttribute("aria-label", opt.label);
    sh.innerHTML = '<div class="grabber" aria-hidden="true"></div><button type="button" class="sheet-close" data-close aria-label="とじる">' + ic("x", "sm") + "</button>" + html;
    root.append(scrim, sh);
    const prevFocus = document.activeElement;
    requestAnimationFrame(() => { scrim.classList.add("show"); sh.classList.add("show"); });
    scrim.addEventListener("click", () => closeSheet());
    sh.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
    sheetStack = { scrim, sh, opt, prevFocus };
    if (opt.mount) opt.mount(sh);
    setTimeout(() => { const f = sh.querySelector("[autofocus]") || sh.querySelector(".sheet-close"); f && f.focus({ preventScroll: true }); }, 60);
    return sh;
  }
  function closeSheet(instant) {
    const s = sheetStack;
    if (!s) return;
    sheetStack = null;
    s.opt.onClose && s.opt.onClose();
    if (instant) { s.scrim.remove(); s.sh.remove(); return; }
    s.scrim.classList.remove("show"); s.sh.classList.remove("show");
    setTimeout(() => { s.scrim.remove(); s.sh.remove(); }, 320);
    if (s.prevFocus && s.prevFocus.focus && document.contains(s.prevFocus)) s.prevFocus.focus({ preventScroll: true });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetStack) closeSheet(); });

  // ---------- sound / haptic ----------
  let actx = null;
  function sound(kind) {
    if (!state.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t0 = actx.currentTime;
      const notes = kind === "fanfare" ? [[784, 0, 0.18], [988, 0.12, 0.18], [1175, 0.24, 0.2], [1568, 0.38, 0.5]] : kind === "soft" ? [[660, 0, 0.18]] : [[1568, 0, 0.09], [2093, 0.07, 0.32]];
      notes.forEach(([f, d, len]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + d);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + d + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + len);
        o.connect(g); g.connect(actx.destination);
        o.start(t0 + d); o.stop(t0 + d + len + 0.02);
      });
    } catch (e) { /* 音が出せない環境では何もしない */ }
  }
  function haptic(p) { if (state.settings.haptic && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.isActive)) { try { navigator.vibrate(p || 12); } catch (e) {} } }

  // ---------- FX ----------
  function coinFly(fromEl, amount) {
    const jar = $("#jar");
    const fx = $("#fx-root");
    if (!fromEl) return;
    const a = fromEl.getBoundingClientRect();
    const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    const fl = document.createElement("div");
    fl.className = "float-amt num"; fl.textContent = "+" + yen(amount);
    fl.style.left = sx + "px"; fl.style.top = (a.top + 6) + "px";
    fx.appendChild(fl); setTimeout(() => fl.remove(), 1100);
    if (!jar || reduceMotion()) { jar && bumpJar(); return; }
    const b = jar.getBoundingClientRect();
    const ex = b.left + b.width / 2, ey = b.top + b.height * 0.35;
    const n = amount >= 3000 ? 4 : amount >= 1000 ? 3 : amount >= 400 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "coin"; c.textContent = "¥";
      c.style.left = sx + "px"; c.style.top = sy + "px";
      fx.appendChild(c);
      const dx = ex - sx, dy = ey - sy;
      const anim = c.animate([
        { transform: "translate(0,0) scale(.6)", opacity: 0 },
        { transform: "translate(" + (dx * 0.35 + (i - 1) * 14) + "px," + (dy * 0.35 - 70) + "px) scale(1.05)", opacity: 1, offset: 0.35 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(.55)", opacity: 1, offset: 0.92 },
        { transform: "translate(" + dx + "px," + (dy + 8) + "px) scale(.4)", opacity: 0 },
      ], { duration: 720, delay: i * 90, easing: "cubic-bezier(.35,.0,.25,1)" });
      anim.onfinish = () => { c.remove(); if (i === n - 1) bumpJar(); };
    }
  }
  function bumpJar() { const j = $("#jar"); if (!j) return; j.classList.remove("bump"); void j.getBoundingClientRect(); j.classList.add("bump"); }
  function rollTo(from, to) {
    const el = $("#hero-num");
    if (!el) return;
    if (reduceMotion() || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 700;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function confetti() {
    if (reduceMotion()) return;
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const cols = ["#E0B65A", "#1F5C55", "#74C3B3", "#E59A7F", "#F3CF74", "#8FB0E8"];
    const ps = Array.from({ length: 110 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 11 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    const step = (t) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => { p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (t - t0 < 2400) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  }

  // ---------- after change: missions / badges / level / goals ----------
  function badgeCtx() { return { t: totals(), s: streakInfo() }; }
  function afterChange(opt = {}) {
    const k = dkey(now());
    // ミッション
    const ms = missionStatus();
    let claims = state.missionDone[k] || [];
    const newly = [];
    ms.forEach((m) => {
      const has = claims.some((x) => x.id === m.id);
      if (m.complete && !has) { claims.push({ id: m.id, xp: m.xp }); newly.push(m); }
      if (!m.complete && has) claims = claims.filter((x) => x.id !== m.id);
    });
    const allDone = ms.every((m) => m.complete);
    const hasAll = claims.some((x) => x.id === "all");
    if (allDone && !hasAll) claims.push({ id: "all", xp: 30 });
    if (!allDone && hasAll) claims = claims.filter((x) => x.id !== "all");
    state.missionDone[k] = claims;
    Object.keys(state.missionDone).forEach((x) => { if (!state.missionDone[x].length) delete state.missionDone[x]; });
    // バッジ
    const ctx = badgeCtx();
    const newBadges = BADGES.filter((b) => !state.badges[b.id] && b.ok(ctx));
    newBadges.forEach((b) => { state.badges[b.id] = now(); });
    // 目標
    const reached = [];
    activeGoals().forEach((g) => { if (!g.reachedAt && goalProgress(g).pct >= 1) { g.reachedAt = now(); reached.push(g); } });
    // レベル
    const x = xpInfo();
    const lvUp = state.lastLv && x.lv > state.lastLv;
    state.lastLv = x.lv;
    const newChars = unlockedChars().filter((c) => !state.seenChars.includes(c.id));
    newChars.forEach((c) => state.seenChars.push(c.id));
    save();

    renderTop();
    if (!opt.silent || newly.length) {
      if (curTab === "home" && opt.homePartial) refreshHomeBits();
      else if (!opt.noRender) renderView(curTab);
    }
    let delay = opt.toastDelay || 0;
    newly.forEach((m) => { setTimeout(() => toast("✓ ミッション達成「" + esc(m.t) + "」 +" + m.xp + "XP"), delay); delay += 400; });
    if (allDone && !hasAll) setTimeout(() => toast("🎉 今日のミッションをすべて達成！ +30XP"), delay += 400);
    if (newBadges.length > 2) { setTimeout(() => toast("🏅 バッジを" + newBadges.length + "個獲得しました（実績で確認できます）"), delay); delay += 500; }
    else newBadges.forEach((b) => { setTimeout(() => toast(b.e + " バッジ獲得「" + esc(b.n) + "」"), delay); delay += 500; });
    if (lvUp) setTimeout(() => { toast("⬆️ レベルアップ！ Lv." + x.lv + "「" + esc(x.title) + "」"); sound("fanfare"); }, delay += 300);
    newChars.forEach((c) => { setTimeout(() => toast("🎉 新しいなかま「" + esc(c.name) + "」が森に来ました"), delay); delay += 500; });
    if (reached.length) setTimeout(() => celebrateGoal(reached[0]), clamp(delay, 900, 1600));
  }
  function refreshHomeBits() {
    // ホームの数字だけ更新（アニメーションを保つ）
    const t = totals();
    const keep = shownTotal;
    renderHome();
    shownTotal = keep;
    const el = $("#hero-num"); if (el) el.textContent = fmt(keep);
    return t;
  }

  // ---------- tap ----------
  let lastUndo = null;
  function tapItem(id, srcEl) {
    const it = itemById(id);
    if (!it) return;
    if (!it.price && it.minutes) { openTimerSheet(it); return; }
    const hadFocus = srcEl && document.activeElement === srcEl;
    const r = addSave({ group: guessGroup(it), amount: it.price, label: null, itemId: it.id, minutes: it.minutes || 0, src: "item", srcEl });
    if (!r) return;
    const nItem = $('.item[data-item="' + it.id + '"]');
    if (nItem) { ripple(nItem); if (hadFocus) nItem.querySelector(".item-hit").focus({ preventScroll: true }); }
  }
  function ripple(item) {
    const rp = document.createElement("span");
    rp.className = "ripple"; const s = item.offsetWidth;
    rp.style.width = rp.style.height = s + "px"; rp.style.left = "0px"; rp.style.top = (item.offsetHeight / 2 - s / 2) + "px";
    item.appendChild(rp); setTimeout(() => rp.remove(), 650);
  }
  function undoRecord(id) {
    const r = state.records.find((x) => x.id === id);
    if (!r) return;
    const before = totals().total;
    state.records = state.records.filter((x) => x.id !== id);
    const ctx = badgeCtx();
    BADGES.forEach((b) => { if (state.badges[b.id] && now() - state.badges[b.id] < 20000 && !b.ok(ctx)) delete state.badges[b.id]; });
    activeGoals().forEach((g) => { if (g.reachedAt && now() - g.reachedAt < 20000 && goalProgress(g).pct < 1) delete g.reachedAt; });
    save();
    shownTotal = before;
    afterChange({ homePartial: curTab === "home" });
    if (curTab === "home") { rollTo(before, totals().total); shownTotal = totals().total; }
    toast("取り消しました");
  }

  // ---------- items ----------
  function itemFormHTML(it) {
    const isNew = !it;
    it = it || { emoji: "💸", name: "", price: 500, minutes: 0, cap: 3, adult: false };
    return '<h2>' + (isNew ? "いつもの項目を固定" : "項目を編集") + "</h2>" +
      (isNew ? '<div class="field"><span>よくある項目から</span><div class="chips">' + PRESETS.filter((p) => (!p.adult || state.adult) && !state.items.some((i) => i.pid === p.pid && !i.archived)).map((p) => '<button type="button" class="chip" data-preset="' + p.pid + '">' + p.emoji + " " + esc(p.name) + "</button>").join("") + "</div></div>" : "") +
      '<div class="field"><span>アイコン</span><div class="emoji-pick" id="f-emoji">' + EMOJIS.map((e) => '<button type="button" data-e="' + e + '" aria-pressed="' + (e === it.emoji) + '" aria-label="' + e + '">' + e + "</button>").join("") + "</div></div>" +
      '<label class="field"><span>名前</span><input class="input" id="f-name" maxlength="24" value="' + esc(it.name) + '" placeholder="例：コンビニスイーツ"></label>' +
      '<div class="row" style="gap:10px"><label class="field grow"><span>1回あたりの金額</span><span class="input-yen"><input class="input" id="f-price" inputmode="numeric" value="' + it.price + '"></span></label>' +
      '<label class="field" style="width:120px"><span>時間（任意）</span><span class="input-yen input-min"><input class="input" id="f-min" inputmode="numeric" value="' + (it.minutes || 0) + '"></span></label></div>' +
      '<div class="field"><span>グループ（グラフと森の木の種類に使います）</span><div class="chips" id="f-group">' + visibleGroups().map((g) => '<button type="button" class="chip" data-ig="' + g.id + '" aria-pressed="' + (g.id === (it.group || guessGroup(it))) + '">' + g.e + " " + g.s + "</button>").join("") + "</div></div>" +
      '<label class="field"><span>1日に記録できる上限（連打防止）</span><input class="input" id="f-cap" type="number" min="1" max="20" inputmode="numeric" value="' + (it.cap || 3) + '"></label>' +
      (state.adult ? '<label class="li" style="padding:12px 0"><span class="li-t">20歳以上向けの項目（タバコ・お酒など）</span>' + sw("f-adult", it.adult, "20歳以上向け") + "</label>" : "") +
      '<div class="err" id="f-err"></div>' +
      '<div class="note">「いつもの」に固定した項目は、ホームで1タップで記録できます。金額0円・時間ありの項目（スマホなど）は、タイマー挑戦になります。</div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="f-save">保存する</button>' + (isNew ? "" : '<button type="button" class="btn danger block" id="f-del">' + ic("trash", "sm") + "この項目を削除</button>") + "</div>";
  }
  function openItemForm(id) {
    const it = id ? itemById(id) : null;
    let emoji = it ? it.emoji : "💸";
    let pid = it ? it.pid : null;
    let grp = it ? it.group || guessGroup(it) : "other";
    openSheet(itemFormHTML(it), {
      label: "項目の編集",
      mount: (sh) => {
        sh.addEventListener("click", (e) => {
          const eb = e.target.closest("[data-e]");
          if (eb) { emoji = eb.dataset.e; $$("[data-e]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === eb))); }
          const gb = e.target.closest("[data-ig]");
          if (gb) { grp = gb.dataset.ig; $$("[data-ig]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === gb))); }
          const pb = e.target.closest("[data-preset]");
          if (pb) {
            const p = PRESETS.find((x) => x.pid === pb.dataset.preset);
            pid = p.pid; emoji = p.emoji; if (p.group) { grp = p.group; $$("[data-ig]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ig === grp))); }
            $("#f-name", sh).value = p.name; $("#f-price", sh).value = p.price; $("#f-min", sh).value = p.minutes || 0; $("#f-cap", sh).value = p.cap;
            const ad = $("#f-adult", sh); if (ad) ad.checked = !!p.adult;
            $$("[data-e]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.e === emoji)));
            $$("[data-preset]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === pb)));
          }
        });
        $("#f-save", sh).addEventListener("click", () => {
          const name = $("#f-name", sh).value.trim();
          const price = toInt($("#f-price", sh).value);
          const minutes = toInt($("#f-min", sh).value);
          const cap = clamp(toInt($("#f-cap", sh).value) || 3, 1, 20);
          const ad = $("#f-adult", sh);
          if (!name) return ($("#f-err", sh).textContent = "名前を入力してください");
          if (price < 0 || price > 1000000) return ($("#f-err", sh).textContent = "金額は0〜1,000,000円で入力してください");
          if (!price && !minutes) return ($("#f-err", sh).textContent = "金額か時間のどちらかを入力してください");
          if (minutes > 600) return ($("#f-err", sh).textContent = "時間は600分までです");
          const data = { emoji, name, price, minutes, cap, adult: ad ? ad.checked : !!(it && it.adult), group: !price && minutes ? null : grp };
          if (it) Object.assign(it, data);
          else state.items.push(Object.assign({ id: uid(), pid }, data));
          save(); closeSheet(); renderAll();
          toast(it ? "保存しました" : "「" + esc(name) + "」を追加しました");
        });
        const del = $("#f-del", sh);
        if (del) del.addEventListener("click", () => {
          confirmSheet("「" + esc(it.name) + "」を削除しますか？", "これまでの記録と貯金額はそのまま残ります。", "削除する", () => { it.archived = true; save(); renderAll(); toast("削除しました"); });
        });
      },
    });
  }
  const toInt = (v) => { const n = parseInt(String(v).replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n; };
  function openItemsList() {
    const its = activeItems();
    openSheet('<h2>いつもの項目</h2><p class="small muted">よく我慢するものを固定しておくと、ホームで1タップで記録できます。よく使う組み合わせは自動でも表示されます。</p><div class="list" style="box-shadow:none">' +
      its.map((i) => '<button type="button" class="li" data-edit="' + i.id + '"><span class="li-ico" style="background:var(--surface2)">' + esc(i.emoji) + '</span><span class="li-t">' + esc(i.name) + (i.adult ? '<span class="item-tag">20+</span>' : "") + '<span class="li-s num">' + (i.price ? groupById(guessGroup(i)).e + " " + yen(i.price) : "") + (i.minutes ? (i.price ? "・" : "") + i.minutes + "分" : "") + "・1日" + (i.cap || 3) + "回まで</span></span>" + ic("chev", "sm chev") + "</button>").join("") +
      '</div><div class="actions"><button type="button" class="btn primary block" data-add>' + ic("plus", "sm") + "項目を追加</button></div>", {
      label: "項目一覧",
      mount: (sh) => sh.addEventListener("click", (e) => {
        const b = e.target.closest("[data-edit]"); if (b) openItemForm(b.dataset.edit);
        if (e.target.closest("[data-add]")) openItemForm(null);
      }),
    });
  }
  function itemMenu(id) {
    const it = itemById(id);
    if (!it) return;
    openSheet('<h2>' + esc(it.emoji) + " " + esc(it.name) + '</h2><p class="small muted num">' + (it.price ? yen(it.price) : "") + (it.minutes ? " ・ " + it.minutes + "分" : "") + "・今日 " + todayCount(it.id) + "/" + (it.cap || 3) + "回</p>" +
      '<div class="actions">' + (it.price ? '<button type="button" class="btn primary block" data-m="tap">' + ic("plus", "sm") + "我慢した（" + yen(it.price) + "）</button>" : "") +
      (it.minutes ? '<button type="button" class="btn block" data-m="timer">' + ic("timer", "sm") + "タイマーで挑戦する</button>" : "") +
      '<button type="button" class="btn block" data-m="slip">' + ic("refresh", "sm") + "使っちゃった…を記録</button>" +
      '<button type="button" class="btn block ghost" data-m="edit">' + ic("edit", "sm") + "金額・上限を編集</button></div>", {
      mount: (sh) => sh.addEventListener("click", (e) => {
        const b = e.target.closest("[data-m]"); if (!b) return;
        const m = b.dataset.m;
        if (m === "tap") { closeSheet(); setTimeout(() => tapItem(id, $('.item[data-item="' + id + '"] .item-hit')), 330); }
        if (m === "timer") openTimerSheet(it);
        if (m === "slip") openSlip(id);
        if (m === "edit") openItemForm(id);
      }),
    });
  }
  function confirmSheet(title, body, okLabel, onOk, danger = true) {
    openSheet("<h2>" + title + '</h2><p class="muted">' + body + '</p><div class="actions two"><button type="button" class="btn" data-close>やめる</button><button type="button" class="btn ' + (danger ? "danger solid" : "primary") + '" data-ok>' + esc(okLabel) + "</button></div>", {
      mount: (sh) => $("[data-ok]", sh).addEventListener("click", () => { closeSheet(); onOk(); }),
    });
  }

  // ---------- slip ----------
  function openSlip(preId) {
    const pre = preId ? itemById(preId) : null;
    let sel = pre ? guessGroup(pre) : null;
    let trig = null, act = null;
    openSheet('<h2>使っちゃった…を記録</h2><p class="small muted">責めるための記録ではありません。正直に残すほど、自分のパターンが見えてきます。貯金額は減りません。</p>' +
      '<div class="field"><span>なにに使った？</span><div class="chips" id="s-items">' + visibleGroups().map((g) => '<button type="button" class="chip" data-i="' + g.id + '" aria-pressed="' + (g.id === sel) + '">' + g.e + " " + g.s + "</button>").join("") + "</div>" +
      '<input class="input" id="s-label" style="margin-top:8px" maxlength="24" placeholder="なにを？（任意）" value="' + esc(pre ? pre.name : "") + '" autocomplete="off"></div>' +
      '<label class="field"><span>使った金額（任意）</span><span class="input-yen"><input class="input" id="s-amt" inputmode="numeric" value="' + (pre ? pre.price : "") + '"></span></label>' +
      '<div class="field"><span>きっかけは？（任意）</span><div class="chips" id="s-trig">' + TRIGGERS.map((t) => '<button type="button" class="chip" data-t="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>").join("") + "</div></div>" +
      '<div id="s-plan" hidden><div class="field"><span>次に同じ状況になったら、代わりに…</span><div class="chips">' + ACTIONS.map((a) => '<button type="button" class="chip" data-a="' + esc(a) + '" aria-pressed="false">' + esc(a) + "</button>").join("") + '</div><input class="input" id="s-act" style="margin-top:8px" maxlength="40" placeholder="自分で書く（例：コンビニの前を通らない道で帰る）"></div><p class="small muted">「もし〜なら、〜する」と決めておくと、同じ場面で迷いにくくなります。ホームに表示されます。</p></div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="s-save">記録する</button></div>', {
      label: "使っちゃった記録",
      mount: (sh) => {
        sh.addEventListener("click", (e) => {
          const ib = e.target.closest("[data-i]");
          if (ib) { sel = ib.dataset.i; $$("[data-i]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === ib))); }
          const tb = e.target.closest("[data-t]");
          if (tb) { trig = trig === tb.dataset.t ? null : tb.dataset.t; $$("[data-t]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === trig))); $("#s-plan", sh).hidden = !trig; }
          const ab = e.target.closest("[data-a]");
          if (ab) { act = act === ab.dataset.a ? null : ab.dataset.a; $$("[data-a]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.a === act))); if (act) $("#s-act", sh).value = ""; }
        });
        $("#s-save", sh).addEventListener("click", () => {
          const custom = $("#s-act", sh).value.trim();
          const action = custom || act;
          const label = $("#s-label", sh).value.trim();
          state.records.push({ id: uid(), t: now(), type: "slip", group: sel || "other", itemId: pre && guessGroup(pre) === sel ? pre.id : null, label: label || null, name: label || null, amount: Math.min(1000000, toInt($("#s-amt", sh).value)), trigger: trig || null });
          if (trig && action) state.plans.push({ id: uid(), trigger: trig, action, created: now(), active: true });
          save(); closeSheet(); afterChange();
          toast(trig && action ? "記録して、作戦をホームに置きました。次はきっと大丈夫。" : "記録しました。気づけたことが、次の我慢につながります。", { duration: 4000 });
        });
      },
    });
  }
  function openPlans() {
    setFlag("plan");
    const render = () => '<h2>「もし〜なら」作戦</h2><p class="small muted">きっかけと代わりの行動をセットで決めておく方法です。</p>' +
      (state.plans.length ? '<div class="card" style="box-shadow:none">' + state.plans.map((x) => '<div class="plan"><div class="grow"><div class="plan-if">もし「' + esc(x.trigger) + '」になったら</div><div class="plan-then">' + esc(x.action) + '</div></div><button type="button" class="item-more" style="position:static" data-delplan="' + x.id + '" aria-label="作戦を削除">' + ic("trash", "sm") + "</button></div>").join("") + "</div>" : '<p class="note">まだ作戦はありません。下から作るか、「使っちゃった」を記録するときに作れます。</p>') +
      '<div class="field"><span>きっかけ</span><div class="chips">' + TRIGGERS.map((t) => '<button type="button" class="chip" data-pt="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>").join("") + "</div></div>" +
      '<label class="field"><span>代わりにすること</span><input class="input" id="p-act" maxlength="40" placeholder="例：水を飲んで5分待つ" list="p-acts"></label><datalist id="p-acts">' + ACTIONS.map((a) => '<option value="' + esc(a) + '">').join("") + "</datalist>" +
      '<div class="err" id="p-err"></div><div class="actions"><button type="button" class="btn primary block" id="p-add">作戦を追加</button></div>';
    let trig = null;
    const sh = openSheet(render(), { label: "作戦" });
    const bind = () => {
      sh.onclick = (e) => {
        const t = e.target.closest("[data-pt]");
        if (t) { trig = t.dataset.pt; $$("[data-pt]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === t))); }
        const d = e.target.closest("[data-delplan]");
        if (d) { state.plans = state.plans.filter((x) => x.id !== d.dataset.delplan); save(); refresh(); }
        if (e.target.closest("#p-add")) {
          const a = $("#p-act", sh).value.trim();
          if (!trig || !a) { $("#p-err", sh).textContent = "きっかけと、代わりにすることを選んでください"; return; }
          state.plans.push({ id: uid(), trigger: trig, action: a, created: now(), active: true }); save(); afterChange({ noRender: true }); trig = null; refresh(); toast("作戦を追加しました");
        }
      };
    };
    const refresh = () => { const top = sh.scrollTop; sh.innerHTML = '<div class="grabber"></div><button type="button" class="sheet-close" data-close aria-label="とじる">' + ic("x", "sm") + "</button>" + render(); sh.scrollTop = top; bind(); renderView(curTab); };
    bind();
  }

  // ---------- transfers ----------
  function addTransfer(wk, amount) {
    if (!(amount > 0)) return;
    state.transfers.push({ id: uid(), t: now(), week: wk, amount: Math.round(amount) });
    delete state.dismiss["tr-" + wk];
    save();
  }
  function openTransfer() {
    const weeks = [];
    const ws0 = weekStart(now());
    for (let i = 0; i < 8; i++) { const s = weekSummary(dkey(addDays(ws0, -7 * i))); if (s.saved > 0 || s.moved > 0 || i < 2) weeks.push(s); }
    const render = () => '<h2>実際に移した額を記録</h2><p class="small muted">我慢した分を貯金口座・貯金箱に移したら記録しましょう。移した分の記録に ✅ がつき、レベルにも満額反映されます。</p>' +
      weeks.map((w) => { const s = weekSummary(w.wk); return '<div class="week-row"><div class="between"><b>' + mdLabel(s.ws) + "〜" + mdLabel(addDays(s.we, -1)) + (s.wk === wkey(now()) ? '<span class="soon" style="margin-left:6px">今週</span>' : "") + '</b><span class="small num">' + (s.remaining > 0 ? '<span class="mark tri">△ ' + yen(s.remaining) + " 未入金</span>" : s.saved > 0 ? '<span class="mark ok">✅ 入金済み</span>' : "") + '</span></div><div class="small muted num">我慢 ' + yen(s.saved) + " ／ 移した " + yen(s.moved) + '</div><div class="row" style="margin-top:8px"><span class="input-yen grow"><input class="input" data-amt="' + s.wk + '" inputmode="numeric" value="' + (s.remaining || "") + '" aria-label="移した金額"></span><button type="button" class="btn primary sm" data-tr="' + s.wk + '">移した</button></div></div>'; }).join("") +
      (state.transfers.length ? '<div class="sec-title"><span>入金の履歴</span></div><ul class="hist">' + state.transfers.slice().sort((a, b) => b.t - a.t).slice(0, 20).map((x) => '<li><span class="h-emoji">🏦</span><div class="h-main"><div class="h-name num">' + yen(x.amount) + '</div><div class="h-time">' + mdLabel(parseKey(x.week)) + "の週・" + mdwLabel(x.t) + '記録</div></div><button type="button" class="item-more" style="position:static" data-deltr="' + x.id + '" aria-label="この入金記録を削除">' + ic("x", "xs") + "</button></li>").join("") + "</ul>" : "") +
      '<p class="note">アプリはお金を動かしません。あなたが自分で移した金額を記録するだけです。</p>';
    const sh = openSheet(render(), { label: "入金の記録" });
    const refresh = () => { const top = sh.scrollTop; sh.innerHTML = '<div class="grabber"></div><button type="button" class="sheet-close" data-close aria-label="とじる">' + ic("x", "sm") + "</button>" + render(); sh.scrollTop = top; };
    sh.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tr]");
      if (b) {
        const v = toInt($('[data-amt="' + b.dataset.tr + '"]', sh).value);
        if (!v) { toast("金額を入力してください"); return; }
        if (v > 10000000) { toast("金額が大きすぎます"); return; }
        addTransfer(b.dataset.tr, v); sound("soft"); haptic(10); afterChange(); refresh(); toast("✅ " + yen(v) + " を移した記録をつけました");
      }
      const d = e.target.closest("[data-deltr]");
      if (d) { state.transfers = state.transfers.filter((x) => x.id !== d.dataset.deltr); save(); afterChange(); refresh(); toast("入金記録を削除しました"); }
    });
  }

  // ---------- goals ----------
  const GOAL_EMOJIS = ["✈️", "🏝️", "♨️", "🎧", "💻", "📷", "⌚", "👟", "🚲", "🏠", "🚗", "💍", "🎓", "🛟", "🎁", "🐶"];
  function openGoalForm(id) {
    const g = id ? state.goals.find((x) => x.id === id) : null;
    let emoji = g ? g.emoji : "✈️";
    openSheet("<h2>" + (g ? "目標を編集" : "目標を追加") + '</h2><div class="field"><span>アイコン</span><div class="emoji-pick">' + GOAL_EMOJIS.map((e) => '<button type="button" data-e="' + e + '" aria-pressed="' + (e === emoji) + '" aria-label="' + e + '">' + e + "</button>").join("") + "</div></div>" +
      '<label class="field"><span>目標の名前</span><input class="input" id="g-name" maxlength="24" value="' + esc(g ? g.name : "") + '" placeholder="例：沖縄旅行"></label>' +
      '<label class="field"><span>目標金額</span><span class="input-yen"><input class="input" id="g-amt" inputmode="numeric" value="' + (g ? g.amount : 50000) + '"></span></label>' +
      '<div class="err" id="g-err"></div><div class="actions"><button type="button" class="btn primary block" id="g-save">保存する</button>' + (g ? '<button type="button" class="btn danger block" id="g-del">' + ic("trash", "sm") + "この目標を削除</button>" : "") + "</div>", {
      label: "目標",
      mount: (sh) => {
        sh.addEventListener("click", (e) => { const eb = e.target.closest("[data-e]"); if (eb) { emoji = eb.dataset.e; $$("[data-e]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === eb))); } });
        $("#g-save", sh).addEventListener("click", () => {
          const name = $("#g-name", sh).value.trim(), amount = toInt($("#g-amt", sh).value);
          if (!name) return ($("#g-err", sh).textContent = "名前を入力してください");
          if (amount < 100 || amount > 100000000) return ($("#g-err", sh).textContent = "金額は100円以上で入力してください");
          if (g) { Object.assign(g, { name, amount, emoji }); if (goalProgress(g).pct < 1) delete g.reachedAt; }
          else { state.goals.push({ id: uid(), name, emoji, amount, pct: 0, created: now() }); evenAlloc(); }
          save(); closeSheet(); afterChange(); toast(g ? "保存しました" : "目標「" + esc(name) + "」をつくりました");
        });
        const del = $("#g-del", sh);
        if (del) del.addEventListener("click", () => confirmSheet("目標を削除しますか？", "貯金額は減りません。割り当てが他の目標に戻ります。", "削除する", () => { state.goals = state.goals.filter((x) => x.id !== g.id); evenAlloc(); save(); afterChange(); }));
      },
    });
  }
  function openAlloc() {
    const act = activeGoals();
    const vals = {}; act.forEach((g) => (vals[g.id] = g.pct || 0));
    const total = () => sum(Object.values(vals));
    openSheet('<h2>割り当てを調整</h2><p class="small muted">貯まったお金を、どの目標に何%ずつ振り分けるか決めます。合計100%まで。</p>' +
      act.map((g) => '<div class="alloc-row"><div><div style="font-weight:600">' + esc(g.emoji) + " " + esc(g.name) + '</div><input type="range" min="0" max="100" step="5" value="' + vals[g.id] + '" data-r="' + g.id + '" aria-label="' + esc(g.name) + 'の割合"></div><div style="text-align:right;font-weight:700" class="num" data-v="' + g.id + '">' + vals[g.id] + "%</div></div>").join("") +
      '<div class="between" style="margin-top:10px"><span class="muted">合計 <b class="num" id="a-total">' + total() + '%</b></span><button type="button" class="btn sm" id="a-even">均等にする</button></div><div class="err" id="a-err"></div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="a-save">保存する</button></div>', {
      label: "割り当て",
      mount: (sh) => {
        const upd = () => { $("#a-total", sh).textContent = total() + "%"; const over = total() > 100; $("#a-err", sh).textContent = over ? "合計が100%を超えています" : ""; $("#a-save", sh).disabled = over; act.forEach((g) => { $('[data-v="' + g.id + '"]', sh).textContent = vals[g.id] + "%"; $('[data-r="' + g.id + '"]', sh).value = vals[g.id]; }); };
        sh.addEventListener("input", (e) => { const r = e.target.closest("[data-r]"); if (r) { vals[r.dataset.r] = +r.value; upd(); } });
        $("#a-even", sh).addEventListener("click", () => { const each = Math.floor(100 / act.length); act.forEach((g, i) => (vals[g.id] = each + (i === 0 ? 100 - each * act.length : 0))); upd(); });
        $("#a-save", sh).addEventListener("click", () => { if (total() > 100) return; act.forEach((g) => (g.pct = vals[g.id])); save(); closeSheet(); afterChange(); toast("割り当てを保存しました"); });
      },
    });
  }
  function completeGoal(id) {
    const g = state.goals.find((x) => x.id === id);
    if (!g) return;
    confirmSheet(esc(g.emoji) + " 「" + esc(g.name) + "」を完了にしますか？", "目標金額 " + yen(g.amount) + " を使ったものとして、残りの貯金を他の目標に振り分けます。", "完了にする", () => {
      g.done = true; g.doneAt = now(); g.pct = 0; g.reachedAt = g.reachedAt || now(); evenAlloc(); save(); afterChange(); toast("おつかれさまでした！ 目標を完了にしました");
    }, false);
  }
  function celebrateGoal(g) {
    sound("fanfare"); haptic([20, 60, 20, 60, 40]); confetti();
    openSheet('<div class="celebrate"><div class="c-em">' + esc(g.emoji) + '</div><h2>目標達成！</h2><p class="muted">「' + esc(g.name) + "」の " + yen(g.amount) + " が貯まりました。小さな我慢の積み重ねです。</p>" +
      '<div class="actions"><button type="button" class="btn gold block" data-close>やったね</button><button type="button" class="btn block" id="c-goals">目標を見る</button></div></div>', {
      label: "目標達成", mount: (sh) => $("#c-goals", sh).addEventListener("click", () => { closeSheet(); go("goals"); }),
    });
  }

  // ---------- premium ----------
  function openPremium() {
    const feats = [
      ["chart", "くわしい分析", "曜日・時間帯ごとの傾向、月ごとの比較、CSV書き出し"],
      ["palette", "追加テーマ", "落ち着いたプレミアム配色と、ホーム画面のスタイル"],
      ["cloud", "クラウドバックアップ", "機種変更しても記録をそのまま引き継ぎ"],
      ["target", "目標を無制限に", "目標ごとの専用グラフと、達成記念カード"],
      ["doc", "月のレポート", "1か月の成績カードと振り返り"],
    ];
    openSheet('<div class="premium-hero" style="border-radius:16px;margin-top:4px"><div class="soon">近日公開</div><h2>我慢貯金 プレミアム</h2><p class="small muted" style="margin:0">続けやすさと見やすさをアップ。</p></div>' +
      feats.map(([i, n, d]) => '<div class="p-feat"><span class="li-ico">' + ic(i, "sm") + '</span><div><b>' + n + '</b><div class="small muted">' + d + "</div></div></div>").join("") +
      '<div class="price-grid"><div class="price"><span class="small muted">月額（予定）</span><b class="num">480円</b></div><div class="price"><span class="small muted">年額（予定）</span><b class="num">3,600円</b><span class="small" style="color:var(--good)">約37%おトク</span></div></div>' +
      '<button type="button" class="btn gold block" disabled aria-disabled="true">' + ic("lock", "sm") + "近日公開</button>" +
      '<p class="note">プレミアムで買えるのは「便利さ」と「見た目」だけです。レベルやXP、貯金額、ゲームの有利さなどの“強さ”はお金で増えません。現在、決済機能はありません。料金は予定で、変わる場合があります。</p>', { label: "プレミアム" });
  }

  // ---------- data ----------
  function exportData() {
    const payload = { app: "gaman-chokin", version: VERSION, schema: SCHEMA, exportedAt: new Date().toISOString(), data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const d = new Date();
    const name = "gaman-chokin-backup-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".json";
    downloadBlob(blob, name);
    toast("バックアップを書き出しました");
    return name;
  }
  function downloadBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function importText(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { toast("ファイルを読み込めませんでした（JSONではありません）"); return false; }
    const data = obj && obj.app === "gaman-chokin" ? obj.data : obj; // v1（schemaなし）も v3 もここで受け付け、migrate で変換
    if (!validState(data)) { toast("我慢貯金のバックアップではないようです"); return false; }
    const s = migrate(data);
    confirmSheet("バックアップを読み込みますか？", "記録 " + s.records.length + "件・項目 " + s.items.filter((i) => !i.archived).length + "件・目標 " + s.goals.length + "件。今のデータは上書きされます。", "読み込む", () => {
      state = s; state.onboarded = true; save(); shownTotal = null; hideOnboarding(); renderAll(); toast("読み込みました");
    });
    return true;
  }
  function openReset() {
    openSheet('<h2>すべてのデータを消す</h2><p class="muted">記録・目標・設定がすべて消え、元に戻せません。必要ならバックアップを書き出してください。</p><label class="field"><span>確認のため「消す」と入力してください</span><input class="input" id="r-in" autocomplete="off" autocapitalize="off"></label><div class="actions two"><button type="button" class="btn" data-close>やめる</button><button type="button" class="btn danger solid" id="r-ok" disabled>消す</button></div>', {
      label: "リセット",
      mount: (sh) => {
        const inp = $("#r-in", sh), ok = $("#r-ok", sh);
        inp.addEventListener("input", () => { ok.disabled = inp.value.trim() !== "消す"; });
        ok.addEventListener("click", () => {
          if (inp.value.trim() !== "消す") return;
          [KEY].concat(OLD_KEYS).forEach((k) => localStorage.removeItem(k)); try { localStorage.removeItem("gaman-chokin:friendchess"); } catch (e) {} state = defaultState(); shownTotal = null; closeSheet(true); curTab = "home"; renderAll(); startOnboarding(); toast("すべてのデータを消しました");
        });
      },
    });
  }
  function openAge() {
    openSheet('<h2>年齢の設定</h2><p class="small muted">タバコ・お酒に関する項目は20歳以上の方だけに表示します。</p><div class="actions"><button type="button" class="btn block' + (state.adult ? " primary" : "") + '" data-age="1">20歳以上</button><button type="button" class="btn block' + (state.adult === false ? " primary" : "") + '" data-age="0">20歳未満</button></div>', {
      mount: (sh) => sh.addEventListener("click", (e) => { const b = e.target.closest("[data-age]"); if (!b) return; state.adult = b.dataset.age === "1"; save(); closeSheet(); renderAll(); toast("設定しました"); }),
    });
  }
  // ---------- charts ----------
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const PALETTE = ["#1F5C55", "#C8952E", "#5B7DB8", "#B4664B", "#7A9A5B", "#8C6BB0", "#4A9A9A", "#A0A6AD"];
  const DARK_PALETTE = ["#74C3B3", "#E0B65A", "#8FB0E8", "#E59A7F", "#A8C97F", "#B79BDB", "#7FCFCF", "#6F767D"];
  const pal = () => (document.documentElement.dataset.theme === "dark" ? DARK_PALETTE : PALETTE);
  const compact = (n) => (n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "万" : fmt(n));
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, raw))));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function setupCanvas(cv, h) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = cv.clientWidth || 320;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }
  function dailySeries(n) {
    const today = startOfDay(now());
    const days = [];
    for (let i = n - 1; i >= 0; i--) days.push({ t: addDays(today, -i), v: 0 });
    const idx = {}; days.forEach((d, i) => (idx[dkey(d.t)] = i));
    moneySaves().forEach((r) => { const i = idx[dkey(r.t)]; if (i != null) days[i].v += r.amount; });
    return days;
  }
  function drawBars() {
    const cv = $("#chart-bars"); if (!cv) return;
    const { ctx, w, h } = setupCanvas(cv, 180);
    const data = dailySeries(statRange);
    const nice = niceStep(Math.max(500, ...data.map((d) => d.v)) / 3) * 3;
    const L = 38, R = 6, T = 10, B = 24, cw = w - L - R, ch = h - T - B;
    ctx.font = "11px " + cssVar("--font"); ctx.fillStyle = cssVar("--faint"); ctx.strokeStyle = cssVar("--line"); ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) { const y = T + ch - (ch * i) / 3; ctx.beginPath(); ctx.moveTo(L, y + 0.5); ctx.lineTo(w - R, y + 0.5); ctx.stroke(); ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(compact((nice * i) / 3), L - 6, y); }
    const bw = cw / data.length, gap = Math.max(1, bw * 0.28);
    const acc = cssVar("--accent"), gold = cssVar("--gold");
    data.forEach((d, i) => {
      const bh = (d.v / nice) * ch, x = L + i * bw + gap / 2, y = T + ch - bh;
      ctx.fillStyle = i === data.length - 1 ? gold : acc;
      if (bh > 0) roundRect(ctx, x, y, bw - gap, bh, Math.min(4, (bw - gap) / 2), true);
      const every = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 15;
      if ((data.length - 1 - i) % every === 0) { ctx.fillStyle = cssVar("--faint"); ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(data.length <= 7 ? WD[new Date(d.t).getDay()] : mdLabel(d.t), x + (bw - gap) / 2, T + ch + 7); }
    });
  }
  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); if (fill) ctx.fill();
  }
  function drawLine() {
    const cv = $("#chart-line"); if (!cv) return;
    const { ctx, w, h } = setupCanvas(cv, 170);
    const data = dailySeries(statRange);
    const startT = data[0].t;
    let run = sum(moneySaves().filter((r) => r.t < startT), (r) => r.amount);
    const pts = data.map((d) => (run += d.v));
    const max = niceStep(Math.max(1000, ...pts) / 3) * 3, min = 0;
    const L = 38, R = 8, T = 12, B = 24, cw = w - L - R, ch = h - T - B;
    ctx.font = "11px " + cssVar("--font"); ctx.fillStyle = cssVar("--faint"); ctx.strokeStyle = cssVar("--line");
    for (let i = 0; i <= 3; i++) { const y = T + ch - (ch * i) / 3; ctx.beginPath(); ctx.moveTo(L, y + 0.5); ctx.lineTo(w - R, y + 0.5); ctx.stroke(); ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(compact(min + ((max - min) * i) / 3), L - 6, y); }
    const X = (i) => L + (cw * i) / Math.max(1, pts.length - 1), Y = (v) => T + ch - ((v - min) / (max - min)) * ch;
    const acc = cssVar("--accent");
    const grd = ctx.createLinearGradient(0, T, 0, T + ch); grd.addColorStop(0, acc + "55"); grd.addColorStop(1, acc + "00");
    ctx.beginPath(); ctx.moveTo(X(0), Y(pts[0])); pts.forEach((v, i) => ctx.lineTo(X(i), Y(v))); ctx.lineTo(X(pts.length - 1), T + ch); ctx.lineTo(X(0), T + ch); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath(); pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.strokeStyle = acc; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();
    const lx = X(pts.length - 1), ly = Y(pts[pts.length - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fillStyle = cssVar("--gold"); ctx.fill();
    ctx.fillStyle = cssVar("--faint"); ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(mdLabel(data[0].t), L, T + ch + 7); ctx.textAlign = "right"; ctx.fillText("今日", w - R, T + ch + 7);
  }
  function itemBreakdown() {
    const by = {};
    moneySaves().forEach((r) => { const g = recGroup(r).id; by[g] = (by[g] || 0) + r.amount; });
    return Object.entries(by).map(([id, v]) => { const g = groupById(id); return { id, v, emoji: g.e, name: g.n, ci: GROUPS.indexOf(g) }; }).sort((a, b) => b.v - a.v);
  }
  function drawDonut() {
    const cv = $("#chart-donut"); if (!cv) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = 132 * dpr; cv.height = 132 * dpr;
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const data = itemBreakdown(), total = sum(data, (d) => d.v), cols = pal();
    const cx = 66, cy = 66, r = 56, lw = 18;
    ctx.lineWidth = lw; ctx.lineCap = "butt";
    if (!total) { ctx.strokeStyle = cssVar("--bg2"); ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); ctx.stroke(); }
    let a = -Math.PI / 2;
    data.forEach((d, i) => { const da = (d.v / total) * Math.PI * 2; ctx.strokeStyle = cols[d.ci % cols.length]; ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, a, a + Math.max(0.001, da - 0.03)); ctx.stroke(); a += da; });
    ctx.fillStyle = cssVar("--muted"); ctx.font = "11px " + cssVar("--font"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("合計", cx, cy - 10);
    ctx.fillStyle = cssVar("--text"); ctx.font = "700 15px " + cssVar("--font"); ctx.fillText(yenS(total), cx, cy + 9);
    const lg = $("#legend");
    if (lg) lg.innerHTML = data.length ? data.map((d) => '<div><div class="legend-row"><span class="legend-dot" style="background:' + cols[d.ci % cols.length] + '"></span><span class="grow">' + esc(d.emoji) + " " + esc(d.name) + '</span><b class="num">' + yen(d.v) + '</b></div><div class="legend-bar"><i style="width:' + ((d.v / total) * 100).toFixed(1) + "%;background:" + cols[d.ci % cols.length] + '"></i></div></div>').join("") : '<span class="small muted">記録するとここに内訳が出ます</span>';
  }

  // ---------- weekly report image ----------
  let lastReport = null;
  function reportData(wkStart) {
    const ws = wkStart, we = addDays(ws, 7);
    const recs = saves().filter((r) => r.t >= ws && r.t < we);
    const money = recs.filter((r) => r.type === "save");
    const by = {};
    money.forEach((r) => { const k = recEmoji(r) + "|" + recLabel(r); by[k] = (by[k] || 0) + r.amount; });
    const top = Object.entries(by).map(([k, v]) => { const [emoji, name] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)]; return { it: { emoji, name }, v }; }).sort((a, b) => b.v - a.v).slice(0, 3);
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => { const s = addDays(ws, i), e = addDays(ws, i + 1); return sum(money.filter((r) => r.t >= s && r.t < e), (r) => r.amount); });
    const sm = weekSummary(dkey(ws));
    return { ws, we, saved: sum(money, (r) => r.amount), count: recs.length, minutes: sum(recs, (r) => r.minutes || 0), top, days, moved: sm.moved };
  }
  function drawReport(wkStart) {
    const d = reportData(wkStart);
    const x = xpInfo(), s = streakInfo(), t = totals();
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    const F = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Noto Sans CJK JP",sans-serif';
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#173F3A"); g.addColorStop(1, "#0D1F1D");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // 装飾
    const rg = c.createRadialGradient(W - 120, 160, 10, W - 120, 160, 420); rg.addColorStop(0, "rgba(224,182,90,.28)"); rg.addColorStop(1, "rgba(224,182,90,0)");
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    const gold = "#E8C06A", ink = "#F3F1EA", mute = "rgba(243,241,234,.62)";
    c.textBaseline = "alphabetic";
    c.fillStyle = gold; c.font = "700 30px " + F; c.fillText("我慢貯金  WEEKLY REPORT", 80, 120);
    c.fillStyle = mute; c.font = "500 34px " + F; c.fillText(mdwLabel(d.ws).replace(/（.）/, "") + " 〜 " + mdwLabel(addDays(d.we, -1)).replace(/（.）/, ""), 80, 176);
    c.fillStyle = mute; c.font = "500 36px " + F; c.fillText("今週の我慢貯金", 80, 300);
    c.fillStyle = ink; c.font = "800 150px " + F; c.fillText("¥" + fmt(d.saved), 72, 450);
    // stats
    const stats = [["我慢した回数", d.count + "回"], ["取り戻した時間", minLabel(d.minutes)], ["連続記録", s.count + "日"]];
    stats.forEach(([l, v], i) => {
      const bx = 80 + i * 315, by = 520;
      c.fillStyle = "rgba(255,255,255,.07)"; rr(c, bx, by, 290, 150, 26); c.fill();
      c.fillStyle = mute; c.font = "500 28px " + F; c.fillText(l, bx + 28, by + 56);
      c.fillStyle = ink; c.font = "700 50px " + F; c.fillText(v, bx + 28, by + 120);
    });
    // 7日バー
    const max = Math.max(1, ...d.days);
    c.fillStyle = mute; c.font = "500 28px " + F; c.fillText("毎日の我慢額", 80, 750);
    d.days.forEach((v, i) => {
      const bw = 96, gap = 33, bx = 80 + i * (bw + gap), base = 960, bh = Math.max(6, (v / max) * 170);
      c.fillStyle = v ? (i === d.days.length - 1 ? gold : "#74C3B3") : "rgba(255,255,255,.12)"; rr(c, bx, base - bh, bw, bh, 14); c.fill();
      c.fillStyle = mute; c.font = "500 26px " + F; c.textAlign = "center"; c.fillText(WD[new Date(addDays(d.ws, i)).getDay()], bx + bw / 2, base + 40); c.textAlign = "left";
    });
    // top items
    c.fillStyle = mute; c.font = "500 28px " + F; c.fillText("よく我慢できたこと", 80, 1070);
    if (!d.top.length) { c.fillStyle = ink; c.font = "500 34px " + F; c.fillText("来週はここに並びます", 80, 1125); }
    d.top.forEach((x2, i) => {
      const y = 1125 + i * 56;
      c.fillStyle = ink; c.font = "500 36px " + F; c.fillText(x2.it.emoji + "  " + x2.it.name, 80, y);
      c.textAlign = "right"; c.fillStyle = gold; c.font = "700 36px " + F; c.fillText(yen(x2.v), W - 80, y); c.textAlign = "left";
    });
    // footer
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(80, 1268, W - 160, 2);
    c.fillStyle = mute; c.font = "500 26px " + F;
    c.fillText("合計 " + yen(t.total) + "・実際に移した額 " + yen(t.transferred) + "・Lv." + x.lv + " " + x.title, 80, 1312);
    return cv;
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function openReport() {
    let which = 0;
    const sh = openSheet('<h2>週の成績カード</h2><div class="seg" role="group" aria-label="週"><button type="button" data-w="0" aria-pressed="true">今週</button><button type="button" data-w="1" aria-pressed="false">先週</button></div><img class="report-img" id="rep-img" alt="週の成績カード"><div class="actions two"><button type="button" class="btn" id="rep-dl">' + ic("download", "sm") + '画像を保存</button><button type="button" class="btn primary" id="rep-share">' + ic("share", "sm") + "シェア</button></div><p class=\"small faint\">画像はこの端末の中で作られます。シェアするかどうかはあなたが決められます。</p>", { label: "週のレポート" });
    const build = () => new Promise((res) => {
      const cv = drawReport(addDays(weekStart(now()), -7 * which));
      cv.toBlob((b) => { lastReport = b; const img = $("#rep-img", sh); if (img) { if (img.dataset.url) URL.revokeObjectURL(img.dataset.url); img.dataset.url = URL.createObjectURL(b); img.src = img.dataset.url; } res(b); }, "image/png");
    });
    build();
    const fname = () => "gaman-chokin-report-" + dkey(addDays(weekStart(now()), -7 * which)) + ".png";
    sh.addEventListener("click", async (e) => {
      const wb = e.target.closest("[data-w]");
      if (wb) { which = +wb.dataset.w; $$("[data-w]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === wb))); build(); }
      if (e.target.closest("#rep-dl")) { const b = lastReport || (await build()); downloadBlob(b, fname()); toast("画像を保存しました"); }
      if (e.target.closest("#rep-share")) {
        const b = lastReport || (await build());
        const file = new File([b], fname(), { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "我慢貯金 週の成績", text: "今週の我慢貯金" }); } catch (err) { if (err && err.name !== "AbortError") toast("シェアできませんでした"); }
        } else { downloadBlob(b, fname()); toast("この環境ではシェアできないため、画像を保存しました"); }
      }
    });
  }

  // ---------- timer ----------
  let timerTick = null, wakeLock = null;
  function openTimerSheet(it) {
    let min = (it && it.minutes) || state.settings.timerMin || 30;
    const opts = [15, 30, 45, 60, 90];
    if (!opts.includes(min)) opts.push(min), opts.sort((a, b) => a - b);
    openSheet('<h2>' + (it ? esc(it.emoji) + " " : "⏱️ ") + "スマホ断ちタイマー</h2><p class=\"small muted\">時間を決めてスタート。終わるまでこの画面を開いたまま、スマホを置いておきましょう。</p>" +
      '<div class="field"><span>時間</span><div class="chips">' + opts.map((m) => '<button type="button" class="chip" data-min="' + m + '" aria-pressed="' + (m === min) + '">' + m + "分</button>").join("") + "</div></div>" +
      '<div class="note">⚠️ ほかのアプリを開く・ホームに戻る・画面を閉じると失敗になります。iPhoneは自動ロックで画面が消えても失敗になるので、対応端末では画面がつきっぱなしになるよう設定します。</div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="t-start">' + ic("timer", "sm") + "スタート</button></div>", {
      label: "タイマー",
      mount: (sh) => {
        sh.addEventListener("click", (e) => { const b = e.target.closest("[data-min]"); if (b) { min = +b.dataset.min; $$("[data-min]", sh).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); } });
        $("#t-start", sh).addEventListener("click", () => { closeSheet(true); startTimer(min, it ? it.id : null); });
      },
    });
  }
  function startTimer(min, itemId) {
    state.settings.timerMin = min;
    state.timer = { itemId, minutes: min, start: now(), end: now() + min * 60000 };
    save();
    showTimerOverlay();
    requestWake();
    timerTick = setInterval(updateTimer, 500);
    updateTimer();
  }
  async function requestWake() { try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { wakeLock = null; } }
  function releaseWake() { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }
  function showTimerOverlay() {
    let ov = $("#timer-ov");
    if (!ov) { ov = document.createElement("div"); ov.id = "timer-ov"; ov.className = "timer-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "タイマー"); document.body.appendChild(ov); }
    const C = 2 * Math.PI * 110;
    ov.innerHTML = '<div class="small muted">スマホ断ちチャレンジ中</div><div class="timer-ring"><svg viewBox="0 0 250 250" aria-hidden="true"><circle class="t-bg" cx="125" cy="125" r="110" fill="none" stroke-width="12"/><circle class="t-fg" id="t-fg" cx="125" cy="125" r="110" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="0"/></svg><div class="timer-time" id="t-time" role="timer" aria-live="off">--:--</div></div>' +
      '<p>画面はこのまま。スマホを伏せずに置いて、目の前のことに集中しましょう。</p><button type="button" class="btn ghost" id="t-cancel">やめる</button>';
    $("#t-cancel", ov).addEventListener("click", () => { endTimer(); ov.remove(); toast("タイマーをやめました。いつでもまた挑戦できます。"); });
  }
  function updateTimer() {
    const tm = state.timer; if (!tm) return;
    const rem = tm.end - now();
    if (rem <= 0) return timerSuccess();
    const el = $("#t-time"), fg = $("#t-fg");
    const s = Math.ceil(rem / 1000);
    if (el) el.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60);
    if (fg) { const C = 2 * Math.PI * 110; fg.setAttribute("stroke-dashoffset", (C * (1 - rem / (tm.minutes * 60000))).toFixed(1)); }
  }
  function endTimer() { clearInterval(timerTick); timerTick = null; state.timer = null; save(); releaseWake(); }
  function timerSuccess() {
    const tm = state.timer; endTimer();
    state.records.push({ id: uid(), t: now(), type: "timer", itemId: tm.itemId, amount: 0, minutes: tm.minutes });
    save();
    sound("fanfare"); haptic([20, 50, 20]);
    const ov = $("#timer-ov");
    const val = (tm.minutes / 60) * state.settings.hourly;
    if (ov) ov.innerHTML = '<div style="font-size:56px">🎉</div><h2 style="margin:8px 0 4px">' + minLabel(tm.minutes) + 'を取り戻しました</h2><p>時給' + yen(state.settings.hourly) + "換算で、約" + yen(val) + "分の時間です。</p><button type=\"button\" class=\"btn primary\" id=\"t-close\">とじる</button>";
    const c = $("#t-close"); if (c) c.addEventListener("click", () => { ov.remove(); });
    afterChange();
  }
  function timerFail(reason) {
    const tm = state.timer || state.timerFail; if (!tm) return;
    state.timerFail = { minutes: tm.minutes, itemId: tm.itemId, reason };
    endTimer();
    showTimerFail(reason);
  }
  function showTimerFail(reason) {
    const tm = state.timerFail; if (!tm) return;
    let ov = $("#timer-ov");
    if (!ov) { showTimerOverlay(); ov = $("#timer-ov"); }
    ov.innerHTML = '<div style="font-size:52px">🌙</div><h2 style="margin:8px 0 4px">タイマーが止まりました</h2><p>' + (reason === "reload" ? "アプリが閉じられたため" : "アプリから離れたため") + "、今回は記録されません。取り戻せた時間は、きっとゼロじゃないはず。いつでもまた挑戦できます。</p>" +
      '<div class="row"><button type="button" class="btn" id="t-close">とじる</button><button type="button" class="btn primary" id="t-again">もう一度</button></div>';
    const clear = () => { state.timerFail = null; save(); ov.remove(); };
    $("#t-close", ov).addEventListener("click", clear);
    $("#t-again", ov).addEventListener("click", () => { clear(); startTimer(tm.minutes, tm.itemId); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && state.timer) timerFail("left");
    if (document.visibilityState === "visible") { if (curTab === "home" && !sheetStack && $("#game-layer").hidden) renderHome(); renderTop(); }
  });
  window.addEventListener("pagehide", () => { if (state.timer) timerFail("left"); });

  // ---------- onboarding ----------
  let ob = null;
  function startOnboarding() {
    ob = { step: 0, adult: null, sel: new Set(["conveni", "coffee", "phone"]), price: {}, min: {}, custom: [], goal: { emoji: "✈️", name: "", amount: 50000 } };
    PRESETS.forEach((p) => { ob.price[p.pid] = p.price; ob.min[p.pid] = p.minutes || 0; });
    $("#onboarding").hidden = false;
    document.body.style.overflow = "hidden";
    renderOb();
  }
  function obHeroSVG() {
    return '<svg class="ob-hero" viewBox="0 0 180 180" aria-hidden="true"><defs><linearGradient id="og" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F3CF74"/><stop offset="1" stop-color="#C8952E"/></linearGradient><clipPath id="oc"><path d="M50 52h80v6c12 8 16 20 16 34v46a18 18 0 0 1-18 18H52a18 18 0 0 1-18-18V92c0-14 4-26 16-34z"/></clipPath></defs>' +
      '<circle cx="90" cy="96" r="84" fill="var(--accent-soft)"/><rect x="56" y="34" width="68" height="18" rx="6" fill="var(--accent)"/>' +
      '<g clip-path="url(#oc)"><rect width="180" height="180" fill="var(--surface)"/><rect y="104" width="180" height="80" fill="url(#og)"><animate attributeName="y" values="150;104" dur="1.6s" fill="freeze"/></rect></g>' +
      '<path d="M50 52h80v6c12 8 16 20 16 34v46a18 18 0 0 1-18 18H52a18 18 0 0 1-18-18V92c0-14 4-26 16-34z" fill="none" stroke="var(--line2)" stroke-width="2"/>' +
      '<g><circle cx="90" cy="20" r="13" fill="url(#og)" stroke="#B8862A" stroke-width="1.5"><animate attributeName="cy" values="0;70;70" keyTimes="0;.6;1" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" keyTimes="0;.3;.62" dur="1.8s" repeatCount="indefinite"/></circle></g></svg>';
  }
  function renderOb() {
    const el = $("#onboarding");
    const N = 5;
    const dots = '<div class="ob-dots" aria-hidden="true">' + Array.from({ length: N }, (_, i) => '<i class="' + (i <= ob.step ? "on" : "") + '"></i>').join("") + "</div>";
    const back = ob.step > 0 ? '<button type="button" class="btn sm ghost" data-ob="back">戻る</button>' : "<span></span>";
    let body = "", foot = "";
    const presets = PRESETS.filter((p) => !p.adult || ob.adult);
    if (ob.step === 0) {
      body = obHeroSVG() + '<h1>我慢したお金を、<br>見える貯金に。</h1><p class="lead">コンビニ、コーヒー、衝動買い。我慢した分は財布に残っても、目に見えないから実感がわきません。このアプリは、それを“貯金”として見える化します。</p>' +
        '<div class="ob-points">' + [["plus", "2タップで記録", "グループを選んで金額をタップ。よく使うものは自動で1タップに。"], ["chart", "合計・グラフ・1年後の見込み", "小さな我慢が、どれだけ大きくなるか。"], ["bank", "本物の貯金につなげる", "週に1回、実際に移した額を記録して ✅ に。"], ["tree", "森が育つ・ゲームで遊べる", "我慢するほど森となかまが育ち、13種類のゲームで有利に。"], ["shield", "ログイン・広告なし", "データはこの端末だけに保存されます。"]].map(([i, b, s]) => '<div class="ob-point"><span class="li-ico">' + ic(i, "sm") + "</span><div><b>" + b + "</b><span>" + s + "</span></div></div>").join("") + "</div>";
      foot = '<button type="button" class="btn primary block" data-ob="next">はじめる</button><p class="small faint" style="text-align:center;margin:0">はじめることで<a href="./legal.html" style="color:inherit">利用規約・プライバシーポリシー</a>に同意したものとします。</p>';
    } else if (ob.step === 1) {
      body = '<h2>はじめに、年齢を教えてください</h2><p class="lead">タバコやお酒の項目は、20歳以上の方にだけ表示します。</p><div class="age-opts"><button type="button" class="btn block' + (ob.adult === true ? " primary" : "") + '" data-age-ob="1">20歳以上</button><button type="button" class="btn block' + (ob.adult === false ? " primary" : "") + '" data-age-ob="0">20歳未満</button></div>';
      foot = "";
    } else if (ob.step === 2) {
      body = '<h2>ついやってしまうことは？</h2><p class="lead">選んだものはホームの「いつもの」に置かれ、1タップで記録できます（選ばなくても、グループから記録できます）。</p><div class="pick-grid">' +
        presets.map((p) => '<button type="button" class="pick" data-pick="' + p.pid + '" aria-pressed="' + ob.sel.has(p.pid) + '"><span class="p-em">' + p.emoji + '</span><span><span class="p-n">' + esc(p.name) + (p.adult ? '<span class="item-tag">20+</span>' : "") + '</span><br><span class="p-p">' + (p.price ? "約" + yen(p.price) : p.minutes + "分") + "</span></span></button>").join("") + "</div>";
      foot = '<button type="button" class="btn primary block" data-ob="next">次へ（' + (ob.sel.size + ob.custom.length) + "件）</button>";
    } else if (ob.step === 3) {
      const rows = presets.filter((p) => ob.sel.has(p.pid));
      body = '<h2>1回あたり、だいたいいくら？</h2><p class="lead">ざっくりでOK。我慢したときに貯まる金額になります。</p><div class="card" style="padding:4px 14px">' +
        rows.map((p) => '<div class="price-row"><span class="pr-em">' + p.emoji + '</span><span class="pr-n">' + esc(p.name) + "</span>" + (p.minutes && !p.price ? '<span class="input-yen input-min"><input class="input" data-obmin="' + p.pid + '" inputmode="numeric" value="' + ob.min[p.pid] + '" aria-label="' + esc(p.name) + 'の時間"></span>' : '<span class="input-yen"><input class="input" data-obprice="' + p.pid + '" inputmode="numeric" value="' + ob.price[p.pid] + '" aria-label="' + esc(p.name) + 'の金額"></span>') + "</div>").join("") +
        ob.custom.map((c, i) => '<div class="price-row"><span class="pr-em">' + esc(c.emoji) + '</span><span class="pr-n">' + esc(c.name) + '</span><span class="input-yen"><input class="input" data-obcustom="' + i + '" inputmode="numeric" value="' + c.price + '" aria-label="' + esc(c.name) + 'の金額"></span></div>').join("") +
        '</div><div class="sec-title"><span>自分で追加</span></div><div class="card"><div class="row"><select class="input" id="ob-cem" style="width:72px;padding:0 8px" aria-label="アイコン">' + EMOJIS.map((e) => "<option>" + e + "</option>").join("") + '</select><input class="input grow" id="ob-cname" maxlength="24" placeholder="例：コンビニスイーツ"></div><div class="row" style="margin-top:8px"><span class="input-yen grow"><input class="input" id="ob-cprice" inputmode="numeric" placeholder="300"></span><button type="button" class="btn" data-ob="addcustom">' + ic("plus", "sm") + "追加</button></div><div class=\"err\" id=\"ob-err\"></div></div>";
      foot = '<button type="button" class="btn primary block" data-ob="next">次へ</button>';
    } else if (ob.step === 4) {
      body = '<h2>貯まったら、何に使いたい？</h2><p class="lead">目標があると続きやすくなります。あとで決めてもOK。</p><div class="emoji-pick">' + GOAL_EMOJIS.map((e) => '<button type="button" data-goalem="' + e + '" aria-pressed="' + (e === ob.goal.emoji) + '" aria-label="' + e + '">' + e + "</button>").join("") + "</div>" +
        '<label class="field"><span>目標</span><input class="input" id="ob-gname" maxlength="24" placeholder="例：沖縄旅行" value="' + esc(ob.goal.name) + '"></label><label class="field"><span>目標金額</span><span class="input-yen"><input class="input" id="ob-gamt" inputmode="numeric" value="' + ob.goal.amount + '"></span></label>' +
        '<div class="note">表示される金額はあなたの記録にもとづく目安です。投資や金融のアドバイスではありません。</div>';
      foot = '<button type="button" class="btn primary block" data-ob="finish-goal">この目標ではじめる</button><button type="button" class="btn ghost block" data-ob="finish">目標はあとで決める</button>';
    }
    el.innerHTML = '<div class="ob"><div class="ob-top">' + back + dots + '<span style="width:52px"></span></div><div class="ob-body">' + body + '</div><div class="ob-foot">' + foot + "</div></div>";
    el.scrollTop = 0;
  }
  function obCollect() {
    $$("[data-obprice]").forEach((i) => (ob.price[i.dataset.obprice] = toInt(i.value)));
    $$("[data-obmin]").forEach((i) => (ob.min[i.dataset.obmin] = toInt(i.value)));
    $$("[data-obcustom]").forEach((i) => (ob.custom[+i.dataset.obcustom].price = toInt(i.value)));
    const gn = $("#ob-gname"); if (gn) { ob.goal.name = gn.value.trim(); ob.goal.amount = toInt($("#ob-gamt").value); }
  }
  function obFinish(withGoal) {
    obCollect();
    if (withGoal && (!ob.goal.name || ob.goal.amount < 100)) { toast("目標の名前と金額（100円以上）を入力してください"); return; }
    state.adult = ob.adult;
    state.items = [];
    PRESETS.filter((p) => ob.sel.has(p.pid) && (!p.adult || ob.adult)).forEach((p) => {
      const price = p.price ? Math.max(0, ob.price[p.pid]) : 0;
      const minutes = p.minutes ? Math.max(1, ob.min[p.pid] || p.minutes) : 0;
      if (!price && !minutes) return;
      state.items.push({ id: uid(), pid: p.pid, emoji: p.emoji, name: p.name, price, minutes, cap: p.cap, adult: !!p.adult, group: p.group || null });
    });
    ob.custom.forEach((c) => { if (c.price > 0) state.items.push({ id: uid(), pid: null, emoji: c.emoji, name: c.name, price: c.price, minutes: 0, cap: 3, adult: false, group: guessGroup({ emoji: c.emoji }) }); });
    if (withGoal) state.goals.push({ id: uid(), name: ob.goal.name, emoji: ob.goal.emoji, amount: ob.goal.amount, pct: 100, created: now() });
    state.onboarded = true;
    state.createdAt = now();
    save();
    hideOnboarding(); curTab = "home"; renderAll();
    toast("準備ができました。我慢したら、グループ→金額の2タップで記録できます", { duration: 4000 });
  }
  function hideOnboarding() { $("#onboarding").hidden = true; $("#onboarding").innerHTML = ""; document.body.style.overflow = ""; ob = null; }
  $("#onboarding").addEventListener("click", (e) => {
    if (!ob) return;
    const a = e.target.closest("[data-ob]");
    const age = e.target.closest("[data-age-ob]");
    const pick = e.target.closest("[data-pick]");
    const gem = e.target.closest("[data-goalem]");
    if (age) { ob.adult = age.dataset.ageOb === "1"; if (!ob.adult) PRESETS.forEach((p) => p.adult && ob.sel.delete(p.pid)); ob.step = 2; renderOb(); return; }
    if (pick) { const id = pick.dataset.pick; ob.sel.has(id) ? ob.sel.delete(id) : ob.sel.add(id); renderOb(); return; }
    if (gem) { ob.goal.emoji = gem.dataset.goalem; $$("[data-goalem]").forEach((b) => b.setAttribute("aria-pressed", String(b === gem))); return; }
    if (!a) return;
    const act = a.dataset.ob;
    obCollect();
    if (act === "next") { if (ob.step === 3 && Object.keys(ob.price).some((k) => ob.sel.has(k) && ob.price[k] > 1000000)) { $("#ob-err").textContent = "金額は1,000,000円までです"; return; } ob.step = Math.min(4, ob.step + 1); renderOb(); }
    if (act === "back") { ob.step = Math.max(0, ob.step - 1); renderOb(); }
    if (act === "addcustom") {
      const name = $("#ob-cname").value.trim(), price = toInt($("#ob-cprice").value), emoji = $("#ob-cem").value;
      if (!name || !price) { $("#ob-err").textContent = "名前と金額を入力してください"; return; }
      ob.custom.push({ name, price, emoji }); renderOb();
    }
    if (act === "finish") obFinish(false);
    if (act === "finish-goal") obFinish(true);
  });

  // ---------- theme ----------
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function applyTheme() {
    const th = state.settings.theme === "system" ? (mq && mq.matches ? "dark" : "light") : state.settings.theme;
    document.documentElement.dataset.theme = th;
    document.documentElement.dataset.accent = state.settings.accent || "teal";
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", th === "dark" ? "#0E1113" : "#F5F3EE"));
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", () => { if (state.settings.theme === "system") { applyTheme(); renderView(curTab); } });

  // ---------- platform ----------
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function isStandalone() { return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }

  // ======================================================================
  // v3: 2タップ記録（グループ → 金額）・いつもの・時間帯のおすすめ・欲しいものリスト
  // ======================================================================
  function groupTodayCount(gid) {
    const sd = startOfDay(now());
    return state.records.filter((r) => r.type === "save" && r.t >= sd && recGroup(r).id === gid).length;
  }
  // 記録の共通処理。o = { group, amount, label, itemId, minutes, src, proof, srcEl, skipGap, skipGroupCap }
  function addSave(o) {
    const block = recordBlock(o);
    if (block) { toast(block); haptic([8, 40, 8]); return null; }
    const before = totals().total;
    const r = { id: uid(), t: now(), type: "save", group: o.group, itemId: o.itemId || null, amount: Math.round(o.amount), minutes: o.minutes || 0 };
    if (o.label) r.label = String(o.label).slice(0, 24);
    if (o.src) r.src = o.src;
    if (o.proof) r.proof = o.proof;
    state.records.push(r);
    save();
    sound("coin"); haptic(14);
    if (curTab === "home") {
      if (o.srcEl && document.contains(o.srcEl)) coinFly(o.srcEl, r.amount); else bumpJar();
      shownTotal = before;
      afterChange({ homePartial: true, toastDelay: 600 });
      rollTo(before, before + r.amount);
      shownTotal = before + r.amount;
    } else afterChange({ toastDelay: 600 });
    if (lastUndo) lastUndo.close();
    const g = groupById(r.group);
    lastUndo = toast(esc(o.itemId && itemById(o.itemId) ? itemById(o.itemId).emoji : g.e) + " " + esc(o.label || g.n) + " <b>" + yen(r.amount) + "</b> を貯金しました" + (r.proof === "squat" ? " 💪" : ""), { action: "取り消す", duration: 5000, onAction: () => undoRecord(r.id) });
    return r;
  }

  // いつもの：固定した項目 + よく使う「グループ・名前・金額」を自動で学習
  function favorites() {
    const pinned = activeItems().filter((i) => i.price > 0).map((i) => ({ item: i, group: guessGroup(i), amount: i.price, label: i.name }));
    const cutoff = now() - 90 * DAY, by = {};
    moneySaves().filter((r) => r.t >= cutoff && !r.itemId && r.src !== "wish").forEach((r) => {
      const g = recGroup(r);
      if (g.adult && state.adult !== true) return;
      const k = g.id + "|" + (r.label || "") + "|" + r.amount;
      const o = (by[k] = by[k] || { key: k, group: g.id, rawLabel: r.label || null, amount: r.amount, n: 0, last: 0 });
      o.n++; o.last = Math.max(o.last, r.t);
    });
    const learned = Object.values(by)
      .filter((x) => x.n >= 2 && !state.hiddenFavs[x.key] && !pinned.some((p) => p.group === x.group && p.amount === x.amount && p.label === x.rawLabel))
      .sort((a, b) => b.n - a.n || b.last - a.last).slice(0, 6)
      .map((x) => Object.assign(x, { e: groupById(x.group).e, label: x.rawLabel || groupById(x.group).n }));
    return { pinned, learned };
  }
  function favByKey(k) { return favorites().learned.find((x) => x.key === k); }
  function favMenu(k) {
    const x = favByKey(k); if (!x) return;
    openSheet("<h2>" + esc(x.e) + " " + esc(x.label) + '</h2><p class="small muted num">' + yen(x.amount) + "・これまで " + x.n + "回（よく使うので自動で表示しています）</p>" +
      '<div class="actions"><button type="button" class="btn primary block" data-m="tap">' + ic("plus", "sm") + "我慢した（" + yen(x.amount) + '）</button><button type="button" class="btn block" data-m="pin">' + ic("pin", "sm") + 'いつもの項目として固定</button><button type="button" class="btn block ghost" data-m="hide">' + ic("x", "sm") + "ここに表示しない</button></div>", {
      mount: (sh) => sh.addEventListener("click", (e) => {
        const b = e.target.closest("[data-m]"); if (!b) return;
        if (b.dataset.m === "tap") { closeSheet(); setTimeout(() => addSave({ group: x.group, amount: x.amount, label: x.rawLabel, src: "fav", srcEl: $('[data-fav="' + CSS.escape(k) + '"] .item-hit') }), 330); }
        if (b.dataset.m === "pin") { state.items.push({ id: uid(), pid: null, emoji: x.e, name: x.label, price: x.amount, minutes: 0, cap: 3, adult: groupById(x.group).adult || false, group: x.group }); save(); closeSheet(); renderAll(); toast("「" + esc(x.label) + "」をいつものに固定しました"); }
        if (b.dataset.m === "hide") { state.hiddenFavs[k] = now(); save(); closeSheet(); renderAll(); toast("表示しないようにしました"); }
      }),
    });
  }

  // 時間帯のおすすめ（履歴から学習。少ないうちは時間帯の定番）
  function suggestion() {
    const t = now(), H = new Date(t).getHours();
    const by = {};
    moneySaves().filter((r) => r.t >= t - 60 * DAY && r.src !== "wish").forEach((r) => {
      const hh = new Date(r.t).getHours(), d = Math.min(Math.abs(hh - H), 24 - Math.abs(hh - H));
      if (d > 1) return;
      const g = recGroup(r); if (g.adult && state.adult !== true) return;
      const it = r.itemId ? itemById(r.itemId) : null;
      if (r.itemId && (!it || it.archived)) return;
      const lab = recLabel(r), k = g.id + "|" + lab;
      const o = (by[k] = by[k] || { group: g.id, label: lab, rawLabel: r.itemId ? null : r.label || null, itemId: r.itemId || null, n: 0, amts: {} });
      o.n++; o.amts[r.amount] = (o.amts[r.amount] || 0) + 1;
    });
    const best = Object.values(by).sort((a, b) => b.n - a.n)[0];
    if (best && best.n >= 2) {
      const amount = best.itemId ? itemById(best.itemId).price : +Object.entries(best.amts).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
      return Object.assign(best, { amount, learned: true, hour: H });
    }
    const D = H >= 5 && H < 11 ? ["drink", "コーヒー", 300] : H >= 11 && H < 14 ? ["other", "外食", 1000] : H >= 14 && H < 18 ? ["food", "お菓子", 300] : H >= 18 && H < 22 ? ["food", "コンビニ", 500] : ["shop", "ネット通販", 1000];
    return { group: D[0], label: D[1], rawLabel: D[1], itemId: null, amount: D[2], learned: false, n: 0, hour: H };
  }
  function suggestHTML() {
    if (state.dismiss["sg-" + dkey(now()) + "-" + new Date().getHours()]) return "";
    const sg = suggestion();
    const recent = state.records.some((r) => r.type === "save" && r.t > now() - 2 * 3600000 && recGroup(r).id === sg.group && recLabel(r) === sg.label);
    if (recent) return "";
    const g = groupById(sg.group);
    return '<section class="card suggest" id="suggest" aria-label="時間帯のおすすめ"><div class="sg-top"><span class="sg-ico" aria-hidden="true">' + ic("clock", "sm") + '</span><div class="grow"><div class="small muted">' + sg.hour + "時ごろの" + (sg.learned ? "いつもの我慢" : "おすすめ") + '</div><div class="sg-name">' + esc(itemById(sg.itemId) ? itemById(sg.itemId).emoji : g.e) + " " + esc(sg.label) + '</div><div class="small faint">' + (sg.learned ? "この時間によく我慢しています（" + sg.n + "回）" : "この時間に我慢しがちなものの例です") + '</div></div><button type="button" class="item-more" style="position:static" data-act="sg-hide" aria-label="おすすめを閉じる">' + ic("x", "sm") + '</button></div>' +
      '<button type="button" class="btn primary block" data-act="suggest" style="margin-top:10px">' + yen(sg.amount) + " を我慢した</button></section>";
  }
  function tapSuggest(el) {
    const sg = suggestion();
    if (sg.itemId) return tapItem(sg.itemId, el);
    addSave({ group: sg.group, amount: sg.amount, label: sg.rawLabel, src: "suggest", srcEl: el });
  }

  // グループ → 金額
  let squatOn = false;
  function groupLabels(g) {
    const learned = {};
    moneySaves().filter((r) => recGroup(r).id === g.id && r.label && !r.itemId).forEach((r) => { learned[r.label] = (learned[r.label] || 0) + 1; });
    const arr = Object.entries(learned).sort((a, b) => b[1] - a[1]).map(([l]) => l);
    (g.labels || []).concat(state.adult ? g.adultLabels || [] : []).forEach((l) => { if (!arr.includes(l)) arr.push(l); });
    return arr.slice(0, 8);
  }
  function openGroup(gid, srcEl) {
    const g = groupById(gid);
    if (g.adult && state.adult !== true) return;
    let label = null;
    const per = tobaccoPer(), box = state.settings.tobaccoBox || 600, perBox = state.settings.tobaccoPer || 20;
    const priceBtns = g.id === "tobacco"
      ? [[per, "1本"], [per * 3, "3本"], [per * 5, "5本"], [per * 10, "10本"], [box, "1箱"]].map(([v, n]) => '<button type="button" class="pbtn" data-price="' + v + '" data-tlabel="' + n + '"><b>' + n + '</b><span class="num">' + yen(v) + "</span></button>").join("")
      : PRICE_BTNS.map((v) => '<button type="button" class="pbtn" data-price="' + v + '"><b class="num">' + yen(v) + "</b></button>").join("");
    const labels = g.id === "tobacco" ? [] : groupLabels(g);
    const c = groupTodayCount(g.id);
    openSheet('<h2><span aria-hidden="true">' + g.e + "</span> " + g.n + "を我慢した</h2>" +
      (labels.length ? '<div class="field"><span>なにを？（えらばなくてもOK）</span><div class="chips" id="g-labels">' + labels.map((l) => '<button type="button" class="chip" data-label="' + esc(l) + '" aria-pressed="false">' + esc(l) + "</button>").join("") + '</div><input class="input" id="g-label" maxlength="24" placeholder="自分で書く（例：' + esc(labels[0] || "") + '）" style="margin-top:8px" autocomplete="off"></div>' : "") +
      '<div class="field"><span>' + (g.id === "tobacco" ? "吸わなかった本数（1本 約" + yen(per) + "・1箱" + perBox + "本 " + yen(box) + "）" : "金額をタップすると記録します") + '</span><div class="pgrid' + (g.id === "tobacco" ? " tob" : "") + '" id="g-prices">' + priceBtns + "</div></div>" +
      '<div class="row" style="gap:8px"><span class="input-yen grow"><input class="input" id="g-amt" inputmode="numeric" placeholder="自由に入力" aria-label="金額を入力"></span><button type="button" class="btn primary" id="g-free">記録</button></div>' +
      (g.id === "food" ? '<label class="li squat-li"><span class="li-ico">🏋️</span><span class="li-t">スクワット10回で証明する<span class="li-s">食べる前にスクワット。センサーで数えて 💪 と +' + SQUAT_XP + "XP（1日" + SQUAT_DAILY + "回まで）</span></span>" + sw("g-squat", squatOn, "スクワットで証明") + "</label>" : "") +
      '<div class="err" id="g-err"></div><p class="small faint" style="margin:10px 2px 0">今日のこのグループ：' + c + " / " + g.cap + "回" + (g.id === "tobacco" ? "　※1本・1箱の値段は設定で変えられます" : "") + "</p>", {
      label: g.n + "の記録",
      mount: (sh) => {
        const inp = $("#g-label", sh);
        sh.addEventListener("click", (e) => {
          const lb = e.target.closest("[data-label]");
          if (lb) { label = label === lb.dataset.label ? null : lb.dataset.label; $$("[data-label]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.label === label))); if (inp) inp.value = ""; return; }
          const pb = e.target.closest("[data-price]");
          if (pb) go2(+pb.dataset.price, pb.dataset.tlabel ? "タバコ " + pb.dataset.tlabel : null);
        });
        if (inp) inp.addEventListener("input", () => { if (inp.value.trim()) { label = null; $$("[data-label]", sh).forEach((b) => b.setAttribute("aria-pressed", "false")); } });
        const sq = $("#g-squat", sh); if (sq) sq.addEventListener("change", () => { squatOn = sq.checked; });
        $("#g-free", sh).addEventListener("click", () => {
          const v = toInt($("#g-amt", sh).value);
          if (!(v > 0) || v > 1000000) { $("#g-err", sh).textContent = "金額は1〜1,000,000円で入力してください"; return; }
          go2(v, null);
        });
        $("#g-amt", sh).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#g-free", sh).click(); });
        function go2(amount, tl) {
          const lab = (inp && inp.value.trim()) || label || tl || null;
          const o = { group: g.id, amount, label: lab, src: "group", srcEl: srcEl };
          const block = recordBlock(o);
          if (block) { $("#g-err", sh).innerHTML = block; haptic([8, 40, 8]); return; }
          if (g.id === "food" && squatOn) { openSquat(o); return; }
          closeSheet();
          setTimeout(() => addSave(Object.assign(o, { srcEl: srcEl && document.contains(srcEl) ? srcEl : $('.grp[data-g="' + g.id + '"]') })), 120);
        }
      },
    });
  }

  // スクワット（DeviceMotion）。iPhoneは許可が必要。使えないときは普通の記録（△）にできる
  let squatSession = null;
  function openSquat(o) {
    openSheet('<h2>🏋️ スクワット10回</h2><p class="small muted"><b>スマホを胸の前で両手で持って</b>、ゆっくり10回しゃがんで立ちます。動きのセンサーで数えます（データは端末の外に出ません）。</p>' +
      '<div class="squat-box"><div class="squat-count num" id="sq-count">0<small>/10</small></div><div class="vbar" style="height:10px"><i id="sq-bar" style="width:0%"></i></div><p class="small muted" id="sq-status" style="margin:10px 0 0">下のボタンでセンサーをONにしてください。</p></div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="sq-start">センサーON・スタート</button></div><div id="sq-fallback"></div>', {
      label: "スクワット",
      onClose: stopSquat,
      mount: (sh) => {
        $("#sq-start", sh).addEventListener("click", () => startSquatSensor(o));
      },
    });
  }
  function squatFallback(msg, o) {
    const box = $("#sq-fallback"); if (!box) return;
    $("#sq-status").textContent = msg;
    if ($("#sq-self")) return;
    box.innerHTML = '<div class="note" style="margin-top:10px">センサーが使えないときは、スクワットなしで普通に記録できます（💪とボーナスはつきません）。</div><button type="button" class="btn block" id="sq-self" style="margin-top:8px">普通に記録する（' + yen(o.amount) + "）</button>";
    $("#sq-self").addEventListener("click", () => { stopSquat(); closeSheet(); setTimeout(() => addSave(Object.assign({}, o, { srcEl: $('.grp[data-g="food"]') })), 120); });
  }
  function startSquatSensor(o) {
    const btn = $("#sq-start"); if (btn) btn.disabled = true;
    if (typeof window.DeviceMotionEvent === "undefined") { squatFallback("この端末・ブラウザでは動きのセンサーが使えません。", o); return; }
    const begin = () => {
      squatSession = { o, count: 0, filt: null, phase: "idle", lastRep: 0, gotEvent: false, started: performance.now(), lastProgress: performance.now() };
      window.addEventListener("devicemotion", onMotion);
      const st = $("#sq-status"); if (st) st.textContent = "スタート！ ゆっくり10回しゃがんで立ちましょう。";
      squatSession.check = setInterval(() => {
        const s = squatSession; if (!s) return;
        const t = performance.now();
        if (!s.gotEvent && t - s.started > 3000) { clearInterval(s.check); window.removeEventListener("devicemotion", onMotion); squatFallback("センサーから動きが届きません。", o); }
        else if (s.gotEvent && t - s.lastProgress > 25000) squatFallback("うまく数えられないときは、スマホをしっかり持って大きめに動いてみてください。", o);
      }, 500);
    };
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().then((res) => { if (res === "granted") begin(); else squatFallback("センサーの許可が得られませんでした（設定 > Safari > モーションと画面の向きのアクセス をONにすると使えます）。", o); }).catch(() => squatFallback("センサーの許可を求められませんでした。", o));
    } else begin();
  }
  function onMotion(e) {
    const s = squatSession; if (!s) return;
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    s.gotEvent = true;
    const m = Math.hypot(a.x, a.y, a.z);
    if (m > 30) return;
    s.filt = s.filt == null ? m : s.filt * 0.7 + m * 0.3;
    const G = 9.81, t = performance.now();
    if (s.phase !== "high") { if (s.filt > G + 1.5) s.phase = "high"; }
    else if (s.filt < G - 1.3) {
      s.phase = "low";
      if (t - s.lastRep > 900) {
        s.lastRep = t; s.lastProgress = t; s.count += 1;
        const c = $("#sq-count"); if (c) c.innerHTML = s.count + "<small>/10</small>";
        const bar = $("#sq-bar"); if (bar) bar.style.width = s.count * 10 + "%";
        haptic(30);
        if (s.count >= 10) finishSquat();
      }
    }
  }
  function stopSquat() { if (!squatSession) return; clearInterval(squatSession.check); window.removeEventListener("devicemotion", onMotion); squatSession = null; }
  function finishSquat() {
    const o = squatSession && squatSession.o; stopSquat();
    if (!o) return;
    closeSheet();
    sound("fanfare");
    setTimeout(() => addSave(Object.assign({}, o, { proof: "squat", srcEl: $('.grp[data-g="food"]') })), 150);
  }

  // 欲しいものリスト：登録 → 24時間後に「まだ欲しい？」→「やめた」で貯金
  const waitingWishes = () => state.wishes.filter((w) => w.status === "wait");
  const dueWishes = () => waitingWishes().filter((w) => now() >= w.due).sort((a, b) => a.due - b.due);
  function hoursLeft(w) { const ms = w.due - now(); if (ms <= 0) return "時間になりました"; const mins = Math.ceil(ms / 60000), h = Math.floor(mins / 60), m = mins % 60; return "あと" + (h ? h + "時間" : "") + (m || !h ? m + "分" : ""); }
  function wishDueHTML() {
    const w = dueWishes()[0]; if (!w) return "";
    const g = groupById(w.group);
    return '<div class="banner gold wish-due" id="wish-due"><div class="b-ico">⏳</div><div class="grow"><p><b>「' + esc(w.name) + "」まだ欲しい？</b></p><p class=\"small muted\">" + g.e + " " + yen(w.price) + "・登録から" + (w.extended ? "48" : "24") + "時間たちました。やめれば、そのまま貯金になります。</p>" +
      '<div class="b-actions"><button type="button" class="btn sm primary" data-act="wish-quit" data-id="' + w.id + '">やめた（' + yen(w.price) + " 貯金）</button>" +
      (w.extended ? "" : '<button type="button" class="btn sm" data-act="wish-keep" data-id="' + w.id + '">まだ迷う（あと24時間）</button>') +
      '<button type="button" class="btn sm ghost" data-act="wish-bought" data-id="' + w.id + '">買った</button></div></div></div>';
  }
  function wishesHTML() {
    const ws = waitingWishes().sort((a, b) => a.due - b.due);
    const saved = moneySaves().filter((r) => r.src === "wish");
    let h = '<div class="sec-title"><span>欲しいものリスト</span><button type="button" class="link" data-act="wish-add">＋ 欲しい！を登録</button></div><div class="card" id="wishes">';
    if (!ws.length) h += '<div class="small muted">「欲しい！」と思ったら、買う前にここへ。24時間たってから「まだ欲しい？」と聞きます。やめた分はそのまま貯金に。</div>';
    ws.forEach((w) => { const g = groupById(w.group); h += '<div class="wish' + (now() >= w.due ? " due" : "") + '"><span class="h-emoji" aria-hidden="true">' + g.e + '</span><div class="grow"><div class="h-name">' + esc(w.name) + '</div><div class="h-time num">' + yen(w.price) + "・" + hoursLeft(w) + '</div></div><button type="button" class="item-more" style="position:static" data-act="wish-del" data-id="' + w.id + '" aria-label="リストから消す">' + ic("x", "xs") + "</button></div>"; });
    if (saved.length) h += '<div class="small faint" style="margin-top:8px">これまでに「やめた」で貯めた額：<b class="num">' + yen(sum(saved, (r) => r.amount)) + "</b>（" + saved.length + "件）</div>";
    return h + "</div>";
  }
  function openWishForm() {
    if (waitingWishes().length >= 30) { toast("欲しいものリストは30件までです"); return; }
    let gid = "shop";
    openSheet('<h2>欲しい！を登録</h2><p class="small muted">すぐには買わずに、24時間待ってみましょう。時間がたつと、多くの「欲しい」は落ち着きます。</p>' +
      '<label class="field"><span>欲しいもの</span><input class="input" id="w-name" maxlength="24" placeholder="例：ワイヤレスイヤホン" autocomplete="off"></label>' +
      '<label class="field"><span>値段</span><span class="input-yen"><input class="input" id="w-price" inputmode="numeric" placeholder="15000"></span></label>' +
      '<div class="field"><span>グループ</span><div class="chips">' + visibleGroups().map((g) => '<button type="button" class="chip" data-wg="' + g.id + '" aria-pressed="' + (g.id === gid) + '">' + g.e + " " + g.s + "</button>").join("") + "</div></div>" +
      '<div class="err" id="w-err"></div><div class="actions"><button type="button" class="btn primary block" id="w-save">24時間待ってみる</button></div>', {
      label: "欲しいもの",
      mount: (sh) => {
        sh.addEventListener("click", (e) => { const b = e.target.closest("[data-wg]"); if (b) { gid = b.dataset.wg; $$("[data-wg]", sh).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); } });
        $("#w-save", sh).addEventListener("click", () => {
          const name = $("#w-name", sh).value.trim(), price = toInt($("#w-price", sh).value);
          if (!name) return ($("#w-err", sh).textContent = "欲しいものを入力してください");
          if (!(price > 0) || price > 1000000) return ($("#w-err", sh).textContent = "値段は1〜1,000,000円で入力してください");
          state.wishes.push({ id: uid(), name, price, group: gid, t: now(), due: now() + WISH_WAIT, status: "wait" });
          save(); closeSheet(); renderView(curTab); toast("登録しました。24時間後に「まだ欲しい？」と聞きます");
        });
      },
    });
  }
  function resolveWish(id, how) {
    const w = state.wishes.find((x) => x.id === id); if (!w || w.status !== "wait") return;
    if (how === "quit") {
      if (now() < w.due) { toast("24時間たってから「やめた」にできます"); return; }
      const r = addSave({ group: w.group, amount: w.price, label: w.name, src: "wish", skipGap: true, skipGroupCap: true, srcEl: $("#wish-due .btn.primary") });
      if (!r) return;
      w.status = "saved"; w.resolvedAt = now(); w.recId = r.id; save();
      setTimeout(() => toast("🧊 よく我慢しました！ +" + WISH_XP + "XP"), 900);
      renderView(curTab);
    } else if (how === "keep") { w.due = now() + WISH_WAIT; w.extended = true; save(); renderView(curTab); toast("あと24時間、待ってみましょう"); }
    else if (how === "bought") { w.status = "bought"; w.resolvedAt = now(); save(); renderView(curTab); toast("記録しました。納得して買えたなら、それも大事な選択です"); }
    else if (how === "del") { state.wishes = state.wishes.filter((x) => x.id !== id); save(); renderView(curTab); toast("リストから消しました"); }
  }

  // ======================================================================
  // 森とキャラクター
  // ======================================================================
  const ANIMALS = [[2, "🍄"], [3, "🌼"], [5, "🐿️"], [8, "🐦"], [12, "🦊"], [18, "🦉"], [25, "🐻"], [35, "🦌"]];
  function charUnlocked(id) {
    switch (id) {
      case "mori": return true;
      case "sakura": return xpInfo().lv >= 10;
      case "yoru": return sum(state.records.filter((r) => r.type === "timer"), (r) => r.minutes || 0) >= 300;
      case "kin": return sum(state.transfers, (x) => x.amount) >= 30000;
      case "hoshi": return ultraWins() > 0;
      case "niji": return xpInfo().lv >= 40;
    }
    return false;
  }
  function unlockedChars() { return window.GCArt ? GCArt.CHARACTERS.filter((c) => charUnlocked(c.id)) : []; }
  function forestTrees(total) {
    const n = Math.min(GCArt.MAX_TREES, Math.floor(total / GCArt.YEN_PER_TREE));
    const br = itemBreakdown(), tot = sum(br, (d) => d.v) || 1;
    const al = br.map((d) => ({ kind: groupById(d.id).tree, exact: (n * d.v) / tot }));
    al.forEach((a) => (a.k = Math.floor(a.exact)));
    let rem = n - sum(al, (a) => a.k);
    al.slice().sort((a, b) => b.exact - b.k - (a.exact - a.k)).forEach((a) => { if (rem > 0) { a.k++; rem--; } });
    const out = []; let more = true;
    while (out.length < n && more) { more = false; al.forEach((a) => { if (a.k > 0) { out.push({ kind: a.kind }); a.k--; more = true; } }); }
    return out;
  }
  function advantage() {
    const L = xpInfo().lv, r = (L - 1) / 49;
    return { level: L, ratio: r, climbSec: Math.round(30 * r), chessHints: Math.round(5 * r), chessUndo: Math.round(3 * r), arenaHp: Math.round(50 * r), arenaDmg: Math.round(30 * r),
      hints: Math.round(5 * r), undos: Math.round(3 * r), peek: Math.round(30 * r) / 10, paddle: Math.round(50 * r), moleSec: Math.round(10 * r), lives: Math.round(2 * r), undo2048: Math.round(3 * r), sudokuHints: Math.round(5 * r), coinMoves: Math.round(6 * r) };
  }
  const GAMES = [
    { id: "climb", e: "🧗", n: "クライミング", cat: "反射", d: "左手・右手を交互に押して、CPUより先に頂上へ。落石に注意。" },
    { id: "chess", e: "♟️", n: "チェス", cat: "頭脳", d: "キャスリングや昇格もある本格ルール。友だちとリンクで対戦も。" },
    { id: "arena", e: "⚔️", n: "アリーナバトル", cat: "反射", d: "ドラッグで動いて撃ち合う1対1。草むらに隠れて必殺技も。" },
    { id: "reversi", e: "⚫", n: "リバーシ", cat: "頭脳", d: "はさんで裏返す定番の陣取り。角を取ると有利。" },
    { id: "gomoku", e: "⚪", n: "五目並べ", cat: "頭脳", d: "縦・横・ななめに5つ並べたら勝ち。短い時間で1局。" },
    { id: "shogi", e: "☗", n: "ミニ将棋", cat: "頭脳", d: "5×5の盤で遊ぶ本格的な将棋。取った駒は打てます。" },
    { id: "memory", e: "🃏", n: "神経衰弱", cat: "頭脳", d: "CPUと交代でめくって、同じ絵のペアを多く集めます。" },
    { id: "breakout", e: "🧱", n: "ブロック崩し", cat: "反射", d: "CPUより先にブロックを全部消せたら勝ち。" },
    { id: "mole", e: "🔨", n: "もぐらたたき", cat: "反射", d: "出てきたもぐらをたたいて、CPUより高い点数を。" },
    { id: "runner", e: "🏃", n: "ランナー", cat: "反射", d: "タップでジャンプ。障害物をよけてCPUより先にゴール。" },
    { id: "g2048", e: "🔢", n: "2048", cat: "パズル", d: "同じ数字を合体。CPUより少ない手数で目標の数字へ。" },
    { id: "sudoku", e: "🔠", n: "ナンプレ", cat: "パズル", d: "縦・横・3×3に1〜9を1つずつ。CPUより先に解けたら勝ち。" },
    { id: "coin", e: "🪙", n: "お金パズル", cat: "パズル", d: "同じ硬貨を3つ並べて消して貯金。CPUより多く貯めたら勝ち。" },
  ];
  const gameById = (id) => GAMES.find((g) => g.id === id);
  function advText(id, a) {
    a = a || advantage();
    return {
      climb: "CPUが <b>" + a.climbSec + "秒</b> おくれてスタート（最大30秒）",
      chess: "ヒント <b>" + a.chessHints + "回</b>・待った <b>" + a.chessUndo + "回</b>（最大5回・3回）",
      arena: "HP <b>+" + a.arenaHp + "%</b>・攻撃 <b>+" + a.arenaDmg + "%</b>（最大+50%・+30%）",
      reversi: "ヒント <b>" + a.hints + "回</b>・待った <b>" + a.undos + "回</b>（最大5回・3回）",
      gomoku: "ヒント <b>" + a.hints + "回</b>・待った <b>" + a.undos + "回</b>（最大5回・3回）",
      shogi: "ヒント <b>" + a.hints + "回</b>・待った <b>" + a.undos + "回</b>（最大5回・3回）",
      memory: "最初に全部のカードを <b>" + a.peek + "秒</b> 見られる（最大3秒）",
      breakout: "パドルが <b>" + a.paddle + "%</b> 大きい（最大50%）",
      mole: "制限時間が <b>+" + a.moleSec + "秒</b>（最大+10秒。CPUは30秒のまま）",
      runner: "ライフ <b>+" + a.lives + "</b>（最大+2）",
      g2048: "1手もどす <b>" + a.undo2048 + "回</b>（最大3回）",
      sudoku: "ヒント <b>" + a.sudokuHints + "回</b>（最大5回）",
      coin: "手数 <b>+" + a.coinMoves + "手</b>（最大+6手。CPUは増えません）",
    }[id];
  }
  const DIFF_DESC = { easy: "はじめての人向け", normal: "ちょうどいい手ごたえ", hard: "かなり強い", ultra: "ほぼ勝てない。高レベル＋腕をきわめた人向け" };
  function gameRec(id) { return state.games[id] || {}; }
  function gamePlays(id) { return sum(Object.values(gameRec(id)), (d) => (d && d.plays) || 0); }
  function gameWins(id) { return sum(Object.values(gameRec(id)), (d) => (d && d.wins) || 0); }
  function todayGameXp() { return ((state.gameDay[dkey(now())] || {}).xp) || 0; }
  function renderGames() {
    const el = $("#view-games");
    const a = advantage(), gx = todayGameXp();
    let h = '<h1 class="h-title">ゲーム</h1>';
    h += '<div class="card games-head"><div class="row" style="gap:12px;align-items:center"><div class="gh-char">' + GCArt.charSvg(state.selectedChar, a.level, { size: 56 }) + '</div><div class="grow"><div class="small muted">Lv.' + a.level + "・" + esc(GCArt.charById(state.selectedChar).name) + '</div><b>レベルが高いほどゲームで有利</b><div class="small muted">我慢でレベルを上げると、ヒントや時間が増えます。</div></div></div>' +
      '<div class="verify-line" style="margin-top:12px"><span>今日のゲームXP</span><span class="vbar"><i style="width:' + Math.min(100, (gx / GAME_XP_CAP) * 100).toFixed(0) + '%"></i></span><span class="num">' + gx + " / " + GAME_XP_CAP + "</span></div></div>";
    ["頭脳", "反射", "パズル"].forEach((cat) => {
      h += '<div class="sec-title"><span>' + { 頭脳: "頭を使う", 反射: "反射神経", パズル: "パズル" }[cat] + '</span></div><div class="game-grid">';
      GAMES.filter((g) => g.cat === cat).forEach((g) => {
        const p = gamePlays(g.id), w = gameWins(g.id);
        h += '<button type="button" class="game-card" data-act="game" data-game="' + g.id + '"><span class="gc-e" aria-hidden="true">' + g.e + '</span><span class="gc-n">' + g.n + '</span><span class="gc-r num">' + (p ? w + "勝 / " + p + "回" : "まだ遊んでいません") + "</span></button>";
      });
      h += "</div>";
    });
    h += '<p class="foot">勝つとXP（弱い+3・中+6・強い+12・ウルトラ最強+30）。ゲームのXPは1日' + GAME_XP_CAP + 'までなので、レベルの中心はあくまで我慢です。<br>課金でゲームが有利になることはありません。</p>';
    el.innerHTML = h;
  }
  function openGameMenu(id) {
    const g = gameById(id); if (!g) return;
    const rec = gameRec(id), a = advantage();
    const friend = id === "chess" ? '<div class="sec-title"><span>友だちと対戦（リンクで交代）</span></div><div class="actions" style="margin-top:0">' + (window.GFChess && GFChess.hasFriendGame() ? '<button type="button" class="btn block" data-fr="resume">♟️ 友だち対戦の続き</button>' : "") + '<button type="button" class="btn block" data-fr="new">🔗 新しく友だちと対戦する</button></div>' : "";
    openSheet("<h2>" + g.e + " " + g.n + '</h2><p class="small muted">' + g.d + '</p><div class="adv-box">Lv.' + a.level + " のあなたの有利：" + advText(id, a) + "</div>" +
      '<div class="diff-list">' + DIFFS.map((d) => { const r = rec[d.id] || { plays: 0, wins: 0 }; return '<button type="button" class="diff-btn ' + d.id + '" data-diff="' + d.id + '"><span class="grow"><b>' + d.name + "</b><small>" + DIFF_DESC[d.id] + '</small></span><span class="diff-r num">勝ち +' + GAME_WIN_XP[d.id] + "XP<br>" + (r.wins || 0) + "勝/" + (r.plays || 0) + "回</span></button>"; }).join("") + "</div>" + friend, {
      label: g.n,
      mount: (sh) => sh.addEventListener("click", (e) => {
        const b = e.target.closest("[data-diff]");
        if (b) { closeSheet(true); startGame(id, b.dataset.diff); return; }
        const fr = e.target.closest("[data-fr]");
        if (fr && fr.dataset.fr === "resume") { closeSheet(true); GFChess.resumeFriend(); }
        if (fr && fr.dataset.fr === "new") openFriendNew();
      }),
    });
  }
  function openFriendNew() {
    openSheet('<h2>♟️ 友だちとチェス</h2><p class="small muted">あなたが白で先手です。1手指したら、リンクをLINEなどで友だちに送ってください。友だちが開いて1手指し、またリンクを送り返す…のくり返しです。サーバーは使いません。</p><label class="field"><span>あなたの名前（相手に表示）</span><input class="input" id="fr-name" maxlength="12" value="' + esc(state.settings.nick || "") + '" placeholder="例：けい" autocomplete="off"></label><div class="actions"><button type="button" class="btn primary block" id="fr-start">はじめる</button></div>', {
      mount: (sh) => $("#fr-start", sh).addEventListener("click", () => {
        const n = $("#fr-name", sh).value.trim().slice(0, 12);
        if (n) { state.settings.nick = n; save(); }
        closeSheet(true); GFChess.startFriendGame(n);
      }),
    });
  }
  function startGame(id, diff) {
    if (id === "climb") window.GFGames.openClimb(diff);
    else if (id === "arena") window.GFGames.openArena(diff);
    else if (id === "chess") window.GFChess.open({ diff });
    else if (window.GCGames && GCGames.open[id]) GCGames.open[id](diff);
  }
  // ゲーム画面（全画面レイヤー）
  let layerOnClose = null;
  function openLayer(title, onClose) {
    if (layerOnClose) { const f = layerOnClose; layerOnClose = null; try { f(); } catch (e) {} }
    $("#gl-title").textContent = title;
    $("#gl-result").hidden = true;
    $("#gl-body").innerHTML = "";
    $("#game-layer").hidden = false;
    document.body.classList.add("in-game");
    layerOnClose = onClose || null;
    return $("#gl-body");
  }
  function closeLayer() {
    if (layerOnClose) { const f = layerOnClose; layerOnClose = null; try { f(); } catch (e) {} }
    if (window.GFGames) GFGames.stop();
    if (window.GCGames) GCGames.stop();
    $("#game-layer").hidden = true;
    $("#gl-body").innerHTML = "";
    $("#gl-result").hidden = true;
    document.body.classList.remove("in-game");
    renderAll();
  }
  function showResult(o) {
    const box = $("#gl-result");
    let rw = "";
    if (o.reward) {
      if (o.win) {
        rw = '<p class="res-reward">+' + o.reward.xp + " XP</p>";
        if (o.reward.capped) rw += '<p class="small muted">今日のゲームXPは上限（' + GAME_XP_CAP + "）に達しました。続きは我慢でレベルを上げましょう。</p>";
      } else rw = '<p class="small muted">負けてもXPは減りません。レベルを上げるとゲームで有利になります。</p>';
    }
    box.innerHTML = '<div class="res-card" role="dialog" aria-label="結果"><div class="res-emoji">' + (o.win ? "🏆" : o.draw ? "🤝" : "🌧️") + "</div><h3>" + esc(o.title) + "</h3><p>" + esc(o.text || "") + "</p>" + rw +
      '<div class="actions two"><button type="button" class="btn" id="res-close">ゲーム一覧へ</button><button type="button" class="btn primary" id="res-retry">もう一回</button></div></div>';
    box.hidden = false;
    $("#res-close").addEventListener("click", closeLayer);
    $("#res-retry").addEventListener("click", () => { box.hidden = true; if (o.onRetry) o.onRetry(); });
    if (o.win) sound("fanfare");
  }
  function reportGame(game, diff, win, extra = {}) {
    const k = dkey(now());
    const gd = state.gameDay[k] && typeof state.gameDay[k] === "object" ? state.gameDay[k] : { xp: 0, wins: 0, plays: 0 };
    gd.plays = (+gd.plays || 0) + 1;
    if (win) gd.wins = (+gd.wins || 0) + 1;
    state.gameDay[k] = gd;
    state.games[game] = state.games[game] && typeof state.games[game] === "object" ? state.games[game] : {};
    const rec = state.games[game][diff] || { plays: 0, wins: 0 };
    rec.plays += 1; if (win) rec.wins += 1;
    state.games[game][diff] = rec;
    let xp = 0, capped = false;
    if (win) {
      const base = GAME_WIN_XP[diff] || 3;
      xp = Math.max(0, Math.min(base, GAME_XP_CAP - (+gd.xp || 0)));
      capped = xp < base;
      gd.xp = (+gd.xp || 0) + xp;
    }
    // 古いゲーム日次データは集計して残す（XPは消さない）
    save();
    afterChange({ noRender: true, silent: true });
    return { xp, capped };
  }
  function copyText(text) {
    const done = () => toast("リンクをコピーしました");
    const fb = () => { const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("長押しでコピーしてください"); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fb); else fb();
  }
  window.GF = {
    toast: (m) => toast(esc(m)),
    esc,
    advantage: () => advantage(),
    charImage: () => GCArt.charImage(state.selectedChar, xpInfo().lv),
    diffName: (id) => (DIFFS.find((d) => d.id === id) || DIFFS[1]).name,
    DIFFS,
    openLayer, closeLayer, showResult, reportGame, copyText,
    getNick: () => state.settings.nick || "",
    sound: (k) => sound(k), haptic: (p) => haptic(p),
  };
  function handleHash() {
    const h = location.hash || "";
    if (h.startsWith("#chess=")) {
      const code = h.slice(7);
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (window.GFChess) GFChess.openFromHash(code);
      return true;
    }
    return false;
  }
  window.addEventListener("hashchange", handleHash);

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) { go(tab.dataset.tab); return; }
    const b = e.target.closest("[data-act]");
    if (!b || b.closest("#onboarding")) return;
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case "tap": tapItem(id, b); break;
      case "group": openGroup(b.dataset.g, b); break;
      case "fav": { const x = favByKey(b.dataset.key); if (x) addSave({ group: x.group, amount: x.amount, label: x.rawLabel, src: "fav", srcEl: b }); break; }
      case "fav-menu": favMenu(b.dataset.key); break;
      case "suggest": tapSuggest(b); break;
      case "sg-hide": state.dismiss["sg-" + dkey(now()) + "-" + new Date().getHours()] = now(); save(); renderHome(); break;
      case "wish-add": openWishForm(); break;
      case "wish-quit": resolveWish(id, "quit"); break;
      case "wish-keep": resolveWish(id, "keep"); break;
      case "wish-bought": resolveWish(id, "bought"); break;
      case "wish-del": confirmSheet("リストから消しますか？", "貯金にはなりません（24時間たって「やめた」を押すと貯金になります）。", "消す", () => resolveWish(id, "del")); break;
      case "char": if (charUnlocked(id)) { state.selectedChar = id; save(); renderGrowth(); toast(esc(GCArt.charById(id).name) + "といっしょに進みます"); } else toast("🔒 " + esc(GCArt.charById(id).how) + "と会えます"); break;
      case "go-games": go("games"); break;
      case "game": openGameMenu(b.dataset.game); break;
      case "item-menu": itemMenu(id); break;
      case "add-item": openItemForm(null); break;
      case "open-items": openItemsList(); break;
      case "slip": openSlip(); break;
      case "timer": openTimerSheet(activeItems().find((i) => i.pid === "phone") || null); break;
      case "open-transfer": openTransfer(); break;
      case "transfer-full": { const s = weekSummary(b.dataset.wk); addTransfer(b.dataset.wk, s.remaining); sound("soft"); haptic(10); afterChange(); toast("✅ " + yen(s.remaining) + " を移した記録をつけました。本物の貯金です。"); break; }
      case "dismiss-transfer": state.dismiss["tr-" + b.dataset.wk] = now(); save(); renderHome(); toast("また来週お知らせします。分析画面からいつでも記録できます。"); break;
      case "dismiss-a2hs": state.dismiss.a2hs = now(); save(); renderHome(); break;
      case "open-plans": openPlans(); break;
      case "range": statRange = +b.dataset.n; renderStats(); break;
      case "del-record": { const r = state.records.find((x) => x.id === id); if (r) confirmSheet("この記録を削除しますか？", "間違えて記録したときに使ってください。", "削除する", () => { state.records = state.records.filter((x) => x.id !== id); save(); afterChange(); toast("削除しました"); }); break; }
      case "report": openReport(); break;
      case "add-goal": openGoalForm(null); break;
      case "edit-goal": openGoalForm(id); break;
      case "alloc": openAlloc(); break;
      case "goal-complete": completeGoal(id); break;
      case "premium": openPremium(); break;
      case "theme": state.settings.theme = b.dataset.v; save(); applyTheme(); renderSettings(); break;
      case "accent": state.settings.accent = b.dataset.v; save(); applyTheme(); renderSettings(); break;
      case "goalbase": state.settings.goalBase = b.dataset.v; save(); afterChange(); break;
      case "export": exportData(); break;
      case "import": $("#import-file").click(); break;
      case "reset": openReset(); break;
      case "age": openAge(); break;
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "set-sound") { state.settings.sound = t.checked; save(); if (t.checked) sound("coin"); }
    if (t.id === "set-haptic") { state.settings.haptic = t.checked; save(); haptic(15); }
    if (t.id === "set-tbox") { state.settings.tobaccoBox = clamp(toInt(t.value) || 600, 100, 5000); save(); renderSettings(); toast("タバコ1箱を " + yen(state.settings.tobaccoBox) + " にしました"); }
    if (t.id === "set-tper") { state.settings.tobaccoPer = clamp(toInt(t.value) || 20, 1, 40); save(); renderSettings(); }
    if (t.id === "set-hourly") { state.settings.hourly = clamp(toInt(t.value), 0, 100000); t.value = state.settings.hourly; save(); toast("時給換算を " + yen(state.settings.hourly) + " にしました"); }
    if (t.id === "import-file" && t.files && t.files[0]) { const f = t.files[0]; if (f.size > 5e6) { toast("ファイルが大きすぎます"); return; } f.text().then(importText); t.value = ""; }
  });
  $("#pill-level").addEventListener("click", () => go("growth"));
  $("#pill-streak").addEventListener("click", () => go("growth"));
  window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });
  let rz = null;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (curTab === "stats") { drawBars(); drawLine(); } }, 150); });
  $("#gl-close").addEventListener("click", () => closeLayer());
  // 1分ごとに「欲しいもの」の時間をチェック
  setInterval(() => { if (curTab === "home" && !sheetStack && $("#game-layer").hidden && state.onboarded && waitingWishes().length) renderHome(); }, 60000);

  // ---------- init ----------
  function init() {
    applyTheme();
    renderAll();
    if (!state.onboarded) startOnboarding();
    if (state.timer) setTimeout(() => timerFail("reload"), 300);
    else if (state.timerFail) setTimeout(() => showTimerFail(state.timerFail.reason), 300);
    state.lastLv = state.lastLv || xpInfo().lv;
    if (state.onboarded) afterChange({ silent: true, noRender: true });
    handleHash();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded && !state.timer) { reloaded = true; location.reload(); } });
      window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").then((r) => r.update()).catch(() => {}));
    }
  }
  // テスト・デバッグ用（外部には何も送信しません）
  window.GamanApp = {
    version: VERSION,
    get state() { return state; },
    load(s) { state = migrate(JSON.parse(JSON.stringify(s))); save(); shownTotal = null; if (state.onboarded) hideOnboarding(); renderAll(); if (state.onboarded) afterChange({ silent: true, noRender: true }); },
    totals, streakInfo, xpInfo, missionStatus, goalProgress, verifyMap,
    favorites, suggestion, advantage, unlockedChars, forestTrees, startGame, closeLayer, go, GAMES, migrate: (s) => migrate(JSON.parse(JSON.stringify(s))),
    addSave: (o) => addSave(o),
    reportBlob: () => new Promise((res) => drawReport(weekStart(now())).toBlob(res, "image/png")),
    exportJSON: () => JSON.stringify({ app: "gaman-chokin", version: VERSION, data: state }),
    importText,
  };
  init();
})();
