// ============================================================================
// CYBERLINGO ARCADE PRO v4.0 — AAA RETINA EDITIONS OF NINJA, TETRIS, PACMAN, ARKANOID
// Developed by DEAN OPTIMIZE
// ============================================================================

// =========================================================
// GAME 3: 🥷 CHÉM HOA QUẢ ÂM THANH (Fruit Ninja Cyber Blade v4.0)
// =========================================================
let ninjaState = null;
let ninjaRafId = null;

function initNinjaGame() {
  const cvs = document.getElementById('canvas-ninja');
  const { W, H } = setupRetinaCanvas(cvs);

  ninjaState = {
    W,
    H,
    orbs: [],
    halves: [],
    splats: [],
    slashFlashes: [],
    sparks: [],
    popups: [],
    trail: [],
    swiping: false,
    targetVocab: null,
    waveResolved: false,
    waveTimer: null
  };

  const getPt = (e) => {
    const r = cvs.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };

  cvs.onpointerdown = (e) => {
    if (!ninjaState || window.isGamePaused) return;
    ninjaState.swiping = true;
    const pt = getPt(e);
    ninjaState.trail.push({ x: pt.x, y: pt.y, life: 1.0 });
    checkNinjaSliceAt(pt.x, pt.y);
  };

  cvs.onpointermove = (e) => {
    if (!ninjaState || window.isGamePaused || (!ninjaState.swiping && e.pointerType !== 'touch')) return;
    const pt = getPt(e);
    ninjaState.trail.push({ x: pt.x, y: pt.y, life: 1.0 });
    if (ninjaState.trail.length > 18) ninjaState.trail.shift();
    checkNinjaSliceAt(pt.x, pt.y);
  };

  cvs.onpointerup = () => {
    if (ninjaState) ninjaState.swiping = false;
  };

  cleanupFns.push(() => {
    cancelAnimationFrame(ninjaRafId);
    if (ninjaState && ninjaState.waveTimer) clearTimeout(ninjaState.waveTimer);
    ninjaState = null;
  });

  spawnNinjaWave();
  loopNinja();
}

function spawnNinjaWave() {
  if (!ninjaState || activeGame !== 'ninja') return;
  const S = ninjaState;
  S.orbs = [];
  S.waveResolved = false;

  const pools = getActivePools();
  const picks = pickSmartVocabSubset(pools.vocab, 3);
  const target = picks[0];
  S.targetVocab = target;
  currentPromptAudio = { zh: target.zh, audio: target.audio };
  sound.speakChinese(target.zh, target.audio);

  setMissionBanner(
    '🥷 KIẾM ÁNH SÁNG — CHÉM TỪ ĐÚNG!',
    `🎯 Chém quả: "<span style="color:#fde047">${target.vi}</span>"`,
    'Quẹt kiếm katana chém đôi quả Chữ Hán đúng — Né bom 💣!',
    false
  );

  const spdMul = getSpeedFactor();
  const g = 0.21 * spdMul;
  const items = shuffleArr([
    { vocab: picks[0], isCorrect: true, isBomb: false, cTop: '#34d399', cBot: '#065f46', rim: '#a7f3d0' },
    { vocab: picks[1], isCorrect: false, isBomb: false, cTop: '#38bdf8', cBot: '#075985', rim: '#bae6fd' },
    { vocab: picks[2], isCorrect: false, isBomb: false, cTop: '#c084fc', cBot: '#581c87', rim: '#e9d5ff' },
    ...(Math.random() < 0.65 ? [{ vocab: null, isCorrect: false, isBomb: true, cTop: '#475569', cBot: '#0f172a', rim: '#fb7185' }] : [])
  ]);

  const count = items.length;
  items.forEach((it, idx) => {
    const startX = S.W * (0.18 + (idx / Math.max(1, count - 1)) * 0.64);
    const targetPeakY = S.H * (0.17 + Math.random() * 0.16);
    const riseH = (S.H + 30) - targetPeakY;
    const vy = -Math.sqrt(2 * g * riseH);
    const centerBias = (S.W * 0.5 - startX) * (0.006 + Math.random() * 0.005);

    S.orbs.push({
      x: startX,
      y: S.H + 30 + idx * 18,
      vx: centerBias,
      vy,
      g,
      r: it.isBomb ? 28 : 37,
      ...it,
      sliced: false
    });
  });
}

function checkNinjaSliceAt(px, py) {
  if (!ninjaState || ninjaState.waveResolved) return;
  const S = ninjaState;

  for (let i = S.orbs.length - 1; i >= 0; i--) {
    const o = S.orbs[i];
    if (o.sliced) continue;
    const dist = Math.hypot(px - o.x, py - o.y);
    if (dist <= o.r + 14) {
      o.sliced = true;
      createNinjaHalves(o);
      S.slashFlashes.push({ x: o.x, y: o.y, ang: (Math.random() - 0.5) * 0.8, life: 1.0 });

      if (o.isBomb) {
        S.waveResolved = true;
        hapticPulse(45);
        sound.sfxWrong();
        triggerScreenShake();
        combo = 1;
        spawnComboBanner(1, 0);
        lives--;
        updateHUD();
        showToast('💣 Chém trúng BOM! Mất 1 tim!');
        if (lives <= 0) {
          S.waveTimer = setTimeout(() => triggerGameOver('💣 NỔ BOM HẾT TIM!'), 950);
        } else {
          S.waveTimer = setTimeout(spawnNinjaWave, 1050);
        }
        return;
      }

      if (o.isCorrect) {
        S.waveResolved = true;
        hapticPulse(22);
        combo = Math.min(10, combo + 1);
        incrementDailyProgress('combo', combo);
        sound.sfxCombo(combo);
        sound.speakChinese(o.vocab.zh, o.vocab.audio);
        recordLearnedWord(o.vocab);
        recordSrsOutcome(o.vocab, true);
        const pts = Math.round(25 * combo * getScoreMultiplier());
        score += pts;
        addArcadeXP(12);
        spawnComboBanner(combo, pts);
        if (score >= stageNum * 150) stageNum++;
        updateHUD();

        S.splats.push({ x: o.x, y: o.y, r: 34, color: 'rgba(16, 185, 129, 0.22)', life: 1.0 });
        S.popups.push({ x: o.x, y: o.y - 10, txt: `⚔️ +${pts} CRITICAL!`, color: '#fde047', life: 1.0 });
        S.waveTimer = setTimeout(spawnNinjaWave, 850);
        return;
      } else {
        hapticPulse(32);
        sound.sfxWrong();
        recordSrsOutcome(S.targetVocab, false);
        recordSrsOutcome(o.vocab, false);
        combo = 1;
        spawnComboBanner(1, 0);
        lives--;
        updateHUD();
        S.splats.push({ x: o.x, y: o.y, r: 28, color: 'rgba(244, 63, 94, 0.22)', life: 1.0 });
        S.popups.push({ x: o.x, y: o.y, txt: `❌ ${o.vocab.vi}`, color: '#fb7185', life: 1.0 });
        if (lives <= 0) {
          S.waveResolved = true;
          S.waveTimer = setTimeout(() => triggerGameOver('🥷 CHÉM NHẦM QUÁ NHIỀU!'), 950);
          return;
        }
      }
    }
  }
}

