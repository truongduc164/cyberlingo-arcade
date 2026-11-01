/**
 * CYBERLINGO ARCADE v4.1 — UPGRADE MODULE
 * ==========================================
 * 5 Tính năng TOP từ Báo cáo Tình Báo Game Thế Giới:
 * 
 * 1. 🔥 STREAK LỬA THIÊNG + FREEZE TOKEN (Duolingo-killer retention)
 * 2. 🫧 SQUASH & STRETCH BUTTON + HAPTIC PATTERNS (Game Juice Trifecta)
 * 3. 🧩 RADICAL BREAKDOWN ANIMATION (USP — không ai trên web có)
 * 4. 📱 ADD-TO-HOME BONUS (PWA install → 3x DAU)
 * 5. 🎯 ADAPTIVE DIFFICULTY (AI chỉnh độ khó)
 * 
 * Developed by DEAN OPTIMIZE × Antigravity AI — 01/11/2026
 * Loads AFTER arcade_core_v4.js, BEFORE games_v2_extra.js
 */

// =============================================================================
// 1. 🔥 STREAK LỬA THIÊNG + FREEZE TOKEN
// =============================================================================
const STREAK_UPGRADE_KEY = 'cyberlingo_streak_v41';

function loadStreakUpgrade() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_UPGRADE_KEY) || 'null') || {
      freezeTokens: 0,      // Max 3
      maxFreezeTokens: 3,
      totalWordsAllTime: 0,
      longestStreak: 0,
      streakMilestones: {},  // { '7': true, '30': true, '100': true }
      pwaInstallBonus: false,
      lastSessionScore: 0
    };
  } catch (e) {
    return { freezeTokens: 0, maxFreezeTokens: 3, totalWordsAllTime: 0, longestStreak: 0, streakMilestones: {}, pwaInstallBonus: false, lastSessionScore: 0 };
  }
}

function saveStreakUpgrade(data) {
  try { localStorage.setItem(STREAK_UPGRADE_KEY, JSON.stringify(data)); } catch (e) {}
}

// Enhanced Daily Meta with Freeze Token logic
const _origLoadDailyMeta = typeof loadDailyMeta === 'function' ? loadDailyMeta : null;

function loadDailyMetaV41() {
  const meta = _origLoadDailyMeta ? _origLoadDailyMeta() : loadDailyMeta();
  const upgrade = loadStreakUpgrade();
  const today = getTodayStr();
  const yest = getYesterdayStr();
  
  // Track longest streak
  if ((meta.streak || 1) > (upgrade.longestStreak || 0)) {
    upgrade.longestStreak = meta.streak;
    saveStreakUpgrade(upgrade);
  }
  
  // Check streak milestones
  checkStreakMilestones(meta.streak, upgrade);
  
  return meta;
}

function checkStreakMilestones(streak, upgrade) {
  const milestones = [
    { days: 3,   badge: '🌟', label: 'Ngôi Sao Mới', xp: 30 },
    { days: 7,   badge: '🏆', label: 'Chiến Binh Tuần', xp: 70 },
    { days: 14,  badge: '⚔️', label: 'Kiếm Sĩ', xp: 100 },
    { days: 30,  badge: '🐉', label: 'Rồng Vàng', xp: 200 },
    { days: 60,  badge: '👑', label: 'Hoàng Đế', xp: 350 },
    { days: 100, badge: '🔮', label: 'Huyền Thoại', xp: 500 }
  ];
  
  for (const m of milestones) {
    if (streak >= m.days && !upgrade.streakMilestones[m.days]) {
      upgrade.streakMilestones[m.days] = true;
      saveStreakUpgrade(upgrade);
      if (typeof addArcadeXP === 'function') addArcadeXP(m.xp);
      if (typeof showToast === 'function') {
        showToast(`${m.badge} Huy chương Streak ${m.days} ngày: "${m.label}" (+${m.xp} EXP)!`);
      }
      hapticPattern('milestone');
    }
  }
}

