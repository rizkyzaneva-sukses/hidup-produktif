CREATE TABLE "quran_logs" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dari_halaman" INTEGER NOT NULL,
    "ke_halaman" INTEGER NOT NULL,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quran_logs_pkey" PRIMARY KEY ("id")
);
