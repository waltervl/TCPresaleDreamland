'use strict';

const HEADER = () => ({ state: {}, policy: {} });
const BOM_HEADER = () => ({
  state: {
    formatProperties: true,
    stateless: true,
    unloadObjects: false,
    enableServerStateHeaders: true,
    locale: 'en_US',
  },
  policy: {},
});

const trimSlash = (s) => s.replace(/\/+$/, '');

/** Thin client for the Teamcenter JSON REST services (JsonRestServices). Holds one JSESSIONID. */
class TeamcenterClient {
  constructor(baseUrl) {
    this.baseUrl = trimSlash(baseUrl || '');
    this.jsessionId = null;
  }

  url(service) {
    return `${this.baseUrl}/JsonRestServices/${service}`;
  }

  async post(service, body, header = HEADER()) {
    if (!this.jsessionId) throw new Error('Not logged in to Teamcenter');
    const res = await fetch(this.url(service), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `JSESSIONID=${this.jsessionId}` },
      body: JSON.stringify({ header, body }),
    });
    if (!res.ok) throw new Error(`Teamcenter ${service} failed: HTTP ${res.status}`);
    return res.json();
  }

  async login(user, password) {
    if (!this.baseUrl) throw new Error('Teamcenter URL is not set (Settings tab)');
    const res = await fetch(this.url('Core-2011-06-Session/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        header: HEADER(),
        body: { credentials: { user, password, role: '', descrimator: '', locale: '', group: '' } },
      }),
    });
    const json = await res.json().catch(() => ({}));
    const qName = json['.QName'];
    if (!qName || !qName.includes('Session.LoginResponse')) {
      throw new Error(`Teamcenter login failed: ${json.message || qName || `HTTP ${res.status}`}`);
    }
    const cookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    const js = cookies.map((c) => c.split(';')[0]).find((c) => c.startsWith('JSESSIONID='));
    if (!js) throw new Error('Teamcenter login succeeded but no JSESSIONID cookie was returned');
    this.jsessionId = js.slice('JSESSIONID='.length);
    return this.jsessionId;
  }

  getSessionInfo() {
    return this.post('Core-2007-01-Session/getTCSessionInfo', undefined);
  }

  async getProperties(object, attributes) {
    const json = await this.post('Core-2006-03-DataManagement/getProperties', {
      objects: [object],
      attributes,
    });
    return json.modelObjects?.[object.uid]?.props || {};
  }

  async getUserHomeFolder(userUid) {
    const props = await this.getProperties({ uid: userUid, className: 'User', type: 'User' }, ['home_folder']);
    return props.home_folder?.dbValues?.[0] || null;
  }

  /** Lists the first-level contents of a folder with the requested UI property values. */
  async expandFolder(folderUid, propertyAttributes) {
    const json = await this.post('Cad-2008-06-DataManagement/expandFoldersForCAD', {
      folders: [{ uid: folderUid, className: 'Folder', type: 'Fnd0HomeFolder' }],
      pref: { expItemRev: false, latestNRevs: -1, info: [], contentTypesFilter: [] },
    });
    const objects = Object.values(json.ServiceData?.modelObjects || {});
    const out = [];
    for (const o of objects) {
      let props = {};
      try {
        props = await this.getProperties({ uid: o.uid, className: o.className, type: o.type }, propertyAttributes);
      } catch {
        continue;
      }
      const row = { uid: o.uid, className: o.className, type: o.type };
      for (const a of propertyAttributes) row[a] = props[a]?.uiValues?.[0] || '';
      out.push(row);
    }
    return out;
  }

  async createFolder({ name, desc, container }) {
    const json = await this.post('Core-2006-03-DataManagement/createFolders', {
      folders: [{ clientId: '', name, desc }],
      container: { uid: container.uid, className: container.className, type: container.type },
      relationType: 'contents',
    });
    const f = json.output?.[0]?.folder;
    if (!f) throw new Error(`Folder creation failed${partialError(json)}`);
    return { uid: f.uid, className: f.className, type: f.type };
  }

  async createItem({ name, type, description, container }) {
    const json = await this.post('Core-2006-03-DataManagement/createItems', {
      properties: [
        { clientId: '', itemId: '', name, type, revId: '', uom: '', description, extendedAttributes: [] },
      ],
      container: { uid: container.uid, className: container.className, type: container.type },
      relationType: '',
    });
    const first = json.output?.[0];
    if (!first?.item?.uid || !first?.itemRev?.uid) throw new Error(`Item creation failed${partialError(json)}`);
    return { itemUid: first.item.uid, itemRevUid: first.itemRev.uid };
  }

  async createBomWindow(itemUid, itemRevUid) {
    const json = await this.post(
      'Cad-2007-01-StructureManagement/createBOMWindows',
      {
        info: [
          {
            clientId: '',
            item: itemUid,
            revRuleConfigInfo: {
              clientId: '',
              revRule: 'A',
              props: {
                unitNo: 1,
                date: '0001-01-01T00:00:00',
                today: true,
                endItem: itemUid,
                endItemRevision: itemRevUid,
              },
            },
          },
        ],
      },
      BOM_HEADER(),
    );
    const first = json.output?.[0];
    if (!first) throw new Error(`BOM window creation failed${partialError(json)}`);
    return { windowUid: first.bomWindow.uid, lineUid: first.bomLine.uid };
  }

  async addChild(parentLineUid, itemRevUid) {
    const json = await this.post(
      'Bom-2008-06-StructureManagement/addOrUpdateChildrenToParentLine',
      {
        inputs: [
          {
            parentLine: parentLineUid,
            viewType: '',
            items: [
              {
                clientId: '',
                item: '',
                itemRev: itemRevUid,
                occType: '',
                bomline: '',
                itemLineProperties: { SampleStringKey: '' },
              },
            ],
            itemElements: [],
          },
        ],
      },
      BOM_HEADER(),
    );
    return json.itemLines?.[0]?.bomline?.uid || null;
  }

  saveBomWindows(windowUids) {
    return this.post(
      'Cad-2008-06-StructureManagement/saveBOMWindows',
      { bomWindows: windowUids.map((uid) => ({ uid, className: 'BOMWindow', type: 'BOMWindow' })) },
      BOM_HEADER(),
    );
  }

  closeBomWindows() {
    return this.post('Cad-2007-01-StructureManagement/closeBOMWindows', { bomWindows: [] }, BOM_HEADER());
  }
}

function partialError(json) {
  const msg = json?.ServiceData?.partialErrors?.[0]?.errorValues?.[0]?.message;
  return msg ? `: ${msg}` : '';
}

module.exports = { TeamcenterClient };