// Award Freeze Token when player scores high
function awardFreezeTokenOnHighScore(score, gameId) {
  const upgrade = loadStreakUpgrade();
  // Award 1 freeze token every 500 points (max 3 tokens held)
  if (score >= 500 && upgrade.freezeTokens < upgrade.maxFreezeTokens) {
    const prevScore = upgrade.lastSessionScore || 0;
    if (score > prevScore) {
      upgrade.freezeTokens = Math.min(upgrade.maxFreezeTokens, upgrade.freezeTokens + 1);
      upgrade.lastSessionScore = score;
      saveStreakUpgrade(upgrade);
      if (typeof showToast === 'function') {
        showToast(`❄️ Nhận Streak Freeze Token! (${upgrade.freezeTokens}/${upgrade.maxFreezeTokens})`);
      }
      hapticPattern('reward');
    }
  }
}

// Use freeze token to save streak (called when streak would break)
function useStreakFreeze() {
  const upgrade = loadStreakUpgrade();
  if (upgrade.freezeTokens > 0) {
    upgrade.freezeTokens--;
    saveStreakUpgrade(upgrade);
    return true; // Streak saved!
  }
  return false; // No tokens, streak breaks
}

// =============================================================================
// 2. 🫧 SQUASH & STRETCH + HAPTIC PATTERNS  
// =============================================================================

// Advanced haptic patterns (extending basic hapticPulse from arcade_core_v4.js)
function hapticPattern(type) {
  try {
    if (!navigator.vibrate) return;
    const patterns = {
      'tap':       [12],                    // Light click
      'correct':   [15, 30, 15],            // Double tick
      'wrong':     [50, 20, 80],            // Buzz-pause-heavy buzz
      'combo3':    [10, 15, 10, 15, 10],    // Triple tick ascending
      'combo5':    [8, 10, 8, 10, 8, 10, 8, 10, 8], // Rapid fire
      'fever':     [15, 10, 15, 10, 30, 15, 50],     // Escalating
      'milestone': [30, 40, 30, 40, 60, 60, 100],    // Grand celebration
      'reward':    [20, 30, 20, 30, 40],    // Happy double-tick
      'levelup':   [15, 20, 15, 20, 15, 20, 80],     // Ascending wave
      'miss':      [60],                    // Single heavy thud
      'install':   [20, 30, 20, 30, 20, 30, 80, 60, 120], // Grand fanfare
    };
    navigator.vibrate(patterns[type] || [18]);
  } catch (e) {}
}

// Squash & Stretch effect for any element
function juicePress(el) {
  if (!el) return;
  el.style.transition = 'transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1)';
  el.style.transform = 'scale(0.92)';
  hapticPattern('tap');
  
  setTimeout(() => {
    el.style.transform = 'scale(1.06)';
    setTimeout(() => {
      el.style.transform = 'scale(1.0)';
    }, 80);
  }, 80);
}

