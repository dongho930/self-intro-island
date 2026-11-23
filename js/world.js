/*
 * 섬 지도
 * ~ 바다, s 모래, g 풀밭. 길, 선착장, 꽃, 나무, 건물은 아래 목록으로 얹습니다.
 * 좌표는 모두 칸(타일) 단위입니다. 가로 40칸, 세로 32칸.
 */
(function () {
  'use strict';

  const { P, makeCanvas, R, hash } = window.Art;
  const TILE = 16;

  const MAP = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 0
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 1
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 2
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ssss~~~~', // 3
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~sggggs~~~', // 4
    '~~~~~~~~~ssssssssssssss~~~~~~~sggggggs~~', // 5
    '~~~~~~ssggggggggggggggggss~~~sgggggggs~~', // 6
    '~~~~~sgggggggggggggggggggggggggggggggs~~', // 7
    '~~~~sggggggggggggggggggggggggggggggggs~~', // 8
    '~~~sggggggggggggggggggggggggggggggggs~~~', // 9
    '~~~sggggggggggggggggggggggggggggggggs~~~', // 10
    '~~sgggggggggggggggggggggggggggggggggs~~~', // 11
    '~~sgggggggggggggggggggggggggggggggggs~~~', // 12
    '~~sggggggggggggggggggggggggggggggggggs~~', // 13
    '~~sggggggggggggggggggggggggggggggggggs~~', // 14
    '~~sggggggggggggggggggggggggggggggggggs~~', // 15
    '~~~sgggggggggggggggggggggggggggggggggs~~', // 16
    '~~~sgggggggggggggggggggggggggggggggggs~~', // 17
    '~~sgggggggggggggggggggggggggggggggggs~~~', // 18
    '~~sgggggggggggggggggggggggggggggggggs~~~', // 19
    '~~sgggggggggggggggggggggggggggggggggs~~~', // 20
    '~~~sggggggggggggggggggggggggggggggggs~~~', // 21
    '~~~sgggggggggggggggggggggggggggggggs~~~~', // 22
    '~~~~sggggggggggggggggggggggggggggggs~~~~', // 23
    '~~~~~sggggggggggggggggggggggggggggs~~~~~', // 24
    '~~~~~~ssggggggggggggggggggggggggss~~~~~~', // 25
    '~~~~~~~~sssssssssssssssssssssss~~~~~~~~~', // 26
    '~~~~~~~~~~~~sssssssssssssss~~~~~~~~~~~~~', // 27
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 28
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 29
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 30
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', // 31
  ];
  const COLS = 40, ROWS = MAP.length;

  // 길: [x, y, 너비, 높이]
  const PATHS = [
    [19, 18, 2, 8], // 선착장에서 광장까지
    [17, 15, 6, 3], // 광장
    [12, 15, 5, 1], [12, 14, 1, 1], // 집
    [23, 15, 11, 1], [27, 14, 2, 1], // 도서관
    [33, 7, 1, 8], [34, 7, 1, 1], // 등대
    [9, 23, 10, 1], // 작업실
    [21, 23, 8, 1], [28, 22, 1, 1], // 평상
  ];
  const DOCK = [19, 28, 2, 4];
  const WALLS = [[9, 14], [10, 14], [14, 14], [15, 14]];
  const ROCKS = [[2, 11], [3, 16], [34, 24], [13, 27], [24, 6], [35, 3], [36, 18]];
  const FLOWERS = [[29, 16], [30, 16], [31, 16], [30, 17], [6, 12], [7, 12], [6, 13], [8, 13], [31, 23], [32, 23], [31, 24]];
  const NPC_TILE = [13, 14];

  // 장소: fp = 건물이 차지하는 바닥 칸, spot = 살펴보기를 할 수 있는 위치(픽셀)
  const C = window.SITE_CONTENT || {};
  const names = C.places || {};
  const PLACE_DEFS = [
    { id: 'home', name: '집', label: '소개', art: 'house', fp: [10, 10, 5, 4], spot: [12 * TILE + 8, 14 * TILE + 8] },
    { id: 'library', name: '도서관', label: '배운 것', art: 'library', fp: [25, 10, 6, 4], spot: [28 * TILE, 14 * TILE + 8] },
    { id: 'workshop', name: '작업실', label: '프로젝트', art: 'workshop', fp: [7, 19, 5, 4], spot: [9 * TILE + 8, 23 * TILE + 8] },
    { id: 'lighthouse', name: '등대', label: '걸어온 길', art: 'lighthouse', fp: [33, 5, 2, 2], spot: [34 * TILE, 7 * TILE + 8] },
    { id: 'pyeongsang', name: '평상', label: '좋아하는 것', art: 'pyeongsang', fp: [27, 20, 3, 2], spot: [28 * TILE + 8, 22 * TILE + 8] },
    { id: 'mailbox', name: '우체통', label: '연락처', art: 'mailbox', fp: [23, 25, 1, 1], spot: [23 * TILE + 8, 26 * TILE + 8] },
    { id: 'board', name: '마을 게시판', label: '방명록', art: 'board', fp: [19, 14, 2, 1], spot: [20 * TILE, 15 * TILE + 8], noStamp: true },
  ];

  /* ---------- 지형 만들기 ---------- */

  const types = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) types.push((MAP[y][x] || '~'));
  }
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
  const idx = (x, y) => y * COLS + x;
  const typeAt = (x, y) => (inBounds(x, y) ? types[idx(x, y)] : '~');
  const fillRect = ([x0, y0, w, h], fn) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inBounds(x, y)) fn(x, y);
  };

  PATHS.forEach((r) => fillRect(r, (x, y) => { if (types[idx(x, y)] === 'g') types[idx(x, y)] = 'p'; }));
  fillRect(DOCK, (x, y) => { types[idx(x, y)] = 'd'; });
  FLOWERS.forEach(([x, y]) => { if (typeAt(x, y) === 'g') types[idx(x, y)] = 'f'; });

  const isLandType = (t) => t === 's' || t === 'g' || t === 'p' || t === 'f';
  const isWater = (x, y) => typeAt(x, y) === '~';

  // 바다 깊이: 땅에서 몇 칸 떨어졌는지
  const depth = new Uint8Array(COLS * ROWS).fill(9);
  {
    const queue = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isLandType(typeAt(x, y))) { depth[idx(x, y)] = 0; queue.push([x, y]); }
    for (let q = 0; q < queue.length; q++) {
      const [x, y] = queue[q];
      const d = depth[idx(x, y)];
      if (d >= 4) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny) || depth[idx(nx, ny)] <= d + 1) continue;
        depth[idx(nx, ny)] = d + 1;
        queue.push([nx, ny]);
      }
    }
  }

  /* ---------- 장애물과 장식 ---------- */

  const blocked = new Uint8Array(COLS * ROWS);
  const decor = [];

  function addDecor(sprite, tx, ty, lift) {
    decor.push({
      sprite,
      drawX: tx * TILE + Math.round((TILE - sprite.width) / 2),
      drawY: (ty + 1) * TILE - sprite.height + (lift || 0),
      sortY: (ty + 1) * TILE - 2,
    });
    blocked[idx(tx, ty)] = 1;
  }

  const places = PLACE_DEFS.map((d) => {
    const sprite = window.Art[d.art]();
    const [fx, fy, fw, fh] = d.fp;
    const custom = names[d.id] || {};
    fillRect(d.fp, (x, y) => { blocked[idx(x, y)] = 1; });
    return {
      id: d.id,
      name: custom.name || d.name,
      label: custom.label || d.label,
      intro: custom.intro || '',
      stamp: !d.noStamp,
      fp: { x: fx, y: fy, w: fw, h: fh },
      spot: { x: d.spot[0], y: d.spot[1] },
      sprite,
      drawX: fx * TILE + Math.round((fw * TILE - sprite.width) / 2),
      drawY: (fy + fh) * TILE - sprite.height,
      sortY: (fy + fh) * TILE - 1,
    };
  });

  WALLS.forEach(([x, y], i) => addDecor(window.Art.stoneWall(i + 3), x, y, 0));
  ROCKS.forEach(([x, y]) => addDecor(window.Art.rock(), x, y, -1));
  blocked[idx(NPC_TILE[0], NPC_TILE[1])] = 1;

  // 나무: 길과 건물에서 두 칸 이상 떨어진 풀밭에만 심어서 길이 막히지 않게 합니다.
  {
    const isPathish = (t) => t === 'p';
    const near = (x, y, r, test) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (test(x + dx, y + dy)) return true;
      return false;
    };
    const inFootprint = (x, y) => places.some((p) => x >= p.fp.x && x < p.fp.x + p.fp.w && y >= p.fp.y && y < p.fp.y + p.fp.h);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (typeAt(x, y) !== 'g' || blocked[idx(x, y)]) continue;
        if (near(x, y, 1, (a, b) => isPathish(typeAt(a, b)) || inFootprint(a, b))) continue;
        if (near(x, y, 1, (a, b) => a === NPC_TILE[0] && b === NPC_TILE[1])) continue;
        if (x >= 16 && x <= 24 && y >= 24) continue; // 선착장 앞은 비워 둡니다
        if (hash(x, y, 11) > 0.3) continue;
        const coastal = near(x, y, 2, (a, b) => typeAt(a, b) === 's');
        const pine = coastal && hash(x, y, 12) > 0.25;
        addDecor(pine ? window.Art.pineTree(x * 31 + y) : window.Art.broadTree(x * 17 + y * 7), x, y, 1);
      }
    }
  }

  // 파도 거품이 생기는 해안선
  const foam = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!isWater(x, y)) continue;
      if (isLandType(typeAt(x, y - 1))) foam.push({ tx: x, ty: y, side: 'n' });
      if (isLandType(typeAt(x, y + 1))) foam.push({ tx: x, ty: y, side: 's' });
      if (isLandType(typeAt(x - 1, y))) foam.push({ tx: x, ty: y, side: 'w' });
      if (isLandType(typeAt(x + 1, y))) foam.push({ tx: x, ty: y, side: 'e' });
    }
  }

  /* ---------- 바닥 그림 (한 번만 그려 두고 계속 재사용) ---------- */

  function renderGround() {
    const c = makeCanvas(COLS * TILE, ROWS * TILE);
    const g = c.getContext('2d');
    const WATER = [P.sea2, P.sea2, P.sea1, P.sea0];
    const waterBand = (x, y) => Math.min(3, Math.max(1, depth[idx(x, y)]));

    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const t = typeAt(tx, ty), x = tx * TILE, y = ty * TILE;
        if (t === '~' || t === 'd') {
          R(g, WATER[waterBand(tx, ty)], x, y, TILE, TILE);
        } else if (t === 's') {
          R(g, P.sand0, x, y, TILE, TILE);
          for (let i = 0; i < 7; i++) {
            if (hash(tx, ty, 20 + i) < 0.75) R(g, P.sand1, x + Math.floor(hash(tx, ty, 30 + i) * 16), y + Math.floor(hash(tx, ty, 40 + i) * 16), 1, 1);
          }
        } else {
          R(g, P.grass0, x, y, TILE, TILE);
          for (let i = 0; i < 3; i++) {
            const hx = x + 2 + Math.floor(hash(tx, ty, 50 + i) * 12);
            const hy = y + 3 + Math.floor(hash(tx, ty, 60 + i) * 11);
            R(g, P.grass1, hx, hy, 1, 1);
            R(g, P.grass1, hx - 1, hy - 1, 1, 1);
            R(g, P.grass1, hx + 1, hy - 1, 1, 1);
            if (hash(tx, ty, 70 + i) > 0.6) R(g, P.grass2, hx, hy - 3, 1, 1);
          }
          if (t === 'p') {
            R(g, P.path0, x, y, TILE, TILE);
            for (let i = 0; i < 4; i++) R(g, P.path1, x + 1 + Math.floor(hash(tx, ty, 80 + i) * 14), y + 1 + Math.floor(hash(tx, ty, 90 + i) * 14), 2, 1);
          }
          if (t === 'f') {
            for (let i = 0; i < 6; i++) {
              const fx = x + 1 + Math.floor(hash(tx, ty, 100 + i) * 13);
              const fy = y + 1 + Math.floor(hash(tx, ty, 110 + i) * 13);
              const white = hash(tx, ty, 120 + i) > 0.7;
              R(g, P.grass1, fx, fy + 2, 1, 1);
              R(g, white ? P.white : P.yellow, fx - 1, fy, 3, 1);
              R(g, white ? P.white : P.yellow, fx, fy - 1, 1, 3);
              R(g, white ? P.yellow : P.yellowDark, fx, fy, 1, 1);
            }
          }
        }
      }
    }

    const sides = [
      { dx: 0, dy: -1, edge: (x, y, i, d) => [x + i, y, 1, d] },
      { dx: 0, dy: 1, edge: (x, y, i, d) => [x + i, y + TILE - d, 1, d] },
      { dx: -1, dy: 0, edge: (x, y, i, d) => [x, y + i, d, 1] },
      { dx: 1, dy: 0, edge: (x, y, i, d) => [x + TILE - d, y + i, d, 1] },
    ];

    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const t = typeAt(tx, ty), x = tx * TILE, y = ty * TILE;
        sides.forEach((s, si) => {
          const nt = typeAt(tx + s.dx, ty + s.dy);
          for (let i = 0; i < TILE; i++) {
            const h = hash(tx * 4 + si, ty * 4 + i, 140);
            // 바다 색 경계를 체크무늬로 섞기
            if ((t === '~' || t === 'd') && (nt === '~' || nt === 'd') && inBounds(tx + s.dx, ty + s.dy)) {
              const a = waterBand(tx, ty), b = waterBand(tx + s.dx, ty + s.dy);
              if (b < a && (i % 2 === 0)) {
                const [ex, ey, ew, eh] = s.edge(x, y, i, 1);
                R(g, WATER[b], ex, ey, ew, eh);
              }
            }
            // 젖은 모래
            if (t === 's' && nt === '~') {
              const [ex, ey, ew, eh] = s.edge(x, y, i, h > 0.55 ? 2 : 1);
              R(g, P.sandWet, ex, ey, ew, eh);
            }
            // 풀이 모래 쪽으로 삐져나온 가장자리
            if (t === 's' && (nt === 'g' || nt === 'f' || nt === 'p') && h > 0.4) {
              const [ex, ey, ew, eh] = s.edge(x, y, i, h > 0.85 ? 2 : 1);
              R(g, nt === 'p' ? P.path0 : P.grass0, ex, ey, ew, eh);
            }
            // 흙길 가장자리를 부드럽게
            if (t === 'p' && (nt === 'g' || nt === 'f') && h > 0.5) {
              const [ex, ey, ew, eh] = s.edge(x, y, i, 1);
              R(g, P.grass0, ex, ey, ew, eh);
            }
          }
        });
      }
    }

    // 선착장
    fillRect(DOCK, (tx, ty) => {
      const x = tx * TILE, y = ty * TILE;
      const left = typeAt(tx - 1, ty) !== 'd', right = typeAt(tx + 1, ty) !== 'd';
      R(g, P.woodDark, x, y, TILE, TILE);
      for (let py = 0; py < TILE; py += 4) {
        R(g, P.wood, x, y + py, TILE, 3);
        R(g, P.woodLight, x, y + py, TILE, 1);
      }
      if (left) {
        R(g, P.ink, x, y, 1, TILE);
        if (ty % 2 === 0) { R(g, P.ink, x - 3, y + 6, 4, 8); R(g, P.trunkDark, x - 2, y + 7, 2, 6); }
      }
      if (right) {
        R(g, P.ink, x + TILE - 1, y, 1, TILE);
        if (ty % 2 === 0) { R(g, P.ink, x + TILE - 1, y + 6, 4, 8); R(g, P.trunkDark, x + TILE, y + 7, 2, 6); }
      }
    });

    return c;
  }

  /* ---------- 길 찾기 ---------- */

  function walkable(x, y) {
    if (!inBounds(x, y)) return false;
    const t = types[idx(x, y)];
    return t !== '~' && !blocked[idx(x, y)];
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  // A* 길 찾기. 출발 칸은 빼고 도착 칸까지의 칸 목록을 돌려줍니다.
  function findPath(sx, sy, tx, ty) {
    if (!walkable(tx, ty) || !inBounds(sx, sy)) return null;
    if (sx === tx && sy === ty) return [];
    const N = COLS * ROWS;
    const start = idx(sx, sy), goal = idx(tx, ty);
    const gScore = new Float32Array(N).fill(Infinity);
    const fScore = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const h = (x, y) => {
      const dx = Math.abs(x - tx), dy = Math.abs(y - ty);
      return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy);
    };
    const open = [start];
    gScore[start] = 0;
    fScore[start] = h(sx, sy);
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (fScore[open[i]] < fScore[open[bi]]) bi = i;
      const cur = open[bi];
      open[bi] = open[open.length - 1];
      open.pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % COLS, cy = (cur / COLS) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (!walkable(nx, ny)) continue;
        if (dx && dy && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
        const ni = idx(nx, ny);
        if (closed[ni]) continue;
        const ng = gScore[cur] + (dx && dy ? 1.4142 : 1);
        if (ng < gScore[ni]) {
          gScore[ni] = ng;
          fScore[ni] = ng + h(nx, ny);
          came[ni] = cur;
          open.push(ni);
        }
      }
    }
    if (came[goal] === -1) return null;
    const out = [];
    for (let c = goal; c !== start; c = came[c]) out.push({ tx: c % COLS, ty: (c / COLS) | 0 });
    return out.reverse();
  }

  function nearestWalkable(tx, ty) {
    for (let r = 1; r <= 8; r++) {
      let best = null, bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!walkable(tx + dx, ty + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = { tx: tx + dx, ty: ty + dy }; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  // 화면을 누른 곳에 있는 장소 (그림 영역 기준)
  function placeAt(wx, wy) {
    const sorted = places.slice().sort((a, b) => b.sortY - a.sortY);
    return sorted.find((p) => wx >= p.drawX && wx < p.drawX + p.sprite.width && wy >= p.drawY && wy < p.drawY + p.sprite.height) || null;
  }

  const workshopPlace = places.find((p) => p.id === 'workshop');

  window.World = {
    TILE, COLS, ROWS,
    places, decor, foam,
    ground: renderGround(),
    npc: { x: NPC_TILE[0] * TILE + 8, y: NPC_TILE[1] * TILE + 10 },
    start: { x: 20 * TILE, y: 29 * TILE + 8 },
    firstStep: { tx: 20, ty: 27 },
    boatRest: { x: 21 * TILE + 2, y: 29 * TILE + 2 },
    boatFrom: 36 * TILE,
    chimney: { x: workshopPlace.drawX + 62, y: workshopPlace.drawY + 6 },
    isWater, walkable, findPath, nearestWalkable, placeAt,
  };
})();
