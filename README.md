# AI Chat Assistant - React TypeScript

Aplikasi AI Chat Assistant yang dibangun dengan React TypeScript (frontend) dan Node.js Express (backend).

## Struktur Project

```
n8n-ngrok/
├── client/          # React TypeScript Frontend
├── server/          # Node.js Express Backend
└── package.json     # Root package.json
```

## Prerequisites

- Node.js (v18 atau lebih baru)
- npm

## Installation

1. Install dependencies untuk root project:
```bash
npm install
```

2. Install dependencies untuk client:
```bash
cd client
npm install
cd ..
```

3. Install dependencies untuk server:
```bash
cd server
npm install
cd ..
```

## Running the Application

### Development Mode

Jalankan kedua server (frontend dan backend) sekaligus:
```bash
npm run dev
```

Atau jalankan secara terpisah:

**Backend Server:**
```bash
npm run dev:server
# Server akan berjalan di http://localhost:3000
```

**Frontend Client:**
```bash
npm run dev:client
# Client akan berjalan di http://localhost:5173
```

### Production Build

```bash
npm run build
```

## Configuration

### Backend (Server)

Edit file `server/.env` untuk konfigurasi:
- `PORT`: Port untuk backend server (default: 3000)

### Frontend (Client)

Konfigurasi API URL dan temperature dapat diubah melalui Settings Modal di aplikasi.

Default API URL: `https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook-test/f7b24e5c-6669-4601-bc0b-30f3d4ca7c00/webhook`

## Features

- ✅ Chat dengan AI Assistant
- ✅ Upload file (PDF, DOC, DOCX, TXT, PNG, JPG, JPEG)
- ✅ Night mode toggle
- ✅ Konfigurasi API URL dan temperature
- ✅ Conversation history
- ✅ Auto-scroll chat messages
- ✅ Typing indicator
- ✅ LocalStorage persistence untuk settings

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS (Vanilla)

### Backend
- Node.js
- Express
- TypeScript
- Multer (file upload)
- CORS

## API Endpoints

### Backend API

**POST /api/chat**
- Body: FormData
  - `message`: string
  - `temperature`: number
  - `history`: JSON string
  - `apiUrl`: string
  - `file`: File (optional)
- Response: JSON
  - `response`: string (AI response)

**GET /health**
- Response: JSON
  - `status`: "ok"
  - `message`: "Server is running"