// Particle burst effect for correct answers
function spawnParticleBurst(targetEl, count = 8) {
  const shell = document.getElementById('app-shell');
  if (!shell || !targetEl) return;
  
  const rect = targetEl.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - shellRect.left;
  const cy = rect.top + rect.height / 2 - shellRect.top;
  
  const emojis = ['✨', '⭐', '💎', '🔥', '💫', '🌟'];
  
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.textContent = emojis[i % emojis.length];
    p.style.cssText = `
      position: absolute;
      left: ${cx}px;
      top: ${cy}px;
      font-size: ${10 + Math.random() * 8}px;
      pointer-events: none;
      z-index: 60;
      opacity: 1;
      transition: all ${0.5 + Math.random() * 0.4}s cubic-bezier(0.22, 1, 0.36, 1);
    `;
    shell.appendChild(p);
    
    // Animate outward
    requestAnimationFrame(() => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 60;
      p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 30}px) scale(0.3)`;
      p.style.opacity = '0';
    });
    
    setTimeout(() => p.remove(), 900);
  }
}

// Auto-inject Squash & Stretch to ALL interactive elements
function injectJuiceToAllButtons() {
  // Game cards
  document.querySelectorAll('.game-card, .gc-play-btn, .pill-btn, .nb-open-btn, .mini-chip, .filter-tab, .quest-pill, .hud-back, .hud-replay, .streak-pill').forEach(el => {
    if (el._juiced) return;
    el._juiced = true;
    
    el.addEventListener('pointerdown', (e) => {
      juicePress(el);
    }, { passive: true });
  });
}

// =============================================================================
// 3. 🧩 RADICAL BREAKDOWN ANIMATION
// =============================================================================

// Common Chinese radical decompositions for game vocabulary
const RADICAL_DB = {
  '好': { parts: ['女', '子'], meanings: ['nữ (woman)', 'tử (child)'], mnemonic: 'Phụ nữ + con = tốt/thích' },
  '明': { parts: ['日', '月'], meanings: ['nhật (sun)', 'nguyệt (moon)'], mnemonic: 'Mặt trời + mặt trăng = sáng' },
  '休': { parts: ['亻', '木'], meanings: ['nhân (person)', 'mộc (tree)'], mnemonic: 'Người dựa vào cây = nghỉ ngơi' },
  '林': { parts: ['木', '木'], meanings: ['mộc (tree)', 'mộc (tree)'], mnemonic: '2 cây = rừng nhỏ' },
  '森': { parts: ['木', '木', '木'], meanings: ['mộc', 'mộc', 'mộc'], mnemonic: '3 cây = rừng rậm' },
  '看': { parts: ['手', '目'], meanings: ['thủ (hand)', 'mục (eye)'], mnemonic: 'Tay che mắt nhìn = xem' },
  '男': { parts: ['田', '力'], meanings: ['điền (field)', 'lực (strength)'], mnemonic: 'Sức mạnh trên ruộng = đàn ông' },
  '安': { parts: ['宀', '女'], meanings: ['miên (roof)', 'nữ (woman)'], mnemonic: 'Phụ nữ trong nhà = yên ổn' },
  '家': { parts: ['宀', '豕'], meanings: ['miên (roof)', 'thỉ (pig)'], mnemonic: 'Heo dưới mái = gia đình' },
  '字': { parts: ['宀', '子'], meanings: ['miên (roof)', 'tử (child)'], mnemonic: 'Con trong nhà học = chữ' },
  '想': { parts: ['相', '心'], meanings: ['tương (mutual)', 'tâm (heart)'], mnemonic: 'Tâm cùng nhìn = suy nghĩ' },
  '吃': { parts: ['口', '乞'], meanings: ['khẩu (mouth)', 'khất (beg)'], mnemonic: 'Miệng + xin = ăn' },
  '喝': { parts: ['口', '曷'], meanings: ['khẩu (mouth)', 'hạt'], mnemonic: 'Miệng + giọng = uống' },
  '打': { parts: ['扌', '丁'], meanings: ['thủ (hand)', 'đinh (nail)'], mnemonic: 'Tay đóng đinh = đánh' },
  '说': { parts: ['讠', '兑'], meanings: ['ngôn (speech)', 'đoài (exchange)'], mnemonic: 'Lời nói trao đổi = nói' },
  '问': { parts: ['门', '口'], meanings: ['môn (gate)', 'khẩu (mouth)'], mnemonic: 'Miệng ở cửa = hỏi' },
  '间': { parts: ['门', '日'], meanings: ['môn (gate)', 'nhật (sun)'], mnemonic: 'Mặt trời lọt cửa = khoảng giữa' },
  '们': { parts: ['亻', '门'], meanings: ['nhân (person)', 'môn (gate)'], mnemonic: 'Nhiều người ở cửa = bọn họ' },
  '做': { parts: ['亻', '故'], meanings: ['nhân (person)', 'cố (reason)'], mnemonic: 'Người có lý do = làm' },
  '机': { parts: ['木', '几'], meanings: ['mộc (wood)', 'kỉ (table)'], mnemonic: 'Gỗ + bàn nhỏ = máy' },
  '检': { parts: ['木', '佥'], meanings: ['mộc (wood)', 'thiêm (check)'], mnemonic: 'Kiểm tra gỗ = kiểm tra' },
  '工': { parts: ['工'], meanings: ['công (work)'], mnemonic: 'Hình cái thước thợ = công việc' },
  '厂': { parts: ['厂'], meanings: ['xưởng (factory)'], mnemonic: 'Hình mái che = nhà máy' },
  '品': { parts: ['口', '口', '口'], meanings: ['khẩu × 3'], mnemonic: '3 miệng nếm = sản phẩm/phẩm chất' },
  '质': { parts: ['斤', '贝'], meanings: ['cân (axe)', 'bối (shell/value)'], mnemonic: 'Rìu + vỏ sò = chất lượng' },
  '量': { parts: ['日', '一', '里'], meanings: ['nhật', 'nhất', 'lý'], mnemonic: 'Đo lường từ mặt trời = số lượng' },
  '电': { parts: ['田', '乚'], meanings: ['điền (field)', 'ẩn (hidden)'], mnemonic: 'Sét đánh ruộng = điện' },
  '话': { parts: ['讠', '舌'], meanings: ['ngôn (speech)', 'thiệt (tongue)'], mnemonic: 'Lời + lưỡi = lời nói' },
};

// Create radical breakdown popup
function showRadicalBreakdown(char) {
  const info = RADICAL_DB[char];
  if (!info) return false;
  
  const existing = document.getElementById('radical-popup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'radical-popup';
  popup.innerHTML = `
    <div class="radical-overlay" onclick="closeRadicalPopup()"></div>
    <div class="radical-card">
      <div class="radical-main-char">${char}</div>
      <div class="radical-equation">
        ${info.parts.map((p, i) => `
          <span class="radical-part" style="animation-delay:${i * 0.15}s">${p}</span>
          ${i < info.parts.length - 1 ? '<span class="radical-op">+</span>' : ''}
        `).join('')}
        <span class="radical-op">=</span>
        <span class="radical-result">${char}</span>
      </div>
      <div class="radical-meanings">
        ${info.parts.map((p, i) => `
          <span class="radical-meaning-chip">${p} ${info.meanings[i] || ''}</span>
        `).join('')}
      </div>
      <div class="radical-mnemonic">💡 ${info.mnemonic}</div>
      <button class="radical-close-btn" onclick="closeRadicalPopup()">Đã hiểu ✓</button>
    </div>
  `;
  document.getElementById('app-shell').appendChild(popup);
  hapticPattern('reward');
  return true;
}

function closeRadicalPopup() {
  const popup = document.getElementById('radical-popup');
  if (popup) {
    popup.querySelector('.radical-card').style.transform = 'scale(0.8)';
    popup.querySelector('.radical-card').style.opacity = '0';
    setTimeout(() => popup.remove(), 200);
  }
}

// =============================================================================
// 4. 📱 ADD-TO-HOME BONUS (PWA Install Prompt)
// =============================================================================

let deferredInstallPrompt = null;

function setupPWAInstallBonus() {
  // Capture the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });
  
  // Detect if already installed
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallBanner();
    grantInstallBonus();
  });
  
  // Check if running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    const upgrade = loadStreakUpgrade();
    if (!upgrade.pwaInstallBonus) {
      grantInstallBonus();
    }
  }
}

function showInstallBanner() {
  // Don't show if already installed bonus given
  const upgrade = loadStreakUpgrade();
  if (upgrade.pwaInstallBonus) return;
  
  const existing = document.getElementById('pwa-install-banner');
  if (existing) return;
  
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="install-icon">📱</div>
    <div class="install-text">
      <strong>Cài lên Màn hình chính</strong>
      <span>Nhận 🎁 500 EXP + ❄️ 2 Freeze Tokens!</span>
    </div>
    <button class="install-btn" onclick="triggerPWAInstall()">Cài ngay</button>
    <button class="install-dismiss" onclick="hideInstallBanner()">✕</button>
  `;
  
  const lobby = document.getElementById('screen-lobby');
  if (lobby) {
    // Insert after streak-quest-card
    const streakCard = lobby.querySelector('.streak-quest-card');
    if (streakCard && streakCard.nextSibling) {
      streakCard.parentNode.insertBefore(banner, streakCard.nextSibling);
    } else {
      lobby.appendChild(banner);
    }
  }
}

