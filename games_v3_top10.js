// ============================================================================
// CYBERLINGO ARCADE PRO v4.0 — AAA RETINA EDITIONS OF GOLD MINER & DYNOMITE
// 1. Đào Vàng Tiếng Trung (Faceted 24K Gold Nuggets, Strata, Winch Gear)
// 2. Bắn Trứng Khủng Long (3D Glossy Eggs, Shockwave Rings, Bounce Crosshair)
// Developed by DEAN OPTIMIZE
// ============================================================================

// =========================================================
// GAME 1: ⛏️ ĐÀO VÀNG TIẾNG TRUNG (Cyber Gold Miner v4.0)
// =========================================================
let minerState = null;
let minerRafId = null;

// =========================================================
// CYBER STREAK BRIDGE — single source of truth for streak & tier
// ---------------------------------------------------------
// cyber_streak_engine.js loads AFTER this file (index.html:3532),
// so the engine must be instantiated lazily, never at parse time.
// Scoring is intentionally left on the original formula: the engine
// owns streak state, tier and the HUD label only. This keeps every
// existing score value byte-identical to before the integration.
// =========================================================
const STREAK_COMBO_CAP = 10;
let _streakEngine = null;

function streakEngine() {
  if (_streakEngine) return _streakEngine;
  if (typeof window !== 'undefined' && typeof window.CyberStreakEngine === 'function') {
    _streakEngine = new window.CyberStreakEngine();
  }
  return _streakEngine;
}

// Registers a hit. `isPerfect` is only true when the game can actually prove
// it (e.g. first-try catch) — never hardcoded, or the bonus becomes permanent.
// NOTE: legacy combo starts at 1 and increments on hit, so the visible combo is
// always engineStreak + 1. Mapping it any other way would silently cost points.
function streakHit(isPerfect) {
  const e = streakEngine();
  if (!e) {
    combo = Math.min(STREAK_COMBO_CAP, combo + 1);
    return { streak: combo, comboTier: 'NORMAL' };
  }
  const r = e.recordHit(!!isPerfect);
  combo = Math.min(STREAK_COMBO_CAP, r.streak + 1);
  return r;
}

function streakMiss() {
  const e = streakEngine();
  if (e) e.recordMiss();
  combo = 1;
}

function streakTier() {
  const e = streakEngine();
  return e ? e.getStats().comboTier : 'NORMAL';
}

function streakReset() {
  const e = streakEngine();
  if (e) {
    e.streak = 0;
    e.maxStreak = 0;
    e.multiplier = 1.0;
  }
  combo = 1;
}

function initMinerGame() {
  const cvs = document.getElementById('canvas-miner');
  const { W, H } = setupRetinaCanvas(cvs);

  minerState = {
    W,
    H,
    originX: W / 2,
    originY: 48,
    angle: 0,
    swingTime: 0,
    gearRot: 0,
    phase: 'swing',
    clawLen: 28,
    hookedItem: null,
    dynamiteCount: 3,
    nuggets: [],
    popups: [],
    sparks: [],
    rings: [],
    dust: Array.from({ length: 24 }, () => ({
      x: Math.random() * W,
      y: 84 + Math.random() * (H - 96),
      r: 1 + Math.random() * 1.8,
      a: 0.15 + Math.random() * 0.35
    })),
    targetVocab: null,
    timeLeft: 65,
    maxTime: 65
  };

  cvs.onpointerdown = (e) => {
    if (!minerState || window.isGamePaused) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;

    if (minerState.phase === 'reel' && minerState.hookedItem && !minerState.hookedItem.isTarget) {
      if (px > minerState.W - 112 && py < 58 && minerState.dynamiteCount > 0) {
        useMinerDynamite();
        return;
      }
    }

    if (minerState.phase === 'swing') {
      minerState.phase = 'shoot';
      hapticPulse(12);
      sound.sfxTap();
    }
  };

  const onKey = (e) => {
    if (activeGame !== 'miner' || !minerState || window.isGamePaused) return;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 's') {
      if (minerState.phase === 'swing') {
        minerState.phase = 'shoot';
        sound.sfxTap();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      if (minerState.phase === 'reel' && minerState.hookedItem && !minerState.hookedItem.isTarget && minerState.dynamiteCount > 0) {
        useMinerDynamite();
      }
    }
  };
  window.addEventListener('keydown', onKey);

  const timerId = setInterval(() => {
    if (!minerState || activeGame !== 'miner' || window.isGamePaused) return;
    minerState.timeLeft -= 0.25;
    const pct = Math.max(0, (minerState.timeLeft / minerState.maxTime) * 100);
    document.getElementById('mission-timer-fill').style.width = pct + '%';
    if (minerState.timeLeft <= 0) {
      sound.sfxWrong();
      triggerGameOver('⏰ HẾT GIỜ ĐÀO VÀNG!');
    }
  }, 250);

  cleanupFns.push(() => {
    cancelAnimationFrame(minerRafId);
    clearInterval(timerId);
    window.removeEventListener('keydown', onKey);
    minerState = null;
  });

  spawnMinerStage();
  loopMiner();
}

