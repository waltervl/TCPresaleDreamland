#!/usr/bin/env node
'use strict';

const path = require('path');
const { exec } = require('child_process');
const express = require('express');

const store = require('./store');
const deepseek = require('./deepseek');
const { login, pushItems, pushTree } = require('./push');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1'; // local only: settings contain API keys and passwords

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => res.status(e.status && e.status >= 400 ? e.status : 500).json({ error: e.message }));

// ---- settings ----
app.get('/api/settings', (_req, res) => res.json({ settings: store.getSettings(), defaults: store.defaultSettings() }));
app.put('/api/settings', (req, res) => res.json(store.saveSettings(req.body)));

app.post('/api/deepseek/verify', wrap(async (_req, res) => {
  await deepseek.verifyApiKey(store.getSettings().apiKey);
  res.json({ ok: true });
}));

app.post('/api/teamcenter/verify', wrap(async (_req, res) => {
  const settings = store.getSettings();
  const tc = await login(settings);
  const info = await tc.getSessionInfo();
  const userUid = info?.user?.uid;
  if (!userUid) throw new Error('Could not fetch session info');
  const homeUid = await tc.getUserHomeFolder(userUid);
  store.saveSettings({ tcUserUid: userUid, tcUserHomeFolderUid: homeUid || '' });
  const content = homeUid ? await tc.expandFolder(homeUid, ['object_name', 'object_desc', 'creation_date']) : [];
  res.json({ ok: true, userUid, homeFolderUid: homeUid, homeFolderContent: content });
}));

// ---- generation ----
const KINDS = {
  items: { build: (s, b) => ({ domainName: b.name, count: String(b.count) }), parse: deepseek.parseItems },
  bom: { build: (s, b) => ({ productName: b.name, depth: String(b.count) }), parse: deepseek.parseTree },
  reqSpec: { build: (s, b) => ({ productName: b.name, depth: String(b.count) }), parse: deepseek.parseTree },
};

app.post('/api/generate/:kind', wrap(async (req, res) => {
  const kind = KINDS[req.params.kind];
  if (!kind) return res.status(404).json({ error: 'Unknown generator' });
  const settings = store.getSettings();
  const cfg = settings[req.params.kind];
  const body = req.body || {};
  if (!body.name || !body.count) return res.status(400).json({ error: 'Name and count are required' });
  const content = await deepseek.chat({
    apiKey: settings.apiKey,
    prompt: deepseek.fillTemplate(cfg.prompt, kind.build(settings, body)),
    temperature: Number(body.temperature ?? cfg.temperature),
    maxTokens: Number(body.maxTokens ?? cfg.maxTokens),
  });
  let data;
  try {
    data = kind.parse(content);
  } catch (e) {
    return res.status(502).json({ error: `Failed to decode response: ${e.message}`, raw: content });
  }
  res.json({ data });
}));

// ---- push to Teamcenter ----
app.post('/api/push/items', wrap(async (req, res) => {
  res.json(await pushItems(store.getSettings(), req.body));
}));
app.post('/api/push/:kind(bom|reqSpec)', wrap(async (req, res) => {
  res.json(await pushTree(store.getSettings(), req.params.kind, req.body));
}));

// ---- history ----
app.get('/api/history', (_req, res) => res.json(store.getHistory()));
app.post('/api/history', (req, res) => {
  const { kind, name, data } = req.body || {};
  if (!KINDS[kind] || !name) return res.status(400).json({ error: 'kind and name are required' });
  res.json(store.addHistory(kind, name, data));
});
app.delete('/api/history/:id', (req, res) => {
  store.deleteHistory(req.params.id);
  res.json({ ok: true });
});

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`TCPresaleDreamland running at ${url}  (data: ${store.DATA_DIR})`);
    if (!process.env.NO_OPEN) openBrowser(url);
  });
}

module.exports = app;
