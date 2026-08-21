
import express from "express";
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
  const SPREADSHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwK-glXxXsOTMt7Ht4govyHypu7c5CN2kGeQlpnx0hZ9dW0byBWoYrhtlAId5S2fEIeTA/exec';

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return res.json({ 
      text: "Sinkronisasi AI belum dapat memproses analisis saat ini. Periksa API Key Gemini Anda." 
    });
  }

  try {
    const { prompt, contents, model } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    // Gunakan gemini-1.5-flash sebagai fallback default
    const targetModel = model || "gemini-1.5-flash";
    const payload = contents || prompt || "Berikan ringkasan singkat finansial ini.";

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: payload
    });

    return res.json({ text: response.text || "Analisis selesai." });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return res.json({ 
      text: "Sinkronisasi AI sedang memperbarui data analisis. Silakan coba beberapa saat lagi." 
    });
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
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
