-- Tambahkan kolom active pada tabel exam_types
ALTER TABLE public.exam_types 
ADD COLUMN active BOOLEAN DEFAULT false;

-- (Opsional) Jika belum ada data Ujian 1 dan Ujian 2, tambahkan:
-- INSERT INTO public.exam_types (name, active) VALUES ('Ujian 1', true);
-- INSERT INTO public.exam_types (name, active) VALUES ('Ujian 2', false);

-- Jika sudah ada datanya, set satu menjadi aktif (misal id = 1):
UPDATE public.exam_types SET active = true WHERE id = (SELECT id FROM public.exam_types ORDER BY id ASC LIMIT 1);
