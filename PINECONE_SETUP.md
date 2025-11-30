# Panduan Lengkap: Integrasi Pinecone RAG dengan n8n

## 📋 Ringkasan
Proyek ini sekarang memiliki 2 workflow n8n untuk sistem RAG (Retrieval-Augmented Generation):

1. **`google-drive-to-pinecone.json`** - Workflow untuk mengisi knowledge base
2. **`chat-with-pinecone-rag.json`** - Workflow chat yang menggunakan knowledge base

---

## 🔧 Setup Awal

### 1. Persiapan Akun
Pastikan Anda sudah memiliki:
- ✅ Akun OpenAI dengan API key
- ✅ Akun Pinecone (free tier sudah cukup)
- ✅ Akun Google dengan akses Google Drive API

### 2. Buat Pinecone Index
1. Login ke [Pinecone Console](https://app.pinecone.io/)
2. Klik **"Create Index"**
3. Konfigurasi:
   - **Name**: `n8n-knowledge-base` (atau nama lain)
   - **Dimensions**: `1536` (untuk model `text-embedding-3-small`)
   - **Metric**: `cosine`
   - **Region**: Pilih yang terdekat
4. Klik **Create**

### 3. Setup Credentials di n8n

#### OpenAI API
1. Di n8n, buka **Credentials** → **Add Credential**
2. Pilih **OpenAI API**
3. Masukkan API Key dari [OpenAI Platform](https://platform.openai.com/api-keys)

#### Pinecone API
1. Di n8n, buka **Credentials** → **Add Credential**
2. Pilih **Pinecone API**
3. Masukkan:
   - **API Key**: Dari Pinecone Console → API Keys
   - **Environment**: Region Pinecone Anda (misal: `us-east-1`)

#### Google Drive OAuth2
1. Di n8n, buka **Credentials** → **Add Credential**
2. Pilih **Google Drive OAuth2 API**
3. Ikuti wizard untuk authorize akun Google Anda

---

## 📥 Workflow 1: Google Drive to Pinecone (Ingestion)

### Cara Import
1. Buka n8n
2. Klik **Workflows** → **Import from File**
3. Pilih file `google-drive-to-pinecone.json`

### Cara Konfigurasi
1. **Google Drive Node**:
   - Pilih credential Google Drive Anda
   - Pilih file yang ingin di-ingest (bisa PDF, TXT, DOCX, dll)
   
2. **Pinecone Vector Store Node**:
   - Pilih credential Pinecone Anda
   - Pilih index yang sudah dibuat (`n8n-knowledge-base`)

3. **Embeddings OpenAI Node**:
   - Pilih credential OpenAI Anda
   - Model sudah di-set ke `text-embedding-3-small`

### Cara Menggunakan
1. Upload dokumen ke Google Drive Anda
2. Copy **File ID** dari URL Google Drive:
   ```
   https://drive.google.com/file/d/1ABC...XYZ/view
                                    ↑ ini File ID
   ```
3. Paste File ID di node Google Drive
4. Klik **Execute Workflow**
5. Tunggu hingga selesai (cek di Pinecone Console, jumlah vectors akan bertambah)

---

## 💬 Workflow 2: Chat with Pinecone RAG

### Cara Import
1. Buka n8n
2. Klik **Workflows** → **Import from File**
3. Pilih file `chat-with-pinecone-rag.json`

### Cara Konfigurasi
1. **Webhook Node**: Sudah dikonfigurasi dengan path yang sama
2. **OpenAI Chat Model**: Pilih credential OpenAI Anda
3. **Pinecone Vector Store**: 
   - Pilih credential Pinecone Anda
   - Pilih index yang sama (`n8n-knowledge-base`)
   - Mode: **Load** (untuk retrieval)
   - Top K: `5` (ambil 5 dokumen paling relevan)
4. **Embeddings OpenAI**: Pilih credential OpenAI Anda

### Cara Activate
1. Klik toggle **Active** di pojok kanan atas
2. Workflow sekarang siap menerima request dari aplikasi React Anda

---

## 🔄 Alur Data Lengkap

### Ingestion Flow (Sekali saja / saat update knowledge base)
```
Google Drive → Download File → Text Loader → Text Splitter
                                                    ↓
                                            Embeddings (OpenAI)
                                                    ↓
                                            Pinecone (Insert)
```

### Chat Flow (Setiap user bertanya)
```
React App → Webhook → AI Agent → Respond to Webhook → React App
                         ↓
                    ┌────┴────┐
                    │         │
            OpenAI Chat   Vector Store Tool
                Model          ↓
                    │     Pinecone (Load)
                    │          ↓
                    │    Embeddings OpenAI
                    │
            Window Buffer Memory
```

---

## 🧪 Testing

### Test Ingestion
1. Upload file test ke Google Drive (misal: `test.txt` berisi "Nama saya Eja")
2. Jalankan workflow `google-drive-to-pinecone.json`
3. Cek di Pinecone Console → Index Stats → Total Vectors (harus bertambah)

### Test Chat
1. Pastikan workflow `chat-with-pinecone-rag.json` sudah **Active**
2. Dari aplikasi React, kirim pesan: "Siapa nama saya?"
3. AI seharusnya menjawab berdasarkan dokumen yang di-ingest

---

## ❓ Troubleshooting

### AI tidak menggunakan knowledge base
**Solusi**: Pastikan **Vector Store Tool** sudah terhubung ke input **Tool** di AI Agent (bukan Memory).

### Error "Index not found"
**Solusi**: Pastikan nama index di Pinecone sama dengan yang dipilih di n8n.

### Embedding dimension mismatch
**Solusi**: Pastikan Pinecone index dibuat dengan dimension `1536` (untuk `text-embedding-3-small`).

### Window Buffer Memory error
**Solusi**: Pastikan `sessionKey` menggunakan `={{ $json.body.chatId }}` agar setiap user punya memori terpisah.

---

## 📝 Catatan Penting

1. **Biaya**: 
   - OpenAI: Embeddings sangat murah (~$0.0001 per 1K tokens)
   - Pinecone: Free tier = 1 index, 100K vectors
   
2. **Performa**:
   - Chunk size 1000 karakter = balance antara konteks dan presisi
   - Top K = 5 sudah cukup untuk kebanyakan kasus
   
3. **Keamanan**:
   - Jangan commit credential ID ke Git
   - Gunakan environment variables untuk production

---

## 🚀 Next Steps

1. ✅ Import kedua workflow
2. ✅ Setup credentials
3. ✅ Ingest dokumen pertama
4. ✅ Test chat dengan pertanyaan terkait dokumen
5. 🔄 Iterate: tambah dokumen, improve prompts, adjust parameters
