'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');
const KIND_LABEL = { items: 'Items', bom: 'BOM', reqSpec: 'Requirements Specification' };
const NAME_HINT = { items: 'Domain (e.g. Automotive)', bom: 'Product (e.g. Turbocharger)', reqSpec: 'Product (e.g. Turbocharger)' };

const state = { settings: null, defaults: null, generators: {} };

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

async function loadSettings() {
  const { settings, defaults } = await api('GET', '/api/settings');
  state.settings = settings;
  state.defaults = defaults;
}

function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'checked' || k === 'value' || k === 'disabled') e[k] = v;
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

function setStatus(node, text, cls = '') {
  node.textContent = text;
  node.className = `status ${cls}`.trim();
}

// ---------- generator tabs ----------
function renderGenerator(kind) {
  const g = (state.generators[kind] ||= { name: '', count: '3', data: null, links: null });
  const cfg = state.settings[kind];
  const root = document.importNode($('#generator-tpl').content, true);
  const q = (c) => root.querySelector(c);

  q('.g-name').placeholder = NAME_HINT[kind];
  q('.g-name').value = g.name;
  q('.g-count').value = g.count;
  q('.g-temp').value = cfg.temperature;
  q('.g-tokens').value = cfg.maxTokens;
  q('.g-name').addEventListener('input', (e) => (g.name = e.target.value));
  q('.g-count').addEventListener('input', (e) => (g.count = e.target.value));

  const typeSel = q('.g-type');
  typeSel.append(el('option', { value: '' }, '—'), ...cfg.types.map((t) => el('option', { value: t }, t)));
  typeSel.addEventListener('change', (e) => {
    if (!e.target.value || !g.data) return;
    forEachNode(g.data, (n) => (n.type = e.target.value));
    draw();
  });

  const status = q('.g-status');
  const result = q('.g-result');
  const links = q('.g-links');
  const btnGen = q('.g-generate');
  const btnSave = q('.g-save');
  const btnPush = q('.g-push');

  function draw() {
    result.replaceChildren(g.data ? (kind === 'items' ? itemsTable(g.data, cfg.types) : tree(g.data, cfg.types, draw)) : '');
    const has = !!g.data;
    btnSave.disabled = !has;
    btnPush.disabled = !has;
    q('.g-typewrap').style.display = kind === 'items' ? 'none' : '';
    links.replaceChildren(...(g.links || []));
  }

  btnGen.addEventListener('click', async () => {
    if (!g.name.trim() || !Number(g.count)) return setStatus(status, 'Enter a name and a count.', 'err');
    btnGen.disabled = true;
    setStatus(status, `Generating ${KIND_LABEL[kind]}…`);
    try {
      const { data } = await api('POST', `/api/generate/${kind}`, {
        name: g.name.trim(),
        count: Number(g.count),
        temperature: Number(q('.g-temp').value),
        maxTokens: Number(q('.g-tokens').value),
      });
      g.data = data;
      g.links = null;
      setStatus(status, `${KIND_LABEL[kind]} ready. Review, then press “Push to TC”.`, 'ok');
    } catch (e) {
      setStatus(status, e.message, 'err');
    }
    btnGen.disabled = false;
    draw();
  });

  btnSave.addEventListener('click', async () => {
    try {
      await api('POST', '/api/history', { kind, name: g.name.trim() || 'Untitled', data: g.data });
      setStatus(status, 'Saved to history.', 'ok');
    } catch (e) {
      setStatus(status, e.message, 'err');
    }
  });

  btnPush.addEventListener('click', async () => {
    btnPush.disabled = true;
    setStatus(status, 'Pushing to Teamcenter…');
    try {
      const body = kind === 'items' ? { name: g.name.trim(), items: g.data } : { name: g.name.trim(), tree: g.data };
      const res = await api('POST', `/api/push/${kind}`, body);
      const failed = res.results.filter((r) => !r.success);
      setStatus(
        status,
        failed.length ? `Push finished with ${failed.length} failure(s): ${failed.map((f) => `${f.name} (${f.error})`).join('; ')}` : 'Push complete.',
        failed.length ? 'err' : 'ok',
      );
      g.links = awcLinks(res);
    } catch (e) {
      setStatus(status, e.message, 'err');
    }
    btnPush.disabled = false;
    draw();
  });

  draw();
  view.replaceChildren(root);
}

