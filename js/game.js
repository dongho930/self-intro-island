/*
 * 게임 진행: 화면 그리기, 이동(키보드, 터치), 카메라, 장소 살펴보기, 스탬프
 */
(function () {
  'use strict';

  const { TILE } = window.World;
  const W = window.World;
  const P = window.Art.P;
  const C = window.SITE_CONTENT;
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touchQuery = window.matchMedia('(pointer: coarse)');
  let reduceMotion = motionQuery.matches;
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', (e) => { reduceMotion = e.matches; });

  const visitor = window.Art.character({ hair: '#3a2723', shirt: P.yellow, pants: '#34427a', shoes: '#4b3428' });
  const owner = window.Art.character({ hair: P.ink, shirt: P.white, pants: P.roofBlue, shoes: P.ink });
  const boatSprite = window.Art.boat();

  const STAMP_PLACES = W.places.filter((p) => p.stamp);
  const BOARD = W.places.find((p) => p.id === 'board');
  const LIGHTHOUSE = W.places.find((p) => p.id === 'lighthouse');
  const STORE_KEY = 'island-visited';
  const SPEED = 72; // 초당 픽셀
  const NEAR = 18; // 살펴보기가 가능한 거리

  const KEY_DIRS = {
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
    ArrowRight: [1, 0], KeyD: [1, 0],
  };

  const state = {
    mode: 'title', // title(시작 화면) -> intro(배 도착) -> play
    t: 0,
    scale: 4,
    dpr: 1,
    viewW: 0,
    viewH: 0,
    cam: { x: 0, y: 0 },
    snap: true,
    keys: {},
    paused: false,
    near: null,
    marker: null,
    smoke: [],
    smokeTimer: 0,
    introT: 0,
    badges: [], // 화면 가장자리의 장소 표지 (누르면 그곳으로 걸어감)
  };
  const player = { x: W.start.x, y: W.start.y, dir: 'up', moving: false, anim: 0, path: null, pending: null, visible: false };
  const npc = { x: W.npc.x, y: W.npc.y, dir: 'down', moving: false, anim: 0 };
  const boat = { x: W.boatRest.x, y: W.boatFrom };

  /* ---------- 방문 기록 (sessionStorage) ---------- */

  function loadVisited() {
    try {
      const arr = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      return new Set();
    }
  }
  const visited = loadVisited();
  function saveVisited() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(Array.from(visited))); } catch (e) { /* 저장 못 해도 진행 */ }
  }
  const allStamped = () => STAMP_PLACES.every((p) => visited.has(p.id));

  /* ---------- 화면 크기 ---------- */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    // 휴대폰 세로 화면에서 가로 11칸쯤, PC에서 세로 13칸쯤 보이도록 정수 배율을 고릅니다.
    const cssScale = Math.min(w / (TILE * 11), h / (TILE * 13));
    state.scale = Math.max(2, Math.round(cssScale * dpr));
    state.dpr = dpr;
    state.viewW = canvas.width / state.scale;
    state.viewH = canvas.height / state.scale;
    state.snap = true;
  }

  /* ---------- 카메라 ---------- */

  // 지도 위아래 끝은 깊은 바다라서, 세로로는 지도 밖까지 조금 더 움직여도 자연스럽습니다.
  // 덕분에 섬 끝(선착장, 등대)에서도 캐릭터를 화면 가운데에 둘 수 있습니다.
  function clampCam(x, y) {
    const WW = W.COLS * TILE, WH = W.ROWS * TILE, over = 6 * TILE;
    return {
      x: state.viewW >= WW ? (WW - state.viewW) / 2 : Math.min(Math.max(x, 0), WW - state.viewW),
      y: state.viewH >= WH + over * 2 ? (WH - state.viewH) / 2 : Math.min(Math.max(y, -over), WH - state.viewH + over),
    };
  }

  function updateCamera(dt) {
    let fx, fy;
    if (state.mode === 'title') {
      const a = reduceMotion ? 0.6 : state.t * 0.06;
      fx = 330 + Math.cos(a) * 80;
      fy = 250 + Math.sin(a) * 50;
    } else if (state.mode === 'intro') {
      fx = boat.x + 20;
      fy = boat.y - 10;
    } else {
      fx = player.x;
      fy = player.y - 8;
    }
    const target = clampCam(fx - state.viewW / 2, fy - state.viewH / 2);
    const k = state.snap ? 1 : 1 - Math.exp(-dt * 6);
    state.cam.x += (target.x - state.cam.x) * k;
    state.cam.y += (target.y - state.cam.y) * k;
    state.snap = false;
  }

  /* ---------- 이동 ---------- */

  function collides(x, y) {
    const x0 = Math.floor((x - 5) / TILE), x1 = Math.floor((x + 4.99) / TILE);
    const y0 = Math.floor((y - 4) / TILE), y1 = Math.floor((y + 1.99) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) if (!W.walkable(tx, ty)) return true;
    }
    return false;
  }

  function face(ent, dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) ent.dir = dx > 0 ? 'right' : 'left';
    else if (dy) ent.dir = dy > 0 ? 'down' : 'up';
  }

  function playerTile() {
    const tx = Math.floor(player.x / TILE), ty = Math.floor(player.y / TILE);
    return W.walkable(tx, ty) ? { tx, ty } : W.nearestWalkable(tx, ty);
  }

  // 목표 칸까지 걸어가는 경로를 만듭니다. finalPoint가 있으면 마지막에 그 지점으로 붙습니다.
  function walkTo(tx, ty, finalPoint) {
    const start = playerTile();
    if (!start) return false;
    const tiles = W.findPath(start.tx, start.ty, tx, ty);
    if (!tiles) return false;
    const pts = tiles.map((t) => ({ x: t.tx * TILE + 8, y: t.ty * TILE + 8 }));
    if (finalPoint) pts.push({ x: finalPoint.x, y: finalPoint.y });
    player.path = pts;
    player.pending = null;
    return true;
  }

  function distTo(place) {
    return Math.hypot(place.spot.x - player.x, place.spot.y - player.y);
  }

  function updatePlayer(dt) {
    let dx = 0, dy = 0;
    Object.keys(state.keys).forEach((code) => {
      const d = KEY_DIRS[code];
      if (d) { dx += d[0]; dy += d[1]; }
    });
    dx = Math.sign(dx);
    dy = Math.sign(dy);
    let moved = false;

    if (dx || dy) {
      player.path = null;
      player.pending = null;
      state.marker = null;
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * SPEED * dt, vy = (dy / len) * SPEED * dt;
      if (vx && !collides(player.x + vx, player.y)) player.x += vx;
      if (vy && !collides(player.x, player.y + vy)) player.y += vy;
      face(player, dx, dy);
      moved = true;
    } else if (player.path) {
      if (player.path.length) {
        const wp = player.path[0];
        const ex = wp.x - player.x, ey = wp.y - player.y;
        const dist = Math.hypot(ex, ey), step = SPEED * dt;
        if (dist <= step) {
          player.x = wp.x;
          player.y = wp.y;
          player.path.shift();
        } else {
          player.x += (ex / dist) * step;
          player.y += (ey / dist) * step;
        }
        if (dist > 0.01) face(player, ex, ey);
        moved = true;
      }
      if (!player.path.length) {
        player.path = null;
        state.marker = null;
        const target = player.pending;
        player.pending = null;
        if (target && distTo(target) < NEAR) openPlace(target);
      }
    }
    player.moving = moved;
    player.anim = moved ? player.anim + dt : 0;
  }

  function updateNear() {
    let near = null;
    if (state.mode === 'play' && player.visible && !state.paused) {
      let best = NEAR;
      W.places.forEach((p) => {
        const d = distTo(p);
        if (d < best) { best = d; near = p; }
      });
    }
    if (near !== state.near) {
      state.near = near;
      window.UI.setPrompt(near);
    }
    // 집주인은 방문자가 가까이 오면 그쪽을 봅니다.
    const ndx = player.x - npc.x, ndy = player.y - npc.y;
    if (player.visible && Math.hypot(ndx, ndy) < 64) face(npc, ndx, ndy);
    else npc.dir = 'down';
  }

  /* ---------- 시작과 배 도착 ---------- */

  function startGame() {
    window.UI.hideStart();
    if (reduceMotion) {
      boat.y = W.boatRest.y;
      arrive();
      return;
    }
    state.mode = 'intro';
    state.introT = 0;
    boat.y = W.boatFrom;
  }

  function updateIntro(dt) {
    state.introT += dt;
    const k = Math.min(1, state.introT / 2.6);
    const e = 1 - Math.pow(1 - k, 3);
    boat.y = W.boatFrom + (W.boatRest.y - W.boatFrom) * e;
    if (k >= 1) arrive();
  }

  function arrive() {
    state.mode = 'play';
    player.visible = true;
    player.x = W.start.x;
    player.y = W.start.y;
    player.dir = 'up';
    walkTo(W.firstStep.tx, W.firstStep.ty);
    window.UI.showHud(STAMP_PLACES, visited);
    canvas.focus({ preventScroll: true });
    const m = C.messages || {};
    const lines = (m.intro || []).concat(touchQuery.matches ? m.controlsTouch : m.controlsKeyboard).filter(Boolean);
    if (lines.length) setTimeout(() => window.UI.say(lines), reduceMotion ? 0 : 500);
  }

  /* ---------- 장소 열기 ---------- */

  function openPlace(place) {
    if (state.paused) return;
    state.paused = true;
    state.keys = {};
    player.path = null;
    player.pending = null;
    player.moving = false;
    state.marker = null;
    window.UI.endTalk();
    window.UI.setPrompt(null);
    state.near = null;

    let firstVisit = false;
    if (place.stamp && !visited.has(place.id)) {
      visited.add(place.id);
      saveVisited();
      firstVisit = true;
      window.UI.updateStamps(visited, place.id);
    }
    const completedNow = firstVisit && allStamped();
    window.UI.openPlace(place, {
      firstVisit,
      onClose: () => {
        resume();
        if (completedNow && C.messages && C.messages.complete) window.UI.say(C.messages.complete);
      },
    });
  }

  function openSheet() {
    state.paused = true;
    state.keys = {};
    player.moving = false;
    window.UI.endTalk();
    window.UI.setPrompt(null);
    state.near = null;
    window.UI.openSheet(resume);
  }

  function resume() {
    state.paused = false;
    state.near = undefined; // 다음 프레임에 살펴보기 버튼을 다시 계산
    if (state.mode === 'play') canvas.focus({ preventScroll: true });
  }

  /* ---------- 입력 ---------- */

  window.addEventListener('keydown', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const inField = target && target.closest('input, textarea, select, [contenteditable]');
    const onControl = target && target.closest('button, a');
    const isAction = e.code === 'Space' || e.code === 'Enter';
    if (inField || window.UI.isDialogOpen()) return;
    if (window.UI.isTalking() && isAction && !onControl) {
      e.preventDefault();
      window.UI.advanceTalk();
      return;
    }
    if (state.mode !== 'play' || state.paused) return;
    if (KEY_DIRS[e.code]) {
      state.keys[e.code] = true;
      e.preventDefault();
    } else if (isAction && !onControl && state.near) {
      e.preventDefault();
      openPlace(state.near);
    }
  });
  window.addEventListener('keyup', (e) => { delete state.keys[e.code]; });
  window.addEventListener('blur', () => { state.keys = {}; });

  canvas.addEventListener('pointerdown', (e) => {
    if (state.mode !== 'play' || state.paused) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const s = state.scale;
    const wx = (sx + Math.round(state.cam.x * s)) / s;
    const wy = (sy + Math.round(state.cam.y * s)) / s;

    const badge = state.badges.find((b) => Math.hypot(b.X - sx, b.Y - sy) < 26 * state.dpr);
    const place = badge ? badge.place : W.placeAt(wx, wy);
    if (place) {
      if (distTo(place) < NEAR) {
        openPlace(place);
        return;
      }
      const tx = Math.floor(place.spot.x / TILE), ty = Math.floor(place.spot.y / TILE);
      if (walkTo(tx, ty, place.spot)) {
        player.pending = place;
        state.marker = null;
      }
      return;
    }
    let tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (!W.walkable(tx, ty)) {
      const n = W.nearestWalkable(tx, ty);
      if (!n) return;
      tx = n.tx;
      ty = n.ty;
    }
    if (walkTo(tx, ty)) state.marker = { x: tx * TILE + 8, y: ty * TILE + 8, t: state.t };
  });

  /* ---------- 효과 ---------- */

  function updateSmoke(dt) {
    if (reduceMotion) {
      state.smoke.length = 0;
      return;
    }
    state.smokeTimer -= dt;
    if (state.smokeTimer <= 0) {
      state.smokeTimer = 0.5;
      state.smoke.push({ x: W.chimney.x + (Math.random() * 2 - 1), y: W.chimney.y, age: 0, life: 2.4 + Math.random() });
    }
    state.smoke.forEach((p) => {
      p.age += dt;
      p.y -= 7 * dt;
      p.x += 3 * dt;
    });
    state.smoke = state.smoke.filter((p) => p.age < p.life);
  }

  /* ---------- 그리기 ---------- */

  let camPx = 0, camPy = 0;

  function rect(wx, wy, w, h) {
    const s = state.scale;
    ctx.fillRect(Math.round(wx * s) - camPx, Math.round(wy * s) - camPy, w * s, h * s);
  }

  function blit(img, wx, wy) {
    const s = state.scale;
    const x = Math.round(wx * s) - camPx, y = Math.round(wy * s) - camPy;
    const w = img.width * s, h = img.height * s;
    if (x > canvas.width || y > canvas.height || x + w < 0 || y + h < 0) return;
    ctx.drawImage(img, x, y, w, h);
  }

  function drawGround() {
    const s = state.scale;
    const g = W.ground;
    const sx = Math.max(0, Math.floor(state.cam.x));
    const sy = Math.max(0, Math.floor(state.cam.y));
    const sw = Math.min(g.width - sx, Math.ceil(state.viewW) + 2);
    const sh = Math.min(g.height - sy, Math.ceil(state.viewH) + 2);
    if (sw <= 0 || sh <= 0) return;
    ctx.drawImage(g, sx, sy, sw, sh, sx * s - camPx, sy * s - camPy, sw * s, sh * s);
  }

  function drawWater() {
    const t = state.t;
    const tx0 = Math.floor(state.cam.x / TILE) - 1, tx1 = Math.ceil((state.cam.x + state.viewW) / TILE) + 1;
    const ty0 = Math.floor(state.cam.y / TILE) - 1, ty1 = Math.ceil((state.cam.y + state.viewH) / TILE) + 1;
    ctx.fillStyle = P.foam;

    // 해안선 거품
    const ph = reduceMotion ? 0 : Math.floor(t * 1.4) % 2;
    W.foam.forEach((f) => {
      if (f.tx < tx0 || f.tx > tx1 || f.ty < ty0 || f.ty > ty1) return;
      const x = f.tx * TILE, y = f.ty * TILE;
      if (f.side === 'n') { rect(x + ph * 2, y + 1 + ph, 5, 1); rect(x + 8 + ph * 2, y + 1 + ph, 5, 1); }
      if (f.side === 's') { rect(x + 2 - ph * 2, y + 14 - ph, 5, 1); rect(x + 10 - ph * 2, y + 14 - ph, 5, 1); }
      if (f.side === 'w') { rect(x + 1 + ph, y + ph * 2, 1, 5); rect(x + 1 + ph, y + 8 + ph * 2, 1, 5); }
      if (f.side === 'e') { rect(x + 14 - ph, y + 2 - ph * 2, 1, 5); rect(x + 14 - ph, y + 10 - ph * 2, 1, 5); }
    });

    // 반짝이는 물결
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!W.isWater(tx, ty)) continue;
        const h = window.Art.hash(tx, ty, 7);
        if (h > 0.22) continue;
        const v = reduceMotion ? 0.7 : Math.sin(t * 1.3 + h * 97);
        if (v < 0.55) continue;
        const px = tx * TILE + 2 + Math.floor(window.Art.hash(tx, ty, 3) * 10);
        const py = ty * TILE + 2 + Math.floor(window.Art.hash(tx, ty, 5) * 12);
        rect(px, py, v > 0.9 ? 4 : 2, 1);
      }
    }
  }

  function drawChar(sheet, ent) {
    const frames = sheet[ent.dir];
    const f = ent.moving ? [1, 0, 2, 0][Math.floor(ent.anim * 8) % 4] : 0;
    blit(window.Art.footShadow, ent.x - 6, ent.y - 2);
    blit(frames[f], ent.x - 8, ent.y - 15);
  }

  function drawBoat() {
    const bob = reduceMotion ? 0 : Math.round(Math.sin(state.t * 2.2) * 0.8);
    ctx.fillStyle = P.foam;
    if (state.mode === 'intro') {
      rect(boat.x + 4, boat.y + 22, 2, 1);
      rect(boat.x + 30, boat.y + 23, 3, 1);
    }
    rect(boat.x + 1, boat.y + 20 + bob, 34, 1);
    blit(boatSprite, boat.x, boat.y + bob);
  }

  function drawEffects() {
    // 등대 불빛
    const glow = reduceMotion ? 0.35 : 0.2 + 0.3 * (Math.sin(state.t * 2.2) * 0.5 + 0.5);
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#fff6c2';
    const gx = LIGHTHOUSE.drawX, gy = LIGHTHOUSE.drawY;
    rect(gx + 7, gy + 12, 18, 11);
    rect(gx + 10, gy + 9, 12, 17);
    ctx.globalAlpha = glow * 0.5;
    rect(gx - 10, gy + 15, 52, 5);
    ctx.globalAlpha = 1;

    // 작업실 굴뚝 연기
    state.smoke.forEach((p) => {
      ctx.globalAlpha = 0.75 * (1 - p.age / p.life);
      ctx.fillStyle = P.foam;
      const size = Math.min(4, 2 + Math.floor(p.age * 1.2));
      rect(Math.round(p.x), Math.round(p.y), size, size);
    });
    ctx.globalAlpha = 1;
  }

  function drawMarkers() {
    // 누른 곳 표시
    if (state.marker && Math.floor((state.t - state.marker.t) * 4) % 2 === 0) {
      blit(window.Art.marker, state.marker.x - 5, state.marker.y - 1);
    }
    // 살펴볼 수 있는 장소나 걸어가는 목적지 위의 화살표
    const target = state.near || player.pending;
    if (target && !state.paused) {
      const bob = reduceMotion ? 0 : Math.round(Math.sin(state.t * 5) * 1.5);
      blit(window.Art.arrow, target.drawX + Math.floor(target.sprite.width / 2) - 3, target.drawY - 8 + bob);
    }
  }

  // 화면 밖에 있는 아직 안 가 본 장소를 화면 가장자리에서 가리킵니다.
  function drawOffscreen() {
    state.badges = [];
    if (state.mode !== 'play' || state.paused) return;
    let targets = STAMP_PLACES.filter((p) => !visited.has(p.id));
    if (!targets.length) targets = [BOARD];
    const s = state.scale;
    const topInset = (70 * state.dpr) / s;
    const bottomInset = (90 * state.dpr) / s;
    const m = (28 * state.dpr) / s;
    const minX = m, maxX = state.viewW - m, minY = topInset + m, maxY = state.viewH - bottomInset - m;
    if (maxX <= minX || maxY <= minY) return;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const placed = [];
    const gap = 48 * state.dpr;
    targets.forEach((p) => {
      const tx = p.spot.x - state.cam.x, ty = p.drawY + p.sprite.height / 2 - state.cam.y;
      if (tx > 0 && tx < state.viewW && ty > 0 && ty < state.viewH) return;
      const dx = tx - cx, dy = ty - cy;
      const k = Math.min((maxX - cx) / Math.max(Math.abs(dx), 0.001), (maxY - cy) / Math.max(Math.abs(dy), 0.001));
      let X = Math.round((cx + dx * k) * s), Y = Math.round((cy + dy * k) * s);
      // 같은 방향의 표지가 겹치면 가장자리를 따라 옆으로 비켜 놓습니다.
      const onTopOrBottom = Math.abs(Y - minY * s) < 2 || Math.abs(Y - maxY * s) < 2;
      for (let i = 0; i < 6 && placed.some((q) => Math.hypot(q.X - X, q.Y - Y) < gap); i++) {
        if (onTopOrBottom) X += X > canvas.width / 2 ? -gap : gap;
        else Y += Y > canvas.height / 2 ? -gap : gap;
      }
      placed.push({ X, Y });
      state.badges.push({ X, Y, place: p });
      // 표지는 지도 확대와 상관없이 화면에서 일정한 크기(지름 약 42px)로 그립니다.
      const b = Math.max(2, Math.round(2 * state.dpr));
      const ang = Math.atan2(dy, dx), r = 11 * b;
      ctx.fillStyle = P.ink;
      ctx.beginPath();
      ctx.moveTo(X + Math.cos(ang) * (r + 5 * b), Y + Math.sin(ang) * (r + 5 * b));
      ctx.lineTo(X + Math.cos(ang + 0.55) * r, Y + Math.sin(ang + 0.55) * r);
      ctx.lineTo(X + Math.cos(ang - 0.55) * r, Y + Math.sin(ang - 0.55) * r);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(window.Art.badge, X - 10 * b, Y - 10 * b, 21 * b, 21 * b);
      ctx.drawImage(window.Art.icons[p.id], X - 6 * b, Y - 6 * b, 12 * b, 12 * b);
    });
  }

  function render() {
    const s = state.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = P.sea0;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    camPx = Math.round(state.cam.x * s);
    camPy = Math.round(state.cam.y * s);

    drawGround();
    drawWater();

    const list = W.decor.concat(W.places);
    if (state.mode !== 'title') list.push({ kind: 'boat', sortY: boat.y + 14 });
    list.push({ kind: 'npc', sortY: npc.y });
    if (player.visible) list.push({ kind: 'player', sortY: player.y });
    list.sort((a, b) => a.sortY - b.sortY);
    list.forEach((d) => {
      if (d.kind === 'player') drawChar(visitor, player);
      else if (d.kind === 'npc') drawChar(owner, npc);
      else if (d.kind === 'boat') drawBoat();
      else blit(d.sprite, d.drawX, d.drawY);
    });

    drawEffects();
    drawMarkers();
    drawOffscreen();
  }

  /* ---------- 반복 ---------- */

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.t += dt;
    if (state.mode === 'intro') updateIntro(dt);
    if (state.mode === 'play' && !state.paused) updatePlayer(dt);
    updateNear();
    updateSmoke(dt);
    updateCamera(dt);
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  window.UI.initStart({ onStart: startGame, onSheet: openSheet, onPrompt: openPlace });
  requestAnimationFrame(frame);

  // 화면 확인용 (개발자 도구에서 사용)
  window.__island = { state, player, visited, openPlace, places: W.places };
})();
