'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

const listen = (server) => new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)));

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d ? JSON.parse(d) : {}));
  });
}

test('generate, push items and BOM against mocks', async () => {
  process.env.TCPD_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tcpd-'));

  const calls = [];
  let uid = 0;
  const deepseek = http.createServer(async (req, res) => {
    const body = await readBody(req);
    res.setHeader('Content-Type', 'application/json');
    if (!body.messages.length) return res.writeHead(400).end('{}');
    const bom = body.messages[1].content.includes('Bills of Material');
    const content = bom
      ? '```json\n{"product":{"name":"Car","desc":"d","items":[{"name":"Engine","desc":"e","items":[]},{"name":"Wheel","desc":"w"}]}}\n```'
      : '{"items":[{"name":"Turbo","desc":"t"},{"name":"Scanner","desc":"s"}]}';
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });

  const tc = http.createServer(async (req, res) => {
    const body = await readBody(req);
    const svc = req.url.replace('/tc/JsonRestServices/', '');
    calls.push(svc);
    res.setHeader('Content-Type', 'application/json');
    const n = () => `uid${++uid}`;
    const R = {
      'Core-2011-06-Session/login': () => {
        res.setHeader('Set-Cookie', 'JSESSIONID=abc123; Path=/; HttpOnly');
        return { '.QName': 'x.Session.LoginResponse' };
      },
      'Core-2007-01-Session/getTCSessionInfo': () => ({ user: { uid: 'user1' } }),
      'Core-2006-03-DataManagement/getProperties': () => ({
        modelObjects: { [body.body.objects[0].uid]: { props: { home_folder: { dbValues: ['home1'] }, object_name: { uiValues: ['N'] } } } },
      }),
      'Cad-2008-06-DataManagement/expandFoldersForCAD': () => ({ ServiceData: { modelObjects: { f1: { uid: 'f1', className: 'Folder', type: 'Folder' } } } }),
      'Core-2006-03-DataManagement/createFolders': () => ({ output: [{ folder: { uid: n(), className: 'Folder', type: 'Folder' } }] }),
      'Core-2006-03-DataManagement/createItems': () => ({ output: [{ item: { uid: n() }, itemRev: { uid: n() } }] }),
      'Cad-2007-01-StructureManagement/createBOMWindows': () => ({ output: [{ bomWindow: { uid: n() }, bomLine: { uid: n() } }] }),
      'Bom-2008-06-StructureManagement/addOrUpdateChildrenToParentLine': () => ({ itemLines: [{ bomline: { uid: n() } }] }),
      'Cad-2008-06-StructureManagement/saveBOMWindows': () => ({ ServiceData: {} }),
      'Cad-2007-01-StructureManagement/closeBOMWindows': () => ({ ServiceData: { deleted: [] } }),
    };
    if (svc !== 'Core-2011-06-Session/login' && !String(req.headers.cookie).includes('JSESSIONID=abc123')) return res.writeHead(401).end('{}');
    res.end(JSON.stringify(R[svc]()));
  });

  const dsPort = await listen(deepseek);
  const tcPort = await listen(tc);
  process.env.DEEPSEEK_URL = `http://127.0.0.1:${dsPort}/v1/chat/completions`;
  const app = require('../src/server');
  const store = require('../src/store');
  const apiServer = http.createServer(app);
  const api = await listen(apiServer);
  const call = async (m, u, b) => {
    const r = await fetch(`http://127.0.0.1:${api}${u}`, { method: m, headers: { 'Content-Type': 'application/json' }, body: b && JSON.stringify(b) });
    return { status: r.status, json: await r.json() };
  };

  const folder = { uid: 'home1', className: 'Folder', type: 'Fnd0HomeFolder', name: 'Home' };
  store.saveSettings({ apiKey: 'k', tcURL: `http://127.0.0.1:${tcPort}/tc`, tcUsername: 'u', tcPassword: 'p', items: { folder }, bom: { folder } });

  assert.strictEqual((await call('POST', '/api/deepseek/verify')).json.ok, true);
  const v = await call('POST', '/api/teamcenter/verify');
  assert.strictEqual(v.json.homeFolderUid, 'home1');
  assert.strictEqual(v.json.homeFolderContent.length, 1);

  const items = (await call('POST', '/api/generate/items', { name: 'Auto', count: 2 })).json.data;
  assert.deepStrictEqual(items.map((i) => i.name), ['Turbo', 'Scanner']);
  items[1].enabled = false;
  const pushed = (await call('POST', '/api/push/items', { name: 'Auto', items })).json;
  assert.deepStrictEqual(pushed.results, [{ name: 'Turbo', success: true }]);

  const tree = (await call('POST', '/api/generate/bom', { name: 'Car', count: 2 })).json.data;
  assert.strictEqual(tree[0].items.length, 2);
  const bom = (await call('POST', '/api/push/bom', { name: 'Car', tree })).json;
  assert.strictEqual(bom.results.filter((r) => r.success).length, 3);
  assert.ok(calls.includes('Bom-2008-06-StructureManagement/addOrUpdateChildrenToParentLine'));
  assert.ok(calls.includes('Cad-2008-06-StructureManagement/saveBOMWindows'));

  await call('POST', '/api/history', { kind: 'bom', name: 'Car', data: tree });
  assert.strictEqual((await call('GET', '/api/history')).json.length, 1);

  for (const s of [deepseek, tc, apiServer]) { s.closeAllConnections(); s.close(); }
});
