/*
 * 픽셀 아트 모음
 * 모든 그림을 이미지 파일 없이 코드로 그립니다. 1칸(타일) = 16픽셀이고,
 * 화면에 그릴 때 정수 배율로 확대해서 픽셀이 또렷하게 보이게 합니다.
 */
(function () {
  'use strict';

  const P = {
    ink: '#1d2340',
    sea0: '#226b9a', sea1: '#2c7fae', sea2: '#4aa3c8', foam: '#e3f6fb',
    sand0: '#ecd7a0', sand1: '#dcc184', sandWet: '#cdb072',
    grass0: '#7dbb5c', grass1: '#649f48', grass2: '#9ad276',
    path0: '#d6bf91', path1: '#bea477',
    leaf0: '#4a9a4b', leaf1: '#337a3d', leaf2: '#6cbc5d',
    pine0: '#2f7353', pine1: '#22573f', pine2: '#43906a',
    trunk: '#7a5236', trunkDark: '#583a25',
    wall: '#f6f3ea', wallShade: '#dcd5c3',
    brick: '#ece4d2', brickLine: '#d6c9ad',
    stone: '#a9aba5', stoneDark: '#82857f', stoneLight: '#c8cac3',
    basalt: '#575c66', basaltHole: '#2b2f37',
    wood: '#a8754a', woodDark: '#7a5233', woodLight: '#cc9866',
    roofBlue: '#3a66c9', roofBlueDark: '#2a4c9c', roofBlueLight: '#5d88e2',
    roofTeal: '#2f8f84', roofTealDark: '#216b63', roofTealLight: '#4bb0a2',
    slate: '#5a6274', slateDark: '#434a5a', slateLight: '#9aa6c0',
    glass: '#9ad6ef', glassDark: '#5eaad0',
    interior: '#2b2f3d',
    red: '#d6453d', redDark: '#a5312b',
    yellow: '#ffd23f', yellowDark: '#e0a923',
    white: '#ffffff', ridge: '#e9eef8',
    skin: '#f3c9a1',
    shadow: 'rgba(29, 35, 64, 0.22)',
  };

  /* ---------- 기본 도구 ---------- */

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function R(g, color, x, y, w, h) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }

  // 픽셀 단위로 채운 타원 (안티에일리어싱 없음)
  function oval(g, cx, cy, rx, ry, color) {
    g.fillStyle = color;
    for (let dy = -ry; dy <= ry; dy++) {
      const k = ry === 0 ? 1 : 1 - (dy * dy) / (ry * ry);
      const dx = Math.round(rx * Math.sqrt(Math.max(0, k)));
      g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }

  function disc(g, cx, cy, r, color) {
    oval(g, cx, cy, r, r, color);
  }

  // 문자열 그림을 캔버스로 바꿉니다. '.'은 투명입니다.
  function fromStrings(rows, map) {
    const w = Math.max.apply(null, rows.map((r) => r.length));
    const c = makeCanvas(w, rows.length);
    const g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = map[row[x]];
        if (color) R(g, color, x, y, 1, 1);
      }
    });
    return c;
  }

  function flip(src) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  // 항상 같은 결과가 나오는 난수 (지도 장식이 새로고침해도 그대로 있게)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash(x, y, s) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  /* ---------- 캐릭터 (16 x 16) ---------- */

  const HEAD_DOWN = [
    '................',
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohssssssho...',
    '...osesssseso...',
    '...osssssssso...',
    '....osssssso....',
  ];
  const HEAD_UP = [
    '................',
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '....osssssso....',
  ];
  const HEAD_SIDE = [
    '................',
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohhhhsssso...',
    '...ohhhsssseso..',
    '...ohhssssssso..',
    '....osssssso....',
  ];
  const BODY_FRONT = [
    '...occcccccco...',
    '..occcccccccco..',
    '..osccccccccso..',
    '...oppppppppo...',
  ];
  const BODY_SIDE = [
    '....occcccco....',
    '....occcccco....',
    '....occsccco....',
    '....oppppppo....',
  ];
  // [서 있기, 왼발, 오른발]
  const LEGS_FRONT = [
    ['...opppoopppo...', '...okkkookkko...', '....ooo..ooo....'],
    ['...opppoopppo...', '...okkkoopppo...', '....ooo.okkko...'],
    ['...opppoopppo...', '...opppookkko...', '...okkko.ooo....'],
  ];
  const LEGS_SIDE = [
    ['....oppppppo....', '....okkkkkko....', '.....oooooo.....'],
    ['...opppo.oppo...', '...okkko.okko...', '....ooo...oo....'],
    ['....oppo.opppo..', '....okko.okkko..', '.....oo...ooo...'],
  ];

  function character(colors) {
    const map = { o: P.ink, e: P.ink, h: colors.hair, s: P.skin, c: colors.shirt, p: colors.pants, k: colors.shoes };
    const make = (head, body, legs) => fromStrings(head.concat(body, legs), map);
    const right = LEGS_SIDE.map((l) => make(HEAD_SIDE, BODY_SIDE, l));
    return {
      down: LEGS_FRONT.map((l) => make(HEAD_DOWN, BODY_FRONT, l)),
      up: LEGS_FRONT.map((l) => make(HEAD_UP, BODY_FRONT, l)),
      right,
      left: right.map(flip),
    };
  }

  /* ---------- 건물과 장소 ---------- */

  // 집 (소개): 파란 기와지붕 집. 바닥 5 x 4칸
  function house() {
    const W = 80, H = 78;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    R(g, P.shadow, 3, H - 4, 76, 4);
    // 벽
    R(g, P.ink, 5, 36, 70, H - 39);
    R(g, P.wall, 6, 37, 68, H - 41);
    R(g, P.wallShade, 6, 37, 68, 4);
    // 돌 기단
    R(g, P.stoneDark, 6, H - 11, 68, 7);
    R(g, P.stone, 6, H - 11, 68, 5);
    for (let i = 0, x = 7; x < 70; x += 8, i++) R(g, P.stoneLight, x + (i % 2) * 2, H - 10, 5, 1);
    // 문
    R(g, P.ink, 33, 51, 14, H - 54);
    R(g, P.wood, 34, 52, 12, H - 55);
    R(g, P.woodLight, 35, 54, 3, H - 60);
    R(g, P.woodDark, 40, 52, 1, H - 55);
    R(g, P.yellow, 42, 63, 2, 2);
    // 창문과 화분
    const win = (x, y) => {
      R(g, P.ink, x, y, 14, 12);
      R(g, P.glass, x + 1, y + 1, 12, 10);
      R(g, P.glassDark, x + 1, y + 7, 12, 4);
      R(g, P.ink, x + 7, y + 1, 1, 10);
      R(g, P.ink, x + 1, y + 6, 12, 1);
      R(g, P.white, x + 2, y + 2, 2, 2);
      R(g, P.ink, x - 1, y + 12, 16, 4);
      R(g, P.woodDark, x, y + 13, 14, 2);
      for (let i = 0; i < 5; i++) R(g, i % 2 ? P.red : P.yellow, x + 1 + i * 3, y + 10, 2, 2);
    };
    win(11, 46);
    win(55, 46);
    // 지붕 (기와)
    const top = 8, bottom = 40;
    for (let y = top; y <= bottom; y++) {
      const t = (y - top) / (bottom - top);
      const inset = Math.round(15 * (1 - t));
      const x0 = inset, w = W - inset * 2;
      R(g, P.ink, x0, y, w, 1);
      if (y === top || y === bottom) continue;
      const band = (y - top) % 5;
      R(g, band === 0 ? P.roofBlueDark : P.roofBlue, x0 + 1, y, w - 2, 1);
      if (band === 2) {
        const off = (Math.floor((y - top) / 5) % 2) * 3;
        for (let x = x0 + 3 + off; x < x0 + w - 3; x += 6) R(g, P.roofBlueLight, x, y, 2, 1);
      }
    }
    // 살짝 들린 처마 끝
    R(g, P.ink, 0, bottom - 3, 3, 3);
    R(g, P.ink, W - 3, bottom - 3, 3, 3);
    // 용마루
    R(g, P.ink, 13, top - 3, W - 26, 4);
    R(g, P.ridge, 14, top - 2, W - 28, 2);
    R(g, P.ink, 11, top - 5, 3, 3);
    R(g, P.ink, W - 14, top - 5, 3, 3);
    return c;
  }

  // 도서관 (배운 것): 책장이 보이는 큰 창. 바닥 6 x 4칸
  function library() {
    const W = 96, H = 88;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    R(g, P.shadow, 3, H - 4, 92, 4);
    // 벽돌 벽
    R(g, P.ink, 4, 38, 88, H - 41);
    R(g, P.brick, 5, 39, 86, H - 43);
    for (let y = 43, row = 0; y < H - 9; y += 5, row++) {
      R(g, P.brickLine, 5, y, 86, 1);
      for (let x = 5 + (row % 2) * 5; x < 91; x += 10) R(g, P.brickLine, x, y - 4, 1, 4);
    }
    R(g, P.stoneDark, 5, H - 9, 86, 6);
    R(g, P.stone, 5, H - 9, 86, 4);
    // 책장 창문
    const BOOKS = [P.red, P.yellow, P.roofTeal, P.roofBlue, P.white, P.woodLight];
    const shelf = (x, y, w, h) => {
      R(g, P.ink, x, y, w, h);
      R(g, P.interior, x + 1, y + 1, w - 2, h - 2);
      let k = 0;
      for (let sy = y + 1; sy + 6 <= y + h - 1; sy += 6) {
        R(g, P.woodDark, x + 1, sy + 5, w - 2, 1);
        for (let bx = x + 2; bx < x + w - 3;) {
          const bw = hash(bx, sy, 1) > 0.55 ? 3 : 2;
          const bh = hash(sy, bx, 2) > 0.5 ? 4 : 3;
          if (bx + bw > x + w - 2) break;
          R(g, BOOKS[k++ % BOOKS.length], bx, sy + 5 - bh, bw, bh);
          bx += bw + (hash(bx, sy, 3) > 0.8 ? 1 : 0);
        }
      }
      R(g, 'rgba(255,255,255,0.18)', x + 2, y + 2, 2, h - 4);
      R(g, P.ink, x + (w >> 1), y + 1, 1, h - 2);
    };
    shelf(13, 50, 23, 21);
    shelf(60, 50, 23, 21);
    // 아치 문
    R(g, P.ink, 39, 52, 18, H - 55);
    R(g, P.ink, 41, 50, 14, 2);
    R(g, P.ink, 43, 49, 10, 1);
    R(g, P.roofTealDark, 40, 53, 16, H - 58);
    R(g, P.roofTeal, 41, 54, 5, H - 61);
    R(g, P.roofTeal, 50, 54, 5, H - 61);
    R(g, P.ink, 47, 52, 2, H - 55);
    R(g, P.yellow, 45, 67, 1, 2);
    R(g, P.yellow, 50, 67, 1, 2);
    // 계단
    R(g, P.ink, 35, H - 6, 26, 4);
    R(g, P.stoneLight, 36, H - 5, 24, 1);
    R(g, P.stone, 36, H - 4, 24, 1);
    // 처마 띠
    R(g, P.ink, 0, 30, W, 10);
    R(g, P.roofTeal, 1, 31, W - 2, 8);
    R(g, P.roofTealLight, 1, 31, W - 2, 1);
    for (let x = 3; x < W - 2; x += 4) R(g, P.roofTealDark, x, 35, 2, 4);
    // 박공 (삼각 지붕)
    for (let y = 6; y <= 31; y++) {
      const half = Math.round((y - 6) * 1.25) + 2;
      R(g, P.ink, 48 - half, y, half * 2, 1);
      if (y > 7) R(g, (y - 6) % 6 === 0 ? P.roofTealDark : P.roofTeal, 49 - half, y, half * 2 - 2, 1);
    }
    // 책 간판
    R(g, P.ink, 39, 17, 18, 12);
    R(g, P.white, 40, 18, 16, 10);
    R(g, P.roofTeal, 42, 20, 5, 6);
    R(g, P.roofTeal, 49, 20, 5, 6);
    R(g, P.ink, 47, 19, 2, 8);
    return c;
  }

  // 작업실 (프로젝트): 굴뚝 있는 나무 공방. 바닥 5 x 4칸
  function workshop() {
    const W = 80, H = 84;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    R(g, P.shadow, 3, H - 4, 76, 4);
    // 굴뚝 (지붕 뒤)
    R(g, P.ink, 57, 6, 11, 28);
    R(g, P.stone, 58, 7, 9, 27);
    R(g, P.stoneLight, 58, 7, 9, 2);
    for (let y = 12; y < 32; y += 5) R(g, P.stoneDark, 58, y, 9, 1);
    // 판자 벽
    R(g, P.ink, 4, 38, 72, H - 41);
    R(g, P.wood, 5, 39, 70, H - 43);
    for (let x = 10; x < 75; x += 6) R(g, P.woodDark, x, 39, 1, H - 43);
    R(g, P.woodDark, 5, 39, 70, 3);
    // 슬레이트 지붕
    const top = 14, bottom = 42;
    for (let y = top; y <= bottom; y++) {
      const t = (y - top) / (bottom - top);
      const inset = Math.round(10 * (1 - t));
      const x0 = inset, w = W - inset * 2;
      R(g, P.ink, x0, y, w, 1);
      if (y === top || y === bottom) continue;
      R(g, (y - top) % 4 === 0 ? P.slateDark : P.slate, x0 + 1, y, w - 2, 1);
      if ((y - top) % 4 === 2) {
        for (let x = x0 + 2 + ((y >> 2) % 2) * 4; x < x0 + w - 2; x += 8) R(g, '#6c7588', x, y, 3, 1);
      }
    }
    R(g, P.ink, 9, top - 2, W - 18, 3);
    // 열린 작업장
    R(g, P.ink, 9, 50, 38, H - 53);
    R(g, P.interior, 10, 51, 36, H - 55);
    R(g, P.stoneLight, 13, 54, 6, 2); // 망치 머리
    R(g, P.woodLight, 15, 56, 2, 6); // 망치 자루
    R(g, P.stoneLight, 41, 54, 1, 8); // 자
    R(g, P.stoneLight, 39, 54, 5, 1);
    // 모니터
    R(g, P.ink, 21, 55, 15, 11);
    R(g, P.glass, 22, 56, 13, 8);
    R(g, P.white, 23, 57, 6, 1);
    R(g, P.yellow, 23, 59, 8, 1);
    R(g, P.white, 23, 61, 5, 1);
    R(g, P.ink, 27, 66, 3, 1);
    // 작업대
    R(g, P.ink, 11, 67, 34, 4);
    R(g, P.woodLight, 12, 68, 32, 2);
    R(g, P.woodDark, 13, 71, 2, H - 75);
    R(g, P.woodDark, 41, 71, 2, H - 75);
    // 창문
    R(g, P.ink, 54, 50, 15, 13);
    R(g, P.glass, 55, 51, 13, 11);
    R(g, P.glassDark, 55, 57, 13, 5);
    R(g, P.ink, 61, 51, 1, 11);
    R(g, P.white, 56, 52, 2, 2);
    // 톱니바퀴 간판
    for (const [dx, dy] of [[0, -6], [0, 6], [-6, 0], [6, 0], [-4, -4], [4, -4], [-4, 4], [4, 4]]) R(g, P.ink, 61 + dx - 1, 72 + dy - 1, 3, 3);
    disc(g, 61, 72, 5, P.ink);
    disc(g, 61, 72, 4, P.yellow);
    disc(g, 61, 72, 1, P.ink);
    return c;
  }

  // 등대 (걸어온 길): 빨강 흰색 줄무늬. 바닥 2 x 2칸
  function lighthouse() {
    const W = 32, H = 104;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    R(g, P.shadow, 2, H - 4, 28, 4);
    // 돌 기단
    R(g, P.ink, 2, H - 22, 28, 19);
    R(g, P.stone, 3, H - 21, 26, 17);
    R(g, P.stoneLight, 3, H - 21, 26, 2);
    for (let y = H - 16, i = 0; y < H - 4; y += 5, i++) {
      R(g, P.stoneDark, 3, y, 26, 1);
      for (let x = 6 + (i % 2) * 4; x < 28; x += 8) R(g, P.stoneDark, x, y - 4, 1, 4);
    }
    R(g, P.ink, 12, H - 15, 8, 12);
    R(g, P.woodDark, 13, H - 14, 6, 11);
    R(g, P.yellow, 17, H - 9, 1, 1);
    // 탑
    const t0 = 28, t1 = H - 22;
    for (let y = t0; y < t1; y++) {
      const k = (y - t0) / (t1 - t0);
      const half = Math.round(6 + k * 5);
      const x0 = 16 - half, w = half * 2;
      const red = Math.floor((y - t0) / 10) % 2 === 0;
      R(g, P.ink, x0, y, w, 1);
      R(g, red ? P.red : P.white, x0 + 1, y, w - 2, 1);
      R(g, red ? P.redDark : P.wallShade, x0 + w - 4, y, 3, 1);
    }
    R(g, P.ink, 14, 50, 4, 6);
    R(g, P.glass, 15, 51, 2, 4);
    R(g, P.ink, 14, 70, 4, 6);
    R(g, P.glass, 15, 71, 2, 4);
    // 난간
    R(g, P.ink, 6, 19, 20, 1);
    for (let x = 6; x <= 25; x += 4) R(g, P.ink, x, 19, 1, 5);
    R(g, P.ink, 5, 24, 22, 5);
    R(g, P.slate, 6, 25, 20, 3);
    // 등롱
    R(g, P.ink, 9, 11, 14, 13);
    R(g, P.yellow, 10, 12, 12, 11);
    R(g, P.white, 11, 13, 3, 5);
    R(g, P.ink, 15, 12, 2, 11);
    // 지붕
    R(g, P.ink, 7, 8, 18, 4);
    R(g, P.red, 8, 9, 16, 2);
    R(g, P.ink, 9, 5, 14, 3);
    R(g, P.red, 10, 6, 12, 2);
    R(g, P.ink, 12, 2, 8, 3);
    R(g, P.red, 13, 3, 6, 2);
    R(g, P.ink, 15, 0, 2, 2);
    return c;
  }

  // 평상 (좋아하는 것): 큰 정자나무 아래 평상과 수박. 바닥 3 x 2칸
  function pyeongsang() {
    const W = 48, H = 80;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    oval(g, 24, H - 4, 22, 3, P.shadow);
    // 줄기와 뿌리
    R(g, P.ink, 32, 34, 10, H - 38);
    R(g, P.trunk, 33, 34, 8, H - 39);
    R(g, P.trunkDark, 38, 34, 3, H - 39);
    R(g, P.ink, 29, H - 6, 16, 3);
    R(g, P.trunk, 30, H - 6, 14, 2);
    // 평상
    R(g, P.ink, 3, H - 14, 3, 11);
    R(g, P.ink, 25, H - 14, 3, 11);
    R(g, P.woodDark, 4, H - 14, 1, 10);
    R(g, P.woodDark, 26, H - 14, 1, 10);
    R(g, P.ink, 0, H - 22, 31, 9);
    R(g, P.woodLight, 1, H - 21, 29, 4);
    R(g, P.wood, 1, H - 17, 29, 3);
    for (let x = 6; x < 30; x += 6) R(g, P.woodDark, x, H - 21, 1, 4);
    // 수박과 찻잔
    R(g, P.ink, 5, H - 28, 12, 6);
    R(g, P.red, 6, H - 27, 10, 3);
    R(g, P.leaf1, 6, H - 24, 10, 1);
    R(g, P.ink, 9, H - 26, 1, 1);
    R(g, P.ink, 12, H - 26, 1, 1);
    R(g, P.ink, 20, H - 27, 6, 5);
    R(g, P.white, 21, H - 26, 4, 3);
    R(g, P.glassDark, 21, H - 26, 4, 1);
    // 잎
    const blobs = [[24, 20, 16], [10, 27, 10], [39, 25, 9], [26, 31, 11]];
    blobs.forEach(([x, y, r]) => disc(g, x, y, r + 1, P.ink));
    blobs.forEach(([x, y, r]) => disc(g, x, y, r, P.leaf1));
    blobs.forEach(([x, y, r]) => disc(g, x - 2, y - 3, Math.max(2, r - 5), P.leaf0));
    [[19, 11, 2], [29, 9, 2], [8, 22, 1], [37, 20, 1], [22, 24, 2], [14, 17, 1]].forEach(([x, y, r]) => disc(g, x, y, r, P.leaf2));
    return c;
  }

  // 마을 게시판 (방명록). 바닥 2 x 1칸
  function board() {
    const W = 32, H = 40;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    oval(g, 16, H - 3, 14, 2, P.shadow);
    R(g, P.ink, 4, 10, 4, H - 12);
    R(g, P.wood, 5, 10, 2, H - 13);
    R(g, P.ink, 24, 10, 4, H - 12);
    R(g, P.wood, 25, 10, 2, H - 13);
    R(g, P.ink, 0, 7, 32, 22);
    R(g, P.woodDark, 1, 8, 30, 20);
    R(g, P.wood, 2, 9, 28, 18);
    R(g, P.ink, 0, 3, 32, 5);
    R(g, P.roofTeal, 1, 4, 30, 3);
    R(g, P.roofTealLight, 1, 4, 30, 1);
    // 쪽지
    R(g, P.ink, 4, 11, 10, 11);
    R(g, P.white, 5, 12, 8, 9);
    R(g, P.slateLight, 6, 14, 6, 1);
    R(g, P.slateLight, 6, 16, 5, 1);
    R(g, P.slateLight, 6, 18, 6, 1);
    R(g, P.ink, 16, 10, 12, 8);
    R(g, P.yellow, 17, 11, 10, 6);
    R(g, P.yellowDark, 18, 13, 7, 1);
    R(g, P.yellowDark, 18, 15, 5, 1);
    R(g, P.ink, 17, 19, 10, 7);
    R(g, P.glass, 18, 20, 8, 5);
    R(g, P.white, 19, 22, 5, 1);
    R(g, P.red, 8, 11, 2, 1);
    R(g, P.red, 21, 10, 2, 1);
    return c;
  }

  // 우체통 (연락처). 바닥 1칸
  function mailbox() {
    const W = 16, H = 30;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    oval(g, 8, H - 2, 6, 1, P.shadow);
    R(g, P.ink, 6, 16, 4, H - 17);
    R(g, P.woodDark, 7, 16, 2, H - 18);
    R(g, P.ink, 2, 2, 12, 16);
    R(g, P.ink, 1, 4, 14, 13);
    R(g, P.red, 3, 3, 10, 14);
    R(g, P.red, 2, 5, 12, 11);
    R(g, P.redDark, 2, 13, 12, 3);
    R(g, P.ink, 4, 7, 8, 2);
    R(g, P.white, 6, 10, 4, 2);
    R(g, 'rgba(255,255,255,0.35)', 3, 4, 2, 6);
    return c;
  }

  // 방문자가 타고 오는 배
  function boat() {
    const W = 40, H = 22;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    for (let y = 12; y <= 20; y++) {
      const k = y - 12;
      const x0 = 2 + Math.floor(k * 0.6);
      const x1 = 38 - Math.floor(k * 1.2);
      R(g, P.ink, x0, y, x1 - x0, 1);
      if (y > 12 && y < 20) R(g, y < 16 ? P.white : P.roofBlue, x0 + 1, y, x1 - x0 - 2, 1);
    }
    R(g, P.ink, 6, 1, 17, 2);
    R(g, P.ink, 7, 3, 15, 9);
    R(g, P.white, 8, 4, 13, 7);
    R(g, P.red, 7, 2, 15, 1);
    R(g, P.ink, 10, 5, 4, 3);
    R(g, P.glass, 11, 6, 2, 1);
    R(g, P.ink, 15, 5, 4, 3);
    R(g, P.glass, 16, 6, 2, 1);
    R(g, P.ink, 28, 0, 1, 12);
    R(g, P.red, 29, 1, 5, 3);
    return c;
  }

  /* ---------- 자연물 ---------- */

  function broadTree(seed) {
    const r = rng(seed);
    const W = 20, H = 28;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    oval(g, 10, H - 3, 7, 2, P.shadow);
    R(g, P.ink, 8, 16, 5, H - 18);
    R(g, P.trunk, 9, 16, 3, H - 19);
    R(g, P.trunkDark, 11, 16, 1, H - 19);
    disc(g, 10, 10, 9, P.ink);
    disc(g, 10, 10, 8, P.leaf1);
    disc(g, 8, 8, 5, P.leaf0);
    for (let i = 0; i < 5; i++) R(g, P.leaf2, 4 + Math.floor(r() * 9), 4 + Math.floor(r() * 8), 2, 1);
    return c;
  }

  // 바닷가 해송
  function pineTree(seed) {
    const r = rng(seed);
    const W = 26, H = 32;
    const c = makeCanvas(W, H), g = c.getContext('2d');
    oval(g, 13, H - 3, 7, 2, P.shadow);
    const lean = r() > 0.5 ? 1 : -1;
    for (let y = 12; y < H - 3; y++) {
      const x = 12 + Math.round(Math.sin((H - 3 - y) / 7) * 1.6 * lean);
      R(g, P.ink, x - 1, y, 4, 1);
      R(g, P.trunk, x, y, 2, 1);
    }
    const tufts = [[13, 6, 8, 4], [8, 13, 6, 3], [18, 13, 6, 3]];
    tufts.forEach(([x, y, rx, ry]) => oval(g, x, y, rx + 1, ry + 1, P.ink));
    tufts.forEach(([x, y, rx, ry]) => oval(g, x, y, rx, ry, P.pine1));
    tufts.forEach(([x, y, rx, ry]) => oval(g, x - 1, y - 1, rx - 2, Math.max(1, ry - 2), P.pine0));
    tufts.forEach(([x, y, rx]) => R(g, P.pine2, x - Math.floor(rx / 2), y - 2, 3, 1));
    return c;
  }

  function rock() {
    const c = makeCanvas(16, 14), g = c.getContext('2d');
    oval(g, 8, 11, 7, 2, P.shadow);
    oval(g, 8, 8, 7, 5, P.ink);
    oval(g, 8, 8, 6, 4, P.stone);
    oval(g, 7, 9, 5, 2, P.stoneDark);
    oval(g, 6, 6, 3, 1, P.stoneLight);
    return c;
  }

  // 현무암 돌담
  function stoneWall(seed) {
    const r = rng(seed);
    const c = makeCanvas(16, 18), g = c.getContext('2d');
    R(g, P.shadow, 0, 15, 16, 3);
    for (let row = 0; row < 3; row++) {
      const y = 6 + row * 4;
      for (let x = row % 2 ? -2 : 1; x < 16; x += 6) {
        oval(g, x + 3, y, 3, 2, P.ink);
        oval(g, x + 3, y, 2, 1, P.basalt);
        R(g, P.basaltHole, x + 2 + Math.floor(r() * 2), y, 1, 1);
      }
    }
    return c;
  }

  /* ---------- 아이콘 (12 x 12) ---------- */

  const ICON_MAP = {
    o: P.ink, w: P.white, b: P.roofBlue, l: P.glass, n: P.wood, y: P.yellow,
    r: P.red, t: P.roofTeal, k: P.slateLight, g: P.leaf0, s: P.slate,
  };
  const ICON_ROWS = {
    home: [
      '............',
      '.....oo.....',
      '....obbo....',
      '...obbbbo...',
      '..obbbbbbo..',
      '.oooooooooo.',
      '.owwwwwwwwo.',
      '.owllwwnnwo.',
      '.owllwwnnwo.',
      '.owwwwwnnwo.',
      '.oooooooooo.',
      '............',
    ],
    library: [
      '............',
      '............',
      '.oooo..oooo.',
      'owwwwoowwwwo',
      'owkkwoowkkwo',
      'owwwwoowwwwo',
      'owkkwoowkkwo',
      'owwwwoowwwwo',
      'otttttttttto',
      '.oooooooooo.',
      '............',
      '............',
    ],
    workshop: [
      '............',
      '.oooooooooo.',
      '.ollllllllo.',
      '.olwwwwlllo.',
      '.ollyyyyllo.',
      '.olwwwllllo.',
      '.ollllllllo.',
      '.oooooooooo.',
      '.....oo.....',
      '...oooooo...',
      '............',
      '............',
    ],
    lighthouse: [
      '.....yy.....',
      '....oyyo....',
      '....oooo....',
      '....orro....',
      '....owwo....',
      '...orrrro...',
      '...owwwwo...',
      '...orrrro...',
      '..owwwwwwo..',
      '..oooooooo..',
      '.osssssssso.',
      '.oooooooooo.',
    ],
    pyeongsang: [
      '............',
      '............',
      '............',
      'oooooooooooo',
      'orrorrrrorro',
      'orrrrrorrrro',
      '.orrrrrrrro.',
      '.owwwwwwwwo.',
      '..oggggggo..',
      '...oooooo...',
      '............',
      '............',
    ],
    mailbox: [
      '............',
      '............',
      'oooooooooooo',
      'oowwwwwwwwoo',
      'owowwwwwwowo',
      'owwowwwwowwo',
      'owwwowwowwwo',
      'owwwwoowwwwo',
      'owwwwwwwwwwo',
      'oooooooooooo',
      '............',
      '............',
    ],
    board: [
      '.oooooooooo.',
      '.owwwwwwwwo.',
      '.owkkkkkkwo.',
      '.owwwwwwwwo.',
      '.owkkkkkkwo.',
      '.owwwwwwwwo.',
      '.owkkkkwwwo.',
      '.owwwwwwwwo.',
      '.oooooooooo.',
      '....o..o....',
      '....o..o....',
      '............',
    ],
    boat: [
      '............',
      '......o.....',
      '......orr...',
      '......o.....',
      '..ooooooo...',
      '..owwlwwo...',
      'oooooooooooo',
      'owwwwwwwwwwo',
      '.obbbbbbbbo.',
      '..oooooooo..',
      '............',
      '............',
    ],
  };
  const icons = {};
  Object.keys(ICON_ROWS).forEach((k) => { icons[k] = fromStrings(ICON_ROWS[k], ICON_MAP); });

  const arrow = fromStrings([
    'ooooooo',
    'oyyyyyo',
    '.oyyyo.',
    '..oyo..',
    '...o...',
  ], { o: P.ink, y: P.yellow });

  const marker = fromStrings([
    '...yyyyy...',
    '.yy.....yy.',
    'y.........y',
    '.yy.....yy.',
    '...yyyyy...',
  ], { y: P.yellow });

  function badge() {
    const c = makeCanvas(21, 21), g = c.getContext('2d');
    disc(g, 10, 10, 10, P.ink);
    disc(g, 10, 10, 8, P.white);
    return c;
  }

  function footShadow() {
    const c = makeCanvas(12, 4), g = c.getContext('2d');
    oval(g, 6, 2, 5, 1, P.shadow);
    return c;
  }

  window.Art = {
    P, makeCanvas, R, oval, disc, fromStrings, flip, rng, hash,
    character, house, library, workshop, lighthouse, pyeongsang, board, mailbox, boat,
    broadTree, pineTree, rock, stoneWall,
    icons, arrow, marker, badge: badge(), footShadow: footShadow(),
  };
})();
