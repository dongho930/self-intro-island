# 그림 파일 만들기 (Codex CLI + gpt-image-2)

`images/` 폴더의 그림 8장은 Codex CLI의 이미지 생성 기능으로 만들었습니다.
섬 지도, 캐릭터, 건물, 아이콘은 `js/art.js`에서 코드로 그리므로 여기에 없습니다.

| 파일 | 쓰는 곳 | 크기 |
|---|---|---|
| `images/portrait.png` | 장소 창 말풍선의 얼굴, 한눈에 보기의 얼굴 | 192×192 |
| `images/place-home.png` 외 5장 | 장소 창 맨 위 장면 그림 (집, 도서관, 작업실, 등대, 평상, 우체통) | 256×128 (화면에서는 픽셀을 그대로 키워 보여 줌) |
| `images/og.png` | 링크 미리보기 (`index.html`의 `og:image`) | 1200×630 |

## 만드는 방법

1. Codex CLI를 설치하고 ChatGPT 계정으로 로그인합니다.
   ```
   npm install -g @openai/codex
   codex login
   ```
2. 빈 작업 폴더에서 그림 한 장씩 요청합니다. 프로젝트 폴더가 아닌 곳에서 실행해야 사이트 파일이 바뀌지 않습니다.
   ```
   codex exec -C <빈 폴더> -s workspace-write --skip-git-repo-check --ephemeral -i ref-portrait.png '$imagegen <장면 설명> <공통 스타일> Save the final image as <파일 이름>.png in the current working directory.'
   ```
   - `$imagegen`: 이미지 생성 기능을 쓰라는 표시
   - `-i ref-portrait.png`: 얼굴 그림을 참고 이미지로 넣어 그림체와 색을 맞춤
   - 이미지 생성은 ChatGPT 구독의 Codex 사용 한도에서 차감됩니다.
3. 원본(1536×1024, 1~2MB)은 사이트에 넣지 않고, 크기를 줄여 `images/`에 넣습니다.
   - 장면 그림: 가운데를 2:1로 자른 뒤 256×128 픽셀 격자로 줄임. 화면에서는 `image-rendering: pixelated`로 키워서 맵과 같은 픽셀 느낌을 냄
   - 얼굴: 192×192로 부드럽게 줄임 (격자로 줄이면 원본 격자와 어긋나 흐려졌음)
   - 링크 미리보기: 1.91:1로 자른 뒤 400×210 격자로 줄이고, 3배 키워 1200×630으로 저장
   - 줄이는 데는 Windows에 들어 있는 .NET `System.Drawing`을 썼습니다. 따로 설치할 것이 없습니다.

## 공통 스타일 (모든 장면 프롬프트 끝에 붙임)

```
Pixel art in the style of a cozy 16-bit 2D RPG. Crisp square pixels on a coarse grid of about 192x128 pixels,
hard edges, flat colors, no anti-aliasing, no gradients, no blur, no dithering noise. No text, no letters,
no numbers, no UI, no border, no frame, no watermark, no people. Limited palette that matches Image 1
(the attached reference, used only for pixel style and palette): dark navy outlines #1d2340,
sea blues #226b9a #2c7fae #4aa3c8, grass greens #7dbb5c #649f48, sand #ecd7a0, warm wood #a8754a #7a5233,
white #ffffff, sunny yellow #ffd23f, stamp red #d6453d, roof blue #3a66c9, teal #2f8f84.
Wide 3:2 landscape image. Keep the main subject in the middle band so the image can be cropped
to a 2:1 banner without losing it.
```

색 코드는 `js/art.js`의 팔레트(`P`)와 같습니다.

## 그림별 프롬프트

**얼굴 (`portrait.png`)**: 참고 이미지 없이 처음 만든 그림이고, 나머지 그림의 참고 이미지가 됩니다.
```
Create a pixel art portrait of the friendly host of a small island village from a cozy top-down 2D RPG.
Head and shoulders, facing forward, gentle smile. Short neat black hair with slight bangs, light warm skin,
plain white t-shirt. Look: a 32x32 pixel sprite upscaled crisply with hard square pixel edges,
no anti-aliasing, no gradients, no blur. Limited palette: dark navy outline #1d2340, skin #f3c9a1,
white #ffffff, accent blue #3a66c9, flat solid background #4aa3c8. Square 1:1 image.
No text, no border, no watermark.
```

**집 (`place-home.png`)**
```
Cozy interior of a small island cottage seen from the side: wooden floor, a desk under a window that shows
the blue sea, a small bookshelf, a potted plant, a neatly made bed with a blue blanket, a rug,
warm afternoon sunlight.
```

**도서관 (`place-library.png`)**
```
Inside a small village library: tall wooden bookshelves full of colorful books, a reading table with
an open notebook, a laptop and a mug, a rolling ladder, a round window with soft sunlight.
```

**작업실 (`place-workshop.png`)**
```
Inside a cozy maker workshop: a wooden workbench with a laptop whose screen shows a tiny pixel game,
a second monitor with code, tools hanging on a pegboard wall, sketches of pixel characters pinned to the wall,
a desk lamp, a small potted cactus.
```

**등대 (`place-lighthouse.png`)**
```
View from the top balcony of a white lighthouse on a small island: a red railing in the foreground,
a wide calm blue sea with small sparkles, small distant islands and a little sailing boat,
a few soft clouds, warm late-afternoon sky.
```

**평상 (`place-pyeongsang.png`)**: 취미(게임, 운동, 노래 감상)를 소품으로 넣었습니다.
```
A traditional Korean wooden pyeongsang (a low raised wooden platform for resting) under a big shady tree
near the beach. On it: a game controller, a pair of headphones, a pair of sneakers and a plate of
sliced watermelon. Blue sea in the background, bright summer day.
```

**우체통 (`place-mailbox.png`)**
```
A red village mailbox on a wooden post beside a sandy path, a few letters peeking out of it,
a small flower bed, a wooden pier and the blue sea in the background, bright clear day.
```

**링크 미리보기 (`og.png`)**
```
Wide establishing shot of a small cozy island village from a high three-quarter view: a cottage with
a blue roof, a library with a teal roof, a small workshop, a white lighthouse on the right cliff,
a wooden pier with a small white boat, sandy beach, round green trees, calm blue sea all around.
Bright and welcoming.
```