function makeNuggetPolygon(rad) {
  const pts = [];
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const jitter = 0.88 + ((i * 37) % 10) * 0.02;
    pts.push({ x: Math.cos(a) * rad * jitter, y: Math.sin(a) * rad * 0.88 * jitter });
  }
  return pts;
}

function useMinerDynamite() {
  if (!minerState || !minerState.hookedItem) return;
  minerState.dynamiteCount--;
  hapticPulse(30);
  const it = minerState.hookedItem;
  const hx = minerState.originX + Math.sin(minerState.angle) * minerState.clawLen;
  const hy = minerState.originY + Math.cos(minerState.angle) * minerState.clawLen;
  minerState.rings.push({ x: hx, y: hy, r: 8, maxR: 58, color: '#f97316', life: 1.0 });
  for (let k = 0; k < 20; k++) {
    minerState.sparks.push({
      x: hx, y: hy,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      color: k % 2 === 0 ? '#fde047' : '#f97316',
      life: 1.0
    });
  }
  minerState.hookedItem = null;
  minerState.phase = 'retract';
  sound.sfxLaser();
  showToast(`🧨 Đã nổ tung đá sai "${it.vocab.zh}"!`);
}

function spawnMinerStage() {
  if (!minerState) return;
  const S = minerState;
  S.nuggets = [];

  const pools = getActivePools();
  const picks = pickSmartVocabSubset(pools.vocab, 5);
  const target = picks[0];
  S.targetVocab = target;
  currentPromptAudio = { zh: target.zh, audio: target.audio };
  sound.speakChinese(target.zh, target.audio);

  setMissionBanner(
    '⛏️ ĐÀO VÀNG CHỮ HÁN',
    `🎯 Kéo quặng vàng: "<span style="color:#fde047">${target.vi}</span>"`,
    'Chạm màn hình phóng ngoạm — Kéo nhầm sẽ hóa Đá Nặng (bấm 🧨 để hủy)!',
    true
  );

  const placed = [];
  picks.forEach((v, idx) => {
    const rad = 31 + (idx % 2) * 4;
    let bx = S.W * 0.5;
    let by = S.H * 0.56;
    for (let tries = 0; tries < 95; tries++) {
      const tx = 48 + Math.random() * (S.W - 96);
      const ty = 132 + Math.random() * (S.H - 180);
      if (!placed.some((p) => Math.hypot(p.x - tx, p.y - ty) < p.r + rad + 18)) {
        bx = tx; by = ty;
        break;
      }
    }
    const nug = {
      x: bx,
      y: by,
      r: rad,
      poly: makeNuggetPolygon(rad),
      vocab: v,
      isTarget: v.zh === target.zh,
      revealedWrong: false
    };
    placed.push(nug);
    S.nuggets.push(nug);
  });
}

