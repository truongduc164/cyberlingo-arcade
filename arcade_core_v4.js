// ============================================================================
// CYBERLINGO ARCADE PRO v4.0 — SMART SRS, DAILY STREAK/QUESTS & RETINA ENGINE
// Inspired by HelloChinese, Memrise SRS, Duolingo Match Madness & Tetris Effect
// Developed by DEAN OPTIMIZE
// ============================================================================

// 1. TRUE RETINA / HiDPI CANVAS HELPER (Crisp Hanzi on 2x/3x iPhone & Android)
function setupRetinaCanvas(cvs, explicitW, explicitH) {
  const parent = cvs.parentElement;
  const rect = parent ? parent.getBoundingClientRect() : { width: 340, height: 340 };
  const logW = explicitW || Math.max(300, Math.floor(rect.width));
  const logH = explicitH || Math.max(290, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

  cvs.style.width = logW + 'px';
  cvs.style.height = logH + 'px';
  cvs.width = Math.round(logW * dpr);
  cvs.height = Math.round(logH * dpr);

  const ctx = cvs.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cvs._logicalW = logW;
  cvs._logicalH = logH;
  cvs._dpr = dpr;
  return { W: logW, H: logH, ctx, dpr };
}

function drawBeveledBox(ctx, x, y, w, h, r, fillTop, fillBot, borderCol, lineW = 1.8) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, fillTop);
  grad.addColorStop(1, fillBot);
  ctx.fillStyle = grad;
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = lineW;
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  // Subtle top glass bevel shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.roundRect(x + 3, y + 2, Math.max(4, w - 6), Math.max(3, h * 0.28), Math.max(2, r - 2));
  ctx.fill();
}

// 2. HAPTIC FEEDBACK & FLOATING COMBO CALLOUTS ("GAME JUICE")
function hapticPulse(ms = 18) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

function spawnComboBanner(comboVal, pts) {
  const shell = document.getElementById('app-shell');
  if (!shell) return;

  // Toggle Fever Aura when combo >= 5
  shell.classList.toggle('fever-mode', comboVal >= 5);

  if (comboVal < 2) return;
  const labels = {
    2: '⚡ DOUBLE x2!',
    3: '🔥 TRIPLE x3!',
    4: '💎 SUPER x4!',
    5: '🌟 FEVER MODE x5!',
    6: '🚀 UNSTOPPABLE x6!',
    7: '👑 MASTER x7!',
    8: '🐉 GODLIKE x8!'
  };
  const txt = labels[Math.min(8, comboVal)] || `🔥 COMBO x${comboVal}!`;
  const badge = document.createElement('div');
  badge.className = 'floating-callout';
  badge.textContent = pts ? `${txt} (+${pts})` : txt;
  shell.appendChild(badge);
  setTimeout(() => badge.remove(), 820);
}

// 3. SPACED REPETITION SYSTEM (SRS) & MISTAKE VAULT
const SRS_STORAGE_KEY = 'cyberlingo_srs_v4';

