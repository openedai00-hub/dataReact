{
  "name": "databricks-react-monorepo",
  "private": true,
  "version": "0.0.1",
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "dev": "concurrently -k -n server,client -c auto \"npm run dev -w server\" \"npm run dev -w client\"",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "build": "npm run build -w server && npm run build -w client",
    "preview": "npm run preview -w client"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.5",
    "concurrently": "^9.2.1",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "@databricks/sql": "^1.12.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0"
  }
}