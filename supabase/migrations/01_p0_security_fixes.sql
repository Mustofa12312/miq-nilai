-- 01_p0_security_fixes.sql

-------------------------------------------------------------------
-- 1. Helper Functions for RLS
-------------------------------------------------------------------

-- Fungsi untuk mendapatkan role user
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fungsi untuk mengecek apakah examiner ditugaskan ke kelas dari santri ini
CREATE OR REPLACE FUNCTION public.is_examiner_assigned(uid UUID, p_student_id BIGINT, p_period_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_class_id BIGINT;
  v_is_assigned BOOLEAN;
BEGIN
  -- Dapatkan class_id dari santri
  SELECT class_id INTO v_class_id FROM public.students WHERE id = p_student_id;
  
  IF v_class_id IS NULL THEN
    RETURN false;
  END IF;

  -- Cek apakah ada assignment untuk examiner ini, di kelas ini, pada periode ini
  SELECT EXISTS (
    SELECT 1 FROM public.examiner_assignments 
    WHERE examiner_id = uid 
      AND class_id = v_class_id 
      AND period_id = p_period_id
  ) INTO v_is_assigned;

  RETURN v_is_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-------------------------------------------------------------------
-- 2. Scores Table RLS & Constraint
-------------------------------------------------------------------

-- Pastikan unique constraint ada untuk mencegah duplikat (student_id, period_id, exam_type_id)
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_student_period_exam_unique;
ALTER TABLE public.scores ADD CONSTRAINT scores_student_period_exam_unique UNIQUE (student_id, period_id, exam_type_id);

-- Hapus policy lama
DROP POLICY IF EXISTS "Penguji bisa melihat semua nilai" ON public.scores;
DROP POLICY IF EXISTS "Penguji dapat membuat nilai baru" ON public.scores;
DROP POLICY IF EXISTS "Penguji hanya dapat mengubah nilai yang belum dikunci" ON public.scores;
DROP POLICY IF EXISTS "Scores viewable by authenticated users" ON public.scores;
DROP POLICY IF EXISTS "Scores insertable by authorized users" ON public.scores;
DROP POLICY IF EXISTS "Scores updatable by authorized users" ON public.scores;
DROP POLICY IF EXISTS "Scores deletable by admin" ON public.scores;

-- Policy Baru
-- 1. SELECT: Semua authenticated user bisa melihat nilai
CREATE POLICY "Scores viewable by authenticated users" 
ON public.scores FOR SELECT TO authenticated USING (true);

-- 2. INSERT: 
-- Bisa insert jika role adalah admin/super_admin ATAU (role adalah examiner DAN ditugaskan ke kelas santri tsb)
CREATE POLICY "Scores insertable by authorized users" 
ON public.scores FOR INSERT TO authenticated 
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'super_admin') 
  OR 
  (
    public.get_user_role(auth.uid()) = 'examiner' 
    AND public.is_examiner_assigned(auth.uid(), student_id, period_id)
  )
);

-- 3. UPDATE:
-- Bisa update JIKA (locked = false AND (admin/super_admin ATAU examiner assigned)) 
-- ATAU (locked = true AND admin/super_admin)
CREATE POLICY "Scores updatable by authorized users" 
ON public.scores FOR UPDATE TO authenticated 
USING (
  (locked = false AND (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') 
    OR (public.get_user_role(auth.uid()) = 'examiner' AND public.is_examiner_assigned(auth.uid(), student_id, period_id))
  ))
  OR 
  (locked = true AND public.get_user_role(auth.uid()) IN ('admin', 'super_admin'))
);

-- Delete: Hanya admin
CREATE POLICY "Scores deletable by admin"
ON public.scores FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-------------------------------------------------------------------
-- 3. Server/Database-Side Scoring Trigger
-------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score_id BIGINT;
  v_total_score NUMERIC := 0;
  v_max_possible NUMERIC := 0;
  v_percentage NUMERIC := 0;
  v_grade TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_score_id := OLD.score_id;
  ELSE
    v_score_id := NEW.score_id;
  END IF;

  -- Hitung total_score berdasarkan (default_score - (mistakes * deduction))
  SELECT 
    COALESCE(SUM(GREATEST(0, c.default_score - (sd.mistakes * c.deduction))), 0),
    COALESCE(SUM(c.default_score), 0)
  INTO v_total_score, v_max_possible
  FROM public.score_details sd
  JOIN public.criteria c ON c.id = sd.criteria_id
  WHERE sd.score_id = v_score_id;

  -- Kalkulasi persentase untuk Grade
  IF v_max_possible > 0 THEN
    v_percentage := (v_total_score / v_max_possible) * 100;
  ELSE
    v_percentage := 0;
  END IF;

  IF v_percentage >= 90 THEN v_grade := 'Mumtaz';
  ELSIF v_percentage >= 80 THEN v_grade := 'Jayyid Jiddan';
  ELSIF v_percentage >= 70 THEN v_grade := 'Jayyid';
  ELSIF v_percentage >= 60 THEN v_grade := 'Maqbul';
  ELSE v_grade := 'I''adah';
  END IF;

  -- Update score utama (bypasses RLS due to SECURITY DEFINER)
  UPDATE public.scores
  SET total_score = v_total_score,
      grade = v_grade
  WHERE id = v_score_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger di tabel score_details
DROP TRIGGER IF EXISTS tr_recalculate_score ON public.score_details;
CREATE TRIGGER tr_recalculate_score
AFTER INSERT OR UPDATE OR DELETE ON public.score_details
FOR EACH ROW EXECUTE FUNCTION public.recalculate_score();

-------------------------------------------------------------------
-- 4. Score Details RLS Protection (prevent tampering if locked)
-------------------------------------------------------------------

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Semua user dapat memodifikasi detail nilai" ON public.score_details;
DROP POLICY IF EXISTS "Score Details viewable by authenticated users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details insertable by authorized users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details updatable by authorized users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details deletable by authorized users" ON public.score_details;

ALTER TABLE public.score_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Score Details viewable by authenticated users"
ON public.score_details FOR SELECT TO authenticated USING (true);

-- Hanya bisa insert/update jika score utama belum di-lock, ATAU user adalah admin
CREATE POLICY "Score Details insertable by authorized users"
ON public.score_details FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scores s 
    WHERE s.id = score_id 
    AND (
      s.locked = false 
      OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Score Details updatable by authorized users"
ON public.score_details FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scores s 
    WHERE s.id = score_id 
    AND (
      s.locked = false 
      OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Score Details deletable by authorized users"
ON public.score_details FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scores s 
    WHERE s.id = score_id 
    AND (
      s.locked = false 
      OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    )
  )
);
