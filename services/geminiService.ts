
import { GoogleGenAI, Type } from "@google/genai";

const INDO_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
const INDO_DAYS = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

const callGeminiWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    const errorStr = JSON.stringify(error);
    const isRetryable = errorStr.includes("500") || errorStr.includes("503") || errorStr.includes("xhr error");
    if (isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const parseAssetCommand = async (text: string, brokerName: string): Promise<any[]> => {
  return callGeminiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          isTransaction: { type: Type.BOOLEAN },
          transDate: { type: Type.STRING },
          side: { type: Type.STRING },
          lot: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
          buyValue: { type: Type.NUMBER },
          sellValue: { type: Type.NUMBER },
          salesTax: { type: Type.NUMBER },
          name: { type: Type.STRING }
        },
        required: ["name", "lot", "price", "side"]
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 2000 } 
      },
    });

    return response.text ? JSON.parse(response.text) : [];
  });
};

export const parseCostCommand = async (text: string): Promise<any> => {
  return callGeminiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const today = getTodayFormatted();
    const prompt = `Extract cost details from: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    if (response.text) {
      const data = JSON.parse(response.text);
      const parts = (data.tanggal || today).split('/');
      const dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      data.bulan = INDO_MONTHS[dateObj.getMonth()];
      data.hari = INDO_DAYS[dateObj.getDay()];
      data.week = Math.ceil(dateObj.getDate() / 7);
      return data;
    }
  });
};

export const parseRevenueCommand = async (text: string): Promise<any> => {
  return callGeminiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const today = getTodayFormatted();
    const prompt = `Extract revenue details: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    if (response.text) {
      const data = JSON.parse(response.text);
      const parts = (data.tanggal || today).split('/');
      const dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      data.bulan = INDO_MONTHS[dateObj.getMonth()];
      data.hari = INDO_DAYS[dateObj.getDay()];
      data.week = "WEEK" + Math.ceil(dateObj.getDate() / 7);
      return data;
    }
  });
};

export const getFinancialAdvice = async (summary: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Beri saran keuangan singkat untuk Iqbal. Saldo saat ini Rp ${summary.balance}.`,
  });
  return response.text || "Terus pantau keuanganmu.";
};

export const getGrowthStrategy = async (baseline: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Strategi investasi untuk modal Rp ${baseline}. Bahasa Indonesia.`,
  });
  return response.text || "Investasi rutin adalah kunci.";
};

export const parseInvestasiCommand = async (text: string): Promise<any> => {
  return callGeminiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Extract investment details from: "${text}"
      Template format:
      BULAN : [MONTH]
      TYPE INVEST : [TYPE]
      FUND MANAGER : [MANAGER]
      FUND : [AMOUNT]
      RATIO : [PERCENTAGE]
      
      Output JSON with keys: bulan, typeInvest, fundManager, fund (number), ratio (string).
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return response.text ? JSON.parse(response.text) : null;
  });
};