function createNinjaHalves(o) {
  if (!ninjaState) return;
  const label = o.isBomb ? '💥' : o.vocab.zh;
  const mid = Math.ceil(label.length / 2);
  ninjaState.halves.push(
    { x: o.x - 12, y: o.y, vx: -2.8, vy: -2.4, r: o.r * 0.78, color: o.cTop, txt: label.slice(0, mid), life: 1.0 },
    { x: o.x + 12, y: o.y, vx: 2.8, vy: -2.4, r: o.r * 0.78, color: o.cTop, txt: label.slice(mid), life: 1.0 }
  );
  for (let k = 0; k < 18; k++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.8 + Math.random() * 4.5;
    ninjaState.sparks.push({
      x: o.x, y: o.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      color: o.isBomb ? '#fb7185' : '#fde047',
      life: 1.0
    });
  }
}

function loopNinja() {
  if (activeGame !== 'ninja' || !ninjaState) return;
  if (window.isGamePaused) {
    ninjaRafId = requestAnimationFrame(loopNinja);
    return;
  }
  const cvs = document.getElementById('canvas-ninja');
  const ctx = cvs.getContext('2d');
  const S = ninjaState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Dojo wood planks subtle texture lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let y = 48; y < S.H; y += 52) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S.W, y); ctx.stroke();
  }

  // Juice splatters on background wall
  for (let i = S.splats.length - 1; i >= 0; i--) {
    const sp = S.splats[i];
    sp.life -= 0.008;
    if (sp.life <= 0) { S.splats.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  let activeUnsliced = 0;
  let missedCorrect = false;

  for (let i = S.orbs.length - 1; i >= 0; i--) {
    const o = S.orbs[i];
    if (o.sliced) continue;

    o.x += o.vx;
    o.y += o.vy;
    o.vy += o.g;

    if (o.x < o.r + 6) { o.x = o.r + 6; o.vx *= -0.7; }
    if (o.x > S.W - o.r - 6) { o.x = S.W - o.r - 6; o.vx *= -0.7; }

    if (o.y > S.H + 85 && o.vy > 0) {
      if (o.isCorrect && !S.waveResolved) missedCorrect = true;
      S.orbs.splice(i, 1);
      continue;
    }
    activeUnsliced++;

    ctx.save();
    ctx.translate(o.x, o.y);

    // Fruit leaf crown or bomb fuse
    if (!o.isBomb) {
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(0, -o.r - 3, 9, 4.5, -0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -o.r);
      ctx.quadraticCurveTo(8, -o.r - 10, 14, -o.r - 6);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(14, -o.r - 6, 3.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(-o.r * 0.3, -o.r * 0.3, 4, 0, 0, o.r);
    grad.addColorStop(0, o.cTop);
    grad.addColorStop(1, o.cBot);

    ctx.beginPath();
    ctx.arc(0, 0, o.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = o.rim;
    ctx.stroke();

    // Specular fruit gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-o.r * 0.28, -o.r * 0.32, o.r * 0.28, o.r * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (o.isBomb) {
      ctx.font = '24px sans-serif';
      ctx.fillText('💣', 0, 2);
    } else {
      const zh = o.vocab.zh;
      ctx.font = zh.length >= 4 ? '900 14.5px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 17.5px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(zh, 0, showPinyin ? -5 : 1);
      if (showPinyin && o.vocab.pinyin) {
        ctx.fillStyle = '#fef9c3';
        ctx.font = '700 9.5px sans-serif';
        ctx.fillText(o.vocab.pinyin.slice(0, 14), 0, 13);
      }
    }
    ctx.restore();
  }

  if (!S.waveResolved && (missedCorrect || (activeUnsliced === 0 && S.orbs.length === 0))) {
    S.waveResolved = true;
    if (missedCorrect) {
      sound.sfxWrong();
      recordSrsOutcome(S.targetVocab, false);
      combo = 1;
      spawnComboBanner(1, 0);
      lives--;
      updateHUD();
      showToast(`⚠️ Rơi mất từ "${S.targetVocab.zh}" (${S.targetVocab.vi})!`);
      if (lives <= 0) {
        S.waveTimer = setTimeout(() => triggerGameOver('🍉 RƠI MẤT QUÁ NHIỀU QUẢ!'), 900);
      } else {
        S.waveTimer = setTimeout(spawnNinjaWave, 900);
      }
    } else {
      S.waveTimer = setTimeout(spawnNinjaWave, 500);
    }
  }

  for (let i = S.halves.length - 1; i >= 0; i--) {
    const h = S.halves[i];
    h.x += h.vx; h.y += h.vy; h.vy += 0.28; h.life -= 0.032;
    if (h.life <= 0) { S.halves.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = h.life;
    ctx.translate(h.x, h.y);
    ctx.beginPath();
    ctx.arc(0, 0, h.r, 0, Math.PI * 2);
    ctx.fillStyle = h.color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(h.txt, 0, 0);
    ctx.restore();
  }

  // Critical Katana Slash Cross-Flash
  for (let i = S.slashFlashes.length - 1; i >= 0; i--) {
    const sf = S.slashFlashes[i];
    sf.life -= 0.1;
    if (sf.life <= 0) { S.slashFlashes.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = sf.life;
    ctx.translate(sf.x, sf.y);
    ctx.rotate(sf.ang);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.stroke();
    ctx.restore();
  }

  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.045;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  for (let i = S.popups.length - 1; i >= 0; i--) {
    const pp = S.popups[i];
    pp.y -= 1.1; pp.life -= 0.028;
    if (pp.life <= 0) { S.popups.splice(i, 1); continue; }
    ctx.globalAlpha = pp.life;
    ctx.fillStyle = pp.color;
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pp.txt, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;

  // Dual-Layer Plasma Katana Ribbon (Outer Cyan + Inner White Core)
  if (S.trail.length > 1) {
    for (let i = 1; i < S.trail.length; i++) {
      const a = S.trail[i - 1];
      const b = S.trail[i];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(56, 189, 248, ${b.life * 0.65})`;
      ctx.lineWidth = 11 * b.life;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${b.life})`;
      ctx.lineWidth = 4 * b.life;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  for (let i = S.trail.length - 1; i >= 0; i--) {
    S.trail[i].life -= 0.11;
    if (S.trail[i].life <= 0) S.trail.splice(i, 1);
  }

  ctx.fillStyle = 'rgba(148, 163, 184, 0.52)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ Quẹt kiếm ánh sáng chém đôi quả Chữ Hán đúng!', S.W / 2, S.H - 10);

  ninjaRafId = requestAnimationFrame(loopNinja);
}

// =========================================================
// GAME 4: 🧱 XẾP GẠCH TỪ VỰNG (Tetris Drop Match v4.0 + Ghost Block)
// =========================================================
let tetState = null;
let tetRafId = null;

function initTetrisGame() {
  const cvs = document.getElementById('canvas-tetris');
  const { W, H } = setupRetinaCanvas(cvs);

  const pools = getActivePools();
  const initialFour = pickSmartVocabSubset(pools.vocab, 4);

  tetState = {
    W,
    H,
    cols: 4,
    docks: initialFour,
    garbage: [0, 0, 0, 0],
    falling: null,
    flashes: [],
    linesCleared: 0
  };

  cvs.onpointerdown = (e) => {
    if (!tetState || !tetState.falling || window.isGamePaused) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const tappedCol = Math.max(0, Math.min(3, Math.floor((px / tetState.W) * 4)));
    if (tetState.falling.col === tappedCol) {
      tetrisAction('drop');
    } else {
      tetState.falling.col = tappedCol;
      hapticPulse(10);
      sound.sfxTap();
    }
  };

  const onKey = (e) => {
    if (activeGame !== 'tetris' || window.isGamePaused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') tetrisAction('left');
    else if (e.key === 'ArrowRight' || e.key === 'd') tetrisAction('right');
    else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 's') tetrisAction('drop');
  };
  window.addEventListener('keydown', onKey);

  cleanupFns.push(() => {
    cancelAnimationFrame(tetRafId);
    window.removeEventListener('keydown', onKey);
    tetState = null;
  });

  spawnTetrisBlock();
  loopTetris();
}

function tetrisAction(act) {
  if (!tetState || !tetState.falling || window.isGamePaused) return;
  hapticPulse(10);
  if (act === 'left') {
    tetState.falling.col = Math.max(0, tetState.falling.col - 1);
    sound.sfxTap();
  } else if (act === 'right') {
    tetState.falling.col = Math.min(3, tetState.falling.col + 1);
    sound.sfxTap();
  } else if (act === 'drop') {
    tetState.falling.vy = 18;
    sound.sfxTap();
  }
}

function spawnTetrisBlock() {
  if (!tetState || activeGame !== 'tetris') return;
  const S = tetState;
  const targetIdx = Math.floor(Math.random() * 4);
  const vocab = S.docks[targetIdx];
  currentPromptAudio = { zh: vocab.zh, audio: vocab.audio };
  sound.speakChinese(vocab.zh, vocab.audio);

  const baseVy = (0.85 + Math.min(0.85, S.linesCleared * 0.05)) * getSpeedFactor();
  S.falling = {
    col: Math.floor(Math.random() * 4),
    y: 26,
    vy: baseVy,
    vocab
  };

  setMissionBanner(
    `🧱 TETRIS TỪ VỰNG • ĐÃ NỔ ${S.linesCleared} HÀNG`,
    `Thả khối <b style="color:#fde047">${vocab.zh}</b> ${showPinyin ? '(' + (vocab.pinyin || '') + ')' : ''} trúng cột nghĩa!`,
    '💡 Có bóng mờ dự đoán điểm rơi (Ghost Block) dưới chân cột!',
    false
  );
}

function resolveTetrisLanding() {
  if (!tetState || !tetState.falling) return;
  const S = tetState;
  const c = S.falling.col;
  const v = S.falling.vocab;
  const dockVocab = S.docks[c];

  if (dockVocab.zh === v.zh) {
    hapticPulse(20);
    combo = Math.min(10, combo + 1);
    incrementDailyProgress('combo', combo);
    sound.sfxCombo(combo);
    sound.speakChinese(v.zh, v.audio);
    recordLearnedWord(v);
    recordSrsOutcome(v, true);
    S.linesCleared++;
    if (S.garbage[c] > 0) S.garbage[c]--;

    const pts = Math.round(22 * combo * getScoreMultiplier());
    score += pts;
    addArcadeXP(10);
    spawnComboBanner(combo, pts);
    stageNum = 1 + Math.floor(S.linesCleared / 6);
    updateHUD();

    S.flashes.push({ col: c, color: '#34d399', life: 1.0 });

    const pools = getActivePools();
    const usedZh = new Set(S.docks.map((d) => d.zh));
    const replacement = pickSmartVocabSubset(pools.vocab, 12).find((cand) => !usedZh.has(cand.zh)) || v;
    S.docks[c] = replacement;
  } else {
    hapticPulse(35);
    sound.sfxWrong();
    triggerScreenShake();
    recordSrsOutcome(v, false);
    combo = 1;
    spawnComboBanner(1, 0);
    S.garbage[c]++;
    S.flashes.push({ col: c, color: '#f43f5e', life: 1.0 });
    const rightCol = S.docks.findIndex((d) => d.zh === v.zh);
    if (rightCol >= 0) S.flashes.push({ col: rightCol, color: '#fde047', life: 1.0 });
    showToast(`⚠️ "${v.zh}" = ${v.vi}!`);
    updateHUD();

    if (S.garbage[c] >= 5) {
      S.falling = null;
      triggerGameOver('🧱 GẠCH ĐẦY CHẠM TRẦN!');
      return;
    }
  }
  S.falling = null;
  setTimeout(spawnTetrisBlock, 240);
}

function wrapDockLines(ctx, txt, maxW) {
  const words = (txt || '').split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function loopTetris() {
  if (activeGame !== 'tetris' || !tetState) return;
  if (window.isGamePaused) {
    tetRafId = requestAnimationFrame(loopTetris);
    return;
  }
  const cvs = document.getElementById('canvas-tetris');
  const ctx = cvs.getContext('2d');
  const S = tetState;
  const colW = S.W / 4;
  const dockH = 68;
  const brickH = 30;

  ctx.clearRect(0, 0, S.W, S.H);

  for (let c = 0; c < 4; c++) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(c * colW, 0, colW, S.H - dockH);

    if (S.falling && S.falling.col === c) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(c * colW + 1, 0, colW - 2, S.H - dockH);
    }
  }

  for (let i = S.flashes.length - 1; i >= 0; i--) {
    const fl = S.flashes[i];
    fl.life -= 0.06;
    if (fl.life <= 0) { S.flashes.splice(i, 1); continue; }
    ctx.globalAlpha = fl.life * 0.45;
    ctx.fillStyle = fl.color;
    ctx.fillRect(fl.col * colW, 0, colW, S.H);
  }
  ctx.globalAlpha = 1;

  // Danger ceiling line
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
  ctx.setLineDash([5, 5]);
  const ceilingY = S.H - dockH - 5 * brickH;
  ctx.beginPath(); ctx.moveTo(0, ceilingY); ctx.lineTo(S.W, ceilingY); ctx.stroke();
  ctx.setLineDash([]);

  // 3D Beveled Garbage Bricks
  for (let c = 0; c < 4; c++) {
    for (let g = 0; g < S.garbage[c]; g++) {
      const bx = c * colW + 4;
      const by = S.H - dockH - (g + 1) * brickH + 2;
      drawBeveledBox(ctx, bx, by, colW - 8, brickH - 4, 6, '#475569', '#1e293b', '#f43f5e', 1.4);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '800 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧱 ĐÁ CẢN', bx + (colW - 8) / 2, by + (brickH - 4) / 2 + 3);
    }
  }

  // Bottom 4 Meaning Docks
  for (let c = 0; c < 4; c++) {
    const dx = c * colW + 3;
    const dy = S.H - dockH + 3;
    const dw = colW - 6;
    const dh = dockH - 6;
    const isSel = S.falling && S.falling.col === c;

    drawBeveledBox(
      ctx, dx, dy, dw, dh, 10,
      isSel ? '#1e3a5f' : '#0f172a',
      isSel ? '#0f2942' : '#090e1a',
      isSel ? '#38bdf8' : 'rgba(148, 163, 184, 0.32)',
      isSel ? 2.2 : 1.5
    );

    ctx.fillStyle = isSel ? '#fde68a' : '#a7f3d0';
    ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'center';
    const lines = wrapDockLines(ctx, S.docks[c].vi, dw - 8);
    const startY = dy + dh / 2 - ((lines.length - 1) * 13) / 2;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, dx + dw / 2, startY + idx * 13);
    });
  }

  // Falling Block + Ghost Landing Piece!
  if (S.falling) {
    const f = S.falling;
    f.y += f.vy;
    const floorY = S.H - dockH - S.garbage[f.col] * brickH - 22;
    const bx = f.col * colW + 4;
    const bw = colW - 8;
    const bh = 42;

    if (f.y >= floorY) {
      f.y = floorY;
      resolveTetrisLanding();
    } else {
      // Ghost Piece Preview at bottom of column!
      if (floorY - f.y > 28) {
        ctx.save();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.fillStyle = 'rgba(253, 224, 71, 0.08)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.8;
        ctx.roundRect(bx, floorY - bh / 2, bw, bh, 9);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      drawBeveledBox(ctx, bx, f.y - bh / 2, bw, bh, 9, '#0ea5e9', '#1d4ed8', '#fde047', 2.4);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const zh = f.vocab.zh;
      ctx.font = zh.length >= 4 ? '900 13.5px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(zh, bx + bw / 2, showPinyin ? f.y - 5 : f.y + 1);
      if (showPinyin && f.vocab.pinyin) {
        ctx.fillStyle = '#fef08a';
        ctx.font = '700 9px sans-serif';
        ctx.fillText(f.vocab.pinyin.slice(0, 12), bx + bw / 2, f.y + 11);
      }
    }
  }

  tetRafId = requestAnimationFrame(loopTetris);
}

// =========================================================
// GAME 5: 👻 PAC-MAN MÊ CUNG SĂN CHỮ (Smooth 60FPS + Bezier Ghosts v4.0)
// =========================================================
const PAC_MAZE_TEMPLATE = [
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 2, 1, 0, 1, 0],
  [0, 0, 0, 1, 2, 1, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0]
];

let pacState = null;
let pacTimerId = null;
let pacRafId = null;

function initPacmanGame() {
  const cvs = document.getElementById('canvas-pacman');
  const side = Math.min(350, Math.max(288, Math.floor(cvs.parentElement.getBoundingClientRect().width - 8)));
  const { W, H } = setupRetinaCanvas(cvs, side, Math.round(side * 0.9));

  pacState = {
    W,
    H,
    grid: PAC_MAZE_TEMPLATE.map((row) => [...row]),
    px: 4,
    py: 6,
    renderX: 4,
    renderY: 6,
    dir: { x: 0, y: 0 },
    nextDir: { x: 1, y: 0 },
    powerTicks: 0,
    shieldTicks: 0,
    gems: [],
    ghosts: [
      { x: 4, y: 2, rx: 4, ry: 2, dx: 1, dy: 0, color: '#fb7185' },
      { x: 4, y: 4, rx: 4, ry: 4, dx: 0, dy: -1, color: '#c084fc' }
    ],
    tickCount: 0,
    animT: 0
  };

  let sx = 0, sy = 0;
  cvs.onpointerdown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    sx = p.clientX; sy = p.clientY;
  };
  cvs.onpointerup = (e) => {
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - sx;
    const dy = p.clientY - sy;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    if (Math.abs(dx) > Math.abs(dy)) pacSteer(dx > 0 ? 1 : -1, 0);
    else pacSteer(0, dy > 0 ? 1 : -1);
  };

  const onKey = (e) => {
    if (activeGame !== 'pacman' || window.isGamePaused) return;
    if (e.key === 'ArrowUp' || e.key === 'w') pacSteer(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 's') pacSteer(0, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') pacSteer(-1, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd') pacSteer(1, 0);
  };
  window.addEventListener('keydown', onKey);

  spawnPacGems();

  const tickMs = Math.round(245 / getSpeedFactor());
  pacTimerId = setInterval(stepPacman, tickMs);
  loopPacRender();

  cleanupFns.push(() => {
    clearInterval(pacTimerId);
    cancelAnimationFrame(pacRafId);
    window.removeEventListener('keydown', onKey);
    pacState = null;
  });
}

function pacSteer(dx, dy) {
  if (!pacState || window.isGamePaused) return;
  hapticPulse(8);
  pacState.nextDir = { x: dx, y: dy };
}

function canPacWalk(x, y) {
  const nx = (x + 9) % 9;
  const ny = (y + 9) % 9;
  return PAC_MAZE_TEMPLATE[ny][nx] !== 1;
}

function spawnPacGems() {
  if (!pacState) return;
  const pools = getActivePools();
  const picks = pickSmartVocabSubset(pools.vocab, 4);
  const target = picks[0];
  currentPromptAudio = { zh: target.zh, audio: target.audio };
  sound.speakChinese(target.zh, target.audio);

  setMissionBanner(
    '👻 PAC-MAN SĂN NGỌC CHỮ HÁN',
    `🎯 Săn viên ngọc: "<span style="color:#fde047">${target.vi}</span>"`,
    'Ăn đúng ngọc sẽ hóa SIÊU CẤP 5s nuốt ngược cả Ma QC (+50đ)!',
    false
  );

  const corners = shuffleArr([
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 8 },
    { x: 8, y: 8 }
  ]);
  pacState.gems = picks.map((v, idx) => ({
    x: corners[idx].x,
    y: corners[idx].y,
    vocab: v,
    isTarget: v.zh === target.zh
  }));
}

