-- 01_p0_security_fixes.sql
-- P0 hardening: role authorization, examiner assignment, score integrity,
-- locking, duplicate prevention, score recalculation, and audit trail.

BEGIN;

-------------------------------------------------------------------
-- 1. Helper functions for RLS
-------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid AND status = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_user_role(uid) IN ('super_admin', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_readonly_leader(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_user_role(uid) = 'leader';
$$;

CREATE OR REPLACE FUNCTION public.is_examiner_assigned(
  uid UUID,
  p_class_id BIGINT,
  p_period_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.examiner_assignments ea
    WHERE ea.examiner_id = uid
      AND ea.class_id = p_class_id
      AND ea.period_id = p_period_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_score(uid UUID, p_score_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scores s
    JOIN public.students st ON st.id = s.student_id
    WHERE s.id = p_score_id
      AND (
        public.is_admin(uid)
        OR public.is_readonly_leader(uid)
        OR (
          public.get_user_role(uid) = 'examiner'
          AND public.is_examiner_assigned(uid, st.class_id, s.period_id)
        )
      )
  );
$$;

-------------------------------------------------------------------
-- 2. Schema hardening for score integrity
-------------------------------------------------------------------

ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS period_id BIGINT REFERENCES public.exam_periods(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS exam_type_id BIGINT REFERENCES public.exam_types(id) ON DELETE RESTRICT;

UPDATE public.scores s
SET
  period_id = COALESCE(s.period_id, ss.period_id),
  exam_type_id = COALESCE(s.exam_type_id, ss.exam_type_id)
FROM public.score_sessions ss
WHERE s.session_id = ss.id
  AND (s.period_id IS NULL OR s.exam_type_id IS NULL);

ALTER TABLE public.scores
  ALTER COLUMN total_score SET DEFAULT 0;

ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS scores_session_id_student_id_key,
  DROP CONSTRAINT IF EXISTS scores_student_period_exam_unique,
  DROP CONSTRAINT IF EXISTS scores_student_period_examtype_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scores_student_period_examtype_unique'
      AND conrelid = 'public.scores'::regclass
  ) THEN
    ALTER TABLE public.scores
      ADD CONSTRAINT scores_student_period_examtype_unique
      UNIQUE (student_id, period_id, exam_type_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'score_details_score_criteria_unique'
      AND conrelid = 'public.score_details'::regclass
  ) THEN
    ALTER TABLE public.score_details
      ADD CONSTRAINT score_details_score_criteria_unique
      UNIQUE (score_id, criteria_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'examiner_assignments_unique'
      AND conrelid = 'public.examiner_assignments'::regclass
  ) THEN
    ALTER TABLE public.examiner_assignments
      ADD CONSTRAINT examiner_assignments_unique
      UNIQUE (examiner_id, class_id, period_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scores_period_examtype
  ON public.scores(period_id, exam_type_id);
CREATE INDEX IF NOT EXISTS idx_scores_student_period
  ON public.scores(student_id, period_id);
CREATE INDEX IF NOT EXISTS idx_assignments_examiner_period
  ON public.examiner_assignments(examiner_id, period_id);

CREATE OR REPLACE FUNCTION public.validate_score_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.score_sessions%ROWTYPE;
  v_student_class_id BIGINT;
BEGIN
  SELECT * INTO v_session
  FROM public.score_sessions
  WHERE id = NEW.session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sesi penilaian tidak ditemukan.';
  END IF;

  SELECT class_id INTO v_student_class_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF v_student_class_id IS NULL THEN
    RAISE EXCEPTION 'Santri tidak ditemukan.';
  END IF;

  IF v_student_class_id <> v_session.class_id THEN
    RAISE EXCEPTION 'Santri tidak berada di kelas sesi penilaian.';
  END IF;

  IF NEW.period_id IS DISTINCT FROM v_session.period_id
     OR NEW.exam_type_id IS DISTINCT FROM v_session.exam_type_id THEN
    RAISE EXCEPTION 'Periode atau jenis ujian nilai tidak sesuai dengan sesi.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_score_integrity ON public.scores;
CREATE TRIGGER tr_validate_score_integrity
BEFORE INSERT OR UPDATE OF session_id, student_id, period_id, exam_type_id ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.validate_score_integrity();

CREATE OR REPLACE FUNCTION public.recalculate_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  SELECT
    COALESCE(SUM(GREATEST(0, c.default_score - (sd.mistakes * c.deduction))), 0),
    COALESCE(SUM(c.default_score), 0)
  INTO v_total_score, v_max_possible
  FROM public.score_details sd
  JOIN public.criteria c ON c.id = sd.criteria_id
  WHERE sd.score_id = v_score_id;

  IF v_max_possible > 0 THEN
    v_percentage := (v_total_score / v_max_possible) * 100;
  END IF;

  IF v_percentage >= 90 THEN
    v_grade := 'Mumtaz';
  ELSIF v_percentage >= 80 THEN
    v_grade := 'Jayyid Jiddan';
  ELSIF v_percentage >= 70 THEN
    v_grade := 'Jayyid';
  ELSIF v_percentage >= 60 THEN
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

DROP TRIGGER IF EXISTS tr_recalculate_score ON public.score_details;
CREATE TRIGGER tr_recalculate_score
AFTER INSERT OR UPDATE OR DELETE ON public.score_details
FOR EACH ROW EXECUTE FUNCTION public.recalculate_score();

-------------------------------------------------------------------
-- 3. Audit trail
-------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.score_audit_logs (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  table_name TEXT NOT NULL CHECK (table_name IN ('scores', 'score_details')),
  record_id BIGINT NOT NULL,
  score_id BIGINT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.score_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Score audit logs viewable by admins and leaders" ON public.score_audit_logs;
CREATE POLICY "Score audit logs viewable by admins and leaders"
ON public.score_audit_logs FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_readonly_leader(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id BIGINT;
  v_score_id BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_score_id := CASE WHEN TG_TABLE_NAME = 'scores' THEN OLD.id ELSE OLD.score_id END;
  ELSE
    v_record_id := NEW.id;
    v_score_id := CASE WHEN TG_TABLE_NAME = 'scores' THEN NEW.id ELSE NEW.score_id END;
  END IF;

  INSERT INTO public.score_audit_logs (
    table_name,
    record_id,
    score_id,
    action,
    actor_id,
    old_data,
    new_data
  )
  VALUES (
    TG_TABLE_NAME,
    v_record_id,
    v_score_id,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_scores ON public.scores;
CREATE TRIGGER tr_audit_scores
AFTER INSERT OR UPDATE OR DELETE ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.audit_score_change();

DROP TRIGGER IF EXISTS tr_audit_score_details ON public.score_details;
CREATE TRIGGER tr_audit_score_details
AFTER INSERT OR UPDATE OR DELETE ON public.score_details
FOR EACH ROW EXECUTE FUNCTION public.audit_score_change();

-------------------------------------------------------------------
-- 4. RLS policies
-------------------------------------------------------------------

ALTER TABLE public.score_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examiner_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Examiners can view their own sessions." ON public.score_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions." ON public.score_sessions;
DROP POLICY IF EXISTS "Examiners can create sessions." ON public.score_sessions;
DROP POLICY IF EXISTS "Score sessions viewable by authorized users" ON public.score_sessions;
DROP POLICY IF EXISTS "Score sessions insertable by assigned examiners" ON public.score_sessions;
DROP POLICY IF EXISTS "Score sessions updatable by admins" ON public.score_sessions;
DROP POLICY IF EXISTS "Score sessions deletable by admins" ON public.score_sessions;

CREATE POLICY "Score sessions viewable by authorized users"
ON public.score_sessions FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.is_readonly_leader(auth.uid())
  OR (
    examiner_id = auth.uid()
    AND public.is_examiner_assigned(auth.uid(), class_id, period_id)
  )
);

CREATE POLICY "Score sessions insertable by assigned examiners"
ON public.score_sessions FOR INSERT TO authenticated
WITH CHECK (
  examiner_id = auth.uid()
  AND public.get_user_role(auth.uid()) = 'examiner'
  AND public.is_examiner_assigned(auth.uid(), class_id, period_id)
);

CREATE POLICY "Score sessions updatable by admins"
ON public.score_sessions FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Score sessions deletable by admins"
ON public.score_sessions FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Penguji bisa melihat semua nilai" ON public.scores;
DROP POLICY IF EXISTS "Penguji dapat membuat nilai baru" ON public.scores;
DROP POLICY IF EXISTS "Penguji hanya dapat mengubah nilai yang belum dikunci" ON public.scores;
DROP POLICY IF EXISTS "Scores viewable by admins and respective examiner." ON public.scores;
DROP POLICY IF EXISTS "Examiners can insert scores." ON public.scores;
DROP POLICY IF EXISTS "Examiners can update unlocked scores." ON public.scores;
DROP POLICY IF EXISTS "Scores viewable by authenticated users" ON public.scores;
DROP POLICY IF EXISTS "Scores insertable by authorized users" ON public.scores;
DROP POLICY IF EXISTS "Scores updatable by authorized users" ON public.scores;
DROP POLICY IF EXISTS "Scores deletable by admin" ON public.scores;
DROP POLICY IF EXISTS "Admins can delete scores." ON public.scores;

CREATE POLICY "Scores viewable by authorized users"
ON public.scores FOR SELECT TO authenticated
USING (public.can_access_score(auth.uid(), id));

CREATE POLICY "Scores insertable by assigned examiners"
ON public.scores FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'examiner'
  AND EXISTS (
    SELECT 1
    FROM public.students st
    WHERE st.id = student_id
      AND public.is_examiner_assigned(auth.uid(), st.class_id, period_id)
  )
);

CREATE POLICY "Scores lockable by admins and editable by assigned examiners"
ON public.scores FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR (
    locked = false
    AND public.get_user_role(auth.uid()) = 'examiner'
    AND EXISTS (
      SELECT 1
      FROM public.students st
      WHERE st.id = student_id
        AND public.is_examiner_assigned(auth.uid(), st.class_id, period_id)
    )
  )
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR (
    locked = false
    AND public.get_user_role(auth.uid()) = 'examiner'
    AND EXISTS (
      SELECT 1
      FROM public.students st
      WHERE st.id = student_id
        AND public.is_examiner_assigned(auth.uid(), st.class_id, period_id)
    )
  )
);

CREATE POLICY "Scores deletable by admins"
ON public.scores FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Scores details viewable by everyone authenticated" ON public.score_details;
DROP POLICY IF EXISTS "Examiners can insert score details" ON public.score_details;
DROP POLICY IF EXISTS "Examiners can update score details" ON public.score_details;
DROP POLICY IF EXISTS "Examiners can delete score details" ON public.score_details;
DROP POLICY IF EXISTS "Semua user dapat memodifikasi detail nilai" ON public.score_details;
DROP POLICY IF EXISTS "Score Details viewable by authenticated users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details insertable by authorized users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details updatable by authorized users" ON public.score_details;
DROP POLICY IF EXISTS "Score Details deletable by authorized users" ON public.score_details;

CREATE POLICY "Score details viewable by authorized users"
ON public.score_details FOR SELECT TO authenticated
USING (public.can_access_score(auth.uid(), score_id));

CREATE POLICY "Score details insertable by assigned examiners"
ON public.score_details FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scores s
    JOIN public.students st ON st.id = s.student_id
    WHERE s.id = score_id
      AND s.locked = false
      AND public.get_user_role(auth.uid()) = 'examiner'
      AND public.is_examiner_assigned(auth.uid(), st.class_id, s.period_id)
  )
);

CREATE POLICY "Score details updatable by assigned examiners"
ON public.score_details FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.scores s
    JOIN public.students st ON st.id = s.student_id
    WHERE s.id = score_id
      AND s.locked = false
      AND public.get_user_role(auth.uid()) = 'examiner'
      AND public.is_examiner_assigned(auth.uid(), st.class_id, s.period_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.scores s
    JOIN public.students st ON st.id = s.student_id
    WHERE s.id = score_id
      AND s.locked = false
      AND public.get_user_role(auth.uid()) = 'examiner'
      AND public.is_examiner_assigned(auth.uid(), st.class_id, s.period_id)
  )
);

CREATE POLICY "Score details deletable by admins"
ON public.score_details FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Penguji hanya dapat melihat tugas mereka sendiri" ON public.examiner_assignments;
DROP POLICY IF EXISTS "Examiners can view their own assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can insert assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can update assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Assignments viewable by owner admins and leaders" ON public.examiner_assignments;
DROP POLICY IF EXISTS "Assignments insertable by admins" ON public.examiner_assignments;
DROP POLICY IF EXISTS "Assignments updatable by admins" ON public.examiner_assignments;
DROP POLICY IF EXISTS "Assignments deletable by admins" ON public.examiner_assignments;

CREATE POLICY "Assignments viewable by owner admins and leaders"
ON public.examiner_assignments FOR SELECT TO authenticated
USING (
  examiner_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR public.is_readonly_leader(auth.uid())
);

CREATE POLICY "Assignments insertable by admins"
ON public.examiner_assignments FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Assignments updatable by admins"
ON public.examiner_assignments FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Assignments deletable by admins"
ON public.examiner_assignments FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

COMMIT;