function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.transform = 'translateX(100%)';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 300);
  }
}

function triggerPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        grantInstallBonus();
      }
      deferredInstallPrompt = null;
    });
  }
}

function grantInstallBonus() {
  const upgrade = loadStreakUpgrade();
  if (upgrade.pwaInstallBonus) return; // Already claimed
  
  upgrade.pwaInstallBonus = true;
  upgrade.freezeTokens = Math.min(upgrade.maxFreezeTokens, upgrade.freezeTokens + 2);
  saveStreakUpgrade(upgrade);
  
  if (typeof addArcadeXP === 'function') addArcadeXP(500);
  if (typeof showToast === 'function') {
    showToast('🎁 Phần thưởng cài đặt: +500 EXP + 2 Freeze Tokens!');
  }
  hapticPattern('install');
  hideInstallBanner();
}

// =============================================================================
// 5. 🎯 ADAPTIVE DIFFICULTY ENGINE
// =============================================================================

const ADAPTIVE_KEY = 'cyberlingo_adaptive_v41';

function loadAdaptiveProfile() {
  try {
    return JSON.parse(localStorage.getItem(ADAPTIVE_KEY) || 'null') || {
      recentAccuracy: [],    // Last 20 answers [true, false, true, ...]
      currentDifficulty: 0.5, // 0.0 (easy) to 1.0 (hard)
      speedMultiplier: 1.0,   // Game speed factor
      vocabTier: 1,           // 1=basic, 2=intermediate, 3=advanced
      totalCorrect: 0,
      totalWrong: 0
    };
  } catch (e) {
    return { recentAccuracy: [], currentDifficulty: 0.5, speedMultiplier: 1.0, vocabTier: 1, totalCorrect: 0, totalWrong: 0 };
  }
}