function stepPacman() {
  if (activeGame !== 'pacman' || !pacState || window.isGamePaused) return;
  const S = pacState;
  S.tickCount++;
  if (S.powerTicks > 0) S.powerTicks--;
  if (S.shieldTicks > 0) S.shieldTicks--;

  if (canPacWalk(S.px + S.nextDir.x, S.py + S.nextDir.y)) {
    S.dir = { ...S.nextDir };
  }
  if (canPacWalk(S.px + S.dir.x, S.py + S.dir.y)) {
    const oldX = S.px;
    S.px = (S.px + S.dir.x + 9) % 9;
    S.py = (S.py + S.dir.y + 9) % 9;
    if (Math.abs(S.px - oldX) > 2) S.renderX = S.px; // Instant tunnel wrap
  }

  if (S.grid[S.py][S.px] === 0) {
    S.grid[S.py][S.px] = 2;
    score += 2;
    updateHUD();
  }

  const gIdx = S.gems.findIndex((gm) => gm.x === S.px && gm.y === S.py);
  if (gIdx >= 0) {
    const gm = S.gems[gIdx];
    if (gm.isTarget) {
      hapticPulse(25);
      combo = Math.min(10, combo + 1);
      incrementDailyProgress('combo', combo);
      sound.sfxFanfare();
      sound.speakChinese(gm.vocab.zh, gm.vocab.audio);
      recordLearnedWord(gm.vocab);
      recordSrsOutcome(gm.vocab, true);
      S.powerTicks = 20;
      const pts = Math.round(35 * combo * getScoreMultiplier());
      score += pts;
      addArcadeXP(15);
      spawnComboBanner(combo, pts);
      stageNum++;
      updateHUD();
      showToast(`⚡ SIÊU CẤP! "${gm.vocab.zh}" = ${gm.vocab.vi}!`);
      if (stageNum % 2 === 0) {
        S.grid = PAC_MAZE_TEMPLATE.map((r) => [...r]);
      }
      spawnPacGems();
    } else {
      hapticPulse(35);
      sound.sfxWrong();
      recordSrsOutcome(gm.vocab, false);
      S.gems.splice(gIdx, 1);
      combo = 1;
      spawnComboBanner(1, 0);
      lives--;
      updateHUD();
      showToast(`❌ Ăn nhầm "${gm.vocab.zh}" (${gm.vocab.vi})!`);
      if (lives <= 0) {
        triggerGameOver('👻 PAC-MAN HẾT MẠNG!');
        return;
      }
    }
  }

  const ghostShouldMove = S.powerTicks > 0 ? (S.tickCount % 3 === 0) : (S.tickCount % 2 === 0);
  if (ghostShouldMove) {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    for (const gh of S.ghosts) {
      const valid = dirs.filter((d) => {
        if (d.x === -gh.dx && d.y === -gh.dy) return false;
        return canPacWalk(gh.x + d.x, gh.y + d.y);
      });
      const choices = valid.length > 0 ? valid : dirs.filter((d) => canPacWalk(gh.x + d.x, gh.y + d.y));
      if (choices.length > 0) {
        choices.sort((a, b) => {
          const da = Math.hypot((gh.x + a.x) - S.px, (gh.y + a.y) - S.py);
          const db = Math.hypot((gh.x + b.x) - S.px, (gh.y + b.y) - S.py);
          return S.powerTicks > 0 ? db - da : da - db;
        });
        const pick = Math.random() < 0.65 ? choices[0] : choices[Math.floor(Math.random() * choices.length)];
        const prevGx = gh.x;
        gh.dx = pick.x;
        gh.dy = pick.y;
        gh.x = (gh.x + gh.dx + 9) % 9;
        gh.y = (gh.y + gh.dy + 9) % 9;
        if (Math.abs(gh.x - prevGx) > 2) gh.rx = gh.x;
      }
    }
  }

  for (const gh of S.ghosts) {
    if (gh.x === S.px && gh.y === S.py) {
      if (S.powerTicks > 0) {
        hapticPulse(25);
        sound.sfxSuccess();
        score += 50;
        addArcadeXP(10);
        gh.x = 4; gh.y = 4; gh.rx = 4; gh.ry = 4;
        updateHUD();
        showToast('👻 NUỐT GỌN MA QC! +50 ĐIỂM!');
      } else if (S.shieldTicks <= 0) {
        hapticPulse(40);
        sound.sfxWrong();
        triggerScreenShake();
        S.shieldTicks = 8;
        combo = 1;
        spawnComboBanner(1, 0);
        lives--;
        updateHUD();
        showToast('💥 Đụng Ma QC! Cẩn thận!');
        if (lives <= 0) {
          triggerGameOver('👻 BỊ MA QC BẮT MẤT!');
          return;
        }
      }
    }
  }
}

