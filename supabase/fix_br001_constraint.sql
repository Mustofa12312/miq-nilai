-- =============================================================
-- FIX BR-001: Constraint Nilai Unik per Santri per Periode
-- Jalankan script ini di Supabase SQL Editor
-- =============================================================
-- BR-001: 1 santri hanya boleh memiliki 1 nilai untuk
-- 1 periode ujian pada jenis ujian yang sama.
-- =============================================================

-- LANGKAH 1: Tambahkan kolom period_id dan exam_type_id ke tabel scores
-- Kolom ini denormalisasi dari score_sessions untuk memudahkan constraint
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS period_id BIGINT REFERENCES public.exam_periods(id) ON DELETE RESTRICT;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS exam_type_id BIGINT REFERENCES public.exam_types(id) ON DELETE RESTRICT;

-- LANGKAH 2: Backfill data lama (isi kolom baru dari score_sessions)
UPDATE public.scores s
SET 
  period_id = ss.period_id,
  exam_type_id = ss.exam_type_id
FROM public.score_sessions ss
WHERE s.session_id = ss.id
  AND s.period_id IS NULL;

-- LANGKAH 3: Hapus UNIQUE constraint lama yang tidak cukup
-- (hanya unique per session_id + student_id, tidak per period)
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_session_id_student_id_key;

-- LANGKAH 4: Tambahkan UNIQUE constraint yang benar sesuai BR-001
-- 1 santri, 1 periode, 1 jenis ujian = 1 nilai
ALTER TABLE public.scores ADD CONSTRAINT scores_student_period_examtype_unique 
  UNIQUE (student_id, period_id, exam_type_id);

-- LANGKAH 5: Tambahkan index untuk performa query status santri
CREATE INDEX IF NOT EXISTS idx_scores_period_examtype 
  ON public.scores(period_id, exam_type_id);

CREATE INDEX IF NOT EXISTS idx_scores_student_period 
  ON public.scores(student_id, period_id);

-- LANGKAH 6: Update RLS policy untuk scores agar period_id bisa diisi
-- Penguji bisa INSERT scores (dengan period_id dan exam_type_id)
DROP POLICY IF EXISTS "Examiners can insert scores." ON public.scores;
CREATE POLICY "Examiners can insert scores." ON public.scores FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.score_sessions ss 
    WHERE ss.id = session_id AND ss.examiner_id = auth.uid()
  )
);

-- LANGKAH 7: Verifikasi constraint sudah terbuat
-- (Jalankan query ini untuk memastikan berhasil)
SELECT 
  conname AS constraint_name,
  contype AS type
FROM pg_constraint 
WHERE conname = 'scores_student_period_examtype_unique';