function loopMiner() {
  if (activeGame !== 'miner' || !minerState) return;
  if (window.isGamePaused) {
    minerRafId = requestAnimationFrame(loopMiner);
    return;
  }
  const cvs = document.getElementById('canvas-miner');
  const ctx = cvs.getContext('2d');
  const S = minerState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Sky dome & 3-tier geological earth strata
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 76);
  skyGrad.addColorStop(0, '#0c1e3a');
  skyGrad.addColorStop(1, '#172e54');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, S.W, 76);

  const earthGrad = ctx.createLinearGradient(0, 76, 0, S.H);
  earthGrad.addColorStop(0, '#2a1c0e');
  earthGrad.addColorStop(0.45, '#1f140a');
  earthGrad.addColorStop(1, '#120b05');
  ctx.fillStyle = earthGrad;
  ctx.fillRect(0, 76, S.W, S.H - 76);

  // Sparkling gold dust veins underground
  for (const d of S.dust) {
    ctx.fillStyle = `rgba(253, 224, 71, ${d.a})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Surface rail beam
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 72, S.W, 6);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 72); ctx.lineTo(S.W, 72); ctx.stroke();

  // Mechanical Winch Gear + Miner Cabin
  ctx.save();
  ctx.translate(S.originX, 42);
  ctx.rotate(S.gearRot);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  for (let g = 0; g < 6; g++) {
    const ga = (g / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ga) * 11, Math.sin(ga) * 11);
    ctx.lineTo(Math.cos(ga) * 19, Math.sin(ga) * 19);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = '25px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👷‍♂️', S.originX, 24);

  // Dynamite Button
  drawBeveledBox(
    ctx,
    S.W - 104, 12, 94, 34, 10,
    S.dynamiteCount > 0 ? '#dc2626' : '#334155',
    S.dynamiteCount > 0 ? '#991b1b' : '#1e293b',
    S.dynamiteCount > 0 ? '#fca5a5' : '#475569'
  );
  ctx.fillStyle = '#fff';
  ctx.font = '800 11.5px sans-serif';
  ctx.fillText(`🧨 Nổ đá (${S.dynamiteCount})`, S.W - 57, 29);

  // Claw State Machine
  const spdMul = getSpeedFactor();
  if (S.phase === 'swing') {
    S.swingTime += 0.035 * spdMul;
    S.angle = Math.sin(S.swingTime) * 1.18;
    S.clawLen = 28;
  } else if (S.phase === 'shoot') {
    S.clawLen += 8.4 * spdMul;
    S.gearRot += 0.22;
    const hx = S.originX + Math.sin(S.angle) * S.clawLen;
    const hy = S.originY + Math.cos(S.angle) * S.clawLen;

    for (let i = 0; i < S.nuggets.length; i++) {
      const n = S.nuggets[i];
      if (Math.hypot(hx - n.x, hy - n.y) <= n.r + 7) {
        S.hookedItem = n;
        S.nuggets.splice(i, 1);
        S.phase = 'reel';
        if (n.isTarget) {
          hapticPulse(18);
          sound.sfxTap();
        } else {
          n.revealedWrong = true;
          hapticPulse(35);
          recordSrsOutcome(S.targetVocab, false);
          recordSrsOutcome(n.vocab, false);
          sound.sfxWrong();
          showToast(`🪨 Đá nặng! "${n.vocab.zh}" = ${n.vocab.vi} (Bấm 🧨 hủy!)`);
        }
        break;
      }
    }

    if (S.phase === 'shoot' && (hx < 10 || hx > S.W - 10 || hy > S.H - 10)) {
      S.phase = 'retract';
    }
  } else if (S.phase === 'retract') {
    S.clawLen -= 9.8 * spdMul;
    S.gearRot -= 0.25;
    if (S.clawLen <= 28) {
      S.clawLen = 28;
      S.phase = 'swing';
    }
  } else if (S.phase === 'reel') {
    const pullSpd = S.hookedItem && S.hookedItem.isTarget ? 6.4 : 1.65;
    S.clawLen -= pullSpd * spdMul;
    S.gearRot -= pullSpd * 0.05;
    if (S.clawLen <= 30) {
      const caught = S.hookedItem;
      S.hookedItem = null;
      S.clawLen = 28;
      S.phase = 'swing';

      if (caught) {
        if (caught.isTarget) {
          streakHit(!caught.revealedWrong);
          incrementDailyProgress('combo', combo);
          sound.sfxCombo(combo);
          sound.speakChinese(caught.vocab.zh, caught.vocab.audio);
          recordLearnedWord(caught.vocab);
          recordSrsOutcome(caught.vocab, true);
          const pts = Math.round(30 * combo * getScoreMultiplier());
          score += pts;
          addArcadeXP(14);
          spawnComboBanner(combo, pts);
          S.timeLeft = Math.min(S.maxTime, S.timeLeft + 4);
          S.rings.push({ x: S.originX, y: 58, r: 6, maxR: 50, color: '#fde047', life: 1.0 });
          stageNum = 1 + Math.floor(score / 180);
          updateHUD();
          S.popups.push({ x: S.originX, y: 66, txt: `💰 +$${pts} VÀNG 24K!`, color: '#fde047', life: 1.0 });
          spawnMinerStage();
        } else {
          streakMiss();
          spawnComboBanner(1, 0);
          lives--;
          updateHUD();
          if (lives <= 0) {
            triggerGameOver('🪨 KÉO NHẦM QUÁ NHIỀU ĐÁ!');
            return;
          }
        }
      }
    }
  }

  // Draw Faceted 24K Gold Nuggets
  const drawFacetedNugget = (n, cx, cy) => {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer gold halo
    if (!n.revealedWrong) {
      ctx.beginPath();
      ctx.arc(0, 0, n.r + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
      ctx.fill();
    }

    ctx.beginPath();
    n.poly.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();

    if (n.revealedWrong) {
      const rGrad = ctx.createLinearGradient(-n.r, -n.r, n.r, n.r);
      rGrad.addColorStop(0, '#64748b');
      rGrad.addColorStop(1, '#334155');
      ctx.fillStyle = rGrad;
      ctx.strokeStyle = '#94a3b8';
    } else {
      const gGrad = ctx.createRadialGradient(-n.r * 0.3, -n.r * 0.3, 3, 0, 0, n.r);
      gGrad.addColorStop(0, '#fef9c3');
      gGrad.addColorStop(0.45, '#facc15');
      gGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = gGrad;
      ctx.strokeStyle = '#fef08a';
    }
    ctx.lineWidth = 2.2;
    ctx.fill();
    ctx.stroke();

    // Facet specular glint
    if (!n.revealedWrong) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.beginPath();
      ctx.ellipse(-n.r * 0.28, -n.r * 0.32, n.r * 0.26, n.r * 0.12, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark contrast pill behind Hanzi so Chinese strokes are ultra-legible!
    const zh = n.vocab.zh;
    ctx.font = zh.length >= 4 ? '900 13px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 15px "PingFang SC", "Microsoft YaHei", sans-serif';
    const pillW = Math.max(n.r * 1.45, ctx.measureText(zh).width + 12);
    const pillH = showPinyin && n.vocab.pinyin ? 28 : 22;
    ctx.fillStyle = 'rgba(10, 15, 28, 0.84)';
    ctx.strokeStyle = n.revealedWrong ? '#fb7185' : 'rgba(253, 224, 71, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zh, 0, showPinyin && n.vocab.pinyin ? -4.5 : 0.5);
    if (showPinyin && n.vocab.pinyin) {
      ctx.font = '700 8.5px sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(n.vocab.pinyin.slice(0, 13), 0, 8.5);
    }
    ctx.restore();
  };

  for (const n of S.nuggets) {
    drawFacetedNugget(n, n.x, n.y);
  }

  const hx = S.originX + Math.sin(S.angle) * S.clawLen;
  const hy = S.originY + Math.cos(S.angle) * S.clawLen;

  if (S.phase === 'swing') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(S.originX + Math.sin(S.angle) * 165, S.originY + Math.cos(S.angle) * 165);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Steel Cable
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(S.originX, S.originY);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  if (S.hookedItem) {
    drawFacetedNugget(S.hookedItem, hx + Math.sin(S.angle) * 19, hy + Math.cos(S.angle) * 19);
  }

  // Mechanical 2-Prong Grappling Claw
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-S.angle);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, 10);
  ctx.quadraticCurveTo(-12, 2, 0, -2);
  ctx.quadraticCurveTo(12, 2, 9, 10);
  ctx.stroke();
  ctx.fillStyle = '#fde047';
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Shockwave rings
  for (let i = S.rings.length - 1; i >= 0; i--) {
    const rg = S.rings[i];
    rg.r += (rg.maxR - rg.r) * 0.18;
    rg.life -= 0.06;
    if (rg.life <= 0) { S.rings.splice(i, 1); continue; }
    ctx.globalAlpha = rg.life;
    ctx.strokeStyle = rg.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  for (let i = S.popups.length - 1; i >= 0; i--) {
    const pp = S.popups[i];
    pp.y -= 0.95; pp.life -= 0.025;
    if (pp.life <= 0) { S.popups.splice(i, 1); continue; }
    ctx.globalAlpha = pp.life;
    ctx.fillStyle = pp.color;
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pp.txt, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(253, 224, 71, 0.58)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👇 Chạm bất kỳ đâu để phóng ngoạm kéo quặng vàng!', S.W / 2, S.H - 8);

  minerRafId = requestAnimationFrame(loopMiner);
}

// =========================================================
// GAME 2: 🥚 BẮN TRỨNG ÂM THANH (Dynomite Bubble Shooter v4.0)
// =========================================================
let bubState = null;
let bubRafId = null;

function initBubbleGame() {
  const cvs = document.getElementById('canvas-bubble');
  const { W, H } = setupRetinaCanvas(cvs);

  bubState = {
    W,
    H,
    cannonX: W / 2,
    cannonY: H - 40,
    aimAngle: -Math.PI / 2,
    bubbles: [],
    shot: null,
    sparks: [],
    rings: [],
    targetVocab: null
  };

  const updateAim = (e) => {
    if (!bubState || window.isGamePaused) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    let ang = Math.atan2(py - bubState.cannonY, px - bubState.cannonX);
    ang = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, ang));
    bubState.aimAngle = ang;
  };

  cvs.onpointerdown = updateAim;
  cvs.onpointermove = (e) => {
    if (e.buttons || e.pointerType === 'touch') updateAim(e);
  };
  cvs.onpointerup = () => {
    if (!window.isGamePaused) fireBubbleShot();
  };

  cleanupFns.push(() => {
    cancelAnimationFrame(bubRafId);
    bubState = null;
  });

  spawnBubbleCluster();
  loopBubble();
}

function spawnBubbleCluster() {
  if (!bubState) return;
  const S = bubState;
  S.bubbles = [];
  S.shot = null;

  const pools = getActivePools();
  const picks = pickSmartVocabSubset(pools.vocab, 10);
  const cols = 4;
  const rad = Math.min(34, Math.floor((S.W - 36) / (cols * 2.15)));
  const spacingX = rad * 2 + 6;
  const spacingY = rad * 1.82;
  const palette = [
    ['#38bdf8', '#0369a1'],
    ['#c084fc', '#6b21a8'],
    ['#34d399', '#047857'],
    ['#fbbf24', '#b45309'],
    ['#fb7185', '#be123c']
  ];

  let k = 0;
  for (let row = 0; row < 3; row++) {
    const rowCount = row % 2 === 1 ? cols - 1 : cols;
    const rowWidth = (rowCount - 1) * spacingX;
    const startX = (S.W - rowWidth) / 2;
    for (let c = 0; c < rowCount; c++) {
      const v = picks[k % picks.length];
      const pal = palette[(row + c) % palette.length];
      k++;
      S.bubbles.push({
        x: startX + c * spacingX,
        y: 42 + row * spacingY,
        r: rad,
        cTop: pal[0],
        cBot: pal[1],
        vocab: v
      });
    }
  }

  pickNextBubbleTarget();
}

function pickNextBubbleTarget() {
  if (!bubState) return;
  const S = bubState;
  if (S.bubbles.length === 0) {
    sound.sfxFanfare();
    stageNum++;
    score += 75;
    addArcadeXP(22);
    updateHUD();
    showToast(`🎉 Nổ sạch giàn trứng! Qua Màn ${stageNum}!`);
    spawnBubbleCluster();
    return;
  }

  const sorted = [...S.bubbles].sort((a, b) => b.y - a.y);
  const frontLine = sorted.slice(0, Math.min(4, sorted.length));
  const chosen = frontLine[Math.floor(Math.random() * frontLine.length)].vocab;
  S.targetVocab = chosen;
  currentPromptAudio = { zh: chosen.zh, audio: chosen.audio };
  sound.speakChinese(chosen.zh, chosen.audio);

  setMissionBanner(
    '🥚 BẮN TRỨNG KHỦNG LONG ÂM THANH',
    `🎯 Bắn nổ trứng: "<span style="color:#fde047">${chosen.vi}</span>"`,
    'Giữ & kéo tia laser dội tường, thả tay để phóng trứng!',
    false
  );
}

