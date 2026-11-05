# TCPresaleDreamland – Node.js / browser port (Windows, macOS, Linux)

Port of the macOS app to Node.js with a browser UI. Generates demo Items, BOMs and Requirement Specifications and pushes them to Teamcenter through its JSON REST services.

**No AI needed:** by default the data comes from a built-in offline catalog (`src/demo.js`). DeepSeek is an optional alternative, chosen in Settings → Data generator.

| Generator | Known names | Count field |
|---|---|---|
| Items | Automotive, Aerospace, Electronics, Medical, Industrial, Energy | number of items |
| BOM | Turbocharger, Bicycle, Drone, Electric Motor, Washing Machine | BOM levels (1-3) |
| Req. Spec | any product name | categories (1-5) |

Unknown item domains get a random mix of items. Unknown BOM products get a random catalog BOM renamed to your product name.

## Run (Windows)

1. Install [Node.js](https://nodejs.org) 18 or newer.
2. In this folder:
   ```
   npm install
   npm start
   ```
3. The browser opens at http://localhost:3000 (set `PORT` to change, `NO_OPEN=1` to skip auto-open).
4. In **Settings**: enter the Teamcenter URL (e.g. `http://host:7001/tc`), AWC URL, username and password. Press **Connect & load home folder**, then pick a target folder for Items, BOM and Req. Spec.

Settings and history are stored in `%USERPROFILE%\.tcpresaledreamland` (override with `TCPD_DATA_DIR`). The server only listens on `127.0.0.1`. The Teamcenter password (and the DeepSeek key, if used) are stored in plain text in `settings.json`.

## Tests

```
npm test
```

Runs an end-to-end test against mock DeepSeek and Teamcenter servers, and checks the built-in generator. It has not been run against a real DeepSeek or Teamcenter instance.
