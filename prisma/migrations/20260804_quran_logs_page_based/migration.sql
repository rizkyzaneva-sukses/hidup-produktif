-- Convert quran_logs from surah/ayat tracking to page-based tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quran_logs' AND column_name = 'dari_halaman'
  ) THEN
    ALTER TABLE "quran_logs" ADD COLUMN "dari_halaman" INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quran_logs' AND column_name = 'ke_halaman'
  ) THEN
    ALTER TABLE "quran_logs" ADD COLUMN "ke_halaman" INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quran_logs' AND column_name = 'catatan'
  ) THEN
    ALTER TABLE "quran_logs" ADD COLUMN "catatan" TEXT;
  END IF;

  -- Migrate old halaman values if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quran_logs' AND column_name = 'halaman'
  ) THEN
    UPDATE "quran_logs"
    SET
      "dari_halaman" = COALESCE("dari_halaman", GREATEST(COALESCE("halaman", 1) - 1, 1)),
      "ke_halaman" = COALESCE("ke_halaman", COALESCE("halaman", 1))
    WHERE "dari_halaman" IS NULL OR "ke_halaman" IS NULL;
  END IF;

  UPDATE "quran_logs" SET "dari_halaman" = 1 WHERE "dari_halaman" IS NULL;
  UPDATE "quran_logs" SET "ke_halaman" = GREATEST(COALESCE("dari_halaman", 1) + 1, 2) WHERE "ke_halaman" IS NULL;

  ALTER TABLE "quran_logs" DROP COLUMN IF EXISTS "surah";
  ALTER TABLE "quran_logs" DROP COLUMN IF EXISTS "ayat";
  ALTER TABLE "quran_logs" DROP COLUMN IF EXISTS "halaman";
  ALTER TABLE "quran_logs" DROP COLUMN IF EXISTS "ayat_dibaca";
END $$;

ALTER TABLE "quran_logs" ALTER COLUMN "dari_halaman" SET NOT NULL;
ALTER TABLE "quran_logs" ALTER COLUMN "ke_halaman" SET NOT NULL;
