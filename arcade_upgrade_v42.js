/**
 * CYBERLINGO ARCADE PRO v4.2 — HANZI DOJO, MEMORY FORTRESS & CYBER LEAGUE
 * =========================================================================
 * Nâng cấp toàn diện v4.2:
 *  1. 🧩 Radical Breakdown v2.0 (Hỗ trợ từ ghép 2-4 chữ + 140+ Hán tự + Nút Tách Bộ Sổ Tay + Luyện Viết Mini)
 *  2. ❄️ Streak Freeze Auto-Protect + Đền Lửa Thiêng Modal
 *  3. 🤖 Chế độ Nhịp thứ 4: "AI Tự Cân" + Mobile Visibility Auto-Pause Guard
 *  4. 🛡️ Pháo Đài Trí Nhớ (SRS HP Shield Decay theo đường cong quên Ebbinghaus)
 *  5. 🏆 Giải Đấu Tuần — Mini League 30 Kỹ Sư (5 bậc Rank: Đồng -> Kim Cương)
 *  6. ⚔️ Thách Đấu Bạn Bè & Friend Streak qua Link (?c=... Share Telegram/Zalo)
 *  7. 🥋 MINI-GAME #11 MỚI: "Võ Đài Bộ Thủ & Nét Chữ (Hanzi Dojo)"
 *
 * Developed by DEAN OPTIMIZE × Quân Sư Khổng Minh — 01/11/2026
 */

