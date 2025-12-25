# Cloudflare Firewall Rules

## Overview
Firewall rules untuk melindungi endpoint n8n dan webhook dari akses yang tidak sah.

## Cara Menambahkan Firewall Rules

1. Login ke Cloudflare Dashboard
2. Pilih domain **ryuma-ai.cloud**
3. Klik **Security** → **WAF** → **Create rule**

## Recommended Rules

### Rule 1: Block Non-GET/POST Methods
**Rule Name**: Block Invalid HTTP Methods  
**Expression**:
```
(http.request.method ne "GET" and http.request.method ne "POST")
```
**Action**: Block

**Penjelasan**: Hanya izinkan GET (untuk akses dashboard) dan POST (untuk webhook).

---

### Rule 2: Allow Only Vercel and Telegram
**Rule Name**: Allow Vercel and Telegram Only  
**Expression**:
```
(not ip.geoip.asnum in {13335 62041 AS62041} and not http.user_agent contains "TelegramBot")
```
**Action**: Challenge (atau Block)

**Penjelasan**: 
- AS62041 = Telegram ASN
- 13335 = Cloudflare (termasuk Vercel yang host di Cloudflare)
- Challenge user lain yang mencoba akses

**Note**: Rule ini optional karena bisa memblokir akses Anda sendiri. Gunakan hanya jika webhook hanya perlu diakses oleh Telegram dan Vercel.

---

### Rule 3: Rate Limiting (Optional)
**Rule Name**: Rate Limit Webhook  
**Expression**:
```
(http.request.uri.path contains "/webhook")
```
**Action**: Rate Limit (10 requests per minute per IP)

**Penjelasan**: Cegah spam/DDoS attack ke endpoint webhook.

---

## Monitoring

Setelah menambahkan rules, monitor di:
- **Security** → **Events** untuk melihat blocked requests
- **Analytics & Logs** → **Security Events** untuk analisis detail

## Testing Rules

Setelah menambahkan firewall rules, test dengan:
```powershell
# Should work (POST method)
curl -X POST https://webhook.ryuma-ai.cloud/webhook/test

# Should be blocked (DELETE method)
curl -X DELETE https://webhook.ryuma-ai.cloud/webhook/test
```
