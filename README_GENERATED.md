# Databricks Data Explorer (Monorepo)

A small React + Express monorepo that proxies SQL queries to Databricks and displays results in a browser. The repo contains two packages: `server` (API) and `client` (React app).

---

## Overview

- **Server**: an Express TypeScript API that connects to Databricks using `@databricks/sql`. It exposes a health endpoint and a single `/api/query` POST endpoint that accepts a JSON body `{ sql: string }` and returns the query rows.
- **Client**: a Vite + React TypeScript app with pages for listing and executing table queries. The client sends SQL to the server and renders results in a table with pagination and Excel download.

## Project layout

- `server/` — Express TypeScript API
- `client/` — React (Vite) frontend
- Root `package.json` — npm workspace that can run both concurrently

## Key files

- Server:
  - `server/src/server.ts` — Express app and middleware
  - `server/src/routes.ts` — router that exposes `POST /api/query`
  - `server/src/databricks.ts` — connects to Databricks via `@databricks/sql` and runs queries
  - `server/src/env.ts` — loads and validates environment variables

- Client:
  - `client/src/api.ts` — `runSQL(sql)` helper that posts to `/api/query`
  - `client/src/pages/TablesPage.tsx` — list of tables and selects which query to run
  - `client/src/components/SQLTable.tsx` — executes query, displays table, pagination
  - `client/src/components/DownloadButton.tsx` — exports results to Excel
  - `client/vite.config.ts` — dev server proxy (`/api` -> `http://localhost:8787`)

## How it works (request flow)

1. User clicks a table button in the React UI (see `client/src/pages/TablesPage.tsx`).
2. `SQLTable` calls `runSQL(sql)` in `client/src/api.ts` which POSTs to `/api/query`.
3. During development `vite` proxy in `client/vite.config.ts` forwards `/api` calls to the Express server at `http://localhost:8787`.
4. Server `routes.ts` receives the POST with `{ sql }` and calls `runQuery(sql)` in `server/src/databricks.ts`.
5. `runQuery` uses `@databricks/sql`'s `DBSQLClient` to connect (using env vars) and executes the SQL. Results are returned as an array of row objects.
6. Client receives `{ rows }`, `SQLTable` sets state and renders a table. `DownloadButton` can export that array to Excel using `xlsx`.

## Environment variables (server)

Create a `.env` file in the `server/` folder (or set environment variables) with the following values:

```
DATABRICKS_HOST=your-databricks-host.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/endpoints/xxxx
DATABRICKS_TOKEN=dapixxx...your-token...
PORT=8787
```

The server validates these at startup (`server/src/env.ts`) and will throw if missing.

## Install & Run (development)

1. Install dependencies from the repository root (uses npm workspaces):

```bash
npm install
```

2. Start both server and client concurrently from the root:

```bash
npm run dev
```

This runs the server on `http://localhost:8787` and the client on `http://localhost:5173`. The Vite dev server proxies `/api` to the server (see `client/vite.config.ts`).

You can also run them individually:

```bash
# start only server (watch mode)
npm run dev:server
# start only client
npm run dev:client
```

## Build & Production

To build both packages:

```bash
npm run build
```

- The server build uses `tsc` and outputs to `server/dist` (startable with `node server/dist/server.js`).
- The client build outputs static files in `client/dist` which you can serve from any static host. The server currently does not automatically serve the client build; if you want a single-process deployment, serve `client/dist` with a static server (e.g., `serve`) or add static middleware to the Express server.

Example: build then preview the client only:

```bash
npm run preview
```

## Notes and development tips

- The client uses a relative `/api` path so it works when the frontend and backend share the same origin in production.
- Dev proxy is configured in `client/vite.config.ts` to forward `/api` to the server port.
- If you see CORS issues when not using the Vite proxy, ensure the server's CORS middleware is enabled (it is in `server/src/server.ts`).
- The server returns helpful errors from the Databricks client; check server logs for `Query error:` messages when diagnosing failures.

## Where to look to change behavior

- Change the list of demo tables and queries: `client/src/pages/TablesPage.tsx`.
- Change query execution or how rows are processed: `server/src/databricks.ts` and `client/src/components/SQLTable.tsx`.
- Update the dev proxy or client server port: `client/vite.config.ts`.

## Useful commands recap

```bash
# install
npm install

# start both (dev)
npm run dev

# start server only
npm run dev:server

# start client only
npm run dev:client

# build both
npm run build

# preview client build
npm run preview
```

---

If you'd like, I can:

- Add static serving in the server so `server` serves the `client/dist` build automatically.
- Add a sample `.env.example` in `server/` to make env setup easier.
