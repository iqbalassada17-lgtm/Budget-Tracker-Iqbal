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

const isDev = import.meta.env.DEV;
const API_BASE = isDev ? '' : (import.meta.env.VITE_API_URL || '');
const GEMINI_PROXY_URL = `${API_BASE}/api/gemini`;

const callGeminiProxy = async (payload: any): Promise<string> => {
  try {
    const response = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Gemini Proxy Error');
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    throw error;
  }
};

const callWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
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
      model: "gemini-3-pro-preview", 
      prompt 
    });
    
    // Clean potential markdown code blocks
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanJson);
  });
};

export const parseCostCommand = async (text: string): Promise<any> => {
  return callWithRetry(async () => {
    const today = getTodayFormatted();
    const prompt = `Extract cost details from: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON with keys: tanggal, coa, cost, keterangan. No text around JSON.`;
    const text_res = await callGeminiProxy({ 
      model: "gemini-3-flash-preview", 
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
      model: "gemini-3-flash-preview", 
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
    - Total Revenue: Rp ${summary.income.toLocaleString()}
    - Total Expenses: Rp ${summary.expenses.toLocaleString()}
    - Current Balance: Rp ${summary.balance.toLocaleString()}
    
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
    model: "gemini-3-flash-preview", 
    prompt 
  });
};

export const getGrowthStrategy = async (baseline: number): Promise<string> => {
  return await callGeminiProxy({ 
    model: "gemini-3-flash-preview", 
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
      model: "gemini-3-flash-preview", 
      prompt 
    });
    const cleanJson = text_res.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleanJson);
  });
};
