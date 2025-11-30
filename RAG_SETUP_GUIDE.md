# Panduan Lengkap: Setup RAG Pinecone untuk Project n8n

## 📚 Overview

Project Anda akan memiliki **2 workflow n8n**:

1. **Workflow Chat** (sudah ada) - untuk menerima pertanyaan dari user dan menjawab menggunakan AI + knowledge base
2. **Workflow Ingestion** (perlu dibuat) - untuk mengisi knowledge base dari Google Drive

---

## 🔧 BAGIAN 1: Memperbaiki Workflow Chat

### Masalah Saat Ini:
Workflow chat Anda **hampir benar**, tapi masih kurang 1 node penting: **Vector Store Tool**

### Langkah Perbaikan:

#### 1. Buka workflow chat Anda di n8n

#### 2. Tambahkan node "Vector Store Tool":
- Klik area kosong → ketik `Vector Store Tool`
- Drag ke canvas (letakkan antara Pinecone dan AI Agent)

#### 3. Putuskan koneksi yang salah:
- Klik garis dari **Pinecone Vector Store** ke **AI Agent**
- Tekan **Delete**

#### 4. Sambungkan ulang dengan benar:

**Koneksi A**: Pinecone → Vector Store Tool
```
Pinecone Vector Store (output: "Vector Store")
         ↓
Vector Store Tool (input: "Vector Store")
```

**Koneksi B**: Vector Store Tool → AI Agent
```
Vector Store Tool (output: "Tool")
         ↓
AI Agent (input: "Tool")
```

#### 5. Konfigurasi Vector Store Tool:
- **Operation Mode**: `Retrieve Documents (As Tool for AI Agent)`
- **Description**: 
  ```
  Search the knowledge base for relevant information to answer user questions about uploaded documents.
  ```
- **Limit**: `4` (ambil 4 dokumen paling relevan)

#### 6. Struktur Akhir yang Benar:
```
Telegram Trigger ──┐
                   ├──→ AI Agent ──→ Respond to Webhook
Webhook ───────────┘      ↓
                    ┌─────┼─────┬─────────┐
                    │     │     │         │
                  Model Memory Tool   Output Parser
                    │     │     │
              OpenAI  Window  Vector Store Tool
               Chat   Buffer       ↓
              Model  Memory   Pinecone Vector Store
                                   ↓
                             Embeddings OpenAI
```

---

## 🔧 BAGIAN 2: Membuat Workflow Ingestion

### Tujuan:
Workflow ini untuk mengisi Pinecone dengan data dari Google Drive (PDF, DOCX, TXT, dll)

### Langkah Setup:

#### 1. Import workflow ingestion:
- File sudah ada: `google-drive-to-pinecone.json`
- Di n8n: **Workflows** → **Import from File**
- Pilih file tersebut

#### 2. Setup Credentials:

**Google Drive OAuth2**:
- Di n8n: **Credentials** → **Add Credential** → **Google Drive OAuth2 API**
- Ikuti wizard untuk authorize akun Google

**OpenAI API**:
- Gunakan credential yang sama dengan workflow chat

