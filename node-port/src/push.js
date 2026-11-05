'use strict';

const { TeamcenterClient } = require('./teamcenter');

function requireFolder(folder, label) {
  if (!folder?.uid || !folder.className || !folder.type) {
    throw new Error(`Target folder for ${label} is not set. Pick one in Settings → Teamcenter → Target folders.`);
  }
}

async function login(settings) {
  const tc = new TeamcenterClient(settings.tcURL);
  await tc.login(settings.tcUsername, settings.tcPassword);
  return tc;
}

/** Creates a container folder, then every enabled item inside it. */
async function pushItems(settings, { name, items }) {
  const cfg = settings.items;
  requireFolder(cfg.folder, 'Items');
  const tc = await login(settings);
  const folder = await tc.createFolder({
    name,
    desc: `Some items related to ${name}`,
    container: cfg.folder,
  });

  const results = [];
  for (const item of items.filter((i) => i.enabled)) {
    try {
      await tc.createItem({ name: item.name, type: item.type, description: item.desc, container: folder });
      results.push({ name: item.name, success: true });
    } catch (e) {
      results.push({ name: item.name, success: false, error: e.message });
    }
  }
  return { containerFolderUid: folder.uid, results };
}

/** Creates a container folder, the items for every enabled node, and the BOM structure between them. */
async function pushTree(settings, kind, { name, tree }) {
  const cfg = settings[kind];
  const label = kind === 'bom' ? 'BOM' : 'Requirements Specification';
  requireFolder(cfg.folder, label);
  const tc = await login(settings);
  const folder = await tc.createFolder({
    name,
    desc: `Container for ${label} of ${name}`,
    container: cfg.folder,
  });

  await tc.closeBomWindows().catch(() => {});

  const results = [];
  const windows = [];
  let rootRevUid = '';

  async function process(node, parentLineUid) {
    if (!node.enabled) return;
    let created;
    try {
      created = await tc.createItem({ name: node.name, type: node.type, description: node.desc, container: folder });
      results.push({ name: node.name, success: true });
    } catch (e) {
      results.push({ name: node.name, success: false, error: e.message });
      return;
    }

    let lineUid = parentLineUid;
    try {
      if (!parentLineUid) {
        rootRevUid = created.itemRevUid;
        const win = await tc.createBomWindow(created.itemUid, created.itemRevUid);
        windows.push(win.windowUid);
        lineUid = win.lineUid;
      } else {
        lineUid = (await tc.addChild(parentLineUid, created.itemRevUid)) || parentLineUid;
      }
    } catch (e) {
      results.push({ name: `${node.name} (structure)`, success: false, error: e.message });
      return;
    }

    for (const child of node.items || []) await process(child, lineUid);
  }

  for (const root of tree) await process(root, null);

  if (windows.length) await tc.saveBomWindows(windows);
  await tc.closeBomWindows().catch(() => {});

  return { containerFolderUid: folder.uid, rootItemRevUid: rootRevUid, results };
}

module.exports = { login, pushItems, pushTree };
