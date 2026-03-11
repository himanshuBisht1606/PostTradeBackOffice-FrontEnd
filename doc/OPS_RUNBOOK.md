# Operations Runbook — PostTrade BackOffice

## Infrastructure

| Component | Details |
|---|---|
| Dev VM | `80.225.204.132` (OCI, ap-mumbai-1) |
| OS | Oracle Linux 8.10 |
| SSH User | `opc` |
| SSH Key | `ssh-key-2026-02-20.key` |
| Database | Supabase (PostgreSQL) — `aws-1-ap-south-1.pooler.supabase.com:5432` |
| Frontend URL | `http://80.225.204.132:3000` |
| Backend URL | `http://80.225.204.132` |

---

## Accessing the VM

### Step 1 — Open OCI Cloud Shell
Go to **OCI Console** → click the **Cloud Shell** icon (`>_`) in the top right.

### Step 2 — SSH into the VM
```bash
ssh -i ~/ssh-key-2026-02-20.key opc@80.225.204.132
```

> The key `ssh-key-2026-02-20.key` must be uploaded to Cloud Shell.
> To upload: click the **gear icon (⚙)** in Cloud Shell → **Upload**.

---

## Docker Commands

### Check running containers
```bash
docker ps
```

### Check API logs
```bash
docker logs posttrade-api-dev --tail 50
```

### Follow live logs
```bash
docker logs posttrade-api-dev -f
```
Press `Ctrl+C` to stop.

### Restart API
```bash
docker restart posttrade-api-dev
```

### Restart frontend
```bash
docker restart posttrade-frontend-dev
```

### Restart all containers
```bash
docker restart posttrade-api-dev posttrade-frontend-dev
```

### Check memory/CPU usage
```bash
docker stats --no-stream
```

---

## Running Containers

| Container | Image | Port |
|---|---|---|
| `posttrade-api-dev` | `ghcr.io/himanshubisht1606/posttrade-api:dev-latest` | `80 → 8080` |
| `posttrade-frontend-dev` | `ghcr.io/himanshubisht1606/posttrade-frontend:dev-latest` | `3000 → 80` |

> **Note:** VM has only **1GB RAM**. Monitor memory with `docker stats`.

---

## Default Admin Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@123` |
| Tenant Code | `DEMO` |
| Role | `PlatformSuperAdmin` |

---

## Common Issues

### API container keeps restarting
```bash
docker logs posttrade-api-dev --tail 50
```
**Most likely cause:** Supabase project is paused (free tier pauses after 7 days of inactivity).

**Fix:**
1. Go to [supabase.com](https://supabase.com) → login → open project
2. Click **Restore project**
3. Wait ~2 minutes
4. `docker restart posttrade-api-dev`

### Login returns 500 error
- Check if Supabase is active (see above)
- Check API logs for database connection errors

### SSH permission denied
- Ensure you are using `ssh-key-2026-02-20.key` (the key from VM creation date Feb 20, 2026)
- Use `opc` as the username (not `root` or `ubuntu`)

---

## Deployment

CI/CD is handled via GitHub Actions:
- **Dev:** push to any branch except `main` → auto-deploys to dev VM
- **Prod:** merge to `main` → auto-deploys to prod VM

Container registry: `ghcr.io/himanshubisht1606/posttrade-frontend`
