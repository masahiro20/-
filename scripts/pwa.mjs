// PWA（ホーム画面に追加・電波が弱いときも開ける）に必要なファイルを作る。build.mjs から使う。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

// site/ の中身（sw.js 自身は除く）から版を作る。中身が変わったときだけ版が変わる
export function buildVersion(OUT) {
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (name !== 'files') walk(p); continue; }
      const rel = relative(OUT, p);
      if (rel === 'sw.js') continue;
      h.update(rel + '\0');
      h.update(readFileSync(p));
    }
  };
  walk(OUT);
  return h.digest('hex').slice(0, 12);
}

export function manifestJson(CONFIG) {
  return JSON.stringify({
    name: CONFIG.siteName,
    short_name: 'おたすけ帳',
    description: '福祉の書類を無料でかんたんに。入力内容は端末の外に出ません。',
    lang: 'ja',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1f5c4a',
    background_color: '#fdf6ea',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }, null, 2) + '\n';
}

export function swSource(version) {
  return `// ふくしのおたすけ帳 Service Worker（build.mjs が作る。手で直さない）
// ページ：ネットワーク優先（3.5秒で返事がなければ、前に開いたときの写し）。部品（CSS/JS/画像）：写し優先＋裏で更新。
// 版（VERSION）はビルドごとに変わる。新しい版が動き出すと、古い版の写しはすべて消える。
var VERSION = '${version}';
var CACHE = 'otasuke-' + VERSION;
var PRECACHE = ['/offline.html', '/manifest.webmanifest', '/assets/style.css', '/assets/common.js', '/assets/img/icon-192.png'];
var STATIC_RE = /\\.(?:css|js|png|jpe?g|gif|webp|svg|ico|woff2?|webmanifest)$/i;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 失敗しても止めない（1つ取れなくても入れる）
      return Promise.all(PRECACHE.map(function (u) {
        return fetch(u, { cache: 'reload' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function put(req, res) {
  if (!res || !res.ok || res.type !== 'basic') return res;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
  return res;
}

function pageHandler(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
    }, 3500);
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      clearTimeout(timer);
      if (res.ok) put(req, res.clone());
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      if (done) return;
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) { done = true; return resolve(hit); }
        return caches.match('/offline.html').then(function (off) {
          done = true;
          resolve(off || new Response('電波が戻ったら開けます', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
        });
      });
    });
  });
}

function staticHandler(req) {
  return caches.match(req).then(function (hit) {
    var update = fetch(req, { cache: 'no-cache' }).then(function (res) { return put(req, res); }).catch(function () { return null; });
    if (hit) return hit;
    return update.then(function (res) { return res || Response.error(); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js' || url.pathname.indexOf('/_vercel/') === 0 || url.pathname.indexOf('/files/') === 0) return;
  if (req.mode === 'navigate') { e.respondWith(pageHandler(req)); return; }
  if (STATIC_RE.test(url.pathname)) e.respondWith(staticHandler(req));
});
`;
}