function loadSrsMap() {
  try {
    return JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveSrsMap(map) {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {}
}

function recordSrsOutcome(vocabItem, isCorrect) {
  if (!vocabItem || !vocabItem.zh) return;
  const map = loadSrsMap();
  const prev = map[vocabItem.zh] || {
    zh: vocabItem.zh,
    pinyin: vocabItem.pinyin || '',
    vi: vocabItem.vi || '',
    audio: vocabItem.audio || '',
    ok: 0,
    bad: 0,
    box: 1, // 0 = Mistake Vault, 1 = Learning, 2 = Familiar, 3 = Mastered
    ts: 0
  };
  prev.pinyin = vocabItem.pinyin || prev.pinyin;
  prev.vi = vocabItem.vi || prev.vi;
  prev.audio = vocabItem.audio || prev.audio;
  prev.ts = Date.now();

  if (isCorrect) {
    prev.ok = (prev.ok || 0) + 1;
    prev.box = Math.min(3, (prev.box === 0 ? 1 : prev.box + 1));
    incrementDailyProgress('words', 1);
  } else {
    prev.bad = (prev.bad || 0) + 1;
    prev.box = 0; // Enters Mistake Vault for priority review!
  }
  map[vocabItem.zh] = prev;
  saveSrsMap(map);
}

function getSrsStats() {
  const vals = Object.values(loadSrsMap());
  const mistakes = vals.filter((v) => v.box === 0);
  const mastered = vals.filter((v) => v.box >= 3);
  const learning = vals.filter((v) => v.box === 1 || v.box === 2);
  return { totalSeen: vals.length, mistakes, mastered, learning, all: vals };
}

// Smart SRS-weighted picker: injects ~35% due Mistake words into any game pool!
function pickSmartVocabSubset(pool, count) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const srs = loadSrsMap();
  const mistakePool = pool.filter((v) => v && srs[v.zh] && srs[v.zh].box === 0);
  const unseenOrLearning = pool.filter((v) => v && (!srs[v.zh] || srs[v.zh].box < 3));

  const out = [];
  const used = new Set();
  const addFrom = (arr, limit) => {
    for (const item of shuffleArr(arr)) {
      if (out.length >= limit || out.length >= count) break;
      if (item && item.zh && !used.has(item.zh)) {
        used.add(item.zh);
        out.push(item);
      }
    }
  };

  // Priority 1: Up to 40% from Mistake Vault so user conquers weak words naturally
  const mistakeQuota = Math.max(1, Math.floor(count * 0.4));
  if (mistakePool.length > 0) {
    addFrom(mistakePool, mistakeQuota);
  }
  // Priority 2: Unseen / Learning words
  addFrom(unseenOrLearning, count);
  // Priority 3: Fill remainder from full pool
  addFrom(pool, count);
  return shuffleArr(out);
}

// 4. DAILY STREAK, DAILY GOAL RING (0/15 WORDS) & 3 DAILY QUESTS
const DAILY_META_KEY = 'cyberlingo_daily_meta_v4';

function getTodayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function loadDailyMeta() {
  const today = getTodayStr();
  let meta = null;
  try {
    meta = JSON.parse(localStorage.getItem(DAILY_META_KEY) || 'null');
  } catch (e) {}

  if (!meta) {
    meta = {
      streak: 1,
      lastActiveDate: today,
      todayDate: today,
      wordsToday: 0,
      maxComboToday: 1,
      gamesPlayedToday: [],
      claimedQuests: {}
    };
    saveDailyMeta(meta);
    return meta;
  }

  if (meta.todayDate !== today) {
    const yest = getYesterdayStr();
    const newStreak = meta.lastActiveDate === yest ? (meta.streak || 1) + 1 : (meta.lastActiveDate === today ? meta.streak : 1);
    meta = {
      streak: newStreak,
      lastActiveDate: meta.lastActiveDate,
      todayDate: today,
      wordsToday: 0,
      maxComboToday: 1,
      gamesPlayedToday: [],
      claimedQuests: {}
    };
    saveDailyMeta(meta);
  }
  return meta;
}

function saveDailyMeta(meta) {
  try {
    localStorage.setItem(DAILY_META_KEY, JSON.stringify(meta));
  } catch (e) {}
}

function incrementDailyProgress(kind, val) {
  const meta = loadDailyMeta();
  const today = getTodayStr();
  if (meta.lastActiveDate !== today) {
    const yest = getYesterdayStr();
    meta.streak = meta.lastActiveDate === yest ? (meta.streak || 0) + 1 : Math.max(1, meta.streak || 1);
    meta.lastActiveDate = today;
  }
  if (kind === 'words') {
    meta.wordsToday = (meta.wordsToday || 0) + val;
  } else if (kind === 'combo') {
    meta.maxComboToday = Math.max(meta.maxComboToday || 1, val);
  } else if (kind === 'game' && val) {
    if (!meta.gamesPlayedToday.includes(val)) {
      meta.gamesPlayedToday.push(val);
    }
  }
  saveDailyMeta(meta);
  checkAutoClaimQuests(meta);
}

function checkAutoClaimQuests(meta) {
  const quests = [
    { id: 'q_words', done: meta.wordsToday >= 12, xp: 50, label: '🎯 Nhiệm vụ đạt: Ôn 12 từ (+50 EXP)!' },
    { id: 'q_combo', done: meta.maxComboToday >= 5, xp: 60, label: '🔥 Nhiệm vụ đạt: Chuỗi Fever x5 (+60 EXP)!' },
    { id: 'q_variety', done: (meta.gamesPlayedToday || []).length >= 2, xp: 50, label: '🕹️ Nhiệm vụ đạt: Chơi 2 game khác nhau (+50 EXP)!' }
  ];
  let changed = false;
  for (const q of quests) {
    if (q.done && !meta.claimedQuests[q.id]) {
      meta.claimedQuests[q.id] = true;
      changed = true;
      if (typeof addArcadeXP === 'function') addArcadeXP(q.xp);
      if (typeof showToast === 'function') showToast(q.label);
    }
  }
  if (changed) saveDailyMeta(meta);
}

function renderStreakAndQuestsUI() {
  const meta = loadDailyMeta();
  const srs = getSrsStats();

  const streakEl = document.getElementById('ui-streak-num');
  if (streakEl) streakEl.textContent = `${meta.streak || 1} ngày`;

  const goalNumEl = document.getElementById('ui-goal-num');
  const goalPct = Math.min(100, Math.round(((meta.wordsToday || 0) / 15) * 100));
  if (goalNumEl) goalNumEl.textContent = `${meta.wordsToday || 0}/15 từ`;
  const ringEl = document.getElementById('ui-goal-ring');
  if (ringEl) {
    ringEl.style.background = `conic-gradient(#10b981 ${goalPct * 3.6}deg, rgba(255,255,255,0.12) 0deg)`;
  }

  const srsBtn = document.getElementById('src-srs');
  if (srsBtn) {
    srsBtn.innerHTML = `🎯 Hay Sai (${srs.mistakes.length})`;
  }
  const nbBadge = document.getElementById('nb-count-badge');
  if (nbBadge) {
    nbBadge.textContent = `${srs.mastered.length} thuộc • ${srs.mistakes.length} cần ôn`;
  }

  // Render 3 compact Daily Quest pills
  const qBox = document.getElementById('daily-quests-row');
  if (qBox) {
    const q1 = meta.wordsToday >= 12;
    const q2 = meta.maxComboToday >= 5;
    const q3 = (meta.gamesPlayedToday || []).length >= 2;
    qBox.innerHTML = `
      <span class="quest-pill ${q1 ? 'done' : ''}">${q1 ? '✅' : '⬜'} 12 Từ (${Math.min(12, meta.wordsToday)}/12)</span>
      <span class="quest-pill ${q2 ? 'done' : ''}">${q2 ? '✅' : '⬜'} Fever x5 (${Math.min(5, meta.maxComboToday)}/5)</span>
      <span class="quest-pill ${q3 ? 'done' : ''}">${q3 ? '✅' : '⬜'} 2 Trò (${Math.min(2, meta.gamesPlayedToday.length)}/2)</span>
    `;
  }
}

// 5. INTERACTIVE FLASHCARD NOTEBOOK MODAL (Tap to flip & hear Neural Audio!)
let currentNotebookTab = 'mistakes'; // 'mistakes' | 'mastered' | 'all'

function openNotebookModal(tab = 'mistakes') {
  currentNotebookTab = tab;
  if (typeof sound !== 'undefined') sound.sfxTap();
  renderNotebookList();
  document.getElementById('modal-notebook')?.classList.remove('hidden');
}

function closeNotebookModal() {
  if (typeof sound !== 'undefined') sound.sfxTap();
  document.getElementById('modal-notebook')?.classList.add('hidden');
}

function switchNotebookTab(tab) {
  currentNotebookTab = tab;
  if (typeof sound !== 'undefined') sound.sfxTap();
  renderNotebookList();
}

function renderNotebookList() {
  const srs = getSrsStats();
  ['mistakes', 'mastered', 'all'].forEach((t) => {
    document.getElementById('nbtab-' + t)?.classList.toggle('active', t === currentNotebookTab);
  });

  const container = document.getElementById('notebook-list-body');
  if (!container) return;
  container.innerHTML = '';

  let items = [];
  if (currentNotebookTab === 'mistakes') items = srs.mistakes;
  else if (currentNotebookTab === 'mastered') items = srs.mastered;
  else {
    const pools = typeof getActivePools === 'function' ? getActivePools() : { vocab: [] };
    items = pools.vocab.slice(0, 60);
  }

  if (items.length === 0) {
    const emptyMsg = currentNotebookTab === 'mistakes'
      ? '🎉 Tuyệt vời! Hiện không có từ nào bị sai cần phục thù!'
      : 'Chưa có từ nào trong mục này — hãy vào chơi 1 ván để tích lũy nhé!';
    container.innerHTML = `<div style="padding:22px 10px;text-align:center;color:#94a3b8;font-size:12.5px;">${emptyMsg}</div>`;
    return;
  }

  items.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'nb-flashcard';
    card.innerHTML = `
      <div>
        <div style="font-size:16px;font-weight:900;color:#38bdf8;">${w.zh} <span style="font-size:11.5px;color:#fde68a;font-weight:700;">${w.pinyin || ''}</span></div>
        <div style="font-size:12px;color:#d1fae5;margin-top:2px;">${w.vi || ''}</div>
      </div>
      <button class="nb-speak-btn">🔊 Nghe</button>
    `;
    card.onclick = () => {
      if (typeof sound !== 'undefined') sound.speakChinese(w.zh, w.audio);
    };
    container.appendChild(card);
  });
}