(function () {
  'use strict';

  const V42_SHIELD_KEY = 'cyberlingo_shield_v42';
  const V42_LEAGUE_KEY = 'cyberlingo_league_v42';
  const V42_PLAYER_KEY = 'cyberlingo_player_v42';

  const GAME_NAMES_VI = {
    miner: '⛏️ Đào Vàng Chữ Hán',
    bubble: '🥚 Bắn Trứng Âm Thanh',
    ninja: '🥷 Chém Quả Âm Thanh',
    tetris: '🧱 Xếp Gạch Từ Vựng',
    pacman: '👻 Pac-Man Săn Chữ',
    onet: '🔗 Pikachu Nối Từ',
    snake: '🐍 Rắn Săn Ghép Câu',
    whac: '🔨 Đập Chuột Nghe Ý',
    arkanoid: '🏐 Phá Gạch Arkanoid',
    galaga: '👾 Bắn Tàu Đấu Boss',
    dojo: '🥋 Võ Đài Bộ Thủ & Nét Chữ'
  };

  // Safe localStorage helpers (Poki / CrazyGames Incognito compliant)
  function safeGetJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) || fallback) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSetJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function safeGetStr(key, fallback = '') {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSetStr(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {}
  }

  // ===========================================================================
  // 1. 🧩 RADICAL BREAKDOWN v2.0 (MULTI-CHAR WORDS + 140+ CHARS + NOTEBOOK)
  // ===========================================================================
  const BUILTIN_RADICAL_FALLBACK = {
    '我': { parts: ['手', '戈'], meanings: ['thủ (tay)', 'qua (cây giáo)'], mnemonic: 'Tay cầm giáo bảo vệ bản thân = TÔI (Ngã)' },
    '你': { parts: ['亻', '尔'], meanings: ['nhân (người)', 'nhĩ (bạn)'], mnemonic: 'Người đứng đối diện mình = BẠN (Nhĩ)' },
    '们': { parts: ['亻', '门'], meanings: ['nhân (người)', 'môn (cửa)'], mnemonic: 'Nhiều người đứng trước cửa = CHÚNG TA / CÁC BẠN' },
    '好': { parts: ['女', '子'], meanings: ['nữ (mẹ)', 'tử (con)'], mnemonic: 'Mẹ ôm con bình an = TỐT ĐẸP (Hảo)' },
    '谢': { parts: ['讠', '身', '寸'], meanings: ['ngôn (lời)', 'thân (mình)', 'thốn (tấc/tay)'], mnemonic: 'Cúi mình chắp tay nói lời tri ân = CẢM ƠN (Tạ)' },
    '再': { parts: ['一', '冉'], meanings: ['nhất (một)', 'nhiễm (lặp lại)'], mnemonic: 'Một lần rồi lại lần nữa = LẠI / TÁI (Tái kiến)' },
    '见': { parts: ['冂', '儿'], meanings: ['mục (con mắt)', 'nhân (chân người)'], mnemonic: 'Mắt nhìn rõ người phía trước = GẶP / THẤY (Kiến)' },
    '头': { parts: ['丶', '丶', '大'], meanings: ['2 chấm (tóc)', 'đại (người lớn)'], mnemonic: 'Hai chấm tóc trên người lớn = CÁI ĐẦU (Đầu khôi)' },
    '盔': { parts: ['灰', '皿'], meanings: ['hôi (màu xám)', 'mãnh (cái chậu cứng)'], mnemonic: 'Vỏ chậu cứng màu xám úp bảo vệ đầu = MŨ BẢO HIỂM' },
    '安': { parts: ['宀', '女'], meanings: ['miên (mái nhà)', 'nữ (người phụ nữ)'], mnemonic: 'Người thân dưới mái nhà vững chãi = AN TOÀN' },
    '全': { parts: ['人', '王'], meanings: ['nhân (người/nón)', 'vương (ngọc vẹn toàn)'], mnemonic: 'Viên ngọc dưới mái che nguyên vẹn = TOÀN VẸN' },
    '品': { parts: ['口', '口', '口'], meanings: ['3 chữ khẩu (3 kiện hàng)'], mnemonic: 'Ba khối hàng xếp chuẩn chỉnh = SẢN PHẨM / PHẨM CHẤT' },
    '检': { parts: ['木', '佥'], meanings: ['mộc (khuôn gỗ)', 'thiêm (cùng đối chiếu)'], mnemonic: 'Cùng đối chiếu từng khuôn mẫu = KIỂM TRA (KCS)' },
    '合': { parts: ['人', '一', '口'], meanings: ['nhân (nắp)', 'nhất (khít)', 'khẩu (hộp)'], mnemonic: 'Nắp đậy vừa khít miệng hộp = PHÙ HỢP / HỢP CÁCH' },
    '格': { parts: ['木', '各'], meanings: ['mộc (khung gỗ)', 'các (riêng biệt)'], mnemonic: 'Khung gỗ chia ô chuẩn kích thước = QUY CÁCH / TIÊU CHUẨN' },
    '流': { parts: ['氵', '㐬'], meanings: ['thủy (dòng nước)', 'lưu (chảy xuôi)'], mnemonic: 'Dòng nước chảy liên tục không ngừng = DÂY CHUYỀN (Lưu thủy)' },
    '水': { parts: ['水'], meanings: ['thủy (dòng nước chảy)'], mnemonic: 'Hình dòng suối ở giữa và bọt nước hai bên = NƯỚC' },
    '线': { parts: ['纟', '戋'], meanings: ['mịch (sợi tơ)', 'tiễn (mảnh nhỏ)'], mnemonic: 'Sợi dây dẫn kéo dài xuyên xưởng = DÂY CHUYỀN / TUYẾN' },
    '注': { parts: ['氵', '主'], meanings: ['thủy (chất lỏng)', 'chủ (trụ cột/đổ vào)'], mnemonic: 'Bơm dòng nhựa nóng chảy vào khuôn = ÉP NHỰA (Chú tố)' },
    '塑': { parts: ['朔', '土'], meanings: ['sóc (biến đổi)', 'thổ (đất sét/vật liệu)'], mnemonic: 'Vật liệu mềm nặn ép thành hình = NHỰA / TẠO HÌNH' },
    '机': { parts: ['木', '几'], meanings: ['mộc (khung gỗ)', 'kỉ (bàn máy)'], mnemonic: 'Khung bệ lắp cơ cấu chuyển động = MÁY MÓC (Cơ)' },
    '模': { parts: ['木', '莫'], meanings: ['mộc (khung)', 'mạc (phủ kín)'], mnemonic: 'Khung bao phủ định hình sản phẩm = KHUÔN MẪU (Mô)' },
    '具': { parts: ['目', '八'], meanings: ['mục (thân dụng cụ)', 'bát (hai chân đế)'], mnemonic: 'Thiết bị đặt vững trên hai chân đế = DỤNG CỤ / KHUÔN' },
    '厂': { parts: ['厂'], meanings: ['hán (mái xưởng rộng)'], mnemonic: 'Hình mái nhà xưởng công nghiệp mở rộng = NHÀ MÁY' },
    '长': { parts: ['长'], meanings: ['trường/trưởng (dài/đứng đầu)'], mnemonic: 'Người đứng đầu dẫn dắt cả xưởng = XƯỞNG TRƯỞNG' },
    '电': { parts: ['日', '乚'], meanings: ['nhật (tia sáng)', 'ẩn (dây dẫn móc câu)'], mnemonic: 'Tia năng lượng chạy qua dây dẫn = ĐIỆN' },
    '脑': { parts: ['月', '亠', '凶'], meanings: ['nhục (cơ thể)', 'đầu', 'nếp nhăn não'], mnemonic: 'Bộ phận cơ thể nhiều nếp nhăn suy nghĩ = BỘ NÃO (Điện não = Máy tính)' }
  };

  function getCombinedRadicalDB() {
    const baseV41 = (typeof RADICAL_DB !== 'undefined' && RADICAL_DB) ? RADICAL_DB : {};
    const extV42 = (typeof window !== 'undefined' && window.RADICAL_DB_V42) ? window.RADICAL_DB_V42 : {};
    return Object.assign({}, BUILTIN_RADICAL_FALLBACK, baseV41, extV42);
  }

  function findVocabItemByZh(zhText) {
    if (!zhText) return null;
    const pools = typeof getActivePools === 'function' ? getActivePools() : { vocab: [] };
    const all = [...(pools.vocab || []), ...(window.FULL_VOCAB_DATABASE || [])];
    return all.find((x) => x && x.zh === zhText) || all.find((x) => x && x.zh && x.zh.includes(zhText)) || null;
  }

  // Smart fallback if a rare character is outside the 150+ DB
  const COMMON_LEFT_RADICALS = [
    ['氵', 'thủy (nước/chất lỏng)'], ['扌', 'thủ (bàn tay/thao tác)'], ['口', 'khẩu (miệng/lời nói)'],
    ['亻', 'nhân (con người)'], ['木', 'mộc (gỗ/khung máy)'], ['钅', 'kim (kim loại)'],
    ['讠', 'ngôn (ngôn ngữ)'], ['纟', 'mịch (sợi dây/tơ)'], ['火', 'hỏa (lửa/nhiệt)'],
    ['土', 'thổ (đất/nền)'], ['女', 'nữ (phụ nữ)'], ['日', 'nhật (mặt trời/ngày)'],
    ['月', 'nguyệt/nhục (trăng/cơ thể)'], ['目', 'mục (con mắt)'], ['石', 'thạch (đá cứng)'],
    ['车', 'xa (xe cộ)'], ['辶', 'sước (bước đi)'], ['宀', 'miên (mái nhà)'], ['艹', 'thảo (cây cỏ)'],
    ['心', 'tâm (trái tim)'], ['忄', 'tâm đứng (cảm xúc)'], ['门', 'môn (cánh cửa)'], ['贝', 'bối (tiền tài)']
  ];

  function getCharDecomposition(ch, wordVocab) {
    const db = getCombinedRadicalDB();
    if (db[ch]) return db[ch];
    return {
      parts: [ch],
      meanings: ['Hán tự nguyên khối'],
      mnemonic: wordVocab
        ? `Chữ "${ch}" trong từ "${wordVocab.zh}" (${wordVocab.pinyin}) — nghĩa: ${wordVocab.vi}. Bấm "Tập Viết" để khắc sâu mặt chữ!`
        : `Chữ Hán "${ch}" — hãy nghe phát âm và quẹt thử nét chữ bên dưới để nhớ mặt chữ gấp 3 lần!`
    };
  }

  let _radicalTraceMode = false;

  function showRadicalBreakdownV42(wordOrChar, charIndex = 0) {
    if (!wordOrChar) return false;
    const chars = Array.from(String(wordOrChar)).filter((c) => /[\u4e00-\u9fff]/.test(c));
    if (chars.length === 0) return false;

    const idx = Math.max(0, Math.min(chars.length - 1, charIndex || 0));
    const activeChar = chars[idx];
    const vocabMeta = findVocabItemByZh(wordOrChar) || findVocabItemByZh(activeChar);
    const info = getCharDecomposition(activeChar, vocabMeta);

    const existing = document.getElementById('radical-popup');
    if (existing) existing.remove();

    const tabsHtml = chars.length > 1
      ? `<div class="v42-rad-tabs">
          ${chars.map((c, i) => `<button class="v42-rad-tab ${i === idx ? 'active' : ''}" onclick="window.showRadicalBreakdown('${wordOrChar.replace(/'/g, '')}', ${i})">${c}</button>`).join('')}
         </div>`
      : '';

    const wordHeaderHtml = vocabMeta
      ? `<div class="v42-rad-wordbar">
           <div>
             <span style="font-weight:900;color:#fde047;font-size:14px;">${vocabMeta.zh}</span>
             <span style="color:#7dd3fc;font-size:11.5px;margin-left:5px;">${vocabMeta.pinyin || ''}</span>
             <div style="color:#d1fae5;font-size:11.5px;font-weight:700;">${vocabMeta.vi || ''}</div>
           </div>
           <button class="v42-mini-action" onclick="if(typeof sound!=='undefined')sound.speakChinese('${vocabMeta.zh.replace(/'/g, '')}', '${(vocabMeta.audio || '').replace(/'/g, '')}')">🔊 Đọc</button>
         </div>`
      : `<div style="margin-bottom:8px;"><button class="v42-mini-action" onclick="if(typeof sound!=='undefined')sound.speakChinese('${activeChar}', '')">🔊 Đọc "${activeChar}"</button></div>`;

    const popup = document.createElement('div');
    popup.id = 'radical-popup';
    popup.innerHTML = `
      <div class="radical-overlay" onclick="closeRadicalPopup()"></div>
      <div class="radical-card" style="max-width:356px;padding:16px;">
        ${wordHeaderHtml}
        ${tabsHtml}
        <div id="v42-rad-visual-box">
          <div class="radical-main-char" style="font-size:48px;margin-bottom:8px;">${activeChar}</div>
          <div class="radical-equation">
            ${info.parts.map((p, i) => `
              <span class="radical-part" style="animation-delay:${i * 0.12}s">${p}</span>
              ${i < info.parts.length - 1 ? '<span class="radical-op">+</span>' : ''}
            `).join('')}
            <span class="radical-op">=</span>
            <span class="radical-result">${activeChar}</span>
          </div>
          <div class="radical-meanings">
            ${info.parts.map((p, i) => `
              <span class="radical-meaning-chip">${p}: ${info.meanings[i] || ''}</span>
            `).join('')}
          </div>
        </div>

        <div id="v42-rad-trace-box" class="hidden" style="margin:8px auto;">
          <div style="font-size:11px;color:#7dd3fc;margin-bottom:4px;font-weight:800;">✍️ Dùng ngón tay tô theo nét chữ mờ:</div>
          <canvas id="v42-popup-trace-cvs" width="180" height="180" style="border-radius:14px;border:1.5px solid rgba(56,189,248,0.5);background:#091326;touch-action:none;"></canvas>
          <div style="margin-top:5px;display:flex;justify-content:center;gap:8px;">
            <button class="v42-mini-action" onclick="window._clearPopupTrace && window._clearPopupTrace()">🧹 Xóa nét</button>
          </div>
        </div>

        <div class="radical-mnemonic">💡 ${info.mnemonic}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" style="padding:9px;font-size:12px;" onclick="window._togglePopupTrace('${activeChar}')">✍️ Tập Viết</button>
          <button class="radical-close-btn" style="flex:1.3;padding:9px;font-size:13px;" onclick="closeRadicalPopup()">Đã thuộc ✓</button>
        </div>
      </div>
    `;
    (document.getElementById('app-shell') || document.body).appendChild(popup);
    _radicalTraceMode = false;
    if (typeof hapticPattern === 'function') hapticPattern('reward');
    if (typeof sound !== 'undefined') {
      sound.speakChinese(vocabMeta ? vocabMeta.zh : activeChar, vocabMeta ? vocabMeta.audio : '');
    }
    return true;
  }

  window._togglePopupTrace = function (ch) {
    const vis = document.getElementById('v42-rad-visual-box');
    const trc = document.getElementById('v42-rad-trace-box');
    if (!vis || !trc) return;
    _radicalTraceMode = !_radicalTraceMode;
    vis.classList.toggle('hidden', _radicalTraceMode);
    trc.classList.toggle('hidden', !_radicalTraceMode);
    if (_radicalTraceMode) {
      setupCalligraphyPad(document.getElementById('v42-popup-trace-cvs'), ch, 180);
    }
  };

  // Setup interactive TianZiGe (田字格) touch calligraphy pad
  function setupCalligraphyPad(cvs, targetChar, cssSize = 200, onStrokeProgress = null) {
    if (!cvs) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cvs.style.width = cssSize + 'px';
    cvs.style.height = cssSize + 'px';
    cvs.width = Math.round(cssSize * dpr);
    cvs.height = Math.round(cssSize * dpr);
    const ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let strokes = [];
    let currentStroke = null;
    let totalInkLength = 0;

    function redraw() {
      ctx.clearRect(0, 0, cssSize, cssSize);
      // TianZiGe guide lines
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cssSize / 2, 0); ctx.lineTo(cssSize / 2, cssSize);
      ctx.moveTo(0, cssSize / 2); ctx.lineTo(cssSize, cssSize / 2);
      ctx.moveTo(0, 0); ctx.lineTo(cssSize, cssSize);
      ctx.moveTo(cssSize, 0); ctx.lineTo(0, cssSize);
      ctx.stroke();
      ctx.restore();

      // Watermark character
      ctx.save();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.font = `900 ${Math.round(cssSize * 0.68)}px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(targetChar, cssSize / 2, cssSize / 2 + 4);
      ctx.restore();

      // Player glowing brush strokes
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(7, Math.round(cssSize * 0.048));
      for (const st of strokes) {
        if (st.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(st[0].x, st[0].y);
        for (let i = 1; i < st.length; i++) ctx.lineTo(st[i].x, st[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function getPos(e) {
      const r = cvs.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - r.left) / (r.width || cssSize)) * cssSize,
        y: ((clientY - r.top) / (r.height || cssSize)) * cssSize
      };
    }

    cvs.onpointerdown = (e) => {
      e.preventDefault();
      try { cvs.setPointerCapture(e.pointerId); } catch (_) {}
      const p = getPos(e);
      currentStroke = [p];
      strokes.push(currentStroke);
      redraw();
    };

    cvs.onpointermove = (e) => {
      if (!currentStroke) return;
      e.preventDefault();
      const p = getPos(e);
      const prev = currentStroke[currentStroke.length - 1];
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (dist >= 2.5) {
        currentStroke.push(p);
        totalInkLength += dist;
        redraw();
        if (onStrokeProgress) onStrokeProgress(strokes.length, totalInkLength);
      }
    };

    const endStroke = () => {
      if (currentStroke) {
        currentStroke = null;
        if (typeof hapticPattern === 'function') hapticPattern('tap');
        if (onStrokeProgress) onStrokeProgress(strokes.length, totalInkLength);
      }
    };
    cvs.onpointerup = endStroke;
    cvs.onpointercancel = endStroke;

    window._clearPopupTrace = () => {
      strokes = [];
      totalInkLength = 0;
      redraw();
      if (onStrokeProgress) onStrokeProgress(0, 0);
    };

    redraw();
    return {
      clear: window._clearPopupTrace,
      getStats: () => ({ strokeCount: strokes.length, inkLength: totalInkLength })
    };
  }

  // ===========================================================================
  // 2. ❄️ STREAK FREEZE AUTO-PROTECT & SACRED FIRE MODAL
  // ===========================================================================
  function patchStreakFreezeProtection() {
    if (typeof window.loadDailyMeta !== 'function') return;
    const origLoadMeta = window.loadDailyMeta;

    window.loadDailyMeta = function () {
      const today = typeof getTodayStr === 'function' ? getTodayStr() : new Date().toISOString().slice(0, 10);
      const yest = typeof getYesterdayStr === 'function' ? getYesterdayStr() : '';
      const raw = safeGetJSON('cyberlingo_daily_v4', null);

      // Intercept BEFORE origLoadMeta resets a missed streak!
      if (raw && raw.todayDate !== today && raw.lastActiveDate !== today && raw.lastActiveDate !== yest && (raw.streak || 1) > 1) {
        if (typeof useStreakFreeze === 'function' && useStreakFreeze()) {
          const preservedStreak = raw.streak;
          const savedMeta = {
            streak: preservedStreak,
            lastActiveDate: yest, // Bridges the gap so streak continues seamlessly!
            todayDate: today,
            wordsToday: 0,
            maxComboToday: 1,
            gamesPlayedToday: [],
            claimedQuests: {},
            freezeSavedOn: today
          };
          safeSetJSON('cyberlingo_daily_v4', savedMeta);
          setTimeout(() => {
            if (typeof showToast === 'function') {
              showToast(`❄️ Khiên Băng tự động kích hoạt — Bảo vệ chuỗi ${preservedStreak} ngày!`);
            }
          }, 500);
          return savedMeta;
        }
      }
      return origLoadMeta();
    };
  }

  function openStreakFireModal() {
    if (typeof sound !== 'undefined') sound.sfxTap();
    const meta = typeof loadDailyMeta === 'function' ? loadDailyMeta() : { streak: 1, wordsToday: 0 };
    const upg = typeof loadStreakUpgrade === 'function' ? loadStreakUpgrade() : { freezeTokens: 0, maxFreezeTokens: 3, longestStreak: 1 };
    const streak = meta.streak || 1;
    const longest = Math.max(streak, upg.longestStreak || 1);

    const existing = document.getElementById('v42-modal-streak');
    if (existing) existing.remove();

    const badges = [
      { d: 3, icon: '🌟', name: 'Ngôi Sao Mới' },
      { d: 7, icon: '🏆', name: 'Chiến Binh Tuần' },
      { d: 14, icon: '⚔️', name: 'Kiếm Sĩ Xưởng' },
      { d: 30, icon: '🐉', name: 'Rồng Vàng' },
      { d: 60, icon: '👑', name: 'Hoàng Đế' },
      { d: 100, icon: '🔮', name: 'Huyền Thoại' }
    ];

    const modal = document.createElement('div');
    modal.id = 'v42-modal-streak';
    modal.innerHTML = `
      <div class="radical-overlay" onclick="document.getElementById('v42-modal-streak')?.remove()"></div>
      <div class="radical-card" style="max-width:355px;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-size:16px;font-weight:900;color:#fde047;">🔥 Đền Lửa Thiêng Streak</div>
          <button class="hud-back" onclick="document.getElementById('v42-modal-streak')?.remove()">✖</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="v42-stat-tile">
            <div style="font-size:22px;font-weight:900;color:#fb923c;">🔥 ${streak} ngày</div>
            <div style="font-size:10.5px;color:#94a3b8;">Chuỗi hiện tại (Kỷ lục: ${longest})</div>
          </div>
          <div class="v42-stat-tile">
            <div style="font-size:22px;font-weight:900;color:#7dd3fc;">❄️ ${upg.freezeTokens}/${upg.maxFreezeTokens}</div>
            <div style="font-size:10.5px;color:#94a3b8;">Khiên Băng Bảo Hộ</div>
          </div>
        </div>
        <div style="font-size:11.5px;color:#cbd5e1;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);padding:8px 10px;border-radius:10px;margin-bottom:10px;">
          ❄️ <b>Cơ chế Bảo Hộ Tự Động:</b> Đạt <b>≥ 500 điểm</b> ở bất kỳ trò chơi nào để nhận thêm Khiên Băng (tối đa 3). Nếu lỡ bận nghỉ 1 ngày, Khiên Băng tự động bung ra giữ nguyên chuỗi lửa!
        </div>
        <div style="font-size:11.5px;font-weight:800;color:#fde68a;margin-bottom:6px;">🏅 Cột Mốc Huy Chương:</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">
          ${badges.map((b) => {
            const ok = longest >= b.d;
            return `<div style="text-align:center;padding:6px 4px;border-radius:10px;background:${ok ? 'rgba(16,185,129,0.16)' : 'rgba(30,41,59,0.6)'};border:1px solid ${ok ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'};opacity:${ok ? '1' : '0.5'};">
              <div style="font-size:18px;">${b.icon}</div>
              <div style="font-size:10px;font-weight:800;color:#f8fafc;">${b.d} ngày</div>
              <div style="font-size:9px;color:#94a3b8;">${b.name}</div>
            </div>`;
          }).join('')}
        </div>
        <button class="radical-close-btn" onclick="document.getElementById('v42-modal-streak')?.remove()">🔥 Tiếp Tục Giữ Lửa!</button>
      </div>
    `;
    (document.getElementById('app-shell') || document.body).appendChild(modal);
  }

  // ===========================================================================
  // 3. 🛡️ PHÁO ĐÀI TRÍ NHỚ (SRS HP SHIELD DECAY — EBBINGHAUS FORTRESS)
  // ===========================================================================
  function loadShieldState() {
    const today = typeof getTodayStr === 'function' ? getTodayStr() : new Date().toISOString().slice(0, 10);
    const st = safeGetJSON(V42_SHIELD_KEY, {
      lastRepairTs: Date.now(),
      bonusHealToday: 0,
      todayDate: today,
      fullBonusClaimedDate: ''
    });
    if (st.todayDate !== today) {
      st.todayDate = today;
      st.bonusHealToday = 0;
      safeSetJSON(V42_SHIELD_KEY, st);
    }
    return st;
  }

  function computeShieldHP() {
    const st = loadShieldState();
    const srs = typeof getSrsStats === 'function' ? getSrsStats() : { mistakes: [], mastered: [] };
    const hoursElapsed = Math.max(0, (Date.now() - (st.lastRepairTs || Date.now())) / 3600000);
    // Ebbinghaus decay: -2% per hour idle (max -38%) + -7% per unreviewed mistake (max -48%)
    const timeDecay = Math.min(38, Math.round(hoursElapsed * 2.0));
    const mistakeDrain = Math.min(48, (srs.mistakes ? srs.mistakes.length : 0) * 7);
    const rawHp = 100 - timeDecay - mistakeDrain + (st.bonusHealToday || 0);
    return {
      hp: Math.max(12, Math.min(100, rawHp)),
      mistakesCount: srs.mistakes ? srs.mistakes.length : 0,
      masteredCount: srs.mastered ? srs.mastered.length : 0
    };
  }

  function healShieldOnCorrectAnswer(wasMistakeWord) {
    const st = loadShieldState();
    const today = typeof getTodayStr === 'function' ? getTodayStr() : new Date().toISOString().slice(0, 10);
    st.lastRepairTs = Date.now();
    st.bonusHealToday = Math.min(65, (st.bonusHealToday || 0) + (wasMistakeWord ? 9 : 4));
    safeSetJSON(V42_SHIELD_KEY, st);

    const status = computeShieldHP();
    if (status.hp >= 100 && st.fullBonusClaimedDate !== today && (st.bonusHealToday >= 12)) {
      st.fullBonusClaimedDate = today;
      safeSetJSON(V42_SHIELD_KEY, st);
      if (typeof addArcadeXP === 'function') addArcadeXP(80);
      if (typeof showToast === 'function') {
        showToast('🛡️ Giáp Pháo Đài đầy 100%! Thưởng +80 EXP Bất Tử!');
      }
    }
    renderFortressAndHubUI();
  }

  function triggerQuickShieldRepair() {
    if (typeof sound !== 'undefined') sound.sfxTap();
    const srs = typeof getSrsStats === 'function' ? getSrsStats() : { mistakes: [] };
    if (srs.mistakes && srs.mistakes.length > 0) {
      if (typeof setSourceMode === 'function') setSourceMode('srs');
      if (typeof showToast === 'function') {
        showToast(`🛡️ Đã nạp ${srs.mistakes.length} từ cần sửa giáp — Vào Võ Đài Bộ Thủ ngay!`);
      }
      launchGame('dojo');
    } else {
      if (typeof showToast === 'function') {
        showToast('🛡️ Pháo Đài vững chắc! Đang mở Võ Đài Bộ Thủ để rèn thêm EXP!');
      }
      launchGame('dojo');
    }
  }

  // ===========================================================================
  // 4. 🏆 GIẢI ĐẤU TUẦN — MINI LEAGUE 30 KỸ SƯ (5 TIERS)
  // ===========================================================================
  function getISOWeekKey() {
    const d = new Date();
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  function loadPlayerProfile() {
    return safeGetJSON(V42_PLAYER_KEY, { name: '👑 Chiến Binh DEAN' });
  }

  function loadLeagueData() {
    const wk = getISOWeekKey();
    const curTotalXp = parseInt(safeGetStr('arcade_total_xp', '0'), 10) || 0;
    let lg = safeGetJSON(V42_LEAGUE_KEY, null);
    if (!lg || lg.weekKey !== wk) {
      const prevTier = lg ? (lg.tier || 1) : 1;
      lg = {
        weekKey: wk,
        tier: prevTier, // 1=Đồng, 2=Bạc, 3=Vàng, 4=Bạch Kim, 5=Kim Cương
        weekStartXp: Math.max(0, curTotalXp - 60),
        weeklyXp: Math.min(curTotalXp, 60)
      };
      safeSetJSON(V42_LEAGUE_KEY, lg);
    } else {
      lg.weeklyXp = Math.max(lg.weeklyXp || 0, curTotalXp - (lg.weekStartXp || 0));
      safeSetJSON(V42_LEAGUE_KEY, lg);
    }
    return lg;
  }

  function buildLeagueStandings() {
    const lg = loadLeagueData();
    const profile = loadPlayerProfile();
    const rivalNames = [
      'Kỹ sư Minh QC', 'Tổ trưởng Hùng Ép Nhựa', 'Chị Lan KCS', 'Anh Tuấn Khuôn Mẫu',
      'Tiểu Vương (Thâm Quyến)', 'Đức Tự Động Hóa', 'Hải PLC Siemens', 'Trang Phiên Dịch',
      'Nam Bảo Trì Khuôn', 'Linh Kho Vật Tư', 'Phúc Sơn Phủ UV', 'Vy Kế Hoạch ĐH',
      'Khánh Lắp Ráp Chuyền 2', 'Bình Thử Nghiệm Va Đập', 'Thảo ISO 9001', 'Quân Điện Tử EEA',
      'Dũng Robot AGV', 'Hương Thu Mua TQ', 'Tâm Giám Sát Ca', 'Sơn Vận Hành Máy',
      'Ngọc Kiểm Ngoại Quan', 'Đạt Kho Thành Phẩm', 'Yến Nhân Sự Xưởng', 'Long Kỹ Thuật Viên',
      'Hà Thống Kê Sản Lượng', 'Việt Đóng Gói Xuất Khẩu', 'Mai Trợ Lý Xưởng', 'Cường Cắt Laser',
      'Trinh Kiểm Lô Đầu'
    ];

    // Day progress factor through the week (Monday=1 .. Sunday=7) so scores grow realistically
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const progressFactor = (dayOfWeek - 1 + now.getHours() / 24) / 7; // 0.0 -> 1.0
    const tierScale = 0.8 + (lg.tier || 1) * 0.25;

    const list = rivalNames.map((rName, idx) => {
      // Deterministic hash per week + rival index
      const seed = ((idx + 1) * 73 + lg.weekKey.charCodeAt(6) * 19) % 100;
      const maxWeeklyTarget = (140 + (idx % 10) * 55 + seed * 3.2) * tierScale;
      const curXp = Math.round(maxWeeklyTarget * Math.max(0.18, progressFactor));
      return { name: rName, xp: curXp, isMe: false };
    });

    list.push({ name: profile.name, xp: lg.weeklyXp || 0, isMe: true });
    list.sort((a, b) => b.xp - a.xp);
    list.forEach((item, i) => { item.rank = i + 1; });
    return { lg, list, myEntry: list.find((x) => x.isMe) };
  }

  function openLeagueModal() {
    if (typeof sound !== 'undefined') sound.sfxTap();
    const { lg, list, myEntry } = buildLeagueStandings();
    const tiers = [
      { id: 1, icon: '🥉', name: 'Bảng Đồng Tân Binh', color: '#fdba74' },
      { id: 2, icon: '🥈', name: 'Bảng Bạc Kỹ Sư', color: '#e2e8f0' },
      { id: 3, icon: '🥇', name: 'Bảng Vàng Tổ Trưởng', color: '#fde047' },
      { id: 4, icon: '💠', name: 'Bảng Bạch Kim Chuyên Gia', color: '#38bdf8' },
      { id: 5, icon: '💎', name: 'Bảng Kim Cương Xưởng Trưởng', color: '#c084fc' }
    ];
    const tInfo = tiers[(lg.tier || 1) - 1] || tiers[0];

    const existing = document.getElementById('v42-modal-league');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'v42-modal-league';
    modal.innerHTML = `
      <div class="radical-overlay" onclick="document.getElementById('v42-modal-league')?.remove()"></div>
      <div class="radical-card" style="max-width:366px;padding:15px;text-align:left;max-height:84dvh;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:15.5px;font-weight:900;color:${tInfo.color};">${tInfo.icon} ${tInfo.name}</div>
            <div style="font-size:10.5px;color:#94a3b8;">Tuần ${lg.weekKey} • Top 5 🔼 Thăng Hạng Thứ Hai</div>
          </div>
          <button class="hud-back" onclick="document.getElementById('v42-modal-league')?.remove()">✖</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;padding:7px 10px;border-radius:11px;background:rgba(250,204,21,0.12);border:1px solid rgba(250,204,21,0.4);">
          <div style="font-size:12px;font-weight:800;color:#fef08a;">
            Hạng của bạn: <b>#${myEntry.rank}/30</b> (${myEntry.xp} EXP tuần)
          </div>
          <button class="v42-mini-action" onclick="window._renameLeaguePlayer()">✏️ Đổi tên</button>
        </div>

        <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding-right:2px;max-height:46dvh;">
          ${list.map((row) => {
            const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`;
            const promo = row.rank <= 5 ? '<span style="font-size:9px;color:#34d399;font-weight:800;">🔼 LÊN HẠNG</span>' : '';
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 9px;border-radius:9px;background:${row.isMe ? 'linear-gradient(90deg,rgba(2,132,199,0.35),rgba(16,185,129,0.28))' : 'rgba(15,23,42,0.75)'};border:1px solid ${row.isMe ? '#38bdf8' : 'rgba(255,255,255,0.06)'};">
              <div style="display:flex;align-items:center;gap:7px;font-size:12px;">
                <span style="min-width:26px;font-weight:900;color:${row.rank <= 3 ? '#fde047' : '#94a3b8'};">${medal}</span>
                <span style="font-weight:${row.isMe ? '900' : '700'};color:${row.isMe ? '#fff' : '#cbd5e1'};">${row.name}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${promo}
                <span style="font-size:11.5px;font-weight:900;color:#7dd3fc;">${row.xp} EXP</span>
              </div>
            </div>`;
          }).join('')}
        </div>

        <div style="margin-top:10px;display:flex;gap:8px;">
          <button class="btn-secondary" style="padding:9px;font-size:12px;" onclick="window.shareArcadeChallenge()">⚔️ Gửi Kèo Thách Đấu</button>
          <button class="btn-primary" style="padding:9px;font-size:12px;" onclick="document.getElementById('v42-modal-league')?.remove();launchGame('dojo');">🥋 Cày EXP Ngay</button>
        </div>
      </div>
    `;
    (document.getElementById('app-shell') || document.body).appendChild(modal);
  }

  window._renameLeaguePlayer = function () {
    const cur = loadPlayerProfile().name;
    const next = window.prompt('Nhập Biệt Danh Chiến Đấu trên Bảng Xếp Hạng:', cur);
    if (next && next.trim()) {
      safeSetJSON(V42_PLAYER_KEY, { name: next.trim().slice(0, 22) });
      openLeagueModal();
    }
  };

  // ===========================================================================
  // 5. ⚔️ THÁCH ĐẤU BẠN BÈ & FRIEND STREAK QUA LINK (?c=...)
  // ===========================================================================
  function encodeChallengePayload(obj) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch (e) {
      return '';
    }
  }

  function decodeChallengePayload(b64) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
      return null;
    }
  }

  function shareArcadeChallenge(specificGame = null, specificScore = null) {
    if (typeof sound !== 'undefined') sound.sfxTap();
    const profile = loadPlayerProfile();
    const meta = typeof loadDailyMeta === 'function' ? loadDailyMeta() : { streak: 1 };

    // Pick either current game score or best high-score across all 11 games
    let gId = specificGame || (typeof activeGame !== 'undefined' && activeGame) || 'miner';
    let targetScore = specificScore;
    if (targetScore === null || targetScore === undefined) {
      if (typeof activeGame !== 'undefined' && activeGame && typeof score === 'number' && score > 0) {
        gId = activeGame;
        targetScore = score;
      } else {
        let bestS = 180;
        (typeof ALL_GAME_IDS !== 'undefined' ? ALL_GAME_IDS : ['miner']).forEach((id) => {
          const s = parseInt(safeGetStr('arcade_best_' + id, '0'), 10) || 0;
          if (s >= bestS) {
            bestS = s;
            gId = id;
          }
        });
        targetScore = bestS;
      }
    }

    const payload = {
      n: profile.name,
      g: gId,
      s: Math.max(50, targetScore),
      st: meta.streak || 1
    };
    const code = encodeChallengePayload(payload);
    const baseUrl = 'https://truongduc164.github.io/cyberlingo-arcade/';
    const shareUrl = `${baseUrl}?c=${encodeURIComponent(code)}`;
    const gTitle = GAME_NAMES_VI[gId] || gId;
    const shareText = `⚔️ [THÁCH ĐẤU CYBERLINGO ARCADE]\n${profile.name} (🔥 Streak ${payload.st} ngày) thách bạn phá mốc ${payload.s} điểm ở trò "${gTitle}"!\n👉 Bấm nhận kèo ngay: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: '⚔️ Thách Đấu CyberLingo Arcade PRO',
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        if (typeof showToast === 'function') showToast('📋 Đã copy Thiệp Thách Đấu! Dán gửi Telegram/Zalo ngay!');
      }).catch(() => {});
    } else {
      window.prompt('Copy link Thách Đấu gửi bạn bè qua Telegram/Zalo:', shareUrl);
    }
  }

  function checkIncomingChallengeLink() {
    try {
      const params = new URLSearchParams(window.location.search);
      const cParam = params.get('c');
      if (!cParam) return;
      const data = decodeChallengePayload(cParam);
      if (!data || !data.g) return;

      const gTitle = GAME_NAMES_VI[data.g] || data.g;
      const modal = document.createElement('div');
      modal.id = 'v42-modal-challenge';
      modal.innerHTML = `
        <div class="radical-overlay"></div>
        <div class="radical-card" style="border-color:#f59e0b;box-shadow:0 0 35px rgba(245,158,11,0.45);">
          <div style="font-size:38px;">⚔️</div>
          <div style="font-size:17px;font-weight:900;color:#fde047;margin:4px 0;">THIỆP THÁCH ĐẤU ĐỐI KHÁNG!</div>
          <div style="font-size:13px;color:#e2e8f0;margin-bottom:10px;">
            <b>${data.n || 'Một Cao Thủ'}</b> (🔥 Streak ${data.st || 1} ngày) thách bạn vượt qua kỷ lục:
          </div>
          <div style="padding:10px;border-radius:12px;background:rgba(245,158,11,0.14);border:1.5px solid rgba(245,158,11,0.5);margin-bottom:12px;">
            <div style="font-size:14px;font-weight:900;color:#7dd3fc;">${gTitle}</div>
            <div style="font-size:24px;font-weight:900;color:#fde047;margin-top:2px;">🏆 Mục tiêu: ${data.s} điểm</div>
            <div style="font-size:10.5px;color:#a7f3d0;">Phá kỷ lục thưởng nóng +150 EXP Giải Đấu!</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-secondary" onclick="document.getElementById('v42-modal-challenge')?.remove()">Để sau</button>
            <button class="btn-primary" style="background:linear-gradient(135deg,#d97706,#e11d48);" onclick="window._acceptIncomingChallenge('${data.g}', ${Number(data.s) || 100}, '${String(data.n || 'Đối thủ').replace(/'/g, '')}')">🔥 NHẬN KÈO NGAY!</button>
          </div>
        </div>
      `;
      (document.getElementById('app-shell') || document.body).appendChild(modal);
    } catch (e) {}
  }

  window._acceptIncomingChallenge = function (gameId, targetPts, challengerName) {
    document.getElementById('v42-modal-challenge')?.remove();
    window._activeFriendChallenge = { gameId, targetPts, challengerName, beaten: false };
    launchGame(gameId);
  };

  // ===========================================================================
  // 6. 🥋 MINI-GAME #11: VÕ ĐÀI BỘ THỦ & NÉT CHỮ (HANZI DOJO)
  // ===========================================================================
  const DOJO_DISTRACTOR_PARTS = ['氵', '扌', '口', '亻', '木', '钅', '讠', '纟', '火', '土', '女', '日', '月', '目', '宀', '艹', '心', '门', '贝', '力', '刀', '田'];
  let dojoState = null;

  function buildDojoPool() {
    const db = getCombinedRadicalDB();
    const pools = typeof getActivePools === 'function' ? getActivePools() : { vocab: [] };
    const candidates = [];

    for (const v of (pools.vocab || [])) {
      if (!v || !v.zh) continue;
      const chars = Array.from(v.zh).filter((c) => /[\u4e00-\u9fff]/.test(c));
      if (chars.length === 0) continue;
      // Find a character in this word that has >= 2 radical parts, OR use multi-character assembly!
      const richChar = chars.find((c) => db[c] && db[c].parts && db[c].parts.length >= 2);
      if (richChar) {
        candidates.push({
          vocab: v,
          targetChar: richChar,
          parts: db[richChar].parts,
          meanings: db[richChar].meanings,
          mnemonic: db[richChar].mnemonic,
          mode: 'radical'
        });
      } else if (chars.length >= 2 && chars.length <= 4) {
        candidates.push({
          vocab: v,
          targetChar: chars[0],
          parts: chars,
          meanings: chars.map((c) => (db[c] && db[c].meanings ? db[c].meanings[0] : 'Hán tự')),
          mnemonic: `Ghép đủ ${chars.length} chữ thành cụm "${v.zh}" (${v.vi})`,
          mode: 'word'
        });
      }
    }
    return candidates;
  }

  function initDojoGame() {
    lives = 3;
    stageNum = 1;
    startDojoRound();
  }

  function startDojoRound() {
    const candidates = buildDojoPool();
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];

    // Build 6 orb choices = required parts + distractors
    const orbs = pick.parts.map((p, idx) => ({ part: p, reqIdx: idx, used: false }));
    const shuffledDist = typeof shuffleArr === 'function' ? shuffleArr(DOJO_DISTRACTOR_PARTS) : DOJO_DISTRACTOR_PARTS;
    for (const d of shuffledDist) {
      if (orbs.length >= Math.max(6, pick.parts.length + 3)) break;
      if (!pick.parts.includes(d)) {
        orbs.push({ part: d, reqIdx: -1, used: false });
      }
    }
    const displayOrbs = typeof shuffleArr === 'function' ? shuffleArr(orbs) : orbs;

    const speed = typeof getSpeedFactor === 'function' ? getSpeedFactor() : 1.0;
    const totalSec = Math.max(18, Math.round(32 / speed));

    dojoState = {
      item: pick,
      stepIdx: 0,
      orbs: displayOrbs,
      phase: 'fusion', // 'fusion' | 'trace'
      timeLeft: totalSec,
      totalSec,
      timerId: null,
      padCtrl: null,
      traceBonusClaimed: false
    };

    if (typeof currentPromptAudio !== 'undefined') {
      currentPromptAudio.zh = pick.vocab.zh;
      currentPromptAudio.audio = pick.vocab.audio || '';
    }
    if (typeof sound !== 'undefined') {
      sound.speakChinese(pick.vocab.zh, pick.vocab.audio);
    }

    const pyTxt = (typeof showPinyin === 'undefined' || showPinyin) ? ` <span style="color:#fde68a">(${pick.vocab.pinyin || ''})</span>` : '';
    const promptTitle = pick.mode === 'radical'
      ? `Nghĩa: <b style="color:#34d399">${pick.vocab.vi}</b>${pyTxt} — Ghép bộ thủ chữ <b style="color:#38bdf8">[ ${pick.vocab.zh.replace(pick.targetChar, '？')} ]</b>`
      : `Nghĩa: <b style="color:#34d399">${pick.vocab.vi}</b>${pyTxt} — Ghép thứ tự cụm chữ Hán!`;

    setMissionBanner(
      '🥋 VÕ ĐÀI BỘ THỦ & KHẮC ẤN CHỮ HÁN',
      promptTitle,
      '💡 Pha 1: Chạm đúng thứ tự Ngọc Bộ Thủ • Pha 2: Quẹt bút luyện chữ nhận x2 thưởng!',
      true
    );
    updateHUD();
    renderDojoArena();

    clearInterval(dojoState.timerId);
    dojoState.timerId = setInterval(() => {
      if (window.isGamePaused || !dojoState || activeGame !== 'dojo') return;
      dojoState.timeLeft -= 0.25;
      const pct = Math.max(0, (dojoState.timeLeft / dojoState.totalSec) * 100);
      const bar = document.getElementById('mission-timer-fill');
      if (bar) bar.style.width = pct + '%';
      if (dojoState.timeLeft <= 0) {
        clearInterval(dojoState.timerId);
        if (dojoState.phase === 'trace') {
          // Time expired during optional bonus trace -> still advance safely!
          nextDojoStage();
        } else {
          sound.sfxWrong();
          lives--;
          updateHUD();
          if (lives <= 0) triggerGameOver('🥋 HẾT GIỜ LUYỆN CÔNG!');
          else startDojoRound();
        }
      }
    }, 250);

    cleanupFns.push(() => {
      if (dojoState && dojoState.timerId) clearInterval(dojoState.timerId);
    });
  }

  function renderDojoArena() {
    const box = document.getElementById('dojo-stage-content');
    if (!box || !dojoState) return;
    const { item, stepIdx, orbs, phase } = dojoState;

    if (phase === 'fusion') {
      const slotsHtml = item.parts.map((p, i) => {
        const filled = i < stepIdx;
        const current = i === stepIdx;
        return `
          <div class="v42-dojo-slot ${filled ? 'filled' : ''} ${current ? 'current' : ''}">
            ${filled ? p : '？'}
          </div>
          ${i < item.parts.length - 1 ? '<span style="font-weight:900;color:#64748b;font-size:18px;">+</span>' : ''}
        `;
      }).join('');

      box.innerHTML = `
        <div class="v42-dojo-card">
          <div style="font-size:11.5px;color:#7dd3fc;font-weight:800;margin-bottom:4px;">
            ${item.mode === 'radical' ? '⚡ HỢP CHƯỞNG BỘ THỦ:' : '⚡ LẮP RÁP TỪ GHÉP:'}
          </div>
          <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:8px;">
            "${item.vocab.vi}" ${item.vocab.en ? `<span style="font-size:11.5px;color:#94a3b8;">(${item.vocab.en})</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            ${slotsHtml}
            <span style="font-weight:900;color:#fde047;font-size:18px;">=</span>
            <div class="v42-dojo-target-preview">？</div>
          </div>
          <div style="font-size:11px;color:#fde68a;min-height:16px;">
            Gợi ý mảnh #${stepIdx + 1}: <b>${item.meanings[stepIdx] || 'Chọn mảnh đúng'}</b>
          </div>
        </div>

        <div class="v42-dojo-orbs-grid">
          ${orbs.map((o, idx) => `
            <button class="v42-dojo-orb ${o.used ? 'used' : ''}" ${o.used ? 'disabled' : ''} onclick="window._tapDojoOrb(${idx}, this)">
              <span style="font-size:26px;font-weight:900;">${o.part}</span>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      // Phase 2: Calligraphy Trace Bonus!
      box.innerHTML = `
        <div class="v42-dojo-card" style="padding:10px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:900;color:#34d399;">✅ HỢP THỂ THÀNH CÔNG: ${item.vocab.zh} (${item.vocab.pinyin})</span>
            <button class="v42-mini-action" onclick="replayCurrentPromptVoice()">🔊 Nghe</button>
          </div>
          <div style="font-size:11.5px;color:#fde68a;margin-bottom:6px;">💡 ${item.mnemonic}</div>
          <div style="display:flex;flex-direction:column;align-items:center;">
            <canvas id="v42-dojo-trace-cvs" width="196" height="196" style="border-radius:14px;border:2px solid #38bdf8;background:#071022;touch-action:none;box-shadow:0 0 18px rgba(56,189,248,0.28);"></canvas>
            <div id="v42-dojo-ink-hint" style="font-size:11px;color:#7dd3fc;margin-top:5px;font-weight:800;">
              ✍️ Quẹt ngón tay tô nét chữ "${item.targetChar}" để nhận +60 Điểm Chí Mạng!
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn-secondary" style="padding:8px;font-size:12px;" onclick="window._skipDojoTrace()">⏩ Qua Nhanh</button>
            <button class="btn-primary" id="v42-dojo-claim-btn" style="padding:8px;font-size:12.5px;background:linear-gradient(135deg,#059669,#0284c7);" onclick="window._claimDojoTraceBonus()">✨ Khắc Ấn (+60đ)</button>
          </div>
        </div>
      `;
      const cvs = document.getElementById('v42-dojo-trace-cvs');
      dojoState.padCtrl = setupCalligraphyPad(cvs, item.targetChar, 192, (strokeCnt, inkLen) => {
        const hintEl = document.getElementById('v42-dojo-ink-hint');
        if (hintEl && inkLen > 45) {
          hintEl.innerHTML = `<span style="color:#fde047;">🔥 Nét bút tuyệt đẹp (${strokeCnt} nét)! Bấm "Khắc Ấn (+60đ)" ngay!</span>`;
        }
      });
    }
  }

  window._tapDojoOrb = function (orbIdx, btnEl) {
    if (!dojoState || dojoState.phase !== 'fusion' || window.isGamePaused) return;
    const orb = dojoState.orbs[orbIdx];
    if (!orb || orb.used) return;

    const expectedPart = dojoState.item.parts[dojoState.stepIdx];
    if (orb.part === expectedPart) {
      orb.used = true;
      dojoState.stepIdx++;
      if (typeof spawnParticleBurst === 'function' && btnEl) spawnParticleBurst(btnEl, 7);

      if (dojoState.stepIdx >= dojoState.item.parts.length) {
        // Completed radical fusion!
        if (typeof streakHit === 'function') streakHit(true);
        else combo = Math.min(10, combo + 1);

        const mult = typeof getScoreMultiplier === 'function' ? getScoreMultiplier() : 1.0;
        const pts = Math.round((45 + combo * 12) * mult);
        score += pts;
        if (typeof addArcadeXP === 'function') addArcadeXP(12);
        if (typeof incrementDailyProgress === 'function') incrementDailyProgress('combo', combo);
        if (typeof recordLearnedWord === 'function') recordLearnedWord(dojoState.item.vocab);
        if (typeof recordSrsOutcome === 'function') recordSrsOutcome(dojoState.item.vocab, true);
        if (typeof sound !== 'undefined') {
          sound.sfxCombo(combo);
          sound.speakChinese(dojoState.item.vocab.zh, dojoState.item.vocab.audio);
        }
        if (typeof spawnComboBanner === 'function') spawnComboBanner(combo, pts);

        dojoState.phase = 'trace';
        dojoState.timeLeft = Math.max(dojoState.timeLeft, 12); // Give comfortable time for calligraphy bonus
        updateHUD();
        renderDojoArena();
      } else {
        if (typeof sound !== 'undefined') sound.sfxTap();
        renderDojoArena();
      }
    } else {
      // Wrong radical orb!
      if (typeof streakMiss === 'function') streakMiss();
      else combo = 1;
      lives--;
      if (typeof sound !== 'undefined') sound.sfxWrong();
      if (typeof triggerScreenShake === 'function') triggerScreenShake();
      if (typeof recordSrsOutcome === 'function') recordSrsOutcome(dojoState.item.vocab, false);
      updateHUD();
      if (lives <= 0) {
        clearInterval(dojoState.timerId);
        triggerGameOver('💥 TẨU HỎA NHẬP MA — SAI BỘ THỦ!');
      }
    }
  };

  window._claimDojoTraceBonus = function () {
    if (!dojoState || dojoState.phase !== 'trace' || dojoState.traceBonusClaimed) return;
    const stats = dojoState.padCtrl ? dojoState.padCtrl.getStats() : { inkLength: 0 };
    if (stats.inkLength < 35) {
      if (typeof showToast === 'function') showToast('✍️ Hãy quẹt ngón tay viết ít nhất 1-2 nét chữ trên ô kẻ trước nhé!');
      return;
    }
    dojoState.traceBonusClaimed = true;
    score += 60;
    if (typeof addArcadeXP === 'function') addArcadeXP(10);
    if (typeof sound !== 'undefined') sound.sfxFanfare();
    if (typeof spawnComboBanner === 'function') spawnComboBanner(Math.max(3, combo), 60);
    updateHUD();
    nextDojoStage();
  };

  window._skipDojoTrace = function () {
    if (!dojoState) return;
    if (typeof sound !== 'undefined') sound.sfxTap();
    nextDojoStage();
  };

  function nextDojoStage() {
    if (dojoState && dojoState.timerId) clearInterval(dojoState.timerId);
    stageNum++;
    startDojoRound();
  }

  // ===========================================================================
  // 7. 🤖 ADAPTIVE AI PACE, VISIBILITY LIFECYCLE & CORE HOOKS
  // ===========================================================================
  function hookCoreFunctionsV42() {
    // 7.1 Register 'dojo' in ALL_GAME_IDS
    if (typeof ALL_GAME_IDS !== 'undefined' && Array.isArray(ALL_GAME_IDS) && !ALL_GAME_IDS.includes('dojo')) {
      ALL_GAME_IDS.push('dojo');
    }

    // 7.2 Hook cycleGamePace + getSpeedFactor + getScoreMultiplier to add 4th 'ai' mode
    if (typeof window.cycleGamePace === 'function') {
      window.cycleGamePace = function () {
        const order = ['chill', 'normal', 'pro', 'ai'];
        gamePace = order[(order.indexOf(gamePace) + 1) % order.length];
        const ad = typeof getAdaptiveSettings === 'function' ? getAdaptiveSettings() : { speed: 1.0 };
        const labels = {
          chill: '🌱 Nhịp: Thư Giãn',
          normal: '⚡ Nhịp: Chuẩn',
          pro: '🔥 Nhịp: Cao Thủ',
          ai: `🤖 AI Cân (${ad.speed.toFixed(2)}x)`
        };
        const chip = document.getElementById('chip-pace');
        if (chip) chip.textContent = labels[gamePace] || labels.normal;
        if (typeof sound !== 'undefined') sound.sfxTap();
      };
    }

    if (typeof window.getSpeedFactor === 'function') {
      const origSpeed = window.getSpeedFactor;
      window.getSpeedFactor = function () {
        if (typeof gamePace !== 'undefined' && gamePace === 'ai' && typeof getAdaptiveSettings === 'function') {
          const s = getAdaptiveSettings().speed || 1.0;
          return Math.max(0.72, Math.min(1.38, s));
        }
        return origSpeed();
      };
    }

    if (typeof window.getScoreMultiplier === 'function') {
      const origMult = window.getScoreMultiplier;
      window.getScoreMultiplier = function () {
        if (typeof gamePace !== 'undefined' && gamePace === 'ai' && typeof getAdaptiveSettings === 'function') {
          return getAdaptiveSettings().speed >= 1.12 ? 1.35 : 1.15;
        }
        return origMult();
      };
    }

    // 7.3 Hook launchGame to support 'dojo'
    if (typeof window.launchGame === 'function') {
      const origLaunch = window.launchGame;
      window.launchGame = function (mode) {
        origLaunch(mode);
        if (mode === 'dojo') {
          initDojoGame();
        }
      };
    }

    // 7.4 Hook recordSrsOutcome to heal Memory Fortress Shield!
    if (typeof window.recordSrsOutcome === 'function') {
      const origRecordSrs = window.recordSrsOutcome;
      window.recordSrsOutcome = function (vocabItem, isCorrect) {
        const mapBefore = typeof loadSrsMap === 'function' ? loadSrsMap() : {};
        const wasMistake = !!(vocabItem && vocabItem.zh && mapBefore[vocabItem.zh] && mapBefore[vocabItem.zh].box === 0);
        origRecordSrs(vocabItem, isCorrect);
        if (isCorrect) {
          healShieldOnCorrectAnswer(wasMistake);
        } else {
          renderFortressAndHubUI();
        }
        if (typeof gamePace !== 'undefined' && gamePace === 'ai') {
          const chip = document.getElementById('chip-pace');
          const ad = typeof getAdaptiveSettings === 'function' ? getAdaptiveSettings() : { speed: 1.0 };
          if (chip) chip.textContent = `🤖 AI Cân (${ad.speed.toFixed(2)}x)`;
        }
      };
    }

    // 7.5 Hook addArcadeXP to refresh Weekly Mini League live!
    if (typeof window.addArcadeXP === 'function') {
      const origAddXP = window.addArcadeXP;
      window.addArcadeXP = function (amount) {
        origAddXP(amount);
        loadLeagueData();
        renderFortressAndHubUI();
      };
    }

    // 7.6 Hook triggerGameOver to check Friend Challenge Victory + show Share Challenge button
    if (typeof window.triggerGameOver === 'function') {
      const origGameOver = window.triggerGameOver;
      window.triggerGameOver = function (titleText) {
        origGameOver(titleText);
        if (window._activeFriendChallenge && !window._activeFriendChallenge.beaten) {
          const ch = window._activeFriendChallenge;
          if (activeGame === ch.gameId && score > ch.targetPts) {
            ch.beaten = true;
            if (typeof addArcadeXP === 'function') addArcadeXP(150);
            const titleEl = document.getElementById('res-title');
            if (titleEl) titleEl.textContent = `👑 PHÁ KỶ LỤC CỦA ${ch.challengerName.toUpperCase()}!`;
            if (typeof showToast === 'function') {
              showToast(`🎉 Chiến thắng kèo thách đấu (> ${ch.targetPts}đ)! Thưởng +150 EXP!`);
            }
            if (typeof sound !== 'undefined') sound.sfxFanfare();
          }
        }
        renderFortressAndHubUI();
      };
    }

    // 7.7 Enhance Notebook Flashcards with "🧩 Bộ Thủ" button
    if (typeof window.renderNotebookList === 'function') {
      const origRenderNb = window.renderNotebookList;
      window.renderNotebookList = function () {
        origRenderNb();
        const container = document.getElementById('notebook-list-body');
        if (!container) return;
        container.querySelectorAll('.nb-flashcard').forEach((card) => {
          if (card._v42Enhanced) return;
          card._v42Enhanced = true;
          const zhSpan = card.querySelector('div > div');
          if (!zhSpan) return;
          const rawText = zhSpan.childNodes[0] ? zhSpan.childNodes[0].textContent.trim() : '';
          if (!rawText) return;
          const spkBtn = card.querySelector('.nb-speak-btn');
          if (spkBtn) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;gap:5px;align-items:center;';
            const radBtn = document.createElement('button');
            radBtn.className = 'nb-speak-btn';
            radBtn.style.cssText = 'background:rgba(168,85,247,0.18);border-color:rgba(168,85,247,0.5);color:#e9d5ff;';
            radBtn.textContent = '🧩 Bộ Thủ';
            radBtn.onclick = (e) => {
              e.stopPropagation();
              showRadicalBreakdownV42(rawText, 0);
            };
            spkBtn.parentNode.insertBefore(wrap, spkBtn);
            wrap.appendChild(radBtn);
            wrap.appendChild(spkBtn);
          }
        });
      };
    }

    // 7.8 Mobile / Poki / CrazyGames Visibility Lifecycle Guard
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (typeof sound !== 'undefined') sound.stopBgm();
        if (typeof activeGame !== 'undefined' && activeGame && !window.isGamePaused && typeof togglePauseGame === 'function') {
          togglePauseGame();
        }
      }
    });
  }

  // ===========================================================================
  // 8. 🎨 UI INJECTION (LOBBY FORTRESS SHIELD + GAME #11 CARD + RESULT SHARE)
  // ===========================================================================
  function injectV42StylesAndDOM() {
    if (!document.getElementById('v42-upgrade-css')) {
      const st = document.createElement('style');
      st.id = 'v42-upgrade-css';
      st.textContent = `
        .v42-fortress-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(17, 24, 39, 0.96));
          border: 1px solid rgba(56, 189, 248, 0.32);
          border-radius: 15px;
          padding: 9px 11px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .v42-shield-track {
          width: 100%;
          height: 8px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.09);
          overflow: hidden;
        }
        .v42-shield-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.35s ease, background 0.35s ease;
        }
        .v42-hub-btns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .v42-hub-btn {
          padding: 6px 6px;
          border-radius: 10px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(30, 41, 59, 0.85);
          color: #f8fafc;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          text-align: center;
        }
        .v42-hub-btn.repair-alert {
          background: linear-gradient(135deg, rgba(225, 29, 72, 0.28), rgba(217, 119, 6, 0.28));
          border-color: #fbbf24;
          color: #fef08a;
        }
        .v42-mini-action {
          padding: 4px 9px;
          border-radius: 8px;
          border: 1px solid rgba(56, 189, 248, 0.45);
          background: rgba(2, 132, 199, 0.25);
          color: #e0f2fe;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .v42-rad-wordbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          padding: 7px 10px;
          border-radius: 11px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(56, 189, 248, 0.25);
          margin-bottom: 9px;
        }
        .v42-rad-tabs {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .v42-rad-tab {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.8);
          color: #cbd5e1;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
        }
        .v42-rad-tab.active {
          border-color: #38bdf8;
          background: rgba(2, 132, 199, 0.35);
          color: #fff;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.45);
        }
        .v42-stat-tile {
          padding: 9px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        .game-card.c-dojo {
          grid-column: span 2;
          background: linear-gradient(135deg, rgba(88, 28, 135, 0.42), rgba(15, 23, 42, 0.94));
          border-color: rgba(192, 132, 252, 0.55);
        }
        #view-dojo {
          width: 100%;
          height: 100%;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
        }
        .v42-dojo-card {
          background: rgba(15, 23, 42, 0.92);
          border: 1.5px solid rgba(168, 85, 247, 0.45);
          border-radius: 16px;
          padding: 12px;
          text-align: center;
          margin-bottom: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        }
        .v42-dojo-slot {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          border: 2px dashed rgba(148, 163, 184, 0.45);
          background: rgba(30, 41, 59, 0.65);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: #64748b;
        }
        .v42-dojo-slot.current {
          border-color: #fde047;
          color: #fde047;
          box-shadow: 0 0 12px rgba(250, 204, 21, 0.35);
        }
        .v42-dojo-slot.filled {
          border-style: solid;
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.22);
          color: #ecfdf5;
        }
        .v42-dojo-target-preview {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          border: 2px solid rgba(56, 189, 248, 0.5);
          background: rgba(2, 132, 199, 0.2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          color: #38bdf8;
        }
        .v42-dojo-orbs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }
        .v42-dojo-orb {
          height: 62px;
          border-radius: 15px;
          border: 1.5px solid rgba(56, 189, 248, 0.48);
          background: radial-gradient(circle at 30% 25%, rgba(56, 189, 248, 0.28), rgba(15, 23, 42, 0.95));
          color: #f8fafc;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.4);
        }
        .v42-dojo-orb.used {
          opacity: 0.25;
          transform: scale(0.92);
          pointer-events: none;
        }
      `;
      document.head.appendChild(st);
    }

    // 8.1 Update Header Pill & Title to v4.2 TOP 11
    const pill = document.querySelector('.brand-pill');
    if (pill) pill.textContent = '🏆 DEAN OPTIMIZE • AAA RETINA + HANZI DOJO v4.2';
    const title = document.querySelector('.lobby-title');
    if (title) title.textContent = 'TOP 11 GAME KINH ĐIỂN';
    const fltAll = document.getElementById('flt-all');
    if (fltAll) fltAll.textContent = '🏆 Top 11 Đầy Đủ';

    // Make Streak pill open Sacred Fire modal on tap
    const streakPill = document.querySelector('.streak-pill');
    if (streakPill) {
      streakPill.style.cursor = 'pointer';
      streakPill.title = 'Xem Đền Lửa Thiêng & Khiên Băng';
      streakPill.onclick = openStreakFireModal;
    }

    // 8.2 Inject Memory Fortress Shield & Social League Hub card right after .rank-bar-card
    const rankCard = document.querySelector('.rank-bar-card');
    if (rankCard && !document.getElementById('v42-fortress-hub')) {
      const hub = document.createElement('div');
      hub.id = 'v42-fortress-hub';
      hub.className = 'v42-fortress-card';
      rankCard.parentNode.insertBefore(hub, rankCard.nextSibling);
    }

    // 8.3 Inject Game #11 Card into .arcade-grid
    const grid = document.querySelector('.arcade-grid');
    if (grid && !document.getElementById('card-dojo')) {
      const card = document.createElement('div');
      card.id = 'card-dojo';
      card.className = 'game-card c-dojo';
      card.dataset.genre = 'brain';
      card.onclick = () => launchGame('dojo');
      card.innerHTML = `
        <span class="new-ribbon" style="background:linear-gradient(90deg,#a855f7,#ec4899);">GAME #11 MỚI</span>
        <div class="gc-top">
          <span class="gc-icon">🥋</span>
          <span class="gc-best" id="best-dojo">Kỷ lục: 0</span>
        </div>
        <div class="gc-title">11. Võ Đài Bộ Thủ & Luyện Nét Chữ</div>
        <div class="gc-skill">⚡ Hợp Chưởng Bộ Thủ + Khắc Ấn Điền Tự Cách</div>
        <div class="gc-desc">Chạm ghép Ngọc Bộ Thủ thành chữ Hán & quẹt tay luyện nét bút thần tốc nhận x2 điểm thưởng!</div>
        <div class="gc-play-btn" style="background:linear-gradient(135deg,#7e22ce,#2563eb);">▶ VÀO VÕ ĐÀI NGAY</div>
      `;
      grid.insertBefore(card, grid.firstChild);
    }

    // 8.4 Inject #view-dojo into #game-arena
    const arena = document.getElementById('game-arena');
    if (arena && !document.getElementById('view-dojo')) {
      const view = document.createElement('div');
      view.id = 'view-dojo';
      view.className = 'hidden';
      view.innerHTML = `<div id="dojo-stage-content"></div>`;
      arena.appendChild(view);
    }

    // 8.5 Inject "⚔️ Thách Đấu Bạn Bè" button into Result Modal (#modal-result)
    const resActions = document.querySelector('#modal-result .res-actions');
    if (resActions && !document.getElementById('v42-res-challenge-btn')) {
      const btn = document.createElement('button');
      btn.id = 'v42-res-challenge-btn';
      btn.className = 'btn-secondary';
      btn.style.cssText = 'border-color:rgba(250,204,21,0.55);color:#fde047;background:rgba(217,119,6,0.2);';
      btn.textContent = '⚔️ Thách Đấu';
      btn.onclick = () => shareArcadeChallenge(activeGame, score);
      resActions.appendChild(btn);
    }
  }

  function renderFortressAndHubUI() {
    const hub = document.getElementById('v42-fortress-hub');
    if (!hub) return;

    const sh = computeShieldHP();
    const { myEntry } = buildLeagueStandings();
    const barColor = sh.hp >= 75
      ? 'linear-gradient(90deg, #10b981, #38bdf8)'
      : sh.hp >= 45
        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
        : 'linear-gradient(90deg, #e11d48, #f97316)';
    const statusLabel = sh.hp >= 75 ? '🟢 Vững Chắc' : sh.hp >= 45 ? '🟡 Rạn Nứt' : '🔴 Cần Sửa Gấp';

    hub.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;">
        <span style="font-weight:900;color:#e0f2fe;">🛡️ Pháo Đài Trí Nhớ: <b style="color:#fde047">${sh.hp}%</b></span>
        <span style="font-size:10.5px;color:#94a3b8;">${statusLabel} (${sh.mistakesCount} từ rò giáp)</span>
      </div>
      <div class="v42-shield-track">
        <div class="v42-shield-fill" style="width:${sh.hp}%;background:${barColor};"></div>
      </div>
      <div class="v42-hub-btns">
        <button class="v42-hub-btn ${sh.hp < 85 || sh.mistakesCount > 0 ? 'repair-alert' : ''}" onclick="window.triggerQuickShieldRepair()">
          ⚡ Sửa Giáp
        </button>
        <button class="v42-hub-btn" onclick="window.openLeagueModal()">
          🏆 Hạng #${myEntry ? myEntry.rank : 15}/30
        </button>
        <button class="v42-hub-btn" onclick="window.shareArcadeChallenge()">
          ⚔️ Thách Đấu
        </button>
      </div>
    `;
  }

  // ===========================================================================
  // INITIALIZE v4.2
  // ===========================================================================
  function initV42() {
    patchStreakFreezeProtection();
    hookCoreFunctionsV42();
    injectV42StylesAndDOM();
    renderFortressAndHubUI();
    if (typeof refreshHighScoresUI === 'function') refreshHighScoresUI();
    if (typeof injectJuiceToAllButtons === 'function') injectJuiceToAllButtons();
    checkIncomingChallengeLink();

    // Override v4.1 showRadicalBreakdown with v4.2 multi-char + calligraphy edition!
    window.showRadicalBreakdown = showRadicalBreakdownV42;
    window.openLeagueModal = openLeagueModal;
    window.openStreakFireModal = openStreakFireModal;
    window.shareArcadeChallenge = shareArcadeChallenge;
    window.triggerQuickShieldRepair = triggerQuickShieldRepair;

    console.log('🚀 [CyberLingo Arcade PRO v4.2] Hanzi Dojo + Fortress Shield + Cyber League READY!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initV42, 140));
  } else {
    setTimeout(initV42, 140);
  }
})();
