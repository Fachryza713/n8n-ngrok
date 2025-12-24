# Laporan Integrasi Project AI Chat (n8n-ngrok)

Laporan ini merangkum arsitektur teknis, titik integrasi, dan alur data dari proyek aplikasi chat berbasis AI yang sedang dikembangkan.

## 1. Identitas Proyek
*   **Nama Proyek**: `ai-chat-app` (n8n-ngrok)
*   **Deskripsi**: Asisten Chat AI yang terintegrasi web dengan kemampuan memori dan RAG (Retrieval Augmented Generation).
*   **Stack Utama**: React (Vite), Node.js (Express), Supabase, n8n, OpenAI, Pinecone.

## 2. Arsitektur Sistem

Diagram berikut menggambarkan bagaimana komponen-komponen sistem saling berinteraksi:

```mermaid
graph TD
    subgraph Client ["Frontend (Client)"]
        ReactApp[React App]
        SupabaseAuth[Supabase Auth]
    end

    subgraph Server ["Backend API"]
        ExpressAPI[Express Server]
        SupabaseDB[Supabase Database]
    end

    subgraph Orchestration ["AI Orchestration (n8n)"]
        WebhookNode[Webhook Node]
        AIAgent[AI Agent]
        GoogleDrive[Google Drive Trigger]
        Pinecone[Pinecone Vector Store]
    end

    subgraph ExternalServices ["External Services"]
        OpenAI[OpenAI API]
        SerpAPI[SerpAPI (Search)]
        Telegram[Telegram Bot]
    end

    %% Flows
    ReactApp -->|Auth| SupabaseAuth
    ReactApp -->|REST API| ExpressAPI
    ExpressAPI -->|Store History| SupabaseDB
    ExpressAPI -->|Forward Message| WebhookNode
    
    WebhookNode --> AIAgent
    AIAgent -->|LLM| OpenAI
    AIAgent -->|Retrieve Context| Pinecone
    AIAgent -->|Search| SerpAPI
    
    GoogleDrive -->|Ingest Docs| WebhookNode
    WebhookNode -->|Embed & Store| Pinecone
```

## 3. Komponen Integrasi

### A. Frontend (Client)
*   **Framework**: React dengan TypeScript & Vite.
*   **Autentikasi**: Terintegrasi langsung dengan **Supabase Auth** (`supabase.ts`).
*   **State Management**: Mengelola session chat, history pesan, dan konfigurasi user (API URL, Temperature).
*   **Koneksi API**: Mengirim request ke Backend (`http://localhost:3000/api/chat`) yang bertindak sebagai proxy ke n8n.

### B. Backend (Server)
*   **Platform**: Node.js dengan Express.
*   **Fungsi Utama**:
    *   Endpoint `/api/chat`: Menerima pesan dari frontend, memformat payload, dan meneruskan ke n8n Webhook.
    *   Endpoint `/api/sessions`: Mengelola penyimpanan dan pengambilan riwayat chat (likely via Supabase).
*   **Security**: Menyembunyikan detail webhook n8n dari frontend langsung (meskipun saat ini URL webhook masih terekspos di config frontend default).

### C. AI Orchestration (n8n)
Inti kecerdasan sistem berada di n8n workflows:
1.  **Chat Workflow**:
    *   **Trigger**: Webhook dari Backend & Telegram.
    *   **Main Node**: AI Agent (Chat Model dengan Memory).
    *   **Tools**:
        *   **Vector Store Tool**: Untuk mengakses knowledge base di Pinecone (RAG).
        *   **SerpAPI**: Untuk pencarian info terkini (Integrasi dalam proses).
        *   **Dall-E 3**: Untuk generasi gambar.
2.  **Ingestion Workflow** (`google-drive-to-pinecone.json`):
    *   Mengambil dokumen dari Google Drive.
    *   Memecah teks (Chunking) & Embeddings (OpenAI `text-embedding-3-small`).
    *   Menyimpan vektor ke **Pinecone** (Index Dimension: 1536).

### D. Infrastruktur & Tunneling
*   **Ngrok**: Digunakan untuk mengekspos n8n local instance ke internet agar bisa diakses oleh Telegram dan External Webhook.
    *   Current URL: `https://schemeless-charli-unenlightenedly.ngrok-free.dev`

## 4. Status Integrasi Terkini

| Komponen | Status | Catatan |
| :--- | :--- | :--- |
| **Login & Auth** | ✅ Berjalan | Menggunakan Supabase Auth. |
| **Chat Dasar** | ✅ Berjalan | Koneksi Frontend -> Backend -> n8n lancar. |
| **RAG (Pinecone)** | ⚠️ Dalam Proses | Panduan setup tersedia (`RAG_SETUP_GUIDE.md`). Perlu memastikan Vector Store Tool terpasang dengan benar di workflow chat. |
| **Ingestion Dokumen** | ⚠️ Setup Diperlukan | Workflow `google-drive-to-pinecone` siap, perlu dijalankan manual untuk mengisi knowledge base. |
| **Vision/Gambar** | 🛠️ Debugging | Investigasi sebelumnya mengenai kemampuan AI melihat gambar (Vision Scope). |
| **SerpAPI** | 🛠️ Debugging | Integrasi tool pencarian sedang divalidasi agar AI aktif menggunakannya. |

## 5. Langkah Selanjutnya (Rekomendasi)
1.  **Finalisasi RAG**: Ikuti langkah di `RAG_SETUP_GUIDE.md` untuk memastikan AI bisa menjawab dari dokumen Google Drive.
2.  **Harmonisasi URL**: Pastikan URL ngrok di `App.tsx` dan `N8N_INTEGRATION.md` konsisten (URL ngrok sering berubah versi free).
3.  **Security Hardening**: Pindahkan URL webhook sensitif sepenuhnya ke Environment Variables server-side, jangan di-hardcode di Client.