function awcLinks(res) {
  const awc = (state.settings.awcURL || '').replace(/\/+$/, '');
  if (!awc) return [];
  const open = (uid, text) =>
    el('a', { href: `${awc}/#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=${encodeURIComponent(uid)}`, target: '_blank' }, text);
  const out = [];
  if (res.containerFolderUid) out.push(open(res.containerFolderUid, 'Open folder in AWC'));
  if (res.rootItemRevUid) out.push(' · ', open(res.rootItemRevUid, 'Open root item revision in AWC'));
  return out;
}

function forEachNode(nodes, fn) {
  for (const n of nodes) {
    fn(n);
    forEachNode(n.items || [], fn);
  }
}

function typeSelect(types, value, onChange) {
  const s = el('select', { onchange: (e) => onChange(e.target.value) }, ...types.map((t) => el('option', { value: t }, t)));
  s.value = types.includes(value) ? value : types[0];
  return s;
}

function itemsTable(items, types) {
  const body = items.map((it) =>
    el(
      'tr',
      {},
      el('td', {}, el('input', { type: 'checkbox', checked: it.enabled, onchange: (e) => (it.enabled = e.target.checked) })),
      el('td', {}, it.name),
      el('td', {}, it.desc),
      el('td', {}, typeSelect(types, it.type, (v) => (it.type = v))),
    ),
  );
  return el('table', {}, el('thead', {}, el('tr', {}, el('th'), el('th', {}, 'Name'), el('th', {}, 'Description'), el('th', {}, 'Type'))), el('tbody', {}, body));
}

// Disabling a node disables its subtree; enabling a node enables its ancestors.
function tree(nodes, types, onChange) {
  const rerender = () => onChange();
  const build = (list, ancestors) =>
    el(
      'ul',
      { class: `tree${ancestors.length ? '' : ' root'}` },
      list.map((n) =>
        el(
          'li',
          {},
          el(
            'div',
            { class: 'node' },
            el('input', {
              type: 'checkbox',
              checked: n.enabled,
              onchange: (e) => {
                n.enabled = e.target.checked;
                if (!n.enabled) forEachNode(n.items || [], (c) => (c.enabled = false));
                else ancestors.forEach((a) => (a.enabled = true));
                rerender();
              },
            }),
            el('strong', {}, n.name),
            el('span', { class: 'desc' }, n.desc),
            typeSelect(types, n.type, (v) => (n.type = v)),
          ),
          n.items?.length ? build(n.items, [...ancestors, n]) : null,
        ),
      ),
    );
  return build(nodes, []);
}

