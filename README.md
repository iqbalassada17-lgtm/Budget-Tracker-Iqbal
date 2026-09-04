# Laporan Keuangan Iqbal - Panduan Deployment

Aplikasi ini telah dirapikan untuk mendukung deployment terpisah antara Frontend dan Backend.

## Arsitektur
- **Frontend**: React + Vite (Direkomendasikan ke **Vercel**).
- **Backend**: Express.js (Direkomendasikan ke **Render**).
- **Database**: Google Sheets (Data tersimpan aman di Google Spreadsheet Anda).
- **Repo**: Kode siap di-push ke **GitHub**.

## Persiapan Deployment

### 1. Backend (Render)
- Buat Web Service baru di Render.
- Hubungkan dengan repositori GitHub Anda.
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `GEMINI_API_KEY`: API Key dari AI Studio.
  - `SPREADSHEET_WEBAPP_URL`: URL dari Google Apps Script Anda.

### 2. Frontend (Vercel)
- Buat Project baru di Vercel.
- Hubungkan dengan repositori yang sama.
- **Framework Preset**: Vite.
- **Environment Variables**:
  - `VITE_API_URL`: URL aplikasi Backend Anda di Render (contoh: `https://laporan-backend.onrender.com`).

## Keamanan
- API Key Gemini sekarang tersimpan aman di Backend (Server-side).
- Proxy Google Sheets juga melalui Backend untuk menghindari isu CORS.
