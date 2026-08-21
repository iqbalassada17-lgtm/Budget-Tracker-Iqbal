
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const SPREADSHEET_WEBAPP_URL = process.env.SPREADSHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing in environment variables.");
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    try {
      const { model, prompt, config, contents } = req.body;
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      // Use the provided model or fallback to gemini-3-flash-preview
      const modelName = model || "gemini-3-flash-preview";
      
      let response;
      if (contents) {
        // If structured contents are provided (for multi-turn or complex prompts)
        response = await genAI.models.generateContent({
          model: modelName,
          contents: contents,
          config: config
        });
      } else {
        // Standard single prompt
        response = await genAI.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: config
        });
      }
      
      const text = response.text || "";
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

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

      if (req.method === 'POST') {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