**Pinecone API**:
- Di n8n: **Credentials** → **Add Credential** → **Pinecone API**
- **API Key**: Dari [Pinecone Console](https://app.pinecone.io/) → API Keys
- **Environment**: Region Anda (misal: `us-east-1`)

#### 3. Konfigurasi Nodes:

**Node: Google Drive**
- Pilih credential Google Drive
- **Operation**: Download
- **File ID**: Anda akan isi ini setiap kali ingest dokumen baru

**Node: Pinecone Vector Store**
- **Mode**: `Insert`
- **Pinecone Index**: Pilih index Anda (misal: `rag-index`)
- Pilih credential Pinecone

**Node: Embeddings OpenAI**
- Pilih credential OpenAI
- **Model**: `text-embedding-3-small` (sudah default)

**Node: Recursive Character Text Splitter**
- **Chunk Size**: `1000`
- **Chunk Overlap**: `200`

#### 4. Struktur Workflow Ingestion:
```
Manual Trigger
      ↓
Google Drive (download file)
      ↓
Default Data Loader ←─ Recursive Character Text Splitter
      ↓
Pinecone Vector Store ←─ Embeddings OpenAI
```

---

## 🚀 BAGIAN 3: Cara Menggunakan

### A. Mengisi Knowledge Base (Ingestion):

1. **Upload dokumen ke Google Drive**
   - Bisa PDF, DOCX, TXT, atau format lain

2. **Copy File ID**:
   - Buka file di Google Drive
   - URL-nya seperti: `https://drive.google.com/file/d/1ABC...XYZ/view`
   - Copy bagian `1ABC...XYZ` (ini File ID)

3. **Jalankan workflow ingestion**:
   - Buka workflow `google-drive-to-pinecone` di n8n
   - Klik node **Google Drive**
   - Paste File ID
   - Klik **Execute Workflow**

4. **Verifikasi**:
   - Buka [Pinecone Console](https://app.pinecone.io/)
   - Pilih index Anda
   - Lihat **Total Vectors** - harus bertambah

### B. Chat dengan Knowledge Base:

1. **Activate workflow chat**:
   - Buka workflow chat di n8n
   - Toggle **Active** di pojok kanan atas

2. **Test dari React app**:
   - Kirim pertanyaan yang **TIDAK** terkait dokumen:
     ```
     User: "Halo, apa kabar?"
     AI: (jawab normal)
     ```
   
   - Kirim pertanyaan yang **TERKAIT** dokumen yang sudah di-ingest:
     ```
     User: "Apa isi dokumen yang saya upload?"
     AI: (jawab berdasarkan knowledge base)
     ```

---

## 🔍 Troubleshooting

### 1. AI tidak menggunakan knowledge base
**Penyebab**: Vector Store Tool tidak terhubung dengan benar
**Solusi**: Pastikan koneksi Pinecone → Vector Store Tool → AI Agent sudah benar

### 2. Error "Index not found"
**Penyebab**: Nama index di n8n tidak sama dengan di Pinecone
**Solusi**: Cek nama index di Pinecone Console, pastikan sama persis

### 3. Error "Dimension mismatch"
**Penyebab**: Pinecone index dibuat dengan dimension yang salah
**Solusi**: 
- Hapus index lama di Pinecone
- Buat index baru dengan dimension `1536` (untuk model `text-embedding-3-small`)

### 4. Workflow ingestion lambat
**Normal**: Dokumen besar (>100 halaman) bisa memakan waktu beberapa menit
**Tips**: Mulai dengan dokumen kecil (1-5 halaman) untuk testing

---

## 📊 Monitoring

### Cek berapa dokumen sudah di-ingest:
1. Login ke [Pinecone Console](https://app.pinecone.io/)
2. Pilih index Anda
3. Lihat **Index Stats** → **Total Vectors**

### Cek apakah AI menggunakan knowledge base:
1. Di n8n, buka tab **Executions**
2. Klik execution terakhir
3. Lihat node **Vector Store Tool** - jika ada output, berarti AI menggunakan knowledge base

---

## 💡 Tips Optimasi

1. **Chunk Size**: 
   - Terlalu kecil (< 500): Kehilangan konteks
   - Terlalu besar (> 2000): Kurang presisi
   - **Rekomendasi**: 1000 karakter

2. **Top K (Limit)**:
   - Terlalu kecil (< 3): Mungkin miss informasi penting
   - Terlalu besar (> 10): Terlalu banyak noise
   - **Rekomendasi**: 4-5 dokumen

3. **Model Embedding**:
   - `text-embedding-3-small`: Murah, cepat, akurat untuk kebanyakan kasus
   - `text-embedding-3-large`: Lebih akurat tapi lebih mahal

---

## 🎯 Checklist Lengkap

### Setup Awal:
- [ ] Buat Pinecone index (dimension: 1536)
- [ ] Setup credentials di n8n (Google Drive, OpenAI, Pinecone)
- [ ] Import workflow `google-drive-to-pinecone.json`
- [ ] Perbaiki workflow chat (tambah Vector Store Tool)

### Testing:
- [ ] Upload dokumen test ke Google Drive
- [ ] Jalankan workflow ingestion
- [ ] Cek Pinecone Console (vectors bertambah)
- [ ] Activate workflow chat
- [ ] Test dari React app dengan pertanyaan terkait dokumen

### Production:
- [ ] Ingest semua dokumen yang dibutuhkan
- [ ] Test berbagai jenis pertanyaan
- [ ] Monitor usage di OpenAI dan Pinecone dashboard

---

## 📞 Support

Jika ada masalah:
1. Cek tab **Executions** di n8n untuk melihat error detail
2. Lihat log di Pinecone Console
3. Pastikan semua credentials valid dan tidak expired
