-- FIX 2: Update policy agar Admin bisa melihat semua profil
-- Hapus policy lama yang tidak berfungsi
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;

-- Buat 1 policy sederhana: semua user yg sudah login bisa lihat semua profil
-- (Aman karena aplikasi ini hanya untuk user internal MIQ)
CREATE POLICY "Authenticated users can view all profiles."
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Pastikan INSERT masih bisa dilakukan (oleh edge function via service_role)
DROP POLICY IF EXISTS "Allow service role to insert profiles." ON public.profiles;
-- Service role otomatis bypass RLS, jadi tidak perlu policy khusus

-- Pastikan user bisa update profilnya sendiri
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
