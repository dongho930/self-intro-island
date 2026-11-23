/*
 * 방명록 저장소
 * - 미리보기 모드: config.js가 비어 있으면 이 브라우저의 localStorage에만 저장합니다.
 * - AppSync 모드: config.js에 주소와 API 키가 있으면 AppSync(GraphQL)로 조회하고 저장합니다.
 *   (AppSync 쪽 스키마는 다음 단계에서 만듭니다. 아래 쿼리 이름은 기획서 기준입니다.)
 */
(function () {
  'use strict';

  const cfg = (window.APP_CONFIG && window.APP_CONFIG.guestbook) || {};
  const remote = Boolean(cfg.endpoint && cfg.apiKey);
  const LOCAL_KEY = 'island-guestbook-preview';
  const PAGE = 20;
  const LIMITS = { nickname: 12, message: 100 };

  const Q_LIST = 'query ListMessages($limit: Int, $nextToken: String) {'
    + ' listMessages(limit: $limit, nextToken: $nextToken) { items { id nickname message createdAt } nextToken } }';
  const M_CREATE = 'mutation CreateMessage($nickname: String!, $message: String!) {'
    + ' createMessage(nickname: $nickname, message: $message) { id nickname message createdAt } }';

  async function gql(query, variables) {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.apiKey },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.errors && json.errors.length) throw new Error(json.errors[0].message);
    return json.data;
  }

  function readLocal() {
    try {
      const items = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(items) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }

  const length = (s) => Array.from(s).length;

  window.Guestbook = {
    mode: remote ? 'remote' : 'preview',
    limits: LIMITS,

    validate(nickname, message) {
      const n = String(nickname || '').trim();
      const m = String(message || '').trim();
      return {
        nickname: n,
        message: m,
        ok: length(n) >= 1 && length(n) <= LIMITS.nickname && length(m) >= 1 && length(m) <= LIMITS.message,
      };
    },

    // 최신순으로 20개씩. { items, nextToken, total }
    async list(nextToken) {
      if (remote) {
        const data = await gql(Q_LIST, { limit: PAGE, nextToken: nextToken || null });
        const page = data.listMessages || { items: [], nextToken: null };
        return { items: page.items || [], nextToken: page.nextToken || null, total: null };
      }
      const all = readLocal().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const start = Number(nextToken) || 0;
      const items = all.slice(start, start + PAGE);
      const next = start + PAGE < all.length ? String(start + PAGE) : null;
      return { items, nextToken: next, total: all.length };
    },

    async create(nickname, message) {
      const v = this.validate(nickname, message);
      if (!v.ok) throw new Error('invalid');
      if (remote) {
        const data = await gql(M_CREATE, { nickname: v.nickname, message: v.message });
        return data.createMessage;
      }
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        nickname: v.nickname,
        message: v.message,
        createdAt: new Date().toISOString(),
      };
      const all = readLocal();
      all.push(item);
      writeLocal(all);
      return item;
    },
  };
})();
