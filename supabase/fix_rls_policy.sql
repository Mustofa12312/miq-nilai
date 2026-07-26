-- FIX: Hapus semua policy lama yang menyebabkan recursive loop
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;

-- Buat ulang policy yang benar (tanpa recursive query)
-- Policy 1: User bisa melihat profil sendiri
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admin bisa melihat semua profil
-- Gunakan auth.jwt() bukan query ke tabel profiles (menghindari recursion)
CREATE POLICY "Admins can view all profiles."
ON public.profiles FOR SELECT
USING (
  (auth.jwt() ->> 'role') IN ('super_admin', 'admin')
  OR auth.uid() = id
);

-- Policy 3: Izinkan insert saat pertama kali dibuat (by service role / manual)
CREATE POLICY "Allow service role to insert profiles."
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Policy 4: User bisa update profil sendiri
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
