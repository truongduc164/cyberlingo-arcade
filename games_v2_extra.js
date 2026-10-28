// ============================================================================
// CYBERLINGO ARCADE PRO v2.0 — 4 NEW LEGENDARY CLASSIC ENGINES
// 5. Fruit Ninja Cyber Blade  |  6. Tetris Drop Match
// 7. Pac-Man Cyber Maze       |  8. Arkanoid Brick Breaker
// Developed by DEAN OPTIMIZE
// ============================================================================

// =========================================================
// GAME 5: 🥷 CHÉM HOA QUẢ ÂM THANH (Fruit Ninja Cyber Blade)
// =========================================================
let ninjaState = null;
let ninjaRafId = null;

function initNinjaGame() {
  const cvs = document.getElementById('canvas-ninja');
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = Math.max(310, Math.floor(rect.width));
  cvs.height = Math.max(330, Math.floor(rect.height));

  ninjaState = {
    W: cvs.width,
    H: cvs.height,
    orbs: [],
    halves: [],
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
    if (!ninjaState) return;
    ninjaState.swiping = true;
    const pt = getPt(e);
    ninjaState.trail.push({ x: pt.x, y: pt.y, life: 1.0 });
    checkNinjaSliceAt(pt.x, pt.y);
  };

  cvs.onpointermove = (e) => {
    if (!ninjaState || (!ninjaState.swiping && e.pointerType !== 'touch')) return;
    const pt = getPt(e);
    ninjaState.trail.push({ x: pt.x, y: pt.y, life: 1.0 });
    if (ninjaState.trail.length > 16) ninjaState.trail.shift();
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
  const picks = shuffleArr(pools.vocab).slice(0, 3);
  const target = picks[0];
  S.targetVocab = target;
  currentPromptAudio = { zh: target.zh, audio: target.audio };
  sound.speakChinese(target.zh, target.audio);

  setMissionBanner(
    '🥷 KIẾM ÁNH SÁNG — CHÉM TỪ ĐÚNG!',
    `🎯 Chém quả mang nghĩa: "<span style="color:#fde047">${target.vi}</span>"`,
    'Quẹt ngón tay chém đôi quả chữ Hán đúng — Né bom 💣!',
    false
  );

  const spdMul = getSpeedFactor();
  const g = 0.22 * spdMul;
  const items = shuffleArr([
    { vocab: picks[0], isCorrect: true, isBomb: false, color: '#10b981', rim: '#6ee7b7' },
    { vocab: picks[1], isCorrect: false, isBomb: false, color: '#0284c7', rim: '#7dd3fc' },
    { vocab: picks[2], isCorrect: false, isBomb: false, color: '#7c3aed', rim: '#d8b4fe' },
    ...(Math.random() < 0.65 ? [{ vocab: null, isCorrect: false, isBomb: true, color: '#881337', rim: '#fb7185' }] : [])
  ]);

  const count = items.length;
  items.forEach((it, idx) => {
    const startX = S.W * (0.18 + (idx / Math.max(1, count - 1)) * 0.64);
    const targetPeakY = S.H * (0.18 + Math.random() * 0.16);
    const riseH = (S.H + 30) - targetPeakY;
    const vy = -Math.sqrt(2 * g * riseH);
    const centerBias = (S.W * 0.5 - startX) * (0.006 + Math.random() * 0.005);

    S.orbs.push({
      x: startX,
      y: S.H + 30 + idx * 18,
      vx: centerBias,
      vy,
      g,
      r: it.isBomb ? 28 : 36,
      rot: (Math.random() - 0.5) * 0.3,
      vrot: (Math.random() - 0.5) * 0.015,
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

      if (o.isBomb) {
        S.waveResolved = true;
        sound.sfxWrong();
        triggerScreenShake();
        combo = 1;
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
        sound.sfxSuccess();
        sound.speakChinese(o.vocab.zh, o.vocab.audio);
        recordLearnedWord(o.vocab);
        const pts = Math.round(25 * combo * getScoreMultiplier());
        score += pts;
        addArcadeXP(12);
        combo = Math.min(10, combo + 1);
        if (score >= stageNum * 150) stageNum++;
        updateHUD();

        S.popups.push({ x: o.x, y: o.y - 10, txt: `⚡ +${pts} CHUẨN!`, color: '#fde047', life: 1.0 });
        S.waveTimer = setTimeout(spawnNinjaWave, 850);
        return;
      } else {
        // Sliced wrong word fruit
        sound.sfxWrong();
        combo = 1;
        lives--;
        updateHUD();
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
    { x: o.x - 10, y: o.y, vx: -2.6, vy: -2.2, rot: -0.2, r: o.r * 0.78, color: o.color, txt: label.slice(0, mid), life: 1.0 },
    { x: o.x + 10, y: o.y, vx: 2.6, vy: -2.2, rot: 0.2, r: o.r * 0.78, color: o.color, txt: label.slice(mid), life: 1.0 }
  );
  for (let k = 0; k < 16; k++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.8 + Math.random() * 4.2;
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
  const cvs = document.getElementById('canvas-ninja');
  const ctx = cvs.getContext('2d');
  const S = ninjaState;

  ctx.clearRect(0, 0, S.W, S.H);

  // Subtle dojo cyber lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.lineWidth = 1;
  for (let y = 50; y < S.H; y += 55) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S.W, y); ctx.stroke();
  }

  // Update & draw flying orbs
  let activeUnsliced = 0;
  let missedCorrect = false;

  for (let i = S.orbs.length - 1; i >= 0; i--) {
    const o = S.orbs[i];
    if (o.sliced) continue;

    o.x += o.vx;
    o.y += o.vy;
    o.vy += o.g;
    o.rot += o.vrot;

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
    ctx.beginPath();
    ctx.arc(0, 0, o.r, 0, Math.PI * 2);
    ctx.fillStyle = o.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = o.rim;
    ctx.stroke();

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
        ctx.fillStyle = '#e0f2fe';
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
      combo = 1;
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

  // Sliced halves
  for (let i = S.halves.length - 1; i >= 0; i--) {
    const h = S.halves[i];
    h.x += h.vx;
    h.y += h.vy;
    h.vy += 0.28;
    h.life -= 0.032;
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

  // Sparks
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.life -= 0.045;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  // Floating popups
  for (let i = S.popups.length - 1; i >= 0; i--) {
    const pp = S.popups[i];
    pp.y -= 1.1;
    pp.life -= 0.028;
    if (pp.life <= 0) { S.popups.splice(i, 1); continue; }
    ctx.globalAlpha = pp.life;
    ctx.fillStyle = pp.color;
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pp.txt, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;

  // Glowing Katana Blade Trail
  if (S.trail.length > 1) {
    for (let i = 1; i < S.trail.length; i++) {
      const a = S.trail[i - 1];
      const b = S.trail[i];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(56, 189, 248, ${b.life})`;
      ctx.lineWidth = 7 * b.life;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  for (let i = S.trail.length - 1; i >= 0; i--) {
    S.trail[i].life -= 0.12;
    if (S.trail[i].life <= 0) S.trail.splice(i, 1);
  }

  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ Quẹt ngón tay chém ngang quả Chữ Hán đúng!', S.W / 2, S.H - 10);

  ninjaRafId = requestAnimationFrame(loopNinja);
}

// =========================================================
// GAME 6: 🧱 XẾP GẠCH TỪ VỰNG (Tetris Drop Block Match)
// =========================================================
let tetState = null;
let tetRafId = null;

function initTetrisGame() {
  const cvs = document.getElementById('canvas-tetris');
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = Math.max(310, Math.floor(rect.width));
  cvs.height = Math.max(270, Math.floor(rect.height));

  const pools = getActivePools();
  const initialFour = shuffleArr(pools.vocab).slice(0, 4);

  tetState = {
    W: cvs.width,
    H: cvs.height,
    cols: 4,
    docks: initialFour, // 4 Vietnamese meaning docks
    garbage: [0, 0, 0, 0], // stacked wrong blocks per column (max 5)
    falling: null, // { col, y, vy, vocab }
    flashes: [],
    linesCleared: 0
  };

  cvs.onpointerdown = (e) => {
    if (!tetState || !tetState.falling) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const tappedCol = Math.max(0, Math.min(3, Math.floor((px / tetState.W) * 4)));
    if (tetState.falling.col === tappedCol) {
      tetrisAction('drop');
    } else {
      tetState.falling.col = tappedCol;
      sound.sfxTap();
    }
  };

  const onKey = (e) => {
    if (activeGame !== 'tetris') return;
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
  if (!tetState || !tetState.falling) return;
  if (act === 'left') {
    tetState.falling.col = Math.max(0, tetState.falling.col - 1);
    sound.sfxTap();
  } else if (act === 'right') {
    tetState.falling.col = Math.min(3, tetState.falling.col + 1);
    sound.sfxTap();
  } else if (act === 'drop') {
    tetState.falling.vy = 16;
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
    `🧱 XẾP GẠCH TỪ VỰNG • ĐÃ NỔ ${S.linesCleared} HÀNG`,
    `Đặt khối <b style="color:#fde047">${vocab.zh}</b> ${showPinyin ? '(' + (vocab.pinyin || '') + ')' : ''} vào đúng cột nghĩa!`,
    '💡 Chạm cột để chuyển làn — Chạm lần 2 (hoặc nút ⬇) để thả rơi nhanh!',
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
    // Line Clear Match!
    sound.sfxSuccess();
    sound.speakChinese(v.zh, v.audio);
    recordLearnedWord(v);
    S.linesCleared++;
    if (S.garbage[c] > 0) S.garbage[c]--; // Bonus: blasts 1 stacked garbage block!

    const pts = Math.round(20 * combo * getScoreMultiplier());
    score += pts;
    addArcadeXP(10);
    combo = Math.min(10, combo + 1);
    stageNum = 1 + Math.floor(S.linesCleared / 6);
    updateHUD();

    S.flashes.push({ col: c, color: '#34d399', life: 1.0 });

    // Rotate new word into this dock (not duplicating existing 3 docks)
    const pools = getActivePools();
    const usedZh = new Set(S.docks.map((d) => d.zh));
    const replacement = shuffleArr(pools.vocab).find((cand) => !usedZh.has(cand.zh)) || v;
    S.docks[c] = replacement;
  } else {
    // Wrong column -> Stacks garbage block!
    sound.sfxWrong();
    triggerScreenShake();
    combo = 1;
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
  setTimeout(spawnTetrisBlock, 260);
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
  const cvs = document.getElementById('canvas-tetris');
  const ctx = cvs.getContext('2d');
  const S = tetState;
  const colW = S.W / 4;
  const dockH = 68;
  const brickH = 30;

  ctx.clearRect(0, 0, S.W, S.H);

  // Column lanes & flashes
  for (let c = 0; c < 4; c++) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(c * colW, 0, colW, S.H - dockH);

    if (S.falling && S.falling.col === c) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.fillRect(c * colW + 1, 0, colW - 2, S.H - dockH);
    }
  }

  for (let i = S.flashes.length - 1; i >= 0; i--) {
    const fl = S.flashes[i];
    fl.life -= 0.06;
    if (fl.life <= 0) { S.flashes.splice(i, 1); continue; }
    ctx.globalAlpha = fl.life * 0.4;
    ctx.fillStyle = fl.color;
    ctx.fillRect(fl.col * colW, 0, colW, S.H);
  }
  ctx.globalAlpha = 1;

  // Stacked garbage bricks & Danger ceiling line
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
  ctx.setLineDash([5, 5]);
  const ceilingY = S.H - dockH - 5 * brickH;
  ctx.beginPath(); ctx.moveTo(0, ceilingY); ctx.lineTo(S.W, ceilingY); ctx.stroke();
  ctx.setLineDash([]);

  for (let c = 0; c < 4; c++) {
    for (let g = 0; g < S.garbage[c]; g++) {
      const bx = c * colW + 4;
      const by = S.H - dockH - (g + 1) * brickH + 2;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.roundRect(bx, by, colW - 8, brickH - 4, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 10px sans-serif';
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

    ctx.fillStyle = S.falling && S.falling.col === c ? '#0f2942' : '#0f172a';
    ctx.strokeStyle = S.falling && S.falling.col === c ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.roundRect(dx, dy, dw, dh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'center';
    const lines = wrapDockLines(ctx, S.docks[c].vi, dw - 8);
    const startY = dy + dh / 2 - ((lines.length - 1) * 13) / 2;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, dx + dw / 2, startY + idx * 13);
    });
  }

  // Falling Block
  if (S.falling) {
    const f = S.falling;
    f.y += f.vy;
    const floorY = S.H - dockH - S.garbage[f.col] * brickH - 22;
    if (f.y >= floorY) {
      f.y = floorY;
      resolveTetrisLanding();
    } else {
      const bx = f.col * colW + 4;
      const bw = colW - 8;
      const bh = 42;
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.roundRect(bx, f.y - bh / 2, bw, bh, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const zh = f.vocab.zh;
      ctx.font = zh.length >= 4 ? '900 13.5px "PingFang SC", "Microsoft YaHei", sans-serif' : '900 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(zh, bx + bw / 2, showPinyin ? f.y - 5 : f.y + 1);
      if (showPinyin && f.vocab.pinyin) {
        ctx.fillStyle = '#fde68a';
        ctx.font = '700 9px sans-serif';
        ctx.fillText(f.vocab.pinyin.slice(0, 12), bx + bw / 2, f.y + 11);
      }
    }
  }

  tetRafId = requestAnimationFrame(loopTetris);
}

// =========================================================
// GAME 7: 👻 PAC-MAN MÊ CUNG SĂN CHỮ (Cyber Pac-Lingo Maze)
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

function initPacmanGame() {
  pacState = {
    grid: PAC_MAZE_TEMPLATE.map((row) => [...row]),
    px: 4,
    py: 6,
    dir: { x: 0, y: 0 },
    nextDir: { x: 1, y: 0 },
    mouthOpen: true,
    powerTicks: 0,
    shieldTicks: 0,
    gems: [], // { x, y, vocab, isTarget }
    ghosts: [
      { x: 4, y: 2, dx: 1, dy: 0, color: '#fb7185', icon: '👻' },
      { x: 4, y: 4, dx: 0, dy: -1, color: '#c084fc', icon: '👾' }
    ],
    tickCount: 0
  };

  const cvs = document.getElementById('canvas-pacman');
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
    if (activeGame !== 'pacman') return;
    if (e.key === 'ArrowUp' || e.key === 'w') pacSteer(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 's') pacSteer(0, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') pacSteer(-1, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd') pacSteer(1, 0);
  };
  window.addEventListener('keydown', onKey);

  spawnPacGems();
  drawPacMaze();

  const tickMs = Math.round(250 / getSpeedFactor());
  pacTimerId = setInterval(stepPacman, tickMs);
  cleanupFns.push(() => {
    clearInterval(pacTimerId);
    window.removeEventListener('keydown', onKey);
    pacState = null;
  });
}

function pacSteer(dx, dy) {
  if (!pacState) return;
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
  const picks = shuffleArr(pools.vocab).slice(0, 4);
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
  if (activeGame !== 'pacman' || !pacState) return;
  const S = pacState;
  S.tickCount++;
  S.mouthOpen = !S.mouthOpen;
  if (S.powerTicks > 0) S.powerTicks--;
  if (S.shieldTicks > 0) S.shieldTicks--;

  // Move Pac-Man using queued turn if passable
  if (canPacWalk(S.px + S.nextDir.x, S.py + S.nextDir.y)) {
    S.dir = { ...S.nextDir };
  }
  if (canPacWalk(S.px + S.dir.x, S.py + S.dir.y)) {
    S.px = (S.px + S.dir.x + 9) % 9;
    S.py = (S.py + S.dir.y + 9) % 9;
  }

  // Eat small dot
  if (S.grid[S.py][S.px] === 0) {
    S.grid[S.py][S.px] = 2;
    score += 2;
    updateHUD();
  }

  // Check Word Gems
  const gIdx = S.gems.findIndex((gm) => gm.x === S.px && gm.y === S.py);
  if (gIdx >= 0) {
    const gm = S.gems[gIdx];
    if (gm.isTarget) {
      sound.sfxFanfare();
      sound.speakChinese(gm.vocab.zh, gm.vocab.audio);
      recordLearnedWord(gm.vocab);
      S.powerTicks = 20; // ~5 seconds Power Pellet mode!
      const pts = Math.round(35 * combo * getScoreMultiplier());
      score += pts;
      addArcadeXP(15);
      combo = Math.min(10, combo + 1);
      stageNum++;
      updateHUD();
      showToast(`⚡ SIÊU CẤP! "${gm.vocab.zh}" = ${gm.vocab.vi}!`);
      // Refill dots every 2 stages
      if (stageNum % 2 === 0) {
        S.grid = PAC_MAZE_TEMPLATE.map((r) => [...r]);
      }
      spawnPacGems();
    } else {
      sound.sfxWrong();
      S.gems.splice(gIdx, 1);
      combo = 1;
      lives--;
      updateHUD();
      showToast(`❌ Ăn nhầm "${gm.vocab.zh}" (${gm.vocab.vi})!`);
      if (lives <= 0) {
        triggerGameOver('👻 PAC-MAN HẾT MẠNG!');
        return;
      }
    }
  }

  // Move Ghosts every other tick (or slower when scared) so pace feels fair & strategic
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
        // Slight chase bias when normal, flee when scared
        choices.sort((a, b) => {
          const da = Math.hypot((gh.x + a.x) - S.px, (gh.y + a.y) - S.py);
          const db = Math.hypot((gh.x + b.x) - S.px, (gh.y + b.y) - S.py);
          return S.powerTicks > 0 ? db - da : da - db;
        });
        const pick = Math.random() < 0.65 ? choices[0] : choices[Math.floor(Math.random() * choices.length)];
        gh.dx = pick.x;
        gh.dy = pick.y;
        gh.x = (gh.x + gh.dx + 9) % 9;
        gh.y = (gh.y + gh.dy + 9) % 9;
      }
    }
  }

  // Check Pac-Man vs Ghost collision
  for (const gh of S.ghosts) {
    if (gh.x === S.px && gh.y === S.py) {
      if (S.powerTicks > 0) {
        sound.sfxSuccess();
        score += 50;
        addArcadeXP(8);
        gh.x = 4; gh.y = 4;
        updateHUD();
        showToast('👻 NUỐT GỌN MA QC! +50 ĐIỂM!');
      } else if (S.shieldTicks <= 0) {
        sound.sfxWrong();
        triggerScreenShake();
        S.shieldTicks = 8;
        combo = 1;
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

  drawPacMaze();
}

function drawPacMaze() {
  if (!pacState) return;
  const cvs = document.getElementById('canvas-pacman');
  const ctx = cvs.getContext('2d');
  const W = cvs.width;
  const H = cvs.height;
  const cw = W / 9;
  const ch = H / 9;
  const S = pacState;

  ctx.clearRect(0, 0, W, H);

  // Walls & Energy Dots
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = S.grid[r][c];
      if (cell === 1) {
        ctx.fillStyle = '#0f2942';
        ctx.strokeStyle = S.powerTicks > 0 ? '#fde047' : '#2563eb';
        ctx.lineWidth = 2;
        ctx.roundRect(c * cw + 3, r * ch + 3, cw - 6, ch - 6, 7);
        ctx.fill();
        ctx.stroke();
      } else if (cell === 0) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.7)';
        ctx.beginPath();
        ctx.arc(c * cw + cw / 2, r * ch + ch / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Word Gems in corners
  for (const gm of S.gems) {
    const cx = gm.x * cw + cw / 2;
    const cy = gm.y * ch + ch / 2;
    ctx.font = '900 12.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    const tw = Math.max(cw + 4, ctx.measureText(gm.vocab.zh).width + 12);
    const th = 25;
    const bx = Math.max(2, Math.min(W - tw - 2, cx - tw / 2));
    const by = Math.max(2, Math.min(H - th - 2, cy - th / 2));

    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.roundRect(bx, by, tw, th, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gm.vocab.zh, bx + tw / 2, by + th / 2 + 0.5);
  }

  // Draw Pac-Man
  if (S.shieldTicks % 2 === 0) {
    const px = S.px * cw + cw / 2;
    const py = S.py * ch + ch / 2;
    const r = Math.min(cw, ch) * 0.38;
    let baseAng = 0;
    if (S.dir.x === -1) baseAng = Math.PI;
    else if (S.dir.y === -1) baseAng = -Math.PI / 2;
    else if (S.dir.y === 1) baseAng = Math.PI / 2;
    const mouth = S.mouthOpen ? 0.26 * Math.PI : 0.05 * Math.PI;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, r, baseAng + mouth, baseAng + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Ghosts
  for (const gh of S.ghosts) {
    const gx = gh.x * cw + cw / 2;
    const gy = gh.y * ch + ch / 2;
    ctx.font = '21px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(S.powerTicks > 0 ? '😱' : gh.icon, gx, gy + 1);
  }
}

// =========================================================
// GAME 8: 🏐 PHÁ GẠCH ARKANOID (Cyber Brick Breaker)
// =========================================================
let arkState = null;
let arkRafId = null;

function initArkanoidGame() {
  const cvs = document.getElementById('canvas-arkanoid');
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = Math.max(310, Math.floor(rect.width));
  cvs.height = Math.max(330, Math.floor(rect.height));

  arkState = {
    W: cvs.width,
    H: cvs.height,
    paddleX: cvs.width / 2,
    paddleW: 98,
    paddleY: cvs.height - 32,
    ball: { x: cvs.width / 2, y: cvs.height - 52, vx: 2.7, vy: -3.6, r: 7.5 },
    bricks: [],
    capsules: [], // falling bonus meaning capsules
    sparks: [],
    priorityZh: ''
  };

  const movePad = (e) => {
    if (!arkState) return;
    const r = cvs.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    arkState.paddleX = Math.max(arkState.paddleW / 2, Math.min(arkState.W - arkState.paddleW / 2, px));
  };
  cvs.onpointerdown = movePad;
  cvs.onpointermove = (e) => { if (e.buttons || e.pointerType === 'touch') movePad(e); };

  const onKey = (e) => {
    if (activeGame !== 'arkanoid' || !arkState) return;
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
  const spd = 3.5 * getSpeedFactor();
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
  const nine = shuffleArr(pools.vocab).slice(0, 9);
  const cols = 3;
  const bw = (S.W - 24) / cols;
  const bh = 36;
  const rowColors = ['#0284c7', '#7c3aed', '#059669'];

  nine.forEach((v, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    S.bricks.push({
      x: 12 + c * bw + 3,
      y: 22 + r * (bh + 7),
      w: bw - 6,
      h: bh,
      color: rowColors[r % 3],
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
    score += 60;
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
    'Đỡ bóng phá gạch nghe phát âm & hứng viên nang nghĩa xanh rơi xuống!',
    false
  );
}

function loopArkanoid() {
  if (activeGame !== 'arkanoid' || !arkState) return;
  const cvs = document.getElementById('canvas-arkanoid');
  const ctx = cvs.getContext('2d');
  const S = arkState;
  const B = S.ball;

  ctx.clearRect(0, 0, S.W, S.H);

  // Move ball
  B.x += B.vx;
  B.y += B.vy;

  if (B.x < B.r) { B.x = B.r; B.vx = Math.abs(B.vx); sound.sfxTap(); }
  if (B.x > S.W - B.r) { B.x = S.W - B.r; B.vx = -Math.abs(B.vx); sound.sfxTap(); }
  if (B.y < B.r) { B.y = B.r; B.vy = Math.abs(B.vy); sound.sfxTap(); }

  // Paddle bounce with angle control
  if (B.vy > 0 && B.y + B.r >= S.paddleY - 6 && B.y - B.r <= S.paddleY + 10 &&
      Math.abs(B.x - S.paddleX) <= S.paddleW / 2 + B.r) {
    const hitOffset = (B.x - S.paddleX) / (S.paddleW / 2); // -1..1
    const speed = Math.hypot(B.vx, B.vy);
    B.vx = hitOffset * speed * 0.82;
    B.vy = -Math.sqrt(Math.max(4, speed * speed - B.vx * B.vx));
    B.y = S.paddleY - 6 - B.r;
    sound.sfxTap();
  }

  // Ball missed bottom
  if (B.y > S.H + 20) {
    sound.sfxWrong();
    triggerScreenShake();
    combo = 1;
    lives--;
    updateHUD();
    if (lives <= 0) {
      triggerGameOver('🏐 RƠI HẾT BÓNG NĂNG LƯỢNG!');
      return;
    }
    resetArkanoidBall();
  }

  // Bricks collision & render
  for (const br of S.bricks) {
    if (!br.alive) continue;
    const isPrio = br.vocab.zh === S.priorityZh;

    if (B.x + B.r > br.x && B.x - B.r < br.x + br.w &&
        B.y + B.r > br.y && B.y - B.r < br.y + br.h) {
      br.alive = false;
      B.vy *= -1;
      sound.sfxSuccess();
      sound.speakChinese(br.vocab.zh, br.vocab.audio);
      recordLearnedWord(br.vocab);

      const pts = Math.round((isPrio ? 45 : 15) * combo * getScoreMultiplier());
      score += pts;
      addArcadeXP(isPrio ? 12 : 5);
      combo = Math.min(10, combo + 1);
      updateHUD();

      for (let k = 0; k < 12; k++) {
        S.sparks.push({
          x: br.x + br.w / 2, y: br.y + br.h / 2,
          vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
          life: 1.0, color: isPrio ? '#fde047' : '#38bdf8'
        });
      }

      // Drop meaning bonus capsule
      S.capsules.push({
        x: br.x + br.w / 2,
        y: br.y + br.h,
        vy: 1.8,
        txt: `${br.vocab.zh}: ${br.vocab.vi.slice(0, 16)}`,
        life: 1.0
      });

      if (isPrio || !S.bricks.some((x) => x.alive)) {
        pickNextArkanoidPriority();
      }
      break;
    }

    ctx.fillStyle = isPrio ? '#b45309' : br.color;
    ctx.strokeStyle = isPrio ? '#fde047' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = isPrio ? 2.5 : 1.5;
    ctx.roundRect(br.x, br.y, br.w, br.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 13.5px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(br.vocab.zh, br.x + br.w / 2, showPinyin ? br.y + br.h / 2 - 4 : br.y + br.h / 2 + 1);
    if (showPinyin && br.vocab.pinyin) {
      ctx.fillStyle = '#e0f2fe';
      ctx.font = '700 8.5px sans-serif';
      ctx.fillText(br.vocab.pinyin.slice(0, 14), br.x + br.w / 2, br.y + br.h / 2 + 10);
    }
  }

  // Falling Bonus Capsules
  for (let i = S.capsules.length - 1; i >= 0; i--) {
    const cp = S.capsules[i];
    cp.y += cp.vy;
    if (Math.abs(cp.y - S.paddleY) < 14 && Math.abs(cp.x - S.paddleX) < S.paddleW / 2 + 24) {
      score += 20;
      S.paddleW = Math.min(132, S.paddleW + 6);
      sound.sfxTap();
      updateHUD();
      showToast(`💊 Hứng nghĩa +20đ! (${cp.txt})`);
      S.capsules.splice(i, 1);
      continue;
    }
    if (cp.y > S.H + 20) { S.capsules.splice(i, 1); continue; }

    ctx.font = '800 10.5px sans-serif';
    const cw = Math.min(160, ctx.measureText(cp.txt).width + 14);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 1.5;
    ctx.roundRect(cp.x - cw / 2, cp.y - 10, cw, 20, 99);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cp.txt, cp.x, cp.y + 0.5);
  }

  // Sparks
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
    if (sp.life <= 0) { S.sparks.splice(i, 1); continue; }
    ctx.globalAlpha = sp.life;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x, sp.y, 3.5, 3.5);
  }
  ctx.globalAlpha = 1;

  // Draw Neon Paddle
  ctx.fillStyle = '#0ea5e9';
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2;
  ctx.roundRect(S.paddleX - S.paddleW / 2, S.paddleY - 6, S.paddleW, 13, 7);
  ctx.fill();
  ctx.stroke();

  // Draw Plasma Ball
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('◀ Kéo thanh đỡ nảy bóng & hứng viên nang nghĩa ▶', S.W / 2, S.H - 8);

  arkRafId = requestAnimationFrame(loopArkanoid);
}
