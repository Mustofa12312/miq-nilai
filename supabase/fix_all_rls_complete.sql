-- =====================================================
-- FIX LENGKAP: RLS Policies untuk SEMUA tabel
-- Jalankan SELURUH script ini di Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. STUDENTS: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert students." ON public.students;
DROP POLICY IF EXISTS "Admins can update students." ON public.students;
DROP POLICY IF EXISTS "Admins can delete students." ON public.students;

CREATE POLICY "Admins can insert students." ON public.students FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update students." ON public.students FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete students." ON public.students FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 2. CLASSES: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert classes." ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes." ON public.classes;
DROP POLICY IF EXISTS "Admins can delete classes." ON public.classes;

CREATE POLICY "Admins can insert classes." ON public.classes FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update classes." ON public.classes FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete classes." ON public.classes FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 3. LEVELS: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert levels." ON public.levels;
DROP POLICY IF EXISTS "Admins can update levels." ON public.levels;
DROP POLICY IF EXISTS "Admins can delete levels." ON public.levels;

CREATE POLICY "Admins can insert levels." ON public.levels FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update levels." ON public.levels FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete levels." ON public.levels FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 4. EXAM_PERIODS: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert exam_periods." ON public.exam_periods;
DROP POLICY IF EXISTS "Admins can update exam_periods." ON public.exam_periods;
DROP POLICY IF EXISTS "Admins can delete exam_periods." ON public.exam_periods;

CREATE POLICY "Admins can insert exam_periods." ON public.exam_periods FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update exam_periods." ON public.exam_periods FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete exam_periods." ON public.exam_periods FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 5. EXAM_TYPES: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert exam_types." ON public.exam_types;
DROP POLICY IF EXISTS "Admins can update exam_types." ON public.exam_types;
DROP POLICY IF EXISTS "Admins can delete exam_types." ON public.exam_types;

CREATE POLICY "Admins can insert exam_types." ON public.exam_types FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update exam_types." ON public.exam_types FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete exam_types." ON public.exam_types FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 6. CRITERIA: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert criteria." ON public.criteria;
DROP POLICY IF EXISTS "Admins can update criteria." ON public.criteria;
DROP POLICY IF EXISTS "Admins can delete criteria." ON public.criteria;

CREATE POLICY "Admins can insert criteria." ON public.criteria FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update criteria." ON public.criteria FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete criteria." ON public.criteria FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 7. SCORES: Izinkan Admin DELETE (untuk bisa hapus santri yang ada nilainya)
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete scores." ON public.scores;
CREATE POLICY "Admins can delete scores." ON public.scores FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 8. SCORE_SESSIONS: Izinkan Admin SELECT dan DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can delete score_sessions." ON public.score_sessions;
CREATE POLICY "Admins can delete score_sessions." ON public.score_sessions FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- =====================================================
-- 9. EXAMINER_ASSIGNMENTS: Izinkan Admin INSERT, UPDATE, DELETE
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can update assignments." ON public.examiner_assignments;
DROP POLICY IF EXISTS "Admins can delete assignments." ON public.examiner_assignments;

CREATE POLICY "Admins can insert assignments." ON public.examiner_assignments FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can update assignments." ON public.examiner_assignments FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Admins can delete assignments." ON public.examiner_assignments FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
