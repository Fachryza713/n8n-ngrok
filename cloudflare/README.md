# Cloudflare Tunnel Setup Documentation

## Tunnel Information
- **Tunnel Name**: ryuma-tunnel
- **Tunnel ID**: 9f2fd331-d36c-434b-a0f1-f4253a744fd8
- **Credentials**: `C:\Users\Eja\.cloudflared\9f2fd331-d36c-434b-a0f1-f4253a744fd8.json`

## Domain Routing
- **n8n.ryuma-ai.cloud** → localhost:5678 (n8n Dashboard)
- **webhook.ryuma-ai.cloud** → localhost:5678 (n8n Webhooks)

## Configuration File
Location: `c:\Users\Eja\n8n-ngrok\cloudflare\tunnel-config.yaml`

## Running the Tunnel

### One-time Manual Start
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --config cloudflare\tunnel-config.yaml run ryuma-tunnel
```

### Install as Windows Service (Recommended)
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" service install --config c:\Users\Eja\n8n-ngrok\cloudflare\tunnel-config.yaml
```

After installing as service, it will start automatically on boot.

## Stopping the Service
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" service uninstall
```

## Architecture Changes
**Before (Ngrok)**:
- Local n8n → Ngrok tunnel → Dynamic URL (changes on restart)

**After (Cloudflare)**:
- Local n8n → Cloudflare Tunnel → Permanent URLs:
  - https://n8n.ryuma-ai.cloud
  - https://webhook.ryuma-ai.cloud

## Benefits
- ✅ Permanent URLs (no more changing URLs)
- ✅ No session time limits
- ✅ Free SSL/TLS certificates
- ✅ DDoS protection via Cloudflare
- ✅ Can add firewall rules for security
