-- Mengizinkan Admin untuk menambahkan santri
CREATE POLICY "Admins can insert students." ON public.students FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Mengizinkan Admin untuk memperbarui data santri (termasuk soft delete/nonaktif)
CREATE POLICY "Admins can update students." ON public.students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Mengizinkan Admin untuk menghapus santri
CREATE POLICY "Admins can delete students." ON public.students FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
