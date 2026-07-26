-- MIQ Smart Assessment System - SEED DATA
-- Eksekusi ini SETELAH menjalankan schema.sql

-- 1. Levels
INSERT INTO public.levels (name, prefix, sort_order) VALUES 
('Al Quran I', 'AQ1', 1),
('Al Quran II', 'AQ2', 2),
('Al Quran III', 'AQ3', 3);

-- 2. Classes (Assuming IDs 1, 2, 3 for levels above)
INSERT INTO public.classes (level_id, name) VALUES 
(1, 'A1'), (1, 'A2'), (1, 'A3'),
(2, 'B1'), (2, 'B2'), (2, 'B3'),
(3, 'C1'), (3, 'C2');

-- 3. Exam Periods
INSERT INTO public.exam_periods (name, start_date, end_date) VALUES 
('Semester Ganjil 2026', '2026-10-01', '2026-10-15'),
('Semester Genap 2027', '2027-04-01', '2027-04-15');

-- 4. Exam Types
INSERT INTO public.exam_types (name) VALUES 
('Ujian Al-Qur''an'),
('Ujian Tahfidz'),
('Kenaikan Tingkat');

-- 5. Criteria (Kriteria Penilaian Al-Qur'an)
-- Contoh asumsi PRD: Makhroj 30 (potong 2), Sifat 20 (potong 1), dll.
INSERT INTO public.criteria (category, name, default_score, deduction, sort_order) VALUES 
('TAJWID', 'Makhroj', 30, 2, 1),
('TAJWID', 'Sifatul Huruf', 20, 1, 2),
('TAJWID', 'Ahkamul Huruf', 30, 2, 3),
('FASOHAH', 'Waqof Ibtida', 10, 1, 4),
('FASOHAH', 'Kelancaran', 10, 1, 5);

-- 6. Students (Sample)
-- A1 (Level 1)
INSERT INTO public.students (class_id, full_name) VALUES 
(1, 'Ahmad Fulan'),
(1, 'Budi Santoso'),
(1, 'Cahya Ramadhan');

-- B1 (Level 2)
INSERT INTO public.students (class_id, full_name) VALUES 
(4, 'Mustofa Kamal'),
(4, 'Zaid Abdullah');

-- C1 (Level 3)
INSERT INTO public.students (class_id, full_name) VALUES 
(7, 'Fatimah Az-Zahra'),
(7, 'Aisyah Putri');

-- Note: Untuk menambahkan users/profiles, 
-- harus membuat user lewat Supabase Auth terlebih dahulu lalu di-insert ke tabel profiles.
-- (Biasanya menggunakan Supabase Edge Functions / Triggers on auth.users).