function saveAdaptiveProfile(profile) {
  try { localStorage.setItem(ADAPTIVE_KEY, JSON.stringify(profile)); } catch (e) {}
}

function recordAdaptiveAnswer(isCorrect) {
  const profile = loadAdaptiveProfile();
  
  profile.recentAccuracy.push(isCorrect);
  if (profile.recentAccuracy.length > 20) {
    profile.recentAccuracy.shift();
  }
  
  if (isCorrect) profile.totalCorrect++;
  else profile.totalWrong++;
  
  // Calculate rolling accuracy
  const recent = profile.recentAccuracy;
  const accuracy = recent.length > 0 ? recent.filter(x => x).length / recent.length : 0.5;
  
  // Smooth difficulty adjustment
  if (accuracy > 0.85 && recent.length >= 5) {
    // Player is too good — increase challenge
    profile.currentDifficulty = Math.min(1.0, profile.currentDifficulty + 0.05);
    profile.speedMultiplier = Math.min(1.5, profile.speedMultiplier + 0.03);
    if (accuracy > 0.9 && profile.vocabTier < 3) {
      profile.vocabTier = Math.min(3, profile.vocabTier + 1);
    }
  } else if (accuracy < 0.5 && recent.length >= 5) {
    // Player struggling — ease up
    profile.currentDifficulty = Math.max(0.1, profile.currentDifficulty - 0.08);
    profile.speedMultiplier = Math.max(0.6, profile.speedMultiplier - 0.05);
    if (accuracy < 0.35 && profile.vocabTier > 1) {
      profile.vocabTier = Math.max(1, profile.vocabTier - 1);
    }
  }
  
  saveAdaptiveProfile(profile);
  return {
    accuracy: Math.round(accuracy * 100),
    difficulty: profile.currentDifficulty,
    speed: profile.speedMultiplier,
    tier: profile.vocabTier
  };
}

// Get current difficulty settings for game engines
function getAdaptiveSettings() {
  const profile = loadAdaptiveProfile();
  return {
    speed: profile.speedMultiplier,
    difficulty: profile.currentDifficulty,
    vocabTier: profile.vocabTier,
    // Tetris: fall speed, Galaga: enemy fire rate, etc.
    fallInterval: Math.max(200, Math.round(800 / profile.speedMultiplier)),
    enemyFireRate: Math.max(0.5, 2.0 * profile.currentDifficulty),
    hintDelay: profile.currentDifficulty > 0.7 ? 0 : 2000, // No hints for pros
    timeLimit: Math.max(15, Math.round(30 / profile.speedMultiplier)),
  };
}

// =============================================================================
// ENHANCED UI RENDERING  
// =============================================================================

