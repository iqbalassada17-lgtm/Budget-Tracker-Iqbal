import express from "express";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Middleware CORS Manual (Menangani izin akses dari Vercel ke Render)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Tangani request Preflight dari browser
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  const SPREADSHEET_WEBAPP_URL = process.env.SPREADSHEET_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';

  // Proxy for Google Sheets
  app.all("/api/spreadsheet", async (req, res) => {
    const url = new URL(SPREADSHEET_WEBAPP_URL);
    
    // Copy query params for GET
    if (req.method === 'GET') {
      Object.keys(req.query).forEach(key => {
        url.searchParams.append(key, req.query[key] as string);
      });
    }

    try {
      const options: any = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(url.toString(), options);
      const data = await response.text();
      
      // Try to parse as JSON, if not return as text
      try {
        res.json(JSON.parse(data));
      } catch {
        res.send(data);
      }
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();