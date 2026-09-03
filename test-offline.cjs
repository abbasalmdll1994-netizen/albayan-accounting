const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const origin = 'https://example.test/albayan-accounting/';
const code = fs.readFileSync('sw.js', 'utf8');
function worker({stores = new Map(), fail = false, version} = {}) {
  const handlers = {}, fetched = [];
  let online = true, claimed = false, forced = false;
  const fetch = async request => {
    const url = typeof request === 'string' ? request : request.url;
    fetched.push(url);
    if (!online || fail) throw Error('offline');
    const path = new URL(url).pathname.slice('/albayan-accounting/'.length);
    return fs.existsSync(path) ? new Response(fs.readFileSync(path)) : new Response('404', {status: 404});
  };
  const caches = {
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const values = stores.get(name);
      return {
        addAll: async requests => {
          const pairs = await Promise.all(requests.map(async r => {
            const response = await fetch(r);
            if (!response.ok) throw Error('bad response');
            return [r.url, response];
          }));
          for (const [url, response] of pairs) values.set(url, response);
        },
        match: async url => values.get(typeof url === 'string' ? url : url.url)?.clone()
      };
    }
  };
  const self = {location: {href: origin + 'sw.js'}, addEventListener: (n, fn) => handlers[n] = fn,
    clients: {claim: async () => claimed = true}, skipWaiting: () => forced = true};
  const context = vm.createContext({self, caches, Request, Response, URL, fetch});
  vm.runInContext(version ? code.replace("'offline-20260903-2'", JSON.stringify(version)) : code, context);
  async function lifecycle(name) { let done; handlers[name]({waitUntil: p => done = p}); await done; }
  function request(path, options) {
    let response;
    handlers.fetch({request: new Request(new URL(path, origin), options), respondWith: p => response = p});
    return response;
  }
  return {context, stores, fetched, lifecycle, request, offline: () => online = false,
    claimed: () => claimed, forced: () => forced};
}
(async () => {
  const w = worker();
  const files = Array.from(vm.runInContext('FILES', w.context));
  // Make sure the real HTML links/scripts and manifest icons are covered.
  for (const file of fs.readdirSync('.').filter(f => f.endsWith('.html'))) {
    assert.ok(files.includes(file), file);
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/src="offline\.js/g) || []).length, 1, file);
    for (const [, link] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const path = link.split(/[?#]/)[0];
      if (path && fs.existsSync(path)) assert.ok(files.includes(path), file + ': ' + path);
    }
  }
  for (const icon of JSON.parse(fs.readFileSync('manifest.webmanifest')).icons) assert.ok(files.includes(icon.src));
  await w.lifecycle('install');
  assert.equal(w.forced(), false);
  await w.lifecycle('activate');
  assert.equal(w.claimed(), true);
  w.offline();
  const fetchedBefore = w.fetched.length;
  for (const file of files) {
    const response = await w.request(file + '?v=old-link');
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(file));
  }
  assert.equal(await (await w.request('./?v=home')).text(), fs.readFileSync('index.html', 'utf8'));
  for (const mode of ['rep', 'accountant']) assert.equal(await (await w.request('cash-handover.html?mode=' + mode)).text(), fs.readFileSync('cash-handover.html', 'utf8'));
  assert.equal(w.fetched.length, fetchedBefore, 'all cached pages work without network');
  for (const path of ['https://project.supabase.co/rest/v1/snapshots', '/other-app/index.html', 'unknown.html', 'sw.js']) assert.equal(w.request(path), undefined);
  assert.equal(w.request('index.html', {method: 'POST', body: 'invoice'}), undefined);
  const oldCache = vm.runInContext('CACHE', w.context);
  w.stores.set('unrelated-cache', new Map());
  const bad = worker({stores: w.stores, fail: true, version: 'failed-release'});
  await assert.rejects(bad.lifecycle('install'), /offline/);
  assert.ok(w.stores.get(oldCache).size > 0, 'failed update preserves working shell');
  const next = worker({stores: w.stores, version: 'next-release'});
  await next.lifecycle('install');
  assert.ok(w.stores.has(oldCache), 'old release remains until activation');
  assert.equal(next.forced(), false);
  await next.lifecycle('activate');
  assert.equal(w.stores.has(oldCache), false);
  assert.ok(w.stores.has('unrelated-cache'));
  console.log('PASS: complete offline shell, query variants, root route, both cash modes, API isolation, atomic install failure and safe cache lifecycle');
})().catch(e => { console.error(e); process.exitCode = 1; });