function renderStreakFireUI() {
  const meta = loadDailyMetaV41();
  const upgrade = loadStreakUpgrade();
  const streak = meta.streak || 1;
  
  const streakEl = document.getElementById('ui-streak-num');
  if (streakEl) {
    // Fire animation intensity based on streak length
    let fireIcon = '🔥';
    let streakClass = '';
    if (streak >= 30) { fireIcon = '🐉'; streakClass = 'streak-dragon'; }
    else if (streak >= 14) { fireIcon = '⚔️'; streakClass = 'streak-sword'; }
    else if (streak >= 7) { fireIcon = '🏆'; streakClass = 'streak-trophy'; }
    else if (streak >= 3) { fireIcon = '🔥'; streakClass = 'streak-fire'; }
    
    const freezeDisplay = upgrade.freezeTokens > 0 
      ? `<span class="freeze-tokens">${'❄️'.repeat(upgrade.freezeTokens)}</span>` 
      : '';
    
    const pill = streakEl.closest('.streak-pill');
    if (pill) {
      pill.innerHTML = `${fireIcon} <span id="ui-streak-num">${streak} ngày</span> ${freezeDisplay}`;
      pill.className = `streak-pill ${streakClass}`;
    }
  }
  
  // Update original UI too
  if (typeof renderStreakAndQuestsUI === 'function') {
    renderStreakAndQuestsUI();
  }
}

// =============================================================================
// CSS INJECTION — All new styles
// =============================================================================

