CREATE TABLE "quran_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "surah" TEXT NOT NULL,
    "ayat" TEXT NOT NULL,
    "halaman" INTEGER NOT NULL,
    "ayat_dibaca" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quran_logs_pkey" PRIMARY KEY ("id")
);
