# Hidup Produktif Berkah

Aplikasi manajemen hidup produktif berbasis Islami — task, habit, sprint harian, goal, dan Quran tracking dalam satu dashboard.

**Live:** https://produktifmax.maulanacorp.my.id
**Stack:** Next.js 16 (App Router) · PostgreSQL + Prisma 7 · Tailwind CSS · TanStack Query

---

## Fitur

| Halaman | Fungsi |
|---|---|
| 🏠 **Beranda** | Dashboard: statistik, waktu sholat Cimahi, kalender 10 hari, progress per role |
| 🎯 **Daily Sprint** | Rencana harian multi-task (tambah/hapus bebas) + energy level + niat + EOD review |
| ✅ **Tasks** | Task manager: role, prioritas, work type, due date, kanban, batch import, bulk delete |
| 🌟 **Rutinitas** | Habit tracker + **Habit Heatmap 30 hari** — konsistensi visual |
| 📖 **Quran** | Log bacaan Quran per halaman + info surah |
| 💡 **Parkir Ide** | Tangkap ide cepat (Ctrl+Q), promote ke task/proyek |
| 🗂 **Proyek & Belajar** | Tracker proyek (subtask 3 level) + log belajar (buku/podcast/video/artikel) |
| 🔔 **Inbox** | Reminder fleksibel (sekali/harian/mingguan/bulanan) |
| 💳 **Keuangan** | Subscription tracker dengan alert renewal H-7 |
| 📊 **Laporan** | Tren produktivitas, weekly review, sprint history, breakdown per role |
| ⚙️ **Settings** | Custom roles + keyboard shortcuts |
| 📖 **Panduan** | Dokumentasi fitur in-app |

### Roles (peran hidup)
`CEO` · `Suami` · `Ayah` · `Anak` · `Person` — setiap task/habit/goal bisa di-assign ke role.

### Keyboard Shortcuts
| Keys | Aksi |
|---|---|
| `Ctrl+Q` | Parkir Ide (quick capture) |
| `Ctrl+Shift+F` | Pencarian |
| `Ctrl+Enter` | Simpan form |
| `Alt+1..8` | Navigasi halaman utama |

---

## Development

```bash
npm install
npm run dev          # http://localhost:3000
```

Perlu `.env` dengan `DATABASE_URL`, `SESSION_SECRET`, opsional `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.

## Build & Type-check

```bash
npx tsc --noEmit
npm run build        # output: standalone (untuk Docker)
```

## Deploy

Deployment ke **Easypanel** via Dockerfile (`output: 'standalone'`).
Entrypoint otomatis menjalankan `prisma migrate deploy` + transcription server (whisper.cpp) lalu Next.js.

Lihat `DEPLOY-EASYPANEL.md` untuk langkah detail.

## Struktur

```
app/
  api/          ← Route handlers
  sprint/       ← Daily Sprint (multi-task)
  rutinitas/    ← Habit tracker + Heatmap
  tasks/ goals/ ideas/ learning/ projects/
  laporan/ quran/ reminders/ subscriptions/
  settings/ panduan/ role/[slug]/
components/
  layout/       ← Sidebar + bottom nav
  shared/       ← QuickCaptureFAB, badges
  ui/           ← Komponen UI reusable
lib/
  constants.ts  ← ROLES, WORK_TYPES, PRIORITIES, dll
  prisma.ts     ← Prisma client singleton
  shortcuts.ts  ← Definisi keyboard shortcut
prisma/
  schema.prisma
  migrations/
```

Lihat `CLAUDE.md` untuk arsitektur teknis (Daily Sprint FK, konvensi DB, migration).

---

**v2.1** — Dibuat dengan ❤️ di Cimahi