function fireBubbleShot() {
  if (!bubState || bubState.shot || !bubState.targetVocab) return;
  const S = bubState;
  const spd = 11.2 * getSpeedFactor();
  hapticPulse(14);
  S.shot = {
    x: S.cannonX,
    y: S.cannonY - 12,
    vx: Math.cos(S.aimAngle) * spd,
    vy: Math.sin(S.aimAngle) * spd,
    r: 20
  };
  sound.sfxLaser();
}

function resolveBubbleHit(hitBubble) {
  if (!bubState) return;
  const S = bubState;
  const shotPos = { x: S.shot.x, y: S.shot.y };
  S.shot = null;

  const blastRadius = (hitBubble ? hitBubble.r : 30) * 2.35;
  const matched = S.bubbles.filter(
    (b) => b.vocab.zh === S.targetVocab.zh && Math.hypot(b.x - shotPos.x, b.y - shotPos.y) <= blastRadius
  );

  if ((hitBubble && hitBubble.vocab.zh === S.targetVocab.zh) || matched.length > 0) {
    const targetZh = S.targetVocab.zh;
    const popped = S.bubbles.filter((b) => b.vocab.zh === targetZh);
    S.bubbles = S.bubbles.filter((b) => b.vocab.zh !== targetZh);

    popped.forEach((b) => {
      S.rings.push({ x: b.x, y: b.y, r: 8, maxR: b.r * 2.1, color: '#fde047', life: 1.0 });
      for (let k = 0; k < 15; k++) {
        S.sparks.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 6.5,
          vy: (Math.random() - 0.5) * 6.5,
          color: k % 2 === 0 ? '#fde047' : '#38bdf8',
          life: 1.0
        });
      }
    });

    hapticPulse(22);
    // Perfect = hit the intended target egg directly, with no wrong egg touched.
    streakHit(!hitBubble || hitBubble.vocab.zh === S.targetVocab.zh);
    incrementDailyProgress('combo', combo);
    sound.sfxCombo(combo);
    sound.speakChinese(S.targetVocab.zh, S.targetVocab.audio);
    recordLearnedWord(S.targetVocab);
    recordSrsOutcome(S.targetVocab, true);
    const pts = Math.round(30 * combo * getScoreMultiplier());
    score += pts;
    addArcadeXP(12);
    spawnComboBanner(combo, pts);
    updateHUD();
    showToast(`🥚 NỔ GIÒN TAN: ${S.targetVocab.zh}!`);
    pickNextBubbleTarget();
  } else {
    hapticPulse(35);
    sound.sfxWrong();
    triggerScreenShake();
    recordSrsOutcome(S.targetVocab, false);
    if (hitBubble) recordSrsOutcome(hitBubble.vocab, false);
    streakMiss();
    spawnComboBanner(1, 0);
    lives--;
    updateHUD();
    const wrongInfo = hitBubble ? `"${hitBubble.vocab.zh}" = ${hitBubble.vocab.vi}` : 'Trượt mục tiêu!';
    showToast(`❌ Bắn lệch! ${wrongInfo}`);

    const pools = getActivePools();
    const extraVocab = pools.vocab[Math.floor(Math.random() * pools.vocab.length)];
    const r = S.bubbles[0] ? S.bubbles[0].r : 30;
    const clampedX = Math.max(r + 6, Math.min(S.W - r - 6, shotPos.x));
    const clampedY = Math.max(40, shotPos.y);
    S.bubbles.push({
      x: clampedX,
      y: clampedY,
      r,
      cTop: '#64748b',
      cBot: '#334155',
      vocab: extraVocab
    });

    if (lives <= 0 || clampedY + r >= S.cannonY - 54) {
      triggerGameOver('🥚 GIÀN TRỨNG SẬP CHẠM PHÁO!');
      return;
    }
    pickNextBubbleTarget();
  }
}