function drawVectorGhost(ctx, cx, cy, r, color, dx, dy, isScared) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = isScared ? '#2563eb' : color;
  ctx.strokeStyle = isScared ? '#93c5fd' : '#ffffff';
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r, Math.PI, 0, false);
  ctx.lineTo(r, r * 0.85);
  ctx.lineTo(r * 0.5, r * 0.58);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r * 0.5, r * 0.58);
  ctx.lineTo(-r, r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (isScared) {
    // Scared wavy mouth & wide eyes
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.2, 2.3, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Directional eyes!
    [-0.36, 0.36].forEach((ox) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(r * ox, -r * 0.2, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(r * ox + dx * 2, -r * 0.2 + dy * 2, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function loopPacRender() {
  if (activeGame !== 'pacman' || !pacState) return;
  const cvs = document.getElementById('canvas-pacman');
  const ctx = cvs.getContext('2d');
  const S = pacState;
  const cw = S.W / 9;
  const ch = S.H / 9;

  if (!window.isGamePaused) {
    S.animT += 0.18;
    S.renderX += (S.px - S.renderX) * 0.32;
    S.renderY += (S.py - S.renderY) * 0.32;
    for (const gh of S.ghosts) {
      gh.rx += (gh.x - gh.rx) * 0.26;
      gh.ry += (gh.y - gh.ry) * 0.26;
    }
  }

  ctx.clearRect(0, 0, S.W, S.H);

  // Double-tube Neon Maze Walls & Pac-Dots
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = S.grid[r][c];
      if (cell === 1) {
        drawBeveledBox(
          ctx, c * cw + 3, r * ch + 3, cw - 6, ch - 6, 8,
          S.powerTicks > 0 ? '#713f12' : '#0f2942',
          S.powerTicks > 0 ? '#422006' : '#081426',
          S.powerTicks > 0 ? '#fde047' : '#38bdf8',
          2
        );
      } else if (cell === 0) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.78)';
        ctx.beginPath();
        ctx.arc(c * cw + cw / 2, r * ch + ch / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Glowing Corner Word Gems
  for (const gm of S.gems) {
    const cx = gm.x * cw + cw / 2;
    const cy = gm.y * ch + ch / 2;
    ctx.font = '900 12.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = Math.max(cw + 6, ctx.measureText(gm.vocab.zh).width + 14);
    const th = 25;
    const bx = Math.max(2, Math.min(S.W - tw - 2, cx - tw / 2));
    const by = Math.max(2, Math.min(S.H - th - 2, cy - th / 2));

    drawBeveledBox(ctx, bx, by, tw, th, 8, '#059669', '#064e3b', '#6ee7b7', 1.8);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gm.vocab.zh, bx + tw / 2, by + th / 2 + 0.5);
  }

  // Smooth Animated Pac-Man
  if (S.shieldTicks % 2 === 0) {
    const px = S.renderX * cw + cw / 2;
    const py = S.renderY * ch + ch / 2;
    const r = Math.min(cw, ch) * 0.4;
    let baseAng = 0;
    if (S.dir.x === -1) baseAng = Math.PI;
    else if (S.dir.y === -1) baseAng = -Math.PI / 2;
    else if (S.dir.y === 1) baseAng = Math.PI / 2;
    const mouth = (0.06 + Math.abs(Math.sin(S.animT)) * 0.24) * Math.PI;

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, r, baseAng + mouth, baseAng + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Smooth Vector Ghosts
  const gr = Math.min(cw, ch) * 0.38;
  for (const gh of S.ghosts) {
    drawVectorGhost(
      ctx,
      gh.rx * cw + cw / 2,
      gh.ry * ch + ch / 2,
      gr,
      gh.color,
      gh.dx,
      gh.dy,
      S.powerTicks > 0
    );
  }

  pacRafId = requestAnimationFrame(loopPacRender);
}

// =========================================================
// GAME 9: 🏐 PHÁ GẠCH ARKANOID (Comet Ball Trail & 3D Glass Bricks v4.0)
// =========================================================
let arkState = null;
let arkRafId = null;

function initArkanoidGame() {
  const cvs = document.getElementById('canvas-arkanoid');
  const { W, H } = setupRetinaCanvas(cvs);

  arkState = {
    W,
    H,
    paddleX: W / 2,
    paddleW: 98,
    paddleY: H - 34,
    ball: { x: W / 2, y: H - 54, vx: 2.7, vy: -3.6, r: 7.5 },
    ballTrail: [],
    bricks: [],
    capsules: [],
    sparks: [],
    priorityZh: ''
  };

  const movePad = (e) => {
    if (!arkState || window.isGamePaused) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    arkState.paddleX = Math.max(arkState.paddleW / 2, Math.min(arkState.W - arkState.paddleW / 2, px));
  };
  cvs.onpointerdown = movePad;
  cvs.onpointermove = (e) => { if (e.buttons || e.pointerType === 'touch') movePad(e); };

  const onKey = (e) => {
    if (activeGame !== 'arkanoid' || !arkState || window.isGamePaused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') arkState.paddleX = Math.max(50, arkState.paddleX - 26);
    if (e.key === 'ArrowRight' || e.key === 'd') arkState.paddleX = Math.min(arkState.W - 50, arkState.paddleX + 26);
  };
  window.addEventListener('keydown', onKey);

  cleanupFns.push(() => {
    cancelAnimationFrame(arkRafId);
    window.removeEventListener('keydown', onKey);
    arkState = null;
  });

  buildArkanoidWall();
  resetArkanoidBall();
  loopArkanoid();
}

function resetArkanoidBall() {
  if (!arkState) return;
  const spd = 3.55 * getSpeedFactor();
  arkState.ballTrail = [];
  arkState.ball = {
    x: arkState.paddleX,
    y: arkState.paddleY - 16,
    vx: (Math.random() < 0.5 ? -1 : 1) * spd * 0.72,
    vy: -spd,
    r: 7.5
  };
}

function buildArkanoidWall() {
  if (!arkState) return;
  const S = arkState;
  S.bricks = [];
  S.capsules = [];

  const pools = getActivePools();
  const nine = pickSmartVocabSubset(pools.vocab, 9);
  const cols = 3;
  const bw = (S.W - 24) / cols;
  const bh = 37;
  const rowPal = [
    ['#0ea5e9', '#0369a1'],
    ['#a855f7', '#6b21a8'],
    ['#10b981', '#047857']
  ];

  nine.forEach((v, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    S.bricks.push({
      x: 12 + c * bw + 3,
      y: 22 + r * (bh + 7),
      w: bw - 6,
      h: bh,
      cTop: rowPal[r % 3][0],
      cBot: rowPal[r % 3][1],
      vocab: v,
      alive: true
    });
  });

  pickNextArkanoidPriority();
}

function pickNextArkanoidPriority() {
  if (!arkState) return;
  const alive = arkState.bricks.filter((b) => b.alive);
  if (alive.length === 0) {
    sound.sfxFanfare();
    stageNum++;
    score += 65;
    addArcadeXP(20);
    updateHUD();
    showToast(`🎉 Phá sạch tường gạch! Qua Màn ${stageNum}!`);
    buildArkanoidWall();
    resetArkanoidBall();
    return;
  }
  const chosen = alive[Math.floor(Math.random() * alive.length)].vocab;
  arkState.priorityZh = chosen.zh;
  currentPromptAudio = { zh: chosen.zh, audio: chosen.audio };
  sound.speakChinese(chosen.zh, chosen.audio);

  setMissionBanner(
    '🏐 ARKANOID PHÁ TƯỜNG CHỮ HÁN',
    `🎯 Ưu tiên x3 điểm: "<span style="color:#fde047">${chosen.vi}</span>"`,
    'Đỡ bóng sao băng phá gạch & hứng viên nang nghĩa rơi xuống!',
    false
  );
}

function loopArkanoid() {
  if (activeGame !== 'arkanoid' || !arkState) return;
  if (window.isGamePaused) {
    arkRafId = requestAnimationFrame(loopArkanoid);
    return;
  }
  const cvs = document.getElementById('canvas-arkanoid');
  const ctx = cvs.getContext('2d');
  const S = arkState;
  const B = S.ball;

  ctx.clearRect(0, 0, S.W, S.H);

  // Comet trail history
  S.ballTrail.push({ x: B.x, y: B.y });
  if (S.ballTrail.length > 10) S.ballTrail.shift();

  B.x += B.vx;
  B.y += B.vy;

  if (B.x < B.r) { B.x = B.r; B.vx = Math.abs(B.vx); sound.sfxTap(); }
  if (B.x > S.W - B.r) { B.x = S.W - B.r; B.vx = -Math.abs(B.vx); sound.sfxTap(); }
  if (B.y < B.r) { B.y = B.r; B.vy = Math.abs(B.vy); sound.sfxTap(); }

  if (B.vy > 0 && B.y + B.r >= S.paddleY - 7 && B.y - B.r <= S.paddleY + 10 &&
      Math.abs(B.x - S.paddleX) <= S.paddleW / 2 + B.r) {
    const hitOffset = (B.x - S.paddleX) / (S.paddleW / 2);
    const speed = Math.hypot(B.vx, B.vy);
    B.vx = hitOffset * speed * 0.82;
    B.vy = -Math.sqrt(Math.max(4, speed * speed - B.vx * B.vx));
    B.y = S.paddleY - 7 - B.r;
    hapticPulse(10);
    sound.sfxTap();
  }

  if (B.y > S.H + 20) {
    hapticPulse(35);
    sound.sfxWrong();
    triggerScreenShake();
    combo = 1;
    spawnComboBanner(1, 0);
    lives--;
    updateHUD();
    if (lives <= 0) {
      triggerGameOver('🏐 RƠI HẾT BÓNG NĂNG LƯỢNG!');
      return;
    }
    resetArkanoidBall();
  }

  for (const br of S.bricks) {
    if (!br.alive) continue;
    const isPrio = br.vocab.zh === S.priorityZh;

    if (B.x + B.r > br.x && B.x - B.r < br.x + br.w &&
        B.y + B.r > br.y && B.y - B.r < br.y + br.h) {
      br.alive = false;
      B.vy *= -1;
      hapticPulse(18);
      combo = Math.min(10, combo + 1);
      incrementDailyProgress('combo', combo);
      sound.sfxCombo(combo);
      sound.speakChinese(br.vocab.zh, br.vocab.audio);
      recordLearnedWord(br.vocab);
      recordSrsOutcome(br.vocab, true);

      const pts = Math.round((isPrio ? 45 : 15) * combo * getScoreMultiplier());
      score += pts;
      addArcadeXP(isPrio ? 12 : 5);
      if (isPrio) spawnComboBanner(combo, pts);
      updateHUD();

      for (let k = 0; k < 14; k++) {
        S.sparks.push({
          x: br.x + br.w / 2, y: br.y + br.h / 2,
          vx: (Math.random() - 0.5) * 5.5, vy: (Math.random() - 0.5) * 5.5,
          life: 1.0, color: isPrio ? '#fde047' : '#38bdf8'
        });
      }

      S.capsules.push({
        x: br.x + br.w / 2,
        y: br.y + br.h,
        vy: 1.85,
        txt: `${br.vocab.zh}: ${br.vocab.vi.slice(0, 16)}`
      });

      if (isPrio || !S.bricks.some((x) => x.alive)) {
        pickNextArkanoidPriority();
      }
      break;
    }

    drawBeveledBox(
      ctx, br.x, br.y, br.w, br.h, 8,
      isPrio ? '#f59e0b' : br.cTop,
      isPrio ? '#b45309' : br.cBot,
      isPrio ? '#fef08a' : 'rgba(255,255,255,0.4)',
      isPrio ? 2.4 : 1.5
    );

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 13.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(br.vocab.zh, br.x + br.w / 2, showPinyin ? br.y + br.h / 2 - 4 : br.y + br.h / 2 + 1);
    if (showPinyin && br.vocab.pinyin) {
      ctx.fillStyle = '#fef9c3';
      ctx.font = '700 8.5px sans-serif';
      ctx.fillText(br.vocab.pinyin.slice(0, 14), br.x + br.w / 2, br.y + br.h / 2 + 10);
    }
  }

  for (let i = S.capsules.length - 1; i >= 0; i--) {
    const cp = S.capsules[i];
    cp.y += cp.vy;
    if (Math.abs(cp.y - S.paddleY) < 15 && Math.abs(cp.x - S.paddleX) < S.paddleW / 2 + 24) {
      score += 20;
      S.paddleW = Math.min(136, S.paddleW + 6);
      hapticPulse(14);
      sound.sfxTap();
      updateHUD();
      showToast(`💊 Hứng nghĩa +20đ! (${cp.txt})`);
      S.capsules.splice(i, 1);
      continue;
    }
    if (cp.y > S.H + 20) { S.capsules.splice(i, 1); continue; }

    ctx.font = '800 10.5px sans-serif';
    const cw = Math.min(165, ctx.measureText(cp.txt).width + 14);
    drawBeveledBox(ctx, cp.x - cw / 2, cp.y - 10, cw, 20, 99, '#10b981', '#047857', '#a7f3d0', 1.4);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cp.txt, cp.x, cp.y + 0.5);
  }

  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 3.5, 3.5);
  }
  ctx.globalAlpha = 1;

  // Draw Thruster Cyber Paddle
  drawBeveledBox(ctx, S.paddleX - S.paddleW / 2, S.paddleY - 6, S.paddleW, 14, 7, '#38bdf8', '#0284c7', '#fde047', 2);
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(S.paddleX - S.paddleW / 2 + 6, S.paddleY + 1, 3, 0, Math.PI * 2);
  ctx.arc(S.paddleX + S.paddleW / 2 - 6, S.paddleY + 1, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw Comet Trail + Plasma Ball
  S.ballTrail.forEach((pt, idx) => {
    const ratio = (idx + 1) / S.ballTrail.length;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, B.r * ratio * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${ratio * 0.38})`;
    ctx.fill();
  });

  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(148, 163, 184, 0.52)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('◀ Kéo thanh đỡ nảy bóng sao băng & hứng viên nang ▶', S.W / 2, S.H - 8);

  arkRafId = requestAnimationFrame(loopArkanoid);
}
