/* 我慢貯金 v1.0.0 — データはすべてこの端末（localStorage）にだけ保存されます */
(() => {
  "use strict";

  const VERSION = "1.0.0";
  const KEY = "gaman-chokin:v1";
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
  };
  const ic = (n, cls = "") => '<svg class="i ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + "</svg>";

  // ---------- presets ----------
  const PRESETS = [
    { pid: "conveni", emoji: "🏪", name: "コンビニのついで買い", price: 500, cap: 3 },
    { pid: "coffee", emoji: "☕", name: "カフェ・コーヒー", price: 450, cap: 3 },
    { pid: "drink", emoji: "🥤", name: "自販機の飲み物", price: 160, cap: 5 },
    { pid: "snack", emoji: "🍰", name: "お菓子・スイーツ", price: 300, cap: 4 },
    { pid: "lunch", emoji: "🍱", name: "外食・ランチ", price: 1000, cap: 2 },
    { pid: "delivery", emoji: "🛵", name: "フードデリバリー", price: 2000, cap: 2 },
    { pid: "impulse", emoji: "🛍️", name: "衝動買い・ネット通販", price: 3000, cap: 3 },
    { pid: "gacha", emoji: "🎮", name: "スマホ課金・ガチャ", price: 1500, cap: 3 },
    { pid: "taxi", emoji: "🚕", name: "タクシー", price: 1500, cap: 3 },
    { pid: "phone", emoji: "📱", name: "スマホ・SNS（時間）", price: 0, minutes: 30, cap: 6 },
    { pid: "tobacco", emoji: "🚬", name: "タバコ（1箱）", price: 600, cap: 3, adult: true },
    { pid: "alcohol", emoji: "🍺", name: "お酒（家飲み・コンビニ）", price: 400, cap: 3, adult: true },
    { pid: "nomikai", emoji: "🍻", name: "飲み会・二次会", price: 4000, cap: 1, adult: true },
  ];
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
    settings: { sound: true, haptic: true, theme: "system", accent: "teal", hourly: 1000, goalBase: "saved", timerMin: 30 },
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
  });
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return migrate(JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }
  function migrate(s) {
    const d = defaultState();
    const out = Object.assign(d, s || {});
    out.settings = Object.assign(defaultState().settings, (s && s.settings) || {});
    ["items", "records", "transfers", "goals", "plans"].forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    ["badges", "missionDone", "flags", "dismiss"].forEach((k) => { if (!out[k] || typeof out[k] !== "object") out[k] = {}; });
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
    const xp = Math.floor(t.verifiedSaved / 10) + Math.floor((unverified / 10) * 0.3) + timerMin + missionXp;
    let lv = 1;
    while (lv < 50 && xp >= lvNeed(lv + 1)) lv++;
    const cur = lvNeed(lv), next = lv >= 50 ? cur : lvNeed(lv + 1);
    return { xp, lv, cur, next, pct: lv >= 50 ? 1 : (xp - cur) / (next - cur), title: titleFor(lv) };
  }
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
      kinds: new Set(money.map((r) => r.itemId)).size,
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
  ];
  // ---------- rate limit ----------
  const MIN_GAP_MS = 15000;
  const DAILY_TOTAL_CAP = 60;
  function todayCount(itemId) {
    const sd = startOfDay(now());
    return state.records.filter((r) => r.type === "save" && r.itemId === itemId && r.t >= sd).length;
  }
  function tapBlock(item) {
    const sd = startOfDay(now());
    const cap = item.cap || 3;
    if (todayCount(item.id) >= cap) return "「" + item.name + "」は今日" + cap + "回記録しました。1日の上限は項目の編集で変えられます。";
    const last = state.records.filter((r) => r.type === "save" && r.itemId === item.id).reduce((a, r) => Math.max(a, r.t), 0);
    if (now() - last < MIN_GAP_MS) return "連続タップを防ぐため、同じ項目は少し間をあけてから記録してください。";
    if (state.records.filter((r) => r.type === "save" && r.t >= sd).length >= DAILY_TOTAL_CAP) return "今日はもう十分に記録しました。続きはまた明日。";
    return null;
  }

  // ---------- tabs ----------
  const TABS = [
    { id: "home", n: "ホーム", i: "home" },
    { id: "stats", n: "分析", i: "chart" },
    { id: "goals", n: "目標", i: "target" },
    { id: "growth", n: "実績", i: "award" },
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
  }
  function renderView(tab) {
    ({ home: renderHome, stats: renderStats, goals: renderGoals, growth: renderGrowth, settings: renderSettings }[tab] || renderHome)();
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

    // if-then 作戦
    const plans = state.plans.filter((x) => x.active !== false).slice(-3).reverse();
    if (plans.length) {
      h += '<div class="sec-title"><span>今日の作戦</span><button type="button" class="link" data-act="open-plans">見直す</button></div><div class="card">' +
        plans.map((x) => '<div class="plan"><div class="b-ico" style="width:34px;height:34px;border-radius:10px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:none">' + ic("bulb", "sm") + '</div><div><div class="plan-if">もし「' + esc(x.trigger) + "」になったら</div><div class=\"plan-then\">" + esc(x.action) + "</div></div></div>").join("") + "</div>";
    }

    // アイテム
    h += '<div class="sec-title"><span>我慢した？ タップで貯金</span><button type="button" class="link" data-act="open-items">編集</button></div>';
    h += '<div class="items" id="items">';
    items.forEach((it) => {
      const c = todayCount(it.id);
      const limited = c >= (it.cap || 3);
      const timeOnly = !it.price && it.minutes;
      h += '<div class="item' + (limited ? " limited" : "") + '" data-item="' + it.id + '">' +
        '<button type="button" class="item-hit" data-act="tap" data-id="' + it.id + '" aria-label="' + esc(it.name) + (timeOnly ? "、タイマーで挑戦" : "、" + yen(it.price) + "を我慢した") + '"></button>' +
        (c ? '<span class="item-count num">今日 ' + c + "</span>" : "") +
        '<button type="button" class="item-more" data-act="item-menu" data-id="' + it.id + '" aria-label="' + esc(it.name) + 'のメニュー">' + ic("more", "sm") + "</button>" +
        '<div class="item-emoji" aria-hidden="true">' + esc(it.emoji) + "</div>" +
        '<div><div class="item-name">' + esc(it.name) + (it.adult ? '<span class="item-tag">20+</span>' : "") + "</div>" +
        '<div class="item-price num">' + (timeOnly ? ic("timer", "xs") + " " + it.minutes + "分チャレンジ" : yen(it.price) + (it.minutes ? " ・ " + it.minutes + "分" : "")) + "</div></div></div>";
    });
    h += '<button type="button" class="item add" data-act="add-item">' + ic("plus") + "<span>項目を追加</span></button></div>";
    h += '<div class="slip-row"><button type="button" class="btn sm ghost" data-act="slip">' + ic("refresh", "sm") + "使っちゃった…を記録</button></div>";
    // 入金の確認バナー
    const tb = transferPrompt();
    if (tb) {
      h += '<div class="banner" id="transfer-banner"><div class="b-ico">' + ic("bank") + '</div><div class="grow"><p><b>' + tb.label + "の我慢分 " + yen(tb.remaining) + "</b> を貯金口座や貯金箱に移しましたか？</p>" +
        '<p class="small muted">移した分だけ ✅ になり、アプリの数字が本物のお金になります。</p>' +
        '<div class="b-actions"><button type="button" class="btn sm primary" data-act="transfer-full" data-wk="' + tb.wk + '">' + yen(tb.remaining) + " 移した</button>" +
        '<button type="button" class="btn sm" data-act="open-transfer">金額を変える</button><button type="button" class="btn sm ghost" data-act="dismiss-transfer" data-wk="' + tb.wk + '">あとで</button></div></div></div>';
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
    h += '<div class="sec-title"><span>項目ごとの内訳</span></div><div class="card"><div class="donut-row"><canvas id="chart-donut" width="132" height="132" role="img" aria-label="項目ごとの割合"></canvas><div class="grow legend" id="legend"></div></div></div>';

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
    h += '<div class="small faint" style="margin-bottom:4px">✅ 実際に移した分　△ まだ移していない分</div>';
    recs.forEach((r) => {
      const day = dkey(r.t);
      if (day !== lastDay) { if (lastDay) h += "</ul>"; h += '<div class="h-day">' + mdwLabel(r.t) + '</div><ul class="hist">'; lastDay = day; }
      const it = itemById(r.itemId) || { emoji: r.type === "timer" ? "⏱️" : "•", name: r.name || "削除した項目" };
      let name = esc(it.name), amt = "", mark = "";
      if (r.type === "save") { amt = "+" + yen(r.amount); mark = r.amount > 0 ? (vm[r.id] ? '<span class="mark ok">✅</span>' : '<span class="mark tri">△</span>') : ""; if (!r.amount && r.minutes) amt = "+" + minLabel(r.minutes); }
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
    let h = '<h1 class="h-title">実績</h1>';
    h += '<div class="card level-card"><div class="level-badge"><div><span>Lv.</span><b class="num">' + x.lv + '</b></div></div><div class="grow"><div class="small muted">称号</div><div style="font-weight:700;font-size:17px">' + esc(x.title) + '</div><div class="xpbar"><i style="width:' + (x.pct * 100).toFixed(1) + '%"></i></div><div class="small muted num" style="margin-top:4px">' + (x.lv >= 50 ? "最高レベル" : fmt(x.xp) + " / " + fmt(x.next) + " XP") + "</div></div></div>";
    h += '<div class="note">XPは<b>実際に移した我慢額</b>が満額（10円=1XP）、まだ移していない分は3割、タイマー1分=1XP、ミッションで増えます。プレミアムでも強さは買えません。</div>';

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
      '<button type="button" class="li" data-act="open-items"><span class="li-ico">🧾</span><span class="li-t">我慢する項目と金額<span class="li-s">' + activeItems().length + "件・金額や1日の上限を編集</span></span>" + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="open-plans"><span class="li-ico">' + ic("bulb", "sm") + '</span><span class="li-t">「もし〜なら」作戦<span class="li-s">' + state.plans.length + "件</span></span>" + ic("chev", "sm chev") + "</button>" +
      '<button type="button" class="li" data-act="open-transfer"><span class="li-ico">' + ic("bank", "sm") + '</span><span class="li-t">実際の入金の記録</span>' + ic("chev", "sm chev") + "</button>" +
      '<label class="li"><span class="li-ico">' + ic("clock", "sm") + '</span><span class="li-t">時間の価値（時給換算）<span class="li-s">取り戻した時間をお金に換算する目安</span></span><span class="input-yen" style="width:120px"><input class="input" id="set-hourly" inputmode="numeric" value="' + st.hourly + '" aria-label="時給"></span></label>' +
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
      '<div class="li"><span class="li-ico">' + ic("shield", "sm") + '</span><span class="li-t">プライバシー<span class="li-s">記録はすべてこの端末の中だけに保存され、外部に送信されません。ログインも広告もありません。</span></span></div>' +
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
    const block = tapBlock(it);
    if (block) { toast(block); haptic([8, 40, 8]); return; }
    const before = totals().total;
    const r = { id: uid(), t: now(), type: "save", itemId: it.id, amount: it.price, minutes: it.minutes || 0 };
    state.records.push(r);
    save();
    sound("coin"); haptic(14);
    const hadFocus = srcEl && document.activeElement === srcEl;
    coinFly(srcEl, it.price);
    // 再描画（合計は前の値から数える）
    shownTotal = before;
    afterChange({ homePartial: true, toastDelay: 600 });
    const nItem = $('.item[data-item="' + it.id + '"]');
    if (nItem) { ripple(nItem); if (hadFocus) nItem.querySelector(".item-hit").focus({ preventScroll: true }); }
    rollTo(before, before + it.price);
    shownTotal = before + it.price;
    if (lastUndo) lastUndo.close();
    lastUndo = toast(esc(it.emoji) + " " + esc(it.name) + " <b>" + yen(it.price) + "</b> を貯金しました", { action: "取り消す", duration: 5000, onAction: () => undoRecord(r.id) });
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
    return '<h2>' + (isNew ? "項目を追加" : "項目を編集") + "</h2>" +
      (isNew ? '<div class="field"><span>よくある項目から</span><div class="chips">' + PRESETS.filter((p) => (!p.adult || state.adult) && !state.items.some((i) => i.pid === p.pid && !i.archived)).map((p) => '<button type="button" class="chip" data-preset="' + p.pid + '">' + p.emoji + " " + esc(p.name) + "</button>").join("") + "</div></div>" : "") +
      '<div class="field"><span>アイコン</span><div class="emoji-pick" id="f-emoji">' + EMOJIS.map((e) => '<button type="button" data-e="' + e + '" aria-pressed="' + (e === it.emoji) + '" aria-label="' + e + '">' + e + "</button>").join("") + "</div></div>" +
      '<label class="field"><span>名前</span><input class="input" id="f-name" maxlength="24" value="' + esc(it.name) + '" placeholder="例：コンビニスイーツ"></label>' +
      '<div class="row" style="gap:10px"><label class="field grow"><span>1回あたりの金額</span><span class="input-yen"><input class="input" id="f-price" inputmode="numeric" value="' + it.price + '"></span></label>' +
      '<label class="field" style="width:120px"><span>時間（任意）</span><span class="input-yen input-min"><input class="input" id="f-min" inputmode="numeric" value="' + (it.minutes || 0) + '"></span></label></div>' +
      '<label class="field"><span>1日に記録できる上限（連打防止）</span><input class="input" id="f-cap" type="number" min="1" max="20" inputmode="numeric" value="' + (it.cap || 3) + '"></label>' +
      (state.adult ? '<label class="li" style="padding:12px 0"><span class="li-t">20歳以上向けの項目（タバコ・お酒など）</span>' + sw("f-adult", it.adult, "20歳以上向け") + "</label>" : "") +
      '<div class="err" id="f-err"></div>' +
      '<div class="note">金額0円・時間ありの項目（スマホなど）は、タップするとタイマー挑戦になります。</div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="f-save">保存する</button>' + (isNew ? "" : '<button type="button" class="btn danger block" id="f-del">' + ic("trash", "sm") + "この項目を削除</button>") + "</div>";
  }
  function openItemForm(id) {
    const it = id ? itemById(id) : null;
    let emoji = it ? it.emoji : "💸";
    let pid = it ? it.pid : null;
    openSheet(itemFormHTML(it), {
      label: "項目の編集",
      mount: (sh) => {
        sh.addEventListener("click", (e) => {
          const eb = e.target.closest("[data-e]");
          if (eb) { emoji = eb.dataset.e; $$("[data-e]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === eb))); }
          const pb = e.target.closest("[data-preset]");
          if (pb) {
            const p = PRESETS.find((x) => x.pid === pb.dataset.preset);
            pid = p.pid; emoji = p.emoji;
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
          const data = { emoji, name, price, minutes, cap, adult: ad ? ad.checked : !!(it && it.adult) };
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
    openSheet('<h2>我慢する項目</h2><p class="small muted">金額は「だいたい1回いくら」でOK。あとからいつでも変えられます。</p><div class="list" style="box-shadow:none">' +
      its.map((i) => '<button type="button" class="li" data-edit="' + i.id + '"><span class="li-ico" style="background:var(--surface2)">' + esc(i.emoji) + '</span><span class="li-t">' + esc(i.name) + (i.adult ? '<span class="item-tag">20+</span>' : "") + '<span class="li-s num">' + (i.price ? yen(i.price) : "") + (i.minutes ? (i.price ? "・" : "") + i.minutes + "分" : "") + "・1日" + (i.cap || 3) + "回まで</span></span>" + ic("chev", "sm chev") + "</button>").join("") +
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
    const its = activeItems().filter((i) => i.price > 0);
    let sel = preId && itemById(preId) && itemById(preId).price > 0 ? preId : null;
    let trig = null, act = null;
    openSheet('<h2>使っちゃった…を記録</h2><p class="small muted">責めるための記録ではありません。正直に残すほど、自分のパターンが見えてきます。貯金額は減りません。</p>' +
      '<div class="field"><span>なにに使った？</span><div class="chips" id="s-items">' + its.map((i) => '<button type="button" class="chip" data-i="' + i.id + '" aria-pressed="' + (i.id === sel) + '">' + esc(i.emoji) + " " + esc(i.name) + "</button>").join("") + '<button type="button" class="chip" data-i="other" aria-pressed="false">その他</button></div></div>' +
      '<label class="field"><span>使った金額（任意）</span><span class="input-yen"><input class="input" id="s-amt" inputmode="numeric" value="' + (sel ? itemById(sel).price : "") + '"></span></label>' +
      '<div class="field"><span>きっかけは？（任意）</span><div class="chips" id="s-trig">' + TRIGGERS.map((t) => '<button type="button" class="chip" data-t="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>").join("") + "</div></div>" +
      '<div id="s-plan" hidden><div class="field"><span>次に同じ状況になったら、代わりに…</span><div class="chips">' + ACTIONS.map((a) => '<button type="button" class="chip" data-a="' + esc(a) + '" aria-pressed="false">' + esc(a) + "</button>").join("") + '</div><input class="input" id="s-act" style="margin-top:8px" maxlength="40" placeholder="自分で書く（例：コンビニの前を通らない道で帰る）"></div><p class="small muted">「もし〜なら、〜する」と決めておくと、同じ場面で迷いにくくなります。ホームに表示されます。</p></div>' +
      '<div class="actions"><button type="button" class="btn primary block" id="s-save">記録する</button></div>', {
      label: "使っちゃった記録",
      mount: (sh) => {
        sh.addEventListener("click", (e) => {
          const ib = e.target.closest("[data-i]");
          if (ib) { sel = ib.dataset.i; $$("[data-i]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b === ib))); const it = itemById(sel); $("#s-amt", sh).value = it ? it.price : ""; }
          const tb = e.target.closest("[data-t]");
          if (tb) { trig = trig === tb.dataset.t ? null : tb.dataset.t; $$("[data-t]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === trig))); $("#s-plan", sh).hidden = !trig; }
          const ab = e.target.closest("[data-a]");
          if (ab) { act = act === ab.dataset.a ? null : ab.dataset.a; $$("[data-a]", sh).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.a === act))); if (act) $("#s-act", sh).value = ""; }
        });
        $("#s-save", sh).addEventListener("click", () => {
          const custom = $("#s-act", sh).value.trim();
          const action = custom || act;
          const it = itemById(sel);
          state.records.push({ id: uid(), t: now(), type: "slip", itemId: it ? it.id : null, name: it ? null : "その他", amount: toInt($("#s-amt", sh).value), trigger: trig || null });
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
      '<p class="note">プレミアムで買えるのは「便利さ」と「見た目」だけです。レベルやXP、貯金額などの“強さ”はお金で増えません。現在、決済機能はありません。料金は予定で、変わる場合があります。</p>', { label: "プレミアム" });
  }

  // ---------- data ----------
  function exportData() {
    const payload = { app: "gaman-chokin", version: VERSION, exportedAt: new Date().toISOString(), data: state };
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
    const data = obj && obj.app === "gaman-chokin" ? obj.data : obj;
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
          localStorage.removeItem(KEY); state = defaultState(); shownTotal = null; closeSheet(true); curTab = "home"; renderAll(); startOnboarding(); toast("すべてのデータを消しました");
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
    moneySaves().forEach((r) => { by[r.itemId] = (by[r.itemId] || 0) + r.amount; });
    const arr = Object.entries(by).map(([id, v]) => { const it = itemById(id) || { emoji: "•", name: "削除した項目" }; return { id, v, emoji: it.emoji, name: it.name }; }).sort((a, b) => b.v - a.v);
    if (arr.length > 6) { const rest = arr.splice(5); arr.push({ id: "rest", v: sum(rest, (x) => x.v), emoji: "…", name: "その他" }); }
    return arr;
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
    data.forEach((d, i) => { const da = (d.v / total) * Math.PI * 2; ctx.strokeStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, a, a + Math.max(0.001, da - 0.03)); ctx.stroke(); a += da; });
    ctx.fillStyle = cssVar("--muted"); ctx.font = "11px " + cssVar("--font"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("合計", cx, cy - 10);
    ctx.fillStyle = cssVar("--text"); ctx.font = "700 15px " + cssVar("--font"); ctx.fillText(yenS(total), cx, cy + 9);
    const lg = $("#legend");
    if (lg) lg.innerHTML = data.length ? data.map((d, i) => '<div><div class="legend-row"><span class="legend-dot" style="background:' + cols[i % cols.length] + '"></span><span class="grow">' + esc(d.emoji) + " " + esc(d.name) + '</span><b class="num">' + yen(d.v) + '</b></div><div class="legend-bar"><i style="width:' + ((d.v / total) * 100).toFixed(1) + "%;background:" + cols[i % cols.length] + '"></i></div></div>').join("") : '<span class="small muted">記録するとここに内訳が出ます</span>';
  }

  // ---------- weekly report image ----------
  let lastReport = null;
  function reportData(wkStart) {
    const ws = wkStart, we = addDays(ws, 7);
    const recs = saves().filter((r) => r.t >= ws && r.t < we);
    const money = recs.filter((r) => r.type === "save");
    const by = {};
    money.forEach((r) => { by[r.itemId] = (by[r.itemId] || 0) + r.amount; });
    const top = Object.entries(by).map(([id, v]) => ({ it: itemById(id) || { emoji: "•", name: "削除した項目" }, v })).sort((a, b) => b.v - a.v).slice(0, 3);
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
    if (document.visibilityState === "visible") { if (curTab === "home" && !sheetStack) renderHome(); renderTop(); }
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
        '<div class="ob-points">' + [["plus", "1タップで記録", "我慢したらタップするだけ。チャリンと貯まります。"], ["chart", "合計・グラフ・1年後の見込み", "小さな我慢が、どれだけ大きくなるか。"], ["bank", "本物の貯金につなげる", "週に1回、実際に移した額を記録して ✅ に。"], ["shield", "ログイン・広告なし", "データはこの端末だけに保存されます。"]].map(([i, b, s]) => '<div class="ob-point"><span class="li-ico">' + ic(i, "sm") + "</span><div><b>" + b + "</b><span>" + s + "</span></div></div>").join("") + "</div>";
      foot = '<button type="button" class="btn primary block" data-ob="next">はじめる</button><p class="small faint" style="text-align:center;margin:0">はじめることで<a href="./legal.html" style="color:inherit">利用規約・プライバシーポリシー</a>に同意したものとします。</p>';
    } else if (ob.step === 1) {
      body = '<h2>はじめに、年齢を教えてください</h2><p class="lead">タバコやお酒の項目は、20歳以上の方にだけ表示します。</p><div class="age-opts"><button type="button" class="btn block' + (ob.adult === true ? " primary" : "") + '" data-age-ob="1">20歳以上</button><button type="button" class="btn block' + (ob.adult === false ? " primary" : "") + '" data-age-ob="0">20歳未満</button></div>';
      foot = "";
    } else if (ob.step === 2) {
      body = '<h2>ついやってしまうことは？</h2><p class="lead">当てはまるものを選んでください（あとで追加・変更できます）。</p><div class="pick-grid">' +
        presets.map((p) => '<button type="button" class="pick" data-pick="' + p.pid + '" aria-pressed="' + ob.sel.has(p.pid) + '"><span class="p-em">' + p.emoji + '</span><span><span class="p-n">' + esc(p.name) + (p.adult ? '<span class="item-tag">20+</span>' : "") + '</span><br><span class="p-p">' + (p.price ? "約" + yen(p.price) : p.minutes + "分") + "</span></span></button>").join("") + "</div>";
      foot = '<button type="button" class="btn primary block" data-ob="next"' + (ob.sel.size || ob.custom.length ? "" : " disabled") + ">次へ（" + (ob.sel.size + ob.custom.length) + "件）</button>";
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
      state.items.push({ id: uid(), pid: p.pid, emoji: p.emoji, name: p.name, price, minutes, cap: p.cap, adult: !!p.adult });
    });
    ob.custom.forEach((c) => { if (c.price > 0) state.items.push({ id: uid(), pid: null, emoji: c.emoji, name: c.name, price: c.price, minutes: 0, cap: 3, adult: false }); });
    if (!state.items.length) { toast("項目を1つ以上選んでください"); ob.step = 2; renderOb(); return; }
    if (withGoal) state.goals.push({ id: uid(), name: ob.goal.name, emoji: ob.goal.emoji, amount: ob.goal.amount, pct: 100, created: now() });
    state.onboarded = true;
    state.createdAt = now();
    save();
    hideOnboarding(); curTab = "home"; renderAll();
    toast("準備ができました。最初の我慢をタップしてみましょう", { duration: 4000 });
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

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) { go(tab.dataset.tab); return; }
    const b = e.target.closest("[data-act]");
    if (!b || b.closest("#onboarding")) return;
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case "tap": tapItem(id, b); break;
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
    if (t.id === "set-hourly") { state.settings.hourly = clamp(toInt(t.value), 0, 100000); t.value = state.settings.hourly; save(); toast("時給換算を " + yen(state.settings.hourly) + " にしました"); }
    if (t.id === "import-file" && t.files && t.files[0]) { const f = t.files[0]; if (f.size > 5e6) { toast("ファイルが大きすぎます"); return; } f.text().then(importText); t.value = ""; }
  });
  $("#pill-level").addEventListener("click", () => go("growth"));
  $("#pill-streak").addEventListener("click", () => go("growth"));
  window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });
  let rz = null;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (curTab === "stats") { drawBars(); drawLine(); } }, 150); });

  // ---------- init ----------
  function init() {
    applyTheme();
    renderAll();
    if (!state.onboarded) startOnboarding();
    if (state.timer) setTimeout(() => timerFail("reload"), 300);
    else if (state.timerFail) setTimeout(() => showTimerFail(state.timerFail.reason), 300);
    state.lastLv = state.lastLv || xpInfo().lv;
    if (state.onboarded) afterChange({ silent: true, noRender: true });
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
    load(s) { state = migrate(s); save(); shownTotal = null; if (state.onboarded) hideOnboarding(); renderAll(); if (state.onboarded) afterChange({ silent: true, noRender: true }); },
    totals, streakInfo, xpInfo, missionStatus, goalProgress, verifyMap,
    reportBlob: () => new Promise((res) => drawReport(weekStart(now())).toBlob(res, "image/png")),
    exportJSON: () => JSON.stringify({ app: "gaman-chokin", version: VERSION, data: state }),
    importText,
  };
  init();
})();
