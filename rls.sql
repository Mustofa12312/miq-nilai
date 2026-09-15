-- MIQ Assessment System - Supabase RLS Policies
-- Jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.

-- 1. Tabel users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users dapat melihat profil mereka sendiri" ON public.users FOR SELECT USING (auth.uid() = id);

-- 2. Tabel examiner_assignments
ALTER TABLE public.examiner_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Penguji hanya dapat melihat tugas mereka sendiri" ON public.examiner_assignments FOR SELECT USING (auth.uid() = examiner_id);

-- 3. Tabel scores (Penilaian)
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
-- Semua orang yang login dapat melihat score, tetapi hanya bisa mengubah score jika belum dikunci
CREATE POLICY "Penguji bisa melihat semua nilai" ON public.scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Penguji dapat membuat nilai baru" ON public.scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Penguji hanya dapat mengubah nilai yang belum dikunci" ON public.scores FOR UPDATE TO authenticated USING (locked = false);

-- 4. Tabel classes, students, exam_periods, exam_types, criteria, levels
-- (Tabel referensi master dapat dilihat oleh semua user yang sudah login)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat kelas" ON public.classes FOR SELECT TO authenticated USING (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat santri" ON public.students FOR SELECT TO authenticated USING (true);

ALTER TABLE public.exam_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat periode" ON public.exam_periods FOR SELECT TO authenticated USING (true);

ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat jenis ujian" ON public.exam_types FOR SELECT TO authenticated USING (true);

ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat kriteria" ON public.criteria FOR SELECT TO authenticated USING (true);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Semua user authenticated dapat melihat tingkatan" ON public.levels FOR SELECT TO authenticated USING (true);
