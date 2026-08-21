/// <reference types="vite/client" />

import { Type } from "@google/genai";

const INDO_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
const INDO_DAYS = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

// 1. HARDCODE FALLBACK langsung ke Render agar tidak 404 di Vercel
const BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://budget-tracker-iqbal.onrender.com').replace(/\/$/, '');
const GEMINI_PROXY_URL = `${BACKEND_URL}/api/gemini`;

const callGeminiProxy = async (payload: any): Promise<string> => {
  try {
    const response = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    // Cek Content-Type untuk mencegah crash Unexpected Token 'T' jika server ngirim HTML
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Gemini Proxy mengembalikan respon non-JSON. Menggunakan teks fallback.");
      return "SITHIS AI Online. Menunggu sinkronisasi data.";
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Gemini Proxy Error');
    }
    
    const data = await response.json();
    return data.text || "Respon AI kosong.";
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    // Kembalikan teks aman agar UI tidak crash saat gagal
    return "SITHIS AI sedang memperbarui data analisis. Silakan coba beberapa saat lagi.";
  }
};

const callWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
};

export const parseAssetCommand = async (text: string, brokerName: string): Promise<any[]> => {
  return callWithRetry(async () => {
    const prompt = `
      EXTRACT TRANSACTIONS FROM ${brokerName}: "${text}"
      
      CRITICAL RULES:
      1. transDate: DD/MM/YYYY.
      2. name: Stock Ticker (e.g., BBCA, CUAN, ASII). Must be uppercase.
      3. lot/price: Must be clean numbers.
      4. side: 'BUY' or 'SELL'.
      5. isTransaction: Always set to true for trade log entries.
      6. AUTO-CALCULATION: If buyValue or sellValue is zero or missing in text, you MUST calculate it yourself: (Lot * 100 * Price). 
      7. Output: Pure JSON array. No conversational text.
    `;

    const text_res = await callGeminiProxy({ 
      model: "gemini-2.5-flash", 
      prompt 
    });
    
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanJson);
  });
};

export const parseCostCommand = async (text: string): Promise<any> => {
  return callWithRetry(async () => {
    const today = getTodayFormatted();
    const prompt = `Extract cost details from: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON with keys: tanggal, coa, cost, keterangan. No text around JSON.`;
    const text_res = await callGeminiProxy({ 
      model: "gemini-2.5-flash", 
      prompt 
    });
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    const data = JSON.parse(cleanJson);
    const parts = (data.tanggal || today).split('/');
    const dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    data.bulan = INDO_MONTHS[dateObj.getMonth()];
    data.hari = INDO_DAYS[dateObj.getDay()];
    data.week = Math.ceil(dateObj.getDate() / 7);
    return data;
  });
};

export const parseRevenueCommand = async (text: string): Promise<any> => {
  return callWithRetry(async () => {
    const today = getTodayFormatted();
    const prompt = `Extract revenue details: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON with keys: tanggal, parameter, revenue. No text around JSON.`;
    const text_res = await callGeminiProxy({ 
      model: "gemini-2.5-flash", 
      prompt 
    });
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    const data = JSON.parse(cleanJson);
    const parts = (data.tanggal || today).split('/');
    const dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    data.bulan = INDO_MONTHS[dateObj.getMonth()];
    data.hari = INDO_DAYS[dateObj.getDay()];
    data.week = "WEEK" + Math.ceil(dateObj.getDate() / 7);
    return data;
  });
};

export const getFinancialAdvice = async (summary: any): Promise<string> => {
  const prompt = `
    DASHBOARD CONTEXT:
    - Total Revenue: Rp ${(summary?.income || 0).toLocaleString()}
    - Total Expenses: Rp ${(summary?.expenses || 0).toLocaleString()}
    - Current Balance: Rp ${(summary?.balance || 0).toLocaleString()}
    
    TASK:
    Beri 3 saran keuangan singkat, taktis, dan personal untuk Iqbal berdasarkan data di atas.
    
    FORMAT:
    - Gunakan Bahasa Indonesia yang profesional namun modern (masculine tone).
    - Berikan tepat 3 poin saran.
    - Gunakan **bolding** (dengan tanda **) untuk kata kunci atau angka penting.
    - Jangan gunakan karakter bullet (*) di awal kalimat, biarkan sistem yang menangani.
    - Fokus pada optimasi revenue atau kontrol budget.
    - Jangan terlalu panjang.
  `;
  
  return await callGeminiProxy({ 
    model: "gemini-2.5-flash", 
    prompt 
  });
};

export const getGrowthStrategy = async (baseline: number): Promise<string> => {
  return await callGeminiProxy({ 
    model: "gemini-2.5-flash", 
    prompt: `Strategi investasi untuk modal Rp ${baseline}. Bahasa Indonesia.` 
  });
};

export const parseInvestasiCommand = async (text: string): Promise<any> => {
  return callWithRetry(async () => {
    const prompt = `
      Extract investment details from: "${text}"
      Template format:
      BULAN : [MONTH]
      TYPE INVEST : [TYPE]
      FUND MANAGER : [MANAGER]
      FUND : [AMOUNT]
      RATIO : [PERCENTAGE]
      
      Output JSON with keys: bulan, typeInvest, fundManager, fund (number), ratio (string). No text around JSON.
    `;
    const text_res = await callGeminiProxy({ 
      model: "gemini-2.5-flash", 
      prompt 
    });
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanJson);
  });
};