function injectUpgradeCSS() {
  const style = document.createElement('style');
  style.id = 'v41-upgrade-css';
  style.textContent = `
    /* ===== STREAK FIRE ANIMATIONS ===== */
    @keyframes fireGlow {
      0%, 100% { box-shadow: inset 0 0 6px rgba(249, 115, 22, 0.3), 0 0 8px rgba(249, 115, 22, 0.2); }
      50% { box-shadow: inset 0 0 12px rgba(249, 115, 22, 0.5), 0 0 16px rgba(249, 115, 22, 0.4); }
    }
    @keyframes dragonGlow {
      0%, 100% { box-shadow: inset 0 0 8px rgba(250, 204, 21, 0.4), 0 0 12px rgba(239, 68, 68, 0.3); }
      50% { box-shadow: inset 0 0 16px rgba(250, 204, 21, 0.6), 0 0 24px rgba(239, 68, 68, 0.5); }
    }
    
    .streak-pill.streak-fire {
      animation: fireGlow 1.5s ease-in-out infinite;
      border-color: rgba(249, 115, 22, 0.7) !important;
      background: rgba(249, 115, 22, 0.2) !important;
    }
    .streak-pill.streak-trophy {
      animation: fireGlow 1.2s ease-in-out infinite;
      border-color: rgba(250, 204, 21, 0.7) !important;
      background: rgba(250, 204, 21, 0.15) !important;
    }
    .streak-pill.streak-sword {
      animation: fireGlow 1.0s ease-in-out infinite;
      border-color: rgba(168, 85, 247, 0.7) !important;
      background: rgba(168, 85, 247, 0.15) !important;
    }
    .streak-pill.streak-dragon {
      animation: dragonGlow 0.8s ease-in-out infinite;
      border-color: rgba(239, 68, 68, 0.8) !important;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(250, 204, 21, 0.2)) !important;
      color: #fde047 !important;
    }
    
    .freeze-tokens {
      font-size: 10px;
      margin-left: 2px;
      filter: drop-shadow(0 0 4px rgba(147, 197, 253, 0.6));
    }
    
    /* ===== SQUASH & STRETCH ===== */
    .game-card, .gc-play-btn, .pill-btn, .nb-open-btn, .mini-chip, 
    .filter-tab, .hud-back, .hud-replay {
      transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease !important;
      will-change: transform;
    }
    
    .game-card:active { transform: scale(0.94) !important; }
    .gc-play-btn:active, .pill-btn:active, .nb-open-btn:active, 
    .mini-chip:active, .filter-tab:active, .hud-back:active { 
      transform: scale(0.91) !important; 
    }
    
    /* ===== RADICAL BREAKDOWN ===== */
    .radical-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 100;
      backdrop-filter: blur(4px);
    }
    .radical-card {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(1);
      z-index: 101;
      background: linear-gradient(160deg, #1e293b, #0f172a);
      border: 2px solid rgba(56, 189, 248, 0.5);
      border-radius: 20px;
      padding: 20px;
      width: 85%;
      max-width: 340px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .radical-main-char {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: 12px;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }
    .radical-equation {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    @keyframes radicalSlideIn {
      0% { transform: translateY(20px) scale(0.5); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    .radical-part {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px; height: 48px;
      font-size: 28px;
      background: rgba(56, 189, 248, 0.12);
      border: 1.5px solid rgba(56, 189, 248, 0.4);
      border-radius: 12px;
      animation: radicalSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    }
    .radical-op {
      font-size: 22px;
      font-weight: 900;
      color: #94a3b8;
    }
    .radical-result {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px; height: 48px;
      font-size: 28px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(56, 189, 248, 0.2));
      border: 2px solid rgba(16, 185, 129, 0.6);
      border-radius: 12px;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
      animation: radicalSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s backwards;
    }
    .radical-meanings {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .radical-meaning-chip {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 8px;
      background: rgba(250, 204, 21, 0.1);
      border: 1px solid rgba(250, 204, 21, 0.35);
      color: #fde68a;
    }
    .radical-mnemonic {
      font-size: 13px;
      font-weight: 800;
      color: #d1fae5;
      margin-bottom: 14px;
      padding: 8px;
      background: rgba(16, 185, 129, 0.08);
      border-radius: 10px;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .radical-close-btn {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 900;
      color: #fff;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .radical-close-btn:active { transform: scale(0.96); }
    
    /* ===== PWA INSTALL BANNER ===== */
    #pwa-install-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15));
      border: 1.5px solid rgba(16, 185, 129, 0.5);
      border-radius: 14px;
      transition: transform 0.3s ease, opacity 0.3s ease;
      position: relative;
    }
    .install-icon { font-size: 24px; }
    .install-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .install-text strong { font-size: 12px; color: #d1fae5; }
    .install-text span { font-size: 10px; color: #94a3b8; }
    .install-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 900;
      color: #fff;
      background: linear-gradient(135deg, #059669, #0d9488);
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(5, 150, 105, 0.4);
      white-space: nowrap;
    }
    .install-btn:active { transform: scale(0.94); }
    .install-dismiss {
      position: absolute;
      top: 4px; right: 6px;
      background: none;
      border: none;
      color: #64748b;
      font-size: 14px;
      cursor: pointer;
      padding: 2px 4px;
    }
    
    /* ===== ADAPTIVE DIFFICULTY INDICATOR ===== */
    .difficulty-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.35);
      color: #c4b5fd;
    }
  `;
  document.head.appendChild(style);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function initV41Upgrades() {
  // 1. Inject CSS
  injectUpgradeCSS();
  
  // 2. Enhanced streak display
  renderStreakFireUI();
  
  // 3. Inject juice to buttons (retry on DOM changes)
  injectJuiceToAllButtons();
  const observer = new MutationObserver(() => {
    injectJuiceToAllButtons();
  });
  observer.observe(document.getElementById('app-shell') || document.body, {
    childList: true, subtree: true
  });
  
  // 4. Setup PWA install bonus
  setupPWAInstallBonus();
  
  // 5. Log initialization
  console.log('🚀 [CyberLingo Arcade v4.1] Upgrade Module loaded!');
  console.log('  ✅ Streak Lửa Thiêng + Freeze Tokens');
  console.log('  ✅ Squash & Stretch + Haptic Patterns');
  console.log('  ✅ Radical Breakdown (28 characters)');
  console.log('  ✅ PWA Install Bonus (500 EXP + 2 Freeze)');
  console.log('  ✅ Adaptive Difficulty Engine');
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initV41Upgrades);
} else {
  // DOM already loaded (script loaded at bottom)
  setTimeout(initV41Upgrades, 100);
}

// Export all to global scope
if (typeof window !== 'undefined') {
  window.hapticPattern = hapticPattern;
  window.juicePress = juicePress;
  window.spawnParticleBurst = spawnParticleBurst;
  window.showRadicalBreakdown = showRadicalBreakdown;
  window.closeRadicalPopup = closeRadicalPopup;
  window.recordAdaptiveAnswer = recordAdaptiveAnswer;
  window.getAdaptiveSettings = getAdaptiveSettings;
  window.awardFreezeTokenOnHighScore = awardFreezeTokenOnHighScore;
  window.renderStreakFireUI = renderStreakFireUI;
  window.loadDailyMetaV41 = loadDailyMetaV41;
  window.triggerPWAInstall = triggerPWAInstall;
  window.hideInstallBanner = hideInstallBanner;
}
