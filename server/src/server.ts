import express, { Request, Response } from "express"
import cors from "cors"
import path from "path"
import { ENV } from "./env"
import { runQuery } from "./databricks"

// --- Global error handlers ---
process.on("unhandledRejection", (e) => {
  console.error("[UNHANDLED REJECTION]", e)
  process.exit(1)
})

process.on("uncaughtException", (e) => {
  console.error("[UNCAUGHT EXCEPTION]", e)
  process.exit(1)
})

// --- Boot log (useful for Azure logs) ---
console.log("[BOOT] ENV:", {
  PORT: ENV.PORT,
  HOST: !!ENV.DATABRICKS_HOSTNAME,
  PATH: !!ENV.DATABRICKS_HTTP_PATH,
  TOKEN: !!ENV.DATABRICKS_TOKEN
})

// --- Express setup ---
const app = express()
app.use(express.json())
app.use(cors())

// --- Health check ---
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true })
})

// --- Example endpoint ---
app.get("/api/employees", async (_req: Request, res: Response) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM workspace.demo_db.employees LIMIT 100"
    )
    res.json({ rows })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal Server Error" })
  }
})

// --- Main SQL endpoint ---
app.post("/api/query", async (req: Request, res: Response) => {
  try {
    const { sql } = (req.body || {}) as { sql?: string }
    if (!sql) return res.status(400).json({ error: "Missing sql" })

    console.log("[SQL]", sql)
    const rows = await runQuery(sql)
    res.json({ rows })
  } catch (e: any) {
    console.error("[QUERY ERROR]", e?.message || e)
    res.status(500).json({ error: e?.message || "Internal Server Error" })
  }
})

/* ============================================================
   Serve React build (client/dist) in production
   ============================================================ */

// On Azure: process.cwd() === /home/site/wwwroot
const clientDistPath = path.resolve(process.cwd(), "client/dist")

app.use(express.static(clientDistPath))

// SPA fallback (React Router support)
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"))
})

/* ============================================================
   Start server on Azure port
   ============================================================ */

const PORT = Number(process.env.PORT || ENV.PORT || 8080)

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

server.on("error", (err) => {
  console.error("[SERVER LISTEN ERROR]", err)
  process.exit(1)
})
