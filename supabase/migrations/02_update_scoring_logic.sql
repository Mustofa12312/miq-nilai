-- =====================================================================
-- MIGRATION: Update logika perhitungan nilai
-- Logika baru: Total = 100 - SUM(semua_kesalahan × deduction)
-- Tidak ada batas per-kriteria, seluruh potongan langsung dari 100
-- =====================================================================

CREATE OR REPLACE FUNCTION public.recalculate_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score_id BIGINT;
  v_total_deduction NUMERIC := 0;
  v_total_score NUMERIC := 0;
  v_grade TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_score_id := OLD.score_id;
  ELSE
    v_score_id := NEW.score_id;
  END IF;

  -- Hitung TOTAL SEMUA POTONGAN dari seluruh kriteria
  -- Logika: setiap kesalahan × deduction, dijumlahkan tanpa batas per kriteria
  SELECT
    COALESCE(SUM(sd.mistakes * c.deduction), 0)
  INTO v_total_deduction
  FROM public.score_details sd
  JOIN public.criteria c ON c.id = sd.criteria_id
  WHERE sd.score_id = v_score_id;

  -- Total Nilai = 100 - total potongan, minimum 0
  v_total_score := GREATEST(0, 100 - v_total_deduction);

  -- Predikat berdasarkan total nilai langsung
  IF v_total_score >= 90 THEN
    v_grade := 'Mumtaz';
  ELSIF v_total_score >= 80 THEN
    v_grade := 'Jayyid Jiddan';
  ELSIF v_total_score >= 70 THEN
    v_grade := 'Jayyid';
  ELSIF v_total_score >= 60 THEN
    v_grade := 'Maqbul';
  ELSE
    v_grade := 'I''adah';
  END IF;

  UPDATE public.scores
  SET total_score = v_total_score,
      grade = v_grade
  WHERE id = v_score_id;

  RETURN NULL;
END;
$$;

-- Pastikan trigger sudah aktif (re-create)
DROP TRIGGER IF EXISTS tr_recalculate_score ON public.score_details;
CREATE TRIGGER tr_recalculate_score
AFTER INSERT OR UPDATE OR DELETE ON public.score_details
FOR EACH ROW EXECUTE FUNCTION public.recalculate_score();