function drawBubbleAimRay(ctx, S) {
  let rx = S.cannonX;
  let ry = S.cannonY - 12;
  let dx = Math.cos(S.aimAngle) * 9;
  let dy = Math.sin(S.aimAngle) * 9;
  let endX = rx, endY = ry;

  for (let step = 0; step < 34; step++) {
    rx += dx;
    ry += dy;
    if (rx < 18) { rx = 18; dx = -dx; }
    if (rx > S.W - 18) { rx = S.W - 18; dx = -dx; }
    endX = rx; endY = ry;
    if (ry < 26) break;
    if (S.bubbles.some((b) => Math.hypot(b.x - rx, b.y - ry) < b.r)) break;
    if (step % 2 === 0) {
      ctx.fillStyle = `rgba(253, 224, 71, ${0.7 - step * 0.015})`;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Target impact crosshair glow
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(endX, endY, 8, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGlossyEggBubble(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 3, 0, 0, b.r);
  grad.addColorStop(0, b.cTop || '#38bdf8');
  grad.addColorStop(1, b.cBot || '#0369a1');

  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3D Glass specular shine
  ctx.beginPath();
  ctx.ellipse(-b.r * 0.28, -b.r * 0.34, b.r * 0.3, b.r * 0.14, -0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const zh = b.vocab.zh;
  ctx.font = zh.length >= 4 ? '900 12.5px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 15px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(zh, 0, showPinyin ? -4 : 1);
  if (showPinyin && b.vocab.pinyin) {
    ctx.fillStyle = '#fef9c3';
    ctx.font = '700 8.5px sans-serif';
    ctx.fillText(b.vocab.pinyin.slice(0, 12), 0, 10);
  }
  ctx.restore();
}

function loopBubble() {
  if (activeGame !== 'bubble' || !bubState) return;
  if (window.isGamePaused) {
    bubRafId = requestAnimationFrame(loopBubble);
    return;
  }
  const cvs = document.getElementById('canvas-bubble');
  const ctx = cvs.getContext('2d');
  const S = bubState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Danger line
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, S.cannonY - 54);
  ctx.lineTo(S.W, S.cannonY - 54);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!S.shot) {
    drawBubbleAimRay(ctx, S);
  }

  if (S.shot) {
    const sh = S.shot;
    sh.x += sh.vx;
    sh.y += sh.vy;
    if (sh.x < sh.r) { sh.x = sh.r; sh.vx = Math.abs(sh.vx); sound.sfxTap(); }
    if (sh.x > S.W - sh.r) { sh.x = S.W - sh.r; sh.vx = -Math.abs(sh.vx); sound.sfxTap(); }

    let collided = null;
    for (const b of S.bubbles) {
      if (Math.hypot(sh.x - b.x, sh.y - b.y) <= sh.r + b.r - 4) {
        collided = b;
        break;
      }
    }
    if (collided || sh.y <= 32) {
      resolveBubbleHit(collided);
    } else {
      const pGrad = ctx.createRadialGradient(sh.x - 5, sh.y - 5, 2, sh.x, sh.y, sh.r);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.5, '#fde047');
      pGrad.addColorStop(1, '#ea580c');
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2);
      ctx.fillStyle = pGrad;
      ctx.fill();
    }
  }

  for (const b of S.bubbles) {
    drawGlossyEggBubble(ctx, b);
  }

  // Shockwave rings
  for (let i = S.rings.length - 1; i >= 0; i--) {
    const rg = S.rings[i];
    rg.r += (rg.maxR - rg.r) * 0.2;
    rg.life -= 0.06;
    if (rg.life <= 0) { S.rings.splice(i, 1); continue; }
    ctx.globalAlpha = rg.life;
    ctx.strokeStyle = rg.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  // Dino Cyber Cannon Turret
  ctx.save();
  ctx.translate(S.cannonX, S.cannonY);
  ctx.rotate(S.aimAngle + Math.PI / 2);
  drawBeveledBox(ctx, -13, -32, 26, 34, 7, '#f59e0b', '#b45309', '#fef08a', 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(S.cannonX, S.cannonY, 21, 0, Math.PI * 2);
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🦖', S.cannonX, S.cannonY + 1);

  // Loaded Meaning Tag right next to Cannon
  if (S.targetVocab) {
    const label = S.targetVocab.vi.slice(0, 22);
    ctx.font = '800 11px sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`Đạn: "${label}"`, S.W / 2, S.H - 8);
  }

  bubRafId = requestAnimationFrame(loopBubble);
}
