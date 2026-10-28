// ============================================================================
// CYBERLINGO ARCADE PRO v3.0 — FINAL 2 HALL-OF-FAME CLASSICS (COMPLETING TOP 10)
// 9. Đào Vàng Tiếng Trung (Cyber Gold Miner)
// 10. Bắn Trứng Khủng Long (Dynomite Bubble Shooter)
// Developed by DEAN OPTIMIZE
// ============================================================================

// =========================================================
// GAME 9: ⛏️ ĐÀO VÀNG TIẾNG TRUNG (Cyber Gold Miner)
// =========================================================
let minerState = null;
let minerRafId = null;

function initMinerGame() {
  const cvs = document.getElementById('canvas-miner');
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = Math.max(310, Math.floor(rect.width));
  cvs.height = Math.max(330, Math.floor(rect.height));

  minerState = {
    W: cvs.width,
    H: cvs.height,
    originX: cvs.width / 2,
    originY: 46,
    angle: 0,
    swingTime: 0,
    phase: 'swing', // 'swing' | 'shoot' | 'reel' | 'retract'
    clawLen: 28,
    hookedItem: null,
    dynamiteCount: 3,
    nuggets: [],
    popups: [],
    sparks: [],
    targetVocab: null,
    timeLeft: 65,
    maxTime: 65
  };

  cvs.onpointerdown = (e) => {
    if (!minerState) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;

    // Check Dynamite button tap (top-right corner) while reeling wrong rock
    if (minerState.phase === 'reel' && minerState.hookedItem && !minerState.hookedItem.isTarget) {
      if (px > minerState.W - 108 && py < 56 && minerState.dynamiteCount > 0) {
        useMinerDynamite();
        return;
      }
    }

    if (minerState.phase === 'swing') {
      minerState.phase = 'shoot';
      sound.sfxTap();
    }
  };

  const onKey = (e) => {
    if (activeGame !== 'miner' || !minerState) return;
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
    if (!minerState || activeGame !== 'miner') return;
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

function useMinerDynamite() {
  if (!minerState || !minerState.hookedItem) return;
  minerState.dynamiteCount--;
  const it = minerState.hookedItem;
  const hx = minerState.originX + Math.sin(minerState.angle) * minerState.clawLen;
  const hy = minerState.originY + Math.cos(minerState.angle) * minerState.clawLen;
  for (let k = 0; k < 18; k++) {
    minerState.sparks.push({
      x: hx, y: hy,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color: '#f97316',
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
  const picks = shuffleArr(pools.vocab).slice(0, 5);
  const target = picks[0];
  S.targetVocab = target;
  currentPromptAudio = { zh: target.zh, audio: target.audio };
  sound.speakChinese(target.zh, target.audio);

  setMissionBanner(
    '⛏️ ĐÀO VÀNG CHỮ HÁN',
    `🎯 Ngoạm cục vàng: "<span style="color:#fde047">${target.vi}</span>"`,
    'Chạm màn hình thả ngoạm đúng góc — Ngoạm nhầm sẽ hóa Đá Nặng (bấm 🧨 để hủy)!',
    true
  );

  const placed = [];
  picks.forEach((v, idx) => {
    const rad = 28 + (idx % 2) * 4;
    let bx = S.W * 0.5;
    let by = S.H * 0.55;
    for (let tries = 0; tries < 90; tries++) {
      const tx = 44 + Math.random() * (S.W - 88);
      const ty = 128 + Math.random() * (S.H - 175);
      if (!placed.some((p) => Math.hypot(p.x - tx, p.y - ty) < p.r + rad + 18)) {
        bx = tx; by = ty;
        break;
      }
    }
    const nug = {
      x: bx,
      y: by,
      r: rad,
      vocab: v,
      isTarget: v.zh === target.zh,
      revealedWrong: false
    };
    placed.push(nug);
    S.nuggets.push(nug);
  });
}

function pickNextMinerTarget() {
  if (!minerState) return;
  const S = minerState;
  if (S.nuggets.length === 0) {
    sound.sfxFanfare();
    stageNum++;
    S.dynamiteCount = Math.min(5, S.dynamiteCount + 1);
    S.timeLeft = Math.min(S.maxTime, S.timeLeft + 12);
    updateHUD();
    showToast(`🎉 Đào sạch mỏ! Sang Mỏ ${stageNum} (+1 🧨)!`);
    spawnMinerStage();
    return;
  }
  // Ensure at least 3 nuggets so reading stays fun
  if (S.nuggets.length < 3) {
    spawnMinerStage();
    return;
  }
  S.nuggets.forEach((n) => { n.isTarget = false; });
  const chosen = S.nuggets[Math.floor(Math.random() * S.nuggets.length)];
  chosen.isTarget = true;
  S.targetVocab = chosen.vocab;
  currentPromptAudio = { zh: chosen.vocab.zh, audio: chosen.vocab.audio };
  sound.speakChinese(chosen.vocab.zh, chosen.vocab.audio);

  setMissionBanner(
    '⛏️ ĐÀO VÀNG CHỮ HÁN',
    `🎯 Ngoạm cục vàng: "<span style="color:#fde047">${chosen.vocab.vi}</span>"`,
    'Chạm màn hình thả ngoạm đúng góc — Ngoạm nhầm sẽ hóa Đá Nặng!',
    true
  );
}

function loopMiner() {
  if (activeGame !== 'miner' || !minerState) return;
  const cvs = document.getElementById('canvas-miner');
  const ctx = cvs.getContext('2d');
  const S = minerState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Mine header sky vs underground earth
  ctx.fillStyle = '#0f1f38';
  ctx.fillRect(0, 0, S.W, 74);
  ctx.fillStyle = '#1c150c';
  ctx.fillRect(0, 74, S.W, S.H - 74);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 74); ctx.lineTo(S.W, 74); ctx.stroke();

  // Miner rig icon
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👷‍♂️', S.originX, 26);

  // Dynamite button (top right)
  ctx.fillStyle = S.dynamiteCount > 0 ? 'rgba(185, 28, 28, 0.85)' : 'rgba(30, 41, 59, 0.6)';
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.5;
  ctx.roundRect(S.W - 102, 12, 92, 34, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '800 12px sans-serif';
  ctx.fillText(`🧨 Nổ đá (${S.dynamiteCount})`, S.W - 56, 29);

  // Update Claw State Machine
  const spdMul = getSpeedFactor();
  if (S.phase === 'swing') {
    S.swingTime += 0.036 * spdMul;
    S.angle = Math.sin(S.swingTime) * 1.18;
    S.clawLen = 28;
  } else if (S.phase === 'shoot') {
    S.clawLen += 8.2 * spdMul;
    const hx = S.originX + Math.sin(S.angle) * S.clawLen;
    const hy = S.originY + Math.cos(S.angle) * S.clawLen;

    // Check nugget hit
    for (let i = 0; i < S.nuggets.length; i++) {
      const n = S.nuggets[i];
      if (Math.hypot(hx - n.x, hy - n.y) <= n.r + 8) {
        S.hookedItem = n;
        S.nuggets.splice(i, 1);
        S.phase = 'reel';
        if (n.isTarget) {
          sound.sfxTap();
        } else {
          n.revealedWrong = true;
          sound.sfxWrong();
          showToast(`🪨 Đá nặng! "${n.vocab.zh}" = ${n.vocab.vi} (Bấm 🧨 để hủy!)`);
        }
        break;
      }
    }

    if (S.phase === 'shoot' && (hx < 10 || hx > S.W - 10 || hy > S.H - 10)) {
      S.phase = 'retract';
    }
  } else if (S.phase === 'retract') {
    S.clawLen -= 9.5 * spdMul;
    if (S.clawLen <= 28) {
      S.clawLen = 28;
      S.phase = 'swing';
    }
  } else if (S.phase === 'reel') {
    const pullSpd = S.hookedItem && S.hookedItem.isTarget ? 6.2 : 1.65;
    S.clawLen -= pullSpd * spdMul;
    if (S.clawLen <= 30) {
      const caught = S.hookedItem;
      S.hookedItem = null;
      S.clawLen = 28;
      S.phase = 'swing';

      if (caught) {
        if (caught.isTarget) {
          sound.sfxSuccess();
          sound.speakChinese(caught.vocab.zh, caught.vocab.audio);
          recordLearnedWord(caught.vocab);
          const pts = Math.round(30 * combo * getScoreMultiplier());
          score += pts;
          addArcadeXP(14);
          combo = Math.min(10, combo + 1);
          S.timeLeft = Math.min(S.maxTime, S.timeLeft + 4);
          updateHUD();
          S.popups.push({ x: S.originX, y: 66, txt: `💰 +$${pts} CHUẨN!`, color: '#fde047', life: 1.0 });
          spawnMinerStage();
        } else {
          combo = 1;
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

  // Draw Underground Gold Nuggets
  const drawNugget = (n, cx, cy) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, n.r, 0, Math.PI * 2);
    if (n.revealedWrong) {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
    } else {
      const grad = ctx.createRadialGradient(-8, -8, 4, 0, 0, n.r);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.6, '#eab308');
      grad.addColorStop(1, '#a16207');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fef9c3';
    }
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = n.revealedWrong ? '#f8fafc' : '#1e1b4b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const zh = n.vocab.zh;
    ctx.font = zh.length >= 4 ? '900 13px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 15.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(zh, 0, showPinyin ? -4 : 1);
    if (showPinyin && n.vocab.pinyin) {
      ctx.font = '800 8.5px sans-serif';
      ctx.fillStyle = n.revealedWrong ? '#cbd5e1' : '#451a03';
      ctx.fillText(n.vocab.pinyin.slice(0, 13), 0, 11);
    }
    ctx.restore();
  };

  for (const n of S.nuggets) {
    drawNugget(n, n.x, n.y);
  }

  // Draw Aiming Laser (subtle short guide when swinging)
  const hx = S.originX + Math.sin(S.angle) * S.clawLen;
  const hy = S.originY + Math.cos(S.angle) * S.clawLen;

  if (S.phase === 'swing') {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(S.originX + Math.sin(S.angle) * 155, S.originY + Math.cos(S.angle) * 155);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Rope & Claw
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(S.originX, S.originY);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  if (S.hookedItem) {
    drawNugget(S.hookedItem, hx + Math.sin(S.angle) * 18, hy + Math.cos(S.angle) * 18);
  }

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-S.angle);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 4, 9, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.restore();

  // Sparks & Popups
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
    pp.y -= 0.9; pp.life -= 0.025;
    if (pp.life <= 0) { S.popups.splice(i, 1); continue; }
    ctx.globalAlpha = pp.life;
    ctx.fillStyle = pp.color;
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pp.txt, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👇 Chạm bất kỳ đâu trên màn hình để phóng ngoạm đào vàng!', S.W / 2, S.H - 8);

  minerRafId = requestAnimationFrame(loopMiner);
}

// =========================================================
// GAME 10: 🥚 BẮN TRỨNG ÂM THANH (Dynomite / Bubble Shooter)
// =========================================================
let bubState = null;
let bubRafId = null;

function initBubbleGame() {
  const cvs = document.getElementById('canvas-bubble');
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = Math.max(310, Math.floor(rect.width));
  cvs.height = Math.max(330, Math.floor(rect.height));

  bubState = {
    W: cvs.width,
    H: cvs.height,
    cannonX: cvs.width / 2,
    cannonY: cvs.height - 38,
    aimAngle: -Math.PI / 2, // straight up
    bubbles: [],
    shot: null, // { x, y, vx, vy }
    sparks: [],
    targetVocab: null
  };

  const updateAim = (e) => {
    if (!bubState) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    let ang = Math.atan2(py - bubState.cannonY, px - bubState.cannonX);
    // Clamp upward cone (-162 deg to -18 deg)
    ang = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, ang));
    bubState.aimAngle = ang;
  };

  cvs.onpointerdown = (e) => {
    updateAim(e);
  };
  cvs.onpointermove = (e) => {
    if (e.buttons || e.pointerType === 'touch') updateAim(e);
  };
  cvs.onpointerup = () => {
    fireBubbleShot();
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
  const picks = shuffleArr(pools.vocab).slice(0, 10);
  const cols = 4;
  const rad = Math.min(34, Math.floor((S.W - 36) / (cols * 2.15)));
  const spacingX = rad * 2 + 6;
  const spacingY = rad * 1.82;
  const palette = ['#0284c7', '#7c3aed', '#059669', '#d97706', '#e11d48'];

  let k = 0;
  for (let row = 0; row < 3; row++) {
    const rowCount = row % 2 === 1 ? cols - 1 : cols;
    const rowWidth = (rowCount - 1) * spacingX;
    const startX = (S.W - rowWidth) / 2;
    for (let c = 0; c < rowCount; c++) {
      const v = picks[k % picks.length];
      k++;
      S.bubbles.push({
        x: startX + c * spacingX,
        y: 42 + row * spacingY,
        r: rad,
        color: palette[(row + c) % palette.length],
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
    score += 70;
    addArcadeXP(22);
    updateHUD();
    showToast(`🎉 Nổ sạch giàn trứng! Qua Màn ${stageNum}!`);
    spawnBubbleCluster();
    return;
  }

  // Prefer bottom-most accessible bubbles so player always has a clear shot!
  const sorted = [...S.bubbles].sort((a, b) => b.y - a.y);
  const frontLine = sorted.slice(0, Math.min(4, sorted.length));
  const chosen = frontLine[Math.floor(Math.random() * frontLine.length)].vocab;
  S.targetVocab = chosen;
  currentPromptAudio = { zh: chosen.zh, audio: chosen.audio };
  sound.speakChinese(chosen.zh, chosen.audio);

  setMissionBanner(
    '🥚 BẮN TRỨNG KHỦNG LONG ÂM THANH',
    `🎯 Ngắm bắn trứng: "<span style="color:#fde047">${chosen.vi}</span>"`,
    'Giữ & kéo để ngắm tia phản xạ tường, thả tay để phóng trứng!',
    false
  );
}

function fireBubbleShot() {
  if (!bubState || bubState.shot || !bubState.targetVocab) return;
  const S = bubState;
  const spd = 10.5 * getSpeedFactor();
  S.shot = {
    x: S.cannonX,
    y: S.cannonY - 12,
    vx: Math.cos(S.aimAngle) * spd,
    vy: Math.sin(S.aimAngle) * spd,
    r: 22
  };
  sound.sfxLaser();
}

function resolveBubbleHit(hitBubble) {
  if (!bubState) return;
  const S = bubState;
  const shotPos = { x: S.shot.x, y: S.shot.y };
  S.shot = null;

  // Check if hitBubble or any immediate neighbor matches targetVocab!
  const blastRadius = (hitBubble ? hitBubble.r : 30) * 2.35;
  const matched = S.bubbles.filter(
    (b) => b.vocab.zh === S.targetVocab.zh && Math.hypot(b.x - shotPos.x, b.y - shotPos.y) <= blastRadius
  );

  if ((hitBubble && hitBubble.vocab.zh === S.targetVocab.zh) || matched.length > 0) {
    // Cluster POP! Remove all bubbles of that zh + sparks!
    const targetZh = S.targetVocab.zh;
    const popped = S.bubbles.filter((b) => b.vocab.zh === targetZh);
    S.bubbles = S.bubbles.filter((b) => b.vocab.zh !== targetZh);

    popped.forEach((b) => {
      for (let k = 0; k < 14; k++) {
        S.sparks.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          color: '#fde047',
          life: 1.0
        });
      }
    });

    sound.sfxSuccess();
    sound.speakChinese(S.targetVocab.zh, S.targetVocab.audio);
    recordLearnedWord(S.targetVocab);
    const pts = Math.round(30 * combo * getScoreMultiplier());
    score += pts;
    addArcadeXP(12);
    combo = Math.min(10, combo + 1);
    updateHUD();
    showToast(`🥚 NỔ GIÒN TAN: ${S.targetVocab.zh}!`);
    pickNextBubbleTarget();
  } else {
    // Wrong shot -> Sticks as a penalty bubble & lowers ceiling pressure!
    sound.sfxWrong();
    triggerScreenShake();
    combo = 1;
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
      color: '#475569',
      vocab: extraVocab
    });

    if (lives <= 0 || clampedY + r >= S.cannonY - 52) {
      triggerGameOver('🥚 GIÀN TRỨNG SẬP CHẠM PHÁO!');
      return;
    }
    pickNextBubbleTarget();
  }
}

function drawBubbleAimRay(ctx, S) {
  let rx = S.cannonX;
  let ry = S.cannonY - 12;
  let dx = Math.cos(S.aimAngle) * 10;
  let dy = Math.sin(S.aimAngle) * 10;

  ctx.fillStyle = 'rgba(253, 224, 71, 0.55)';
  for (let step = 0; step < 26; step++) {
    rx += dx;
    ry += dy;
    if (rx < 18) { rx = 18; dx = -dx; }
    if (rx > S.W - 18) { rx = S.W - 18; dx = -dx; }
    if (ry < 24) break;
    if (S.bubbles.some((b) => Math.hypot(b.x - rx, b.y - ry) < b.r)) break;
    if (step % 2 === 0) {
      ctx.beginPath();
      ctx.arc(rx, ry, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function loopBubble() {
  if (activeGame !== 'bubble' || !bubState) return;
  const cvs = document.getElementById('canvas-bubble');
  const ctx = cvs.getContext('2d');
  const S = bubState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Danger line above cannon
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, S.cannonY - 52);
  ctx.lineTo(S.W, S.cannonY - 52);
  ctx.stroke();
  ctx.setLineDash([]);

  // Aiming trajectory
  if (!S.shot) {
    drawBubbleAimRay(ctx, S);
  }

  // Update flying shot
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
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Draw Hanging Chinese Egg Bubbles
  for (const b of S.bubbles) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gloss highlight
    ctx.beginPath();
    ctx.arc(-b.r * 0.3, -b.r * 0.3, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const zh = b.vocab.zh;
    ctx.font = zh.length >= 4 ? '900 12.5px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(zh, 0, showPinyin ? -4 : 1);
    if (showPinyin && b.vocab.pinyin) {
      ctx.fillStyle = '#e0f2fe';
      ctx.font = '700 8.5px sans-serif';
      ctx.fillText(b.vocab.pinyin.slice(0, 12), 0, 10);
    }
    ctx.restore();
  }

  // Sparks
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  // Draw Dino Cannon at bottom
  ctx.save();
  ctx.translate(S.cannonX, S.cannonY);
  ctx.rotate(S.aimAngle + Math.PI / 2);
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.roundRect(-12, -30, 24, 32, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(S.cannonX, S.cannonY, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#0284c7';
  ctx.fill();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🦖', S.cannonX, S.cannonY + 1);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎯 Chạm hoặc kéo tia ngắm vào quả trứng Chữ Hán đúng!', S.W / 2, S.H - 7);

  bubRafId = requestAnimationFrame(loopBubble);
}
