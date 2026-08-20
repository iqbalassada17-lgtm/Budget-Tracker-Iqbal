
/// <reference types="vite/client" />

export interface SpreadsheetData {
  bulan: string;      
  tanggal: string;    
  hari: string;       
  week: number | string; 
  coa: string;        
  cost: number;       
  keterangan: string; 
}

export interface RevenueSpreadsheetData {
  bulan: string;      
  tanggal: string;    
  hari: string;       
  week: string;       
  parameter: string;  
  revenue: number;    
}

export interface StockbitTransactionData {
  transDate: string;
  stock: string;
  side: string;
  lot: number;
  price: number;
  buyValue: number;
  sellValue: number;
  salesTax: number;
}

export interface InvestasiSpreadsheetData {
  bulan: string;
  typeInvest: string;
  fundManager: string;
  fund: number;
  ratio: string;
}

/**
 * URL PROXY ENDPOINT (Dinamis: Mendukung lokal dev dan production)
 */
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? '' : (import.meta.env.VITE_API_URL || '');
const SPREADSHEET_PROXY_URL = 'https://budget-tracker-iqbal.onrender.com/api/spreadsheet';

// Definisi Tipe Nama Sheet yang diizinkan
export type SheetName = 'INPUT COST' | 'REVENUE' | 'BUDGET' | 'STOCKBIT' | 'INVESTASI';

/**
 * Fetch data dari Google Sheets (GET)
 */
export const fetchFromGoogleSheet = async (type: SheetName): Promise<any[][]> => {
  const url = `${SPREADSHEET_PROXY_URL}?type=${encodeURIComponent(type)}`;
  
  try {
    const response = await fetch(url);
    
    // Cek apakah responnya OK
    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    // Cek apakah responnya benar-benar JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server tidak mengirimkan data JSON yang valid (Kemungkinan Render sedang tidur/sleep). Silakan coba lagi dalam 1 menit.");
    }
    
    const data = await response.json();
    
    if (data.error) {
      // Jika error karena sheet tidak ditemukan, kembalikan array kosong agar aplikasi tidak crash
      const errorMsg = data.error.toLowerCase();
      if (errorMsg.includes("tidak ditemukan") || errorMsg.includes("not found")) {
        console.warn(`Sheet [${type}] not found in Spreadsheet. Returning empty data.`);
        return []; 
      }
      throw new Error(data.error);
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error(`Spreadsheet Fetch Error [${type}]:`, error);
    throw error;
  }
};

/**
 * Simpan data COST (POST)
 */
export const syncToGoogleSheet = async (data: SpreadsheetData): Promise<boolean> => {
  try {
    const payload = {
      type: 'INPUT COST', 
      bulan: data.bulan.toUpperCase(),
      tanggal: data.tanggal,
      hari: data.hari.toUpperCase(),
      week: data.week.toString().toUpperCase(),
      coa: data.coa.toUpperCase(),
      cost: data.cost,
      keterangan: data.keterangan.toUpperCase()
    };

    await fetch(SPREADSHEET_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Gagal sync cost:", error);
    return false;
  }
};

/**
 * Simpan data REVENUE (POST)
 */
export const syncRevenueToGoogleSheet = async (data: RevenueSpreadsheetData): Promise<boolean> => {
  try {
    const payload = {
      type: 'REVENUE',
      bulan: data.bulan.toUpperCase(),
      tanggal: data.tanggal,
      hari: data.hari.toUpperCase(),
      week: data.week.toUpperCase(),
      parameter: data.parameter.toUpperCase(),
      revenue: data.revenue
    };

    await fetch(SPREADSHEET_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Gagal sync revenue:", error);
    return false;
  }
};

/**
 * Simpan riwayat transaksi khusus Stockbit ke sheet "STOCKBIT"
 */
export const syncStockbitTransactionToSheet = async (data: StockbitTransactionData): Promise<boolean> => {
  try {
    const payload = {
      type: 'STOCKBIT',
      transDate: data.transDate,
      stock: data.stock.toUpperCase(),
      side: data.side.toUpperCase(),
      lot: data.lot,
      price: data.price,
      buyValue: data.buyValue,
      sellValue: data.sellValue,
      salesTax: data.salesTax
    };

    await fetch(SPREADSHEET_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Gagal sync transaksi stockbit:", error);
    return false;
  }
};

/**
 * Simpan data Investasi ke sheet "INVESTASI"
 */
export const syncInvestasiToGoogleSheet = async (data: InvestasiSpreadsheetData): Promise<boolean> => {
  try {
    const payload = {
      type: 'INVESTASI',
      bulan: data.bulan.toUpperCase(),
      typeInvest: data.typeInvest.toUpperCase(),
      fundManager: data.fundManager.toUpperCase(),
      fund: data.fund,
      ratio: data.ratio
    };

    await fetch(SPREADSHEET_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("Gagal sync investasi:", error);
    return false;
  }
};

/**
 * Update Ratio (Kolom E) di sheet "INVESTASI"
 */
export const updateInvestasiRatio = async (rowIndex: number, newRatio: string): Promise<boolean> => {
  try {
    const payload = {
      type: 'INVESTASI',
      action: 'UPDATE',
      rowIndex: rowIndex,
      column: 'E',
      value: newRatio
    };

    const response = await fetch(SPREADSHEET_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.success || true;
  } catch (error) {
    console.error("Gagal update ratio:", error);
    return false;
  }
};
