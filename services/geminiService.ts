
const INDO_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
const INDO_DAYS = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

const getTodayFormatted = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const GEMINI_ENDPOINT = `${API_BASE_URL}/api/gemini/generate`;

const callBackendGemini = async (prompt: string, model?: string, schema?: any, thinkingBudget?: number) => {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, schema, thinkingBudget }),
  });
  
  if (!response.ok) {
    throw new Error(`Backend Gemini Error: ${response.status}`);
  }
  
  const result = await response.json();
  return result.text;
};

const callGeminiWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return callGeminiWithRetry(fn, retries - 1, delay * 2);
  }
};

export const parseAssetCommand = async (text: string, brokerName: string): Promise<any[]> => {
  return callGeminiWithRetry(async () => {
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
      type: 'array',
      items: {
        type: 'object',
        properties: {
          isTransaction: { type: 'boolean' },
          transDate: { type: 'string' },
          side: { type: 'string' },
          lot: { type: 'number' },
          price: { type: 'number' },
          buyValue: { type: 'number' },
          sellValue: { type: 'number' },
          salesTax: { type: 'number' },
          name: { type: 'string' }
        },
        required: ["name", "lot", "price", "side"]
      }
    };

    const textResponse = await callBackendGemini(prompt, "gemini-1.5-pro", schema, 2000);
    return textResponse ? JSON.parse(textResponse) : [];
  });
};

export const parseCostCommand = async (text: string): Promise<any> => {
  return callGeminiWithRetry(async () => {
    const today = getTodayFormatted();
    const prompt = `Extract cost details from: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON.`;
    const textResponse = await callBackendGemini(prompt, "gemini-1.5-flash", { type: 'object' });
    if (textResponse) {
      const data = JSON.parse(textResponse);
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
    const today = getTodayFormatted();
    const prompt = `Extract revenue details: "${text}". Use DD/MM/YYYY. Date default: ${today}. Output JSON.`;
    const textResponse = await callBackendGemini(prompt, "gemini-1.5-flash", { type: 'object' });
    if (textResponse) {
      const data = JSON.parse(textResponse);
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
  
  const textResponse = await callBackendGemini(prompt, "gemini-1.5-flash");
  return textResponse || "Terus pantau keuanganmu.";
};

export const getGrowthStrategy = async (baseline: number): Promise<string> => {
  const textResponse = await callBackendGemini(`Strategi investasi untuk modal Rp ${baseline}. Bahasa Indonesia.`, "gemini-1.5-flash");
  return textResponse || "Investasi rutin adalah kunci.";
};

export const parseInvestasiCommand = async (text: string): Promise<any> => {
  return callGeminiWithRetry(async () => {
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
    const textResponse = await callBackendGemini(prompt, "gemini-1.5-flash", { type: 'object' });
    return textResponse ? JSON.parse(textResponse) : null;
  });
};
