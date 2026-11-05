'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const defaults = require('./prompts');

// Per-user data dir that works on Windows (%USERPROFILE%), macOS and Linux.
const DATA_DIR = process.env.TCPD_DATA_DIR || path.join(os.homedir(), '.tcpresaledreamland');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const emptyFolder = () => ({ uid: '', name: '', className: '', type: '' });

function defaultSettings() {
  const kind = (k) => ({
    prompt: defaults[k].prompt,
    temperature: defaults[k].temperature,
    maxTokens: defaults[k].maxTokens,
    folder: emptyFolder(),
    types: ['Item'],
  });
  return {
    generator: 'demo', // 'demo' = built-in data, 'deepseek' = AI
    apiKey: '',
    tcURL: '',
    awcURL: '',
    tcUsername: '',
    tcPassword: '',
    tcUserUid: '',
    tcUserHomeFolderUid: '',
    items: kind('items'),
    bom: kind('bom'),
    reqSpec: kind('reqSpec'),
  };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function mergeDeep(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = mergeDeep(base[k], v);
    } else if (k in base) {
      out[k] = v;
    }
  }
  return out;
}

function ensureItemType(settings) {
  for (const k of ['items', 'bom', 'reqSpec']) {
    const types = settings[k].types || [];
    if (!types.includes('Item')) types.unshift('Item');
    settings[k].types = types;
  }
  return settings;
}

function getSettings() {
  return ensureItemType(mergeDeep(defaultSettings(), readJson(SETTINGS_FILE, {})));
}

function saveSettings(patch) {
  const next = ensureItemType(mergeDeep(getSettings(), patch));
  writeJson(SETTINGS_FILE, next);
  return next;
}

function getHistory() {
  return readJson(HISTORY_FILE, []);
}

function addHistory(kind, name, data) {
  const history = getHistory();
  const record = {
    id: require('crypto').randomUUID(),
    kind,
    name,
    timestamp: new Date().toISOString(),
    data,
  };
  history.unshift(record);
  writeJson(HISTORY_FILE, history);
  return record;
}

function deleteHistory(id) {
  writeJson(HISTORY_FILE, getHistory().filter((r) => r.id !== id));
}

module.exports = {
  DATA_DIR,
  defaultSettings,
  getSettings,
  saveSettings,
  getHistory,
  addHistory,
  deleteHistory,
};
