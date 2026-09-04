# Laporan Keuangan Iqbal - Panduan Deployment

Aplikasi ini telah dirapikan untuk mendukung deployment terpisah antara Frontend dan Backend.

## 🚀 Persiapan Deployment di Render (BACKEND)

Sangat penting mengikuti langkah ini agar server tidak mati (*Exited with status 1*):

### 1. Konfigurasi Dashboard Render
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`  <-- **PENTING: JANGAN gunakan `npx ts-node` atau `npm run dev`**
- **Environment Variables** (Menu *Environment*):
  - `NODE_ENV`: `production`
  - `GEMINI_API_KEY`: API Key Anda (dari Google AI Studio).
  - `SPREADSHEET_WEBAPP_URL`: URL Google Apps Script Anda (WAJIB diisi agar database terhubung).

### 2. Konfigurasi di Vercel (FRONTEND)
- **Environment Variables**:
  - `VITE_API_URL`: URL backend Anda di Render (Contoh: `https://laporan-backend.onrender.com`).

---

## Arsitektur
- **Frontend**: React + Vite (Direkomendasikan ke **Vercel**).
- **Backend**: Express.js (Direkomendasikan ke **Render**).
- **Database**: Google Sheets (Data tersimpan aman di Google Spreadsheet Anda).
- **Repo**: Kode siap di-push ke **GitHub**.

## Keamanan
- API Key Gemini sekarang tersimpan aman di Backend (Server-side).
- Proxy Google Sheets juga melalui Backend untuk menghindari isu CORS.