// ---------- history ----------
async function renderHistory() {
  const rows = await api('GET', '/api/history');
  const list = rows.length
    ? el(
        'table',
        {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Type'), el('th', {}, 'Name'), el('th'))),
        el(
          'tbody',
          {},
          rows.map((r) =>
            el(
              'tr',
              {},
              el('td', {}, new Date(r.timestamp).toLocaleString()),
              el('td', {}, KIND_LABEL[r.kind] || r.kind),
              el('td', {}, r.name),
              el(
                'td',
                {},
                el('button', { onclick: () => { state.generators[r.kind] = { name: r.name, count: '3', data: r.data, links: null }; switchTab(r.kind); } }, 'Open'),
                ' ',
                el('button', { class: 'danger', onclick: async () => { await api('DELETE', `/api/history/${r.id}`); renderHistory(); } }, 'Delete'),
              ),
            ),
          ),
        ),
      )
    : el('p', { class: 'hint' }, 'Nothing saved yet.');
  view.replaceChildren(el('section', { class: 'card' }, el('h3', {}, 'History'), list));
}

// ---------- settings ----------
function renderSettings() {
  const s = state.settings;
  const status = el('div', { class: 'status' });
  const field = (label, path, opts = {}) => {
    const input = el('input', { type: opts.type || 'text', value: get(path), placeholder: opts.placeholder || '' });
    input.addEventListener('input', () => set(path, opts.number ? Number(input.value) : input.value));
    return el('label', { class: opts.cls || '' }, label, input);
  };
  const get = (path) => path.split('.').reduce((o, k) => o[k], s);
  const set = (path, v) => {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], s)[last] = v;
  };
  const save = async () => {
    try {
      state.settings = await api('PUT', '/api/settings', s);
      setStatus(status, 'Settings saved.', 'ok');
    } catch (e) {
      setStatus(status, e.message, 'err');
    }
  };
  const action = (label, url, onOk) =>
    el('button', {
      onclick: async () => {
        await save();
        setStatus(status, `${label}…`);
        try {
          const r = await api('POST', url);
          await loadSettings();
          Object.assign(s, state.settings);
          onOk?.(r);
          setStatus(status, `${label}: OK`, 'ok');
        } catch (e) {
          setStatus(status, `${label}: ${e.message}`, 'err');
        }
      },
    }, label);

  const homeBox = el('div');
  const showHome = (rows) => {
    const useBtn = (r, k) =>
      el('button', {
        onclick: () => {
          s[k].folder = { uid: r.uid, name: r.object_name, className: r.className, type: r.type };
          save().then(renderSettings);
        },
      }, `Use for ${KIND_LABEL[k]}`);
    const table = el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Name'), el('th', {}, 'Type'), el('th'))),
      el('tbody', {}, rows.map((r) =>
        el('tr', {}, el('td', {}, r.object_name), el('td', {}, r.type),
          el('td', {}, ['items', 'bom', 'reqSpec'].map((k) => [useBtn(r, k), ' ']))))));
    homeBox.replaceChildren(rows.length ? table : '');
  };

  const kindSection = (k) =>
    el('details', {},
      el('summary', {}, `${KIND_LABEL[k]} generation`),
      el('div', { class: 'row' }, field('Temperature', `${k}.temperature`, { type: 'number', number: true, cls: 'num' }), field('Max tokens', `${k}.maxTokens`, { type: 'number', number: true, cls: 'num' }),
        el('div', { class: 'hint' }, `Target folder: ${s[k].folder.name || '(none)'} ${s[k].folder.uid}`)),
      el('label', {}, 'Prompt', (() => { const t = el('textarea', {}, s[k].prompt); t.value = s[k].prompt; t.addEventListener('input', () => (s[k].prompt = t.value)); return t; })()),
      el('div', { class: 'row' }, el('button', { onclick: () => { Object.assign(s[k], { prompt: state.defaults[k].prompt, temperature: state.defaults[k].temperature, maxTokens: state.defaults[k].maxTokens }); save().then(renderSettings); } }, 'Reset to default')),
      (() => {
        const input = el('input', { value: s[k].types.join(', ') });
        input.addEventListener('input', () => (s[k].types = input.value.split(',').map((x) => x.trim()).filter(Boolean)));
        return el('label', {}, 'Allowed Teamcenter item types (comma separated)', input);
      })(),
    );

  view.replaceChildren(
    el('section', { class: 'card' },
      el('h3', {}, 'DeepSeek'),
      el('div', { class: 'row' }, field('API key', 'apiKey', { type: 'password', cls: 'grow' }), action('Verify key', '/api/deepseek/verify')),
      el('h3', {}, 'Teamcenter'),
      el('div', { class: 'row' }, field('Teamcenter URL', 'tcURL', { placeholder: 'http://host:7001/tc', cls: 'grow' }), field('AWC URL', 'awcURL', { placeholder: 'http://host:3000', cls: 'grow' })),
      el('div', { class: 'row' }, field('Username', 'tcUsername', { cls: 'grow' }), field('Password', 'tcPassword', { type: 'password', cls: 'grow' }),
        action('Connect & load home folder', '/api/teamcenter/verify', (r) => showHome(r.homeFolderContent || []))),
      el('p', { class: 'hint' }, 'After connecting, choose a target folder for each generator from your home folder contents below.'),
      homeBox,
      el('div', { class: 'row' }, el('button', { class: 'primary', onclick: save }, 'Save settings')),
      status,
      kindSection('items'), kindSection('bom'), kindSection('reqSpec'),
    ),
  );
}

// ---------- tabs ----------
async function switchTab(tab) {
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'history') return renderHistory();
  if (tab === 'settings') return renderSettings();
  renderGenerator(tab);
}

document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
loadSettings().then(() => switchTab('items'));
