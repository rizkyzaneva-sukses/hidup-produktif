# CLAUDE.md — Panduan Teknis App Hidup Produktif

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Deployment**: Easypanel (Docker)
- **State**: TanStack Query (React Query)
- **UI**: Tailwind CSS + komponen custom di `components/ui`

## Struktur Penting

```
app/
  api/          ← API routes (Next.js Route Handlers)
  sprint/       ← Daily Sprint
  habits/       ← Habit tracker
  tasks/        ← Task manager
  projects/     ← Project tracker
  ideas/        ← Idea capture
  learning/     ← Learning log
  reminders/    ← Reminder
  subscriptions/← Subscription tracker
  laporan/      ← Laporan & weekly review
  focus/        ← Focus mode (Pomodoro)
  settings/     ← Settings & custom roles
  role/[slug]/  ← View task per role
lib/
  constants.ts  ← Semua konstanta (ROLES, WORK_TYPES, dll)
  utils.ts      ← Helper functions
  prisma.ts     ← Prisma client singleton
prisma/
  schema.prisma ← Database schema
  migrations/   ← SQL migrations (manual, bukan prisma migrate)
```

## Konvensi Database

### Migration
App ini **tidak pakai `prisma migrate`**. Semua migration manual:
1. Tulis SQL di `prisma/migrations/<tanggal_nama>/migration.sql`
2. Jalankan manual di DB (via Easypanel DB console atau psql)
3. Update `prisma/schema.prisma` sesuai perubahan

### Naming
- DB columns: `snake_case`
- Prisma fields: `camelCase`
- Selalu pakai `@map()` untuk bridging keduanya

### Model Utama
- **Task** — unit kerja, bisa punya Project, bisa masuk Sprint
- **DailySprint** — rencana harian, punya relasi FK ke Task via SprintTask
- **SprintTask** — junction table Sprint ↔ Task (FK beneran)
- **Habit / HabitLog** — habit tracking harian
- **Project** — kumpulan Task
- **Idea** — ide mentah, bisa di-promote ke Project

## Daily Sprint — Arsitektur FK

### Sebelumnya (JSON string, debt teknis)
```
daily_sprints.tasks = '[{"task_id":"...","task_title":"...","duration":"1 jam"}]'
```

### Sekarang (FK beneran via SprintTask)
```
sprint_tasks
  id          TEXT PK
  sprint_id   TEXT FK → daily_sprints.id  (CASCADE DELETE)
  task_id     TEXT FK → tasks.id          (CASCADE DELETE)
  task_title  TEXT  (snapshot saat sprint dibuat)
  duration    TEXT
  sort_order  INT
```

**Kenapa `task_title` di-denormalisasi?**
Task bisa diedit/dihapus, tapi sprint history harus tetap menampilkan judul asli saat sprint dibuat. `taskTitle` di SprintTask adalah snapshot, bukan live reference.

**Kolom `tasks` di `daily_sprints`** masih ada (default `'[]'`) untuk backward-compat. Source of truth sekarang adalah tabel `sprint_tasks`.

### Migration Data
Migration `20260610_add_sprint_tasks` otomatis memindahkan data JSON lama ke tabel baru via DO block PostgreSQL.

## API Shape

### GET /api/sprints?date=YYYY-MM-DD
```json
{
  "id": "...",
  "date": "2026-06-10",
  "energy_level": 4,
  "intention": "Fokus pada...",
  "tasks": [
    { "task_id": "...", "task_title": "...", "duration": "1 jam", "sort_order": 0 }
  ],
  "eod_task_statuses": [...],
  "eod_submitted_at": null
}
```

### POST /api/sprints
```json
{ "date": "YYYY-MM-DD", "energy_level": 4, "intention": "...", "tasks": [{"task_id":"...","task_title":"...","duration":"1 jam"}] }
```

### PATCH /api/sprints/:id
- Kirim `tasks` array → otomatis upsert/delete sprint_tasks
- Kirim `eod_task_statuses` → simpan ke JSON column (eod statuses tetap JSON karena referensi historis)

## Konstanta (lib/constants.ts)

Semua nilai enumerasi ada di sini:
- `ROLES` — peran hidup (CEO, Suami, Ayah, Anak, Pelajar)
- `WORK_TYPES` — jenis kerja (Deep Work, Admin, Shallow)
- `PRIORITIES` — prioritas task
- `DURATION_OPTIONS / DURATION_HOURS` — pilihan durasi sprint
- `DEFAULT_HABITS` — habit default saat setup
- `SUB_CATEGORIES` — kategori subscription
- `SHOLAT_TIMES` — jadwal sholat Cimahi (statis)

## Deploy ke Easypanel

1. Push ke GitHub
2. Jalankan migration SQL di Easypanel DB console
3. Klik "Redeploy" di Easypanel

### Jalankan Migration Manual
```sql
-- Copy isi prisma/migrations/20260610_add_sprint_tasks/migration.sql
-- Paste dan jalankan di Easypanel → Database → Query
```

## Catatan Penting

- **Jangan pakai `prisma migrate dev`** — akan konflik dengan migration manual
- **Jangan `git push --force`** — repo aktif dipakai di prod
- Setelah edit schema, cukup update file `schema.prisma` + tulis migration SQL manual
- Easypanel otomatis rebuild saat ada push ke branch `main`
