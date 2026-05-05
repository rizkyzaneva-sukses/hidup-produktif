# 🚀 Deploy ke Easypanel - Panduan Lengkap

## Arsitektur

```
┌─────────────────────────────────────────────┐
│              EASYPANEL PROJECT               │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │   App Service    │  │ Postgres Service │  │
│  │   (Next.js)     │──│   (Database)     │  │
│  │   Port: 3000    │  │   Port: 5432     │  │
│  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
```

## Prasyarat

- Server dengan Easypanel terinstall
- Git repository (GitHub/GitLab/Bitbucket)
- Domain (opsional, bisa pakai subdomain Easypanel)

---

## Langkah-Langkah Deployment

### 1️⃣ Buat Project di Easypanel

1. Login ke Easypanel dashboard
2. Klik **"+ Project"** → beri nama misalnya `hidup-produktif`

---

### 2️⃣ Buat Service PostgreSQL

1. Di dalam project, klik **"+ Service"**
2. Pilih **"Postgres"**
3. Konfigurasi:
   - **Service Name**: `db`
   - **Password**: (buat password yang kuat, catat!)
   - **Database Name**: `hidup_produktif`
4. Klik **Create**
5. Catat connection string yang terbentuk:
   ```
   postgresql://postgres:PASSWORD@hidup-produktif-db:5432/hidup_produktif
   ```

---

### 3️⃣ Buat Service App (Next.js)

1. Di dalam project yang sama, klik **"+ Service"**
2. Pilih **"App"**
3. Konfigurasi:
   - **Service Name**: `web`
   - **Source**: GitHub (connect repository)
   - **Branch**: `main`
   - **Build Method**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`

---

### 4️⃣ Set Environment Variables

Di service `web`, buka tab **Environment** dan tambahkan:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@hidup-produktif-db:5432/hidup_produktif?schema=public` |
| `NODE_ENV` | `production` |
| `TELEGRAM_BOT_TOKEN` | *(opsional)* Token bot Telegram |
| `TELEGRAM_CHAT_ID` | *(opsional)* Chat ID Telegram |

> ⚠️ **PENTING**: Ganti `PASSWORD` dengan password PostgreSQL yang sudah dibuat di langkah 2.
> 
> ⚠️ **PENTING**: Hostname database menggunakan format `{project-name}-{service-name}`, jadi jika project = `hidup-produktif` dan service postgres = `db`, maka hostname = `hidup-produktif-db`.

---

### 5️⃣ Konfigurasi Domain

1. Di service `web`, buka tab **Domains**
2. Tambahkan domain:
   - Gunakan subdomain Easypanel: `hidup-produktif.your-server.com`
   - Atau custom domain: `app.yourdomain.com`
3. Port: `3000`
4. Enable HTTPS (Let's Encrypt otomatis)

---

### 6️⃣ Deploy!

1. Klik **"Deploy"** pada service `web`
2. Easypanel akan:
   - Pull code dari Git
   - Build Docker image menggunakan Dockerfile
   - Run `prisma migrate deploy` (otomatis via CMD di Dockerfile)
   - Start Next.js server
3. Tunggu sampai status **"Running"** ✅

---

## Troubleshooting

### Database connection error
- Pastikan hostname database benar (format: `{project}-{service}`)
- Pastikan password tidak ada karakter special yang perlu di-escape
- Cek apakah service Postgres sudah running

### Build error
- Cek logs di tab **"Deployments"**
- Pastikan semua environment variables sudah di-set sebelum deploy

### Migration error
- Jika migration gagal, bisa masuk ke terminal container dan jalankan manual:
  ```bash
  npx prisma migrate deploy
  ```

---

## Update / Redeploy

Setiap kali push ke branch `main`:
1. Buka Easypanel → service `web`
2. Klik **"Deploy"** (atau aktifkan auto-deploy dari settings)

---

## Backup Database

### Manual backup via Easypanel:
1. Buka service `db` (Postgres)
2. Tab **"Backups"** → Create backup

### Via CLI (jika SSH ke server):
```bash
docker exec -t $(docker ps -qf "name=hidup-produktif-db") pg_dump -U postgres hidup_produktif > backup.sql
```

---

## Migrasi Data dari SQLite (Opsional)

Jika ada data di SQLite lokal (`data/app.db`) yang ingin dipindahkan:

1. Export data dari SQLite ke JSON (bisa pakai script atau tool seperti DB Browser for SQLite)
2. Setelah app deployed, gunakan API endpoints untuk import data
3. Atau buat script migrasi custom:

```bash
# Di lokal, setelah deploy berhasil
npx prisma db seed
```

---

## Struktur File Penting

```
├── Dockerfile          # Docker build configuration
├── .dockerignore       # Files to exclude from Docker build
├── prisma/
│   └── schema.prisma   # Database schema (PostgreSQL)
├── lib/
│   ├── prisma.ts       # Prisma client singleton
│   └── db.ts           # DB exports (backward compat)
├── next.config.ts      # Next.js config (output: standalone)
└── .env.example        # Template environment variables
```

---

## Catatan Teknis

- **Database**: Migrasi dari SQLite (sql.js) ke PostgreSQL via Prisma ORM
- **Output**: Next.js standalone mode untuk Docker yang optimal
- **Prisma Migrate**: Otomatis dijalankan saat container start
- **Cron Jobs**: Tetap berjalan via `node-cron` di dalam container (notifikasi Telegram harian)
