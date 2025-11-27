# Integrasi dengan N8N Webhook

## Konfigurasi N8N

### Webhook URL
```
https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328
```

### Workflow
- **Trigger**: Telegram Trigger (Updates: message)
- **AI Agent**: Chat Model dengan Memory
- **Memory**: Window Buffer Memory
- **Tools**: Dall-E 3 Tool
- **Output**: Telegram sendMessage

### Bot Information
- **Bot Name**: n8n_tel_v2_bot
- **Bot Token**: 8233151053:AAH0cm_ybdDeXpi-xj52deNjyZAi8WZ-wFE

## Format Request ke N8N Webhook

Backend server mengirim request dalam format JSON:

```json
{
  "message": "User message here",
  "chatId": "web-app",
  "from": {
    "id": "web-user",
    "first_name": "Web User",
    "username": "web_user"
  },
  "hasFile": false
}
```

### Jika ada file upload:
```json
{
  "message": "User message here",
  "chatId": "web-app",
  "from": {
    "id": "web-user",
    "first_name": "Web User",
    "username": "web_user"
  },
  "hasFile": true,
  "fileName": "document.pdf",
  "fileType": "application/pdf"
}
```

## Format Response dari N8N

Backend server akan mencoba extract response dari berbagai format:
- `data.output`
- `data.text`
- `data.message`
- `data.response`
- Raw string jika data adalah string
- JSON stringify jika format tidak dikenali

## Testing

### 1. Test Webhook Langsung

Anda bisa test webhook n8n langsung dengan curl:

```bash
curl -X POST https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/f7b24e5c-6669-4601-bc0b-30f3d4ca7c00/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from web app", "chatId": "web-app", "from": {"id": "web-user", "first_name": "Web User"}}'
```

### 2. Test via Backend API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI", "apiUrl": "https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/f7b24e5c-6669-4601-bc0b-30f3d4ca7c00/webhook"}'
```

### 3. Test via Web App

1. Buka http://localhost:5173
2. Ketik pesan di chat input
3. Klik send atau tekan Enter
4. Check console log di terminal backend untuk melihat request/response

## Troubleshooting

### Jika webhook tidak merespons:

1. **Check ngrok status**:
   - Pastikan ngrok masih running
   - Check ngrok dashboard untuk request logs

2. **Check n8n workflow**:
   - Pastikan workflow aktif (activated)
   - Check execution logs di n8n

3. **Check backend logs**:
   - Terminal akan menampilkan:
     - 📨 Incoming request
     - 🔄 Forwarding to n8n
     - 📥 n8n response status
     - ✅ n8n response atau ❌ error

4. **Check network**:
   - Pastikan tidak ada firewall blocking
   - Test webhook URL di browser atau Postman

### Common Issues:

**Issue**: "n8n webhook responded with status: 404"
- **Solution**: Pastikan webhook URL benar dan workflow aktif

📥 n8n response status: 200
✅ n8n response: { ... }
```

Jika ada error:
```
❌ n8n error: Error message here
❌ Error in chat endpoint: Error details
```

## Next Steps

Jika webhook tidak bekerja seperti yang diharapkan, kita mungkin perlu:

1. Melihat response format dari n8n webhook
2. Adjust parsing logic di server.ts
3. Atau membuat webhook endpoint baru di n8n khusus untuk web app

Silakan test aplikasi dan beri tahu saya jika ada error atau response yang tidak sesuai!
