
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  const SPREADSHEET_WEBAPP_URL = process.env.SPREADSHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const url = new URL(SPREADSHEET_WEBAPP_URL);
    
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

      // In @google/genai, we use ai.models.generateContent directly
      const result = await ai.models.generateContent({
        model: model || "gemini-3.8-flash",
        contents: prompt,
        config: generationConfig
      });

      // .text is a property in this SDK
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
