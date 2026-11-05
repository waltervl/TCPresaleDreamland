# TCPresaleDreamland – Node.js / browser port (Windows, macOS, Linux)

Port of the macOS app to Node.js with a browser UI. Generates demo Items, BOMs and Requirement Specifications with an LLM (DeepSeek) and pushes them to Teamcenter through its JSON REST services.

## Run (Windows)

1. Install [Node.js](https://nodejs.org) 18 or newer.
2. In this folder:
   ```
   npm install
   npm start
   ```
3. The browser opens at http://localhost:3000 (set `PORT` to change, `NO_OPEN=1` to skip auto-open).
4. In **Settings**: enter the DeepSeek API key, the Teamcenter URL (e.g. `http://host:7001/tc`), AWC URL, username and password. Press **Connect & load home folder**, then pick a target folder for Items, BOM and Req. Spec.

Settings and history are stored in `%USERPROFILE%\.tcpresaledreamland` (override with `TCPD_DATA_DIR`). The server only listens on `127.0.0.1`. The Teamcenter password and API key are stored in plain text in `settings.json`.

## Tests

```
npm test
```

Runs an end-to-end test against mock DeepSeek and Teamcenter servers. It has not been run against a real DeepSeek or Teamcenter instance.
