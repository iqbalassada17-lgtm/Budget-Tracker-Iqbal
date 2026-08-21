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

export const getFinancialAdvice = async (summary: any, recentCosts: any[] = []): Promise<string> => {
  // Format recent costs for context
  const costContext = recentCosts.length > 0 
    ? recentCosts.slice(0, 10).map(c => `- ${c[2] || 'Cost'}: Rp ${c[5] || 0} (${c[6] || ''})`).join('\n')
    : "Data rincian biaya tidak tersedia.";

  const prompt = `
    IDENTITAS PENGGUNA: Iqbal (Portfolio Executive)
    
    KONTEKS RINGKASAN:
    - Total Revenue (Pemasukan): Rp ${summary.income.toLocaleString()}
    - Total Expenses (Biaya): Rp ${summary.expenses.toLocaleString()}
    - Saldo Saat Ini: Rp ${summary.balance.toLocaleString()}
    
    RINCIAN BIAYA TERAKHIR:
    ${costContext}
    
    TUGAS:
    Sebagai asisten AI finansial personal, berikan tepat 3 saran keuangan yang sangat taktis, tajam, dan personal untuk Iqbal berdasarkan rincian data di atas.
    
    ATURAN FORMAT:
    1. Gunakan Bahasa Indonesia yang profesional, modern, dan maskulin (to the point).
    2. Berikan tepat 3 poin saran (tanpa nomor di awal, sistem akan mengatur bullet).
    3. Gunakan **bolding** (tanda **) untuk angka, persentase, atau kata kunci strategis.
    4. Analisis rincian biaya (cost category) jika ada pola pemborosan.
    5. Fokus pada: efisiensi biaya (cost control), optimasi pundi pendapatan (revenue stream), dan alokasi dana cadangan.
    6. Setiap poin harus berisi alasan logis berdasarkan data tersebut.
    7. Jangan bertele-tele. Langsung pada solusi.
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
