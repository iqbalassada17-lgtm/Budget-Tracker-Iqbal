
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
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      console.error("Gemini Error: API Key missing in environment");
      return res.json({ text: "API Key Gemini belum terpasang di Environment Render." });
    }

    const { prompt, contents } = req.body;
    const userPrompt = contents || prompt || "Berikan eksekutif summary keuangan singkat.";

    // Gunakan endpoint REST API v1beta resmi dari Google
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: typeof userPrompt === "string" ? userPrompt : JSON.stringify(userPrompt) }]
          }
        ]
      })
    });

    const result: any = await geminiResponse.json();

    if (result.error) {
      console.error("Google AI API Error Detail:", result.error);
      return res.json({ 
        text: `Gagal memproses AI: ${result.error.message || "Periksa API Key Gemini Anda."}` 
      });
    }

    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.json({ text: aiText || "Analisis selesai, namun tidak ada respons teks." });

  } catch (error: any) {
    console.error("Gemini Endpoint Error:", error);
    return res.json({ text: "Gagal menghubungkan ke layanan Google AI." });
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
