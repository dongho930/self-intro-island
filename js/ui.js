/*
 * 화면 위의 글과 창 (시작 화면, 스탬프, 대화창, 장소 창, 한눈에 보기, 방명록)
 * 내용은 content.js에서 읽고, 모든 글은 textContent로 넣어서 HTML이 실행되지 않게 합니다.
 */
(function () {
  'use strict';

  const C = window.SITE_CONTENT;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 작은 도구 ---------- */

  // 배열이 섞여 있어도 펼쳐서 붙입니다. (append는 배열을 글자로 바꿔 버리기 때문)
  function add(parent, ...kids) {
    kids.flat(Infinity).forEach((kid) => {
      if (kid == null || kid === false) return;
      parent.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    });
    return parent;
  }

  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    return add(node, kids);
  }

  function safeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function link(label, url) {
    const href = safeUrl(url);
    if (!href) return el('span', { text: label });
    const external = /^https?:/.test(href);
    return el('a', { href, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null, text: label });
  }

  const iconCache = {};
  function iconUrl(id) {
    if (!iconCache[id]) iconCache[id] = window.Art.icons[id].toDataURL();
    return iconCache[id];
  }

  let portrait = null;
  function portraitUrl() {
    if (!portrait) {
      const sheet = window.Art.character({ hair: window.Art.P.ink, shirt: window.Art.P.white, pants: window.Art.P.roofBlue, shoes: window.Art.P.ink });
      portrait = sheet.down[0].toDataURL();
    }
    return portrait;
  }

  const islandName = () => `${C.profile.name}의 섬`;
  const clampLevel = (n) => Math.max(1, Math.min(5, Math.round(Number(n) || 1)));
  const byDateDesc = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));
  const byYearDesc = (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);

  function section(title, ...kids) {
    return el('section', { class: 'sec' }, el('h3', { class: 'sec__title', text: title }), kids);
  }

  function sayBlock(text) {
    if (!text) return null;
    return el('div', { class: 'say' },
      el('img', { class: 'px say__face', src: portraitUrl(), alt: '', width: 48, height: 48 }),
      el('p', { class: 'say__text', text }));
  }

  function facts(list) {
    const dl = el('dl', { class: 'facts' });
    (list || []).forEach((f) => dl.append(el('dt', { text: f.label }), el('dd', {}, f.node || f.value)));
    return dl;
  }

  function chips(list) {
    return el('ul', { class: 'chips' }, (list || []).map((t) => el('li', { text: t })));
  }

  function skills(list) {
    return el('ul', { class: 'skills' }, (list || []).map((s) => {
      const lv = clampLevel(s.level);
      return el('li', { class: 'skill' },
        el('span', { class: 'skill__name', text: s.name }),
        el('span', { class: 'meter', role: 'img', 'aria-label': `5단계 중 ${lv}단계` },
          [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= lv ? 'on' : null }))));
    }));
  }

  function timeline(list) {
    return el('ol', { class: 'timeline' }, (list || []).slice().sort(byYearDesc).map((t) =>
      el('li', {}, el('span', { class: 'timeline__year', text: t.year }), el('span', { text: t.text }))));
  }

  function contacts() {
    return el('ul', { class: 'contacts' }, (C.contacts || []).map((c) =>
      el('li', {}, el('span', { class: 'contacts__label', text: c.label }), link(c.value, c.url))));
  }

  function projects() {
    return (C.projects || []).slice().sort(byDateDesc).slice(0, 6);
  }

  function relativeTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const sec = (Date.now() - d.getTime()) / 1000;
    if (sec < 60) return '방금';
    if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
    if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}일 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ---------- 장소별 내용 (S03~S09) ---------- */

  const RENDER = {
    home(body, place) {
      const p = C.profile;
      add(body, 
        sayBlock(place.intro || p.greeting),
        el('p', { class: 'name-big', text: p.name }),
        el('p', { class: 'lede', text: p.tagline }),
        (p.about || []).map((t) => el('p', { text: t })),
        facts(p.facts));
    },

    library(body, place) {
      add(body, 
        sayBlock(place.intro),
        section('학력', el('ul', { class: 'rows' }, (C.education || []).map((e) =>
          el('li', {}, el('span', { class: 'rows__when', text: e.period }),
            el('span', {}, el('strong', { text: e.school }), e.detail ? ` ${e.detail}` : ''))))),
        section('기술', skills(C.skills)),
        section('자격증', el('ul', { class: 'rows' }, (C.certificates || []).map((c) =>
          el('li', {}, el('span', { class: 'rows__when', text: c.date }), el('strong', { text: c.name }))))),
        section('수강 과목', chips(C.courses)));
    },

    workshop(body, place) {
      add(body, sayBlock(place.intro), projects().map((pr) => el('article', { class: 'project' },
        el('h3', { class: 'project__title', text: pr.title }),
        facts([
          { label: '기간', value: pr.period },
          { label: '맡은 역할', value: pr.role },
          { label: '사용 기술', node: chips(pr.tech) },
          { label: '결과', value: pr.result },
        ]),
        pr.links && pr.links.length ? el('p', { class: 'links' }, pr.links.map((l) => link(l.label, l.url))) : null)));
    },

    lighthouse(body, place) {
      add(body, 
        sayBlock(place.intro),
        section('걸어온 길', timeline(C.timeline)),
        section('앞으로의 목표', el('ul', { class: 'goals' }, (C.goals || []).map((g) => el('li', { text: g })))));
    },

    pyeongsang(body, place) {
      add(body, 
        sayBlock(place.intro),
        el('ul', { class: 'hobbies' }, (C.hobbies || []).map((h) =>
          el('li', {}, el('strong', { text: h.name }), el('span', { text: h.desc })))));
    },

    mailbox(body, place) {
      add(body, sayBlock(place.intro), contacts(), C.contactNote ? el('p', { class: 'muted note', text: C.contactNote }) : null);
    },

    board(body, place) {
      add(body, sayBlock(place.intro));
      renderGuestbook(body);
    },
  };

  /* ---------- 방명록 (S09) ---------- */

  function renderGuestbook(body) {
    const GB = window.Guestbook;
    const L = GB.limits;
    let busy = false;
    let nextToken = null;
    let total = null;

    const nameIn = el('input', { id: 'gb-name', type: 'text', maxlength: L.nickname, autocomplete: 'nickname', required: true });
    const msgIn = el('textarea', { id: 'gb-msg', maxlength: L.message, rows: 3, required: true });
    const nameCount = el('span', { class: 'count' });
    const msgCount = el('span', { class: 'count' });
    const submit = el('button', { class: 'btn btn--primary', type: 'submit', disabled: true, text: '방명록 남기기' });
    const status = el('p', { class: 'gb-status', role: 'status' });
    const list = el('ul', { class: 'gb-list' });
    const empty = el('p', { class: 'gb-empty', text: '아직 방명록이 없어요. 첫 방명록을 남겨 보세요.', hidden: true });
    const totalEl = el('p', { class: 'gb-total', hidden: true });
    const more = el('button', { class: 'btn', type: 'button', text: '더 보기', hidden: true });

    function sync() {
      const v = GB.validate(nameIn.value, msgIn.value);
      nameCount.textContent = `${Array.from(nameIn.value).length}/${L.nickname}`;
      msgCount.textContent = `${Array.from(msgIn.value).length}/${L.message}`;
      submit.disabled = busy || !v.ok;
    }

    function entry(item) {
      return el('li', {},
        el('p', { class: 'gb-head' },
          el('strong', { text: item.nickname }),
          el('time', { datetime: item.createdAt, text: relativeTime(item.createdAt) })),
        el('p', { class: 'gb-msg', text: item.message }));
    }

    function showTotal() {
      totalEl.hidden = total == null;
      if (total != null) totalEl.textContent = `방명록 ${total}개`;
    }

    async function load() {
      more.disabled = true;
      try {
        const page = await GB.list(nextToken);
        page.items.forEach((i) => list.append(entry(i)));
        nextToken = page.nextToken;
        total = page.total;
        more.hidden = !nextToken;
        empty.hidden = list.children.length > 0;
        showTotal();
      } catch (e) {
        status.textContent = '방명록을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.';
      } finally {
        more.disabled = false;
      }
    }

    const form = el('form', { class: 'gb-form', novalidate: true },
      el('div', { class: 'field' },
        el('label', { for: 'gb-name' }, el('span', { text: '닉네임' }), nameCount),
        nameIn),
      el('div', { class: 'field' },
        el('label', { for: 'gb-msg' }, el('span', { text: '메시지' }), msgCount),
        msgIn),
      el('div', { class: 'gb-actions' }, submit),
      status);

    form.addEventListener('input', sync);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = GB.validate(nameIn.value, msgIn.value);
      if (!v.ok || busy) return;
      busy = true;
      sync();
      status.textContent = '저장하는 중이에요.';
      try {
        const item = await GB.create(v.nickname, v.message);
        list.prepend(entry(item));
        empty.hidden = true;
        if (total != null) total += 1;
        showTotal();
        form.reset();
        status.textContent = '방명록을 남겼습니다.';
      } catch (err) {
        status.textContent = '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.';
      } finally {
        busy = false;
        sync();
      }
    });
    more.addEventListener('click', load);

    add(body,
      GB.mode === 'preview'
        ? el('p', { class: 'notice', text: '미리보기 모드예요. 지금은 방명록이 이 브라우저에만 저장되고, AppSync를 연결하면 모든 방문자에게 보여요.' })
        : null,
      form,
      section('최근 방명록', totalEl, list, empty, more));
    sync();
    load();
  }

  /* ---------- 한눈에 보기 (S10) ---------- */

  function renderSheet(body) {
    const p = C.profile;
    body.replaceChildren(el('div', { class: 'sheet' },
      el('aside', { class: 'sheet__card' },
        el('img', { class: 'px sheet__portrait', src: portraitUrl(), alt: '', width: 96, height: 96 }),
        el('p', { class: 'sheet__name', text: p.name }),
        el('p', { class: 'sheet__job' }, el('span', { class: 'lv', text: `Lv. ${p.level}` }), el('span', { text: p.job })),
        el('p', { class: 'sheet__tagline', text: p.tagline }),
        facts((p.facts || []).concat((C.education || []).map((e) => ({ label: '학력', value: `${e.school} ${e.detail || ''}`.trim() })))),
        section('연락처', contacts())),
      el('div', { class: 'sheet__main' },
        section('능력치', skills(C.skills)),
        section('프로젝트', el('ul', { class: 'mini-projects' }, projects().map((pr) => el('li', {},
          el('p', { class: 'mini-projects__head' }, el('strong', { text: pr.title }), el('span', { class: 'muted', text: pr.period })),
          el('p', { text: pr.role }),
          chips(pr.tech))))),
        section('걸어온 길', timeline(C.timeline)),
        section('좋아하는 것', chips((C.hobbies || []).map((h) => h.name))))));
  }

  /* ---------- 창 열고 닫기 ---------- */

  const panel = $('panel');
  const sheet = $('sheet');
  let panelClose = null;
  let sheetClose = null;

  [panel, sheet].forEach((dlg) => {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  });
  panel.addEventListener('close', () => { const cb = panelClose; panelClose = null; if (cb) cb(); });
  sheet.addEventListener('close', () => { const cb = sheetClose; sheetClose = null; if (cb) cb(); });

  function openPlace(place, opts) {
    $('panel-title').textContent = place.name;
    $('panel-sub').textContent = place.label;
    $('panel-icon').src = iconUrl(place.id);
    const stamp = $('panel-stamp');
    stamp.hidden = !opts.firstVisit;
    stamp.classList.remove('is-new');
    if (opts.firstVisit && !reduceMotion()) {
      void stamp.offsetWidth;
      stamp.classList.add('is-new');
    }
    const body = $('panel-body');
    body.replaceChildren();
    RENDER[place.id](body, place);
    panelClose = opts.onClose;
    panel.showModal();
    body.scrollTop = 0;
  }

  function openSheet(onClose) {
    renderSheet($('sheet-body'));
    sheetClose = onClose;
    sheet.showModal();
    $('sheet-body').scrollTop = 0;
  }

  /* ---------- 시작 화면, 스탬프, 살펴보기 버튼 ---------- */

  let stampPlaces = [];

  function initStart(handlers) {
    document.title = islandName();
    $('start-title').textContent = islandName();
    $('start-dest').textContent = islandName();
    $('start-tagline').textContent = C.profile.tagline;
    $('route-boat').src = iconUrl('boat');
    $('hud-name').textContent = islandName();
    const d = new Date();
    $('stub-date').textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    $('btn-start').addEventListener('click', handlers.onStart);
    document.querySelectorAll('[data-open-sheet]').forEach((b) => b.addEventListener('click', handlers.onSheet));
    $('prompt-btn').addEventListener('click', () => { if (promptPlace) handlers.onPrompt(promptPlace); });
    $('talk').addEventListener('click', advanceTalk);
  }

  function hideStart() {
    $('start').hidden = true;
  }

  function showHud(places, visited) {
    stampPlaces = places;
    const box = $('stamps');
    box.replaceChildren();
    add(box,
      places.map((p) => el('span', { class: 'stamp', 'data-id': p.id, title: `${p.name} (${p.label})` },
        el('img', { class: 'px', src: iconUrl(p.id), alt: '', width: 24, height: 24 }))),
      el('span', { class: 'stamps__count', id: 'stamp-count' }));
    updateStamps(visited);
    $('hud').hidden = false;
  }

  function updateStamps(visited, newId) {
    let n = 0;
    stampPlaces.forEach((p) => {
      const slot = document.querySelector(`.stamp[data-id="${p.id}"]`);
      if (!slot) return;
      const on = visited.has(p.id);
      if (on) n++;
      slot.classList.toggle('is-on', on);
      if (p.id === newId && !reduceMotion()) {
        slot.classList.remove('is-new');
        void slot.offsetWidth;
        slot.classList.add('is-new');
      }
    });
    const count = $('stamp-count');
    if (count) count.textContent = `${n} / ${stampPlaces.length}`;
    const seen = stampPlaces.filter((p) => visited.has(p.id)).map((p) => p.name);
    $('stamps').setAttribute('aria-label', `스탬프 ${n} / ${stampPlaces.length}${seen.length ? `, 방문한 곳: ${seen.join(', ')}` : ''}`);
  }

  let promptPlace = null;
  function setPrompt(place) {
    promptPlace = place;
    refreshPrompt();
  }
  function refreshPrompt() {
    const box = $('prompt');
    if (!promptPlace || talk) {
      box.hidden = true;
      return;
    }
    $('prompt-label').textContent = `${promptPlace.name} 살펴보기`;
    $('prompt-icon').src = iconUrl(promptPlace.id);
    box.hidden = false;
  }

  /* ---------- 대화창 ---------- */

  let talk = null;

  function say(lines, who) {
    return new Promise((resolve) => {
      if (talk) finishTalk();
      talk = { lines, i: 0, timer: null, typing: false, resolve };
      $('talk-who').textContent = who || C.profile.name;
      $('talk').hidden = false;
      refreshPrompt();
      showLine();
    });
  }

  function showLine() {
    const text = talk.lines[talk.i];
    clearInterval(talk.timer);
    $('talk-live').textContent = text;
    $('talk-next').textContent = talk.i < talk.lines.length - 1 ? '다음' : '닫기';
    const out = $('talk-text');
    if (reduceMotion()) {
      out.textContent = text;
      talk.typing = false;
      return;
    }
    let n = 0;
    talk.typing = true;
    out.textContent = '';
    talk.timer = setInterval(() => {
      n += 1;
      out.textContent = text.slice(0, n);
      if (n >= text.length) {
        clearInterval(talk.timer);
        talk.typing = false;
      }
    }, 24);
  }

  function advanceTalk() {
    if (!talk) return;
    if (talk.typing) {
      clearInterval(talk.timer);
      $('talk-text').textContent = talk.lines[talk.i];
      talk.typing = false;
      return;
    }
    talk.i += 1;
    if (talk.i >= talk.lines.length) finishTalk();
    else showLine();
  }

  function finishTalk() {
    if (!talk) return;
    clearInterval(talk.timer);
    const done = talk.resolve;
    talk = null;
    $('talk').hidden = true;
    refreshPrompt();
    done();
  }

  window.UI = {
    initStart, hideStart, showHud, updateStamps, setPrompt,
    openPlace, openSheet, say, advanceTalk,
    endTalk: finishTalk,
    isTalking: () => Boolean(talk),
    isDialogOpen: () => panel.open || sheet.open,
  };
})();
