-- Original create (may already be applied in production)
CREATE TABLE IF NOT EXISTS "quran_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "surah" TEXT NOT NULL DEFAULT '',
    "ayat" TEXT NOT NULL DEFAULT '',
    "halaman" INTEGER NOT NULL DEFAULT 1,
    "ayat_dibaca" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quran_logs_pkey" PRIMARY KEY ("id")
);
