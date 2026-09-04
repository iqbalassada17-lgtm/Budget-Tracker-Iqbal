
import express from "express";
import cors from "cors";
import path from "path";
import fetch from "node-fetch";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`Starting server on port ${PORT}...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  app.use(cors());
  app.use(express.json());

  const SPREADSHEET_WEBAPP_URL = process.env.SPREADSHEET_WEBAPP_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!SPREADSHEET_WEBAPP_URL) {
    console.warn("WARNING: SPREADSHEET_WEBAPP_URL is not set!");
  }
  if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set!");
  }

  const SPREADSHEET_URL = SPREADSHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';

  // Initialize Gemini correctly for @google/genai
  const ai = GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // Proxy for Google Sheets
  app.all("/api/spreadsheet", async (req, res) => {
    const url = new URL(SPREADSHEET_URL);
    
    if (req.method === 'GET') {
      Object.keys(req.query).forEach(key => {
        url.searchParams.append(key, req.query[key] as string);
      });
    }

    try {
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
      console.error("Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Endpoints
  app.post("/api/gemini/generate", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    const { model, prompt, schema, thinkingBudget } = req.body;

    try {
      const generationConfig: any = {};
      if (schema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = schema;
      }
      if (thinkingBudget) {
        generationConfig.thinkingConfig = { thinkingBudget };
      }

      const result = await ai.models.generateContent({
        model: model || "gemini-3.8-flash",
        contents: prompt,
        config: generationConfig
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite middleware for development...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite. Make sure it is installed in devDependencies.");
      console.error(e);
    }
  } else {
    console.log("Serving static files from dist/ in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is LIVE on port ${PORT}`);
  });
}

startServer();
