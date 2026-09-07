
import express from "express";
import cors from "cors";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`--- Server Initialization ---`);
  console.log(`Port: ${PORT}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  app.use(cors());
  app.use(express.json());

  const SPREADSHEET_WEBAPP_URL = process.env.SPREADSHEET_WEBAPP_URL || process.env.SPREADSHEET_APP_SCRIPT_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!SPREADSHEET_WEBAPP_URL) {
    console.error("CRITICAL: Neither SPREADSHEET_WEBAPP_URL nor SPREADSHEET_APP_SCRIPT_URL is set in Environment Variables!");
  }
  if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set. AI features will be disabled.");
  }

  const SPREADSHEET_URL = SPREADSHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';

  // Health Check Endpoint (Penting untuk Render)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV });
  });

  // Initialize Gemini
  const ai = GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  }) : null;

  // Proxy for Google Sheets (Menggunakan native fetch)
  app.all("/api/spreadsheet", async (req, res) => {
    try {
      const url = new URL(SPREADSHEET_URL);
      if (req.method === 'GET') {
        Object.keys(req.query).forEach(key => {
          url.searchParams.append(key, req.query[key] as string);
        });
      }

      console.log(`[Proxy] ${req.method} request to Google Sheets: ${url.pathname.substring(0, 20)}...`);
      
      const options: any = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
      };

      if (req.method === 'POST') {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(url.toString(), options);
      const data = await response.text();
      
      try {
        res.json(JSON.parse(data));
      } catch {
        res.send(data);
      }
    } catch (error: any) {
      console.error("Spreadsheet Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini API
  app.post("/api/gemini/generate", async (req, res) => {
    if (!ai) return res.status(500).json({ error: "Gemini API Key not configured" });

    const { model, prompt, schema, thinkingBudget } = req.body;

    try {
      const generationConfig: any = {};
      if (schema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = schema;
      }
      
      // Thinking config hanya boleh untuk model yang mendukung (e.g. gemini-2.0-flash-thinking)
      const requestedModel = model || "gemini-1.5-flash";
      if (thinkingBudget && requestedModel.includes("thinking")) {
        generationConfig.thinkingConfig = { thinkingBudget };
      }

      const result = await ai.models.generateContent({
        model: requestedModel,
        contents: prompt,
        config: generationConfig
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite / Static Files
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.log("Running in development but Vite not found. Serving static files instead.");
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  function serveStatic(expressApp: any) {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*all', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`--- Server is LIVE ---`);
    console.log(`Listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
