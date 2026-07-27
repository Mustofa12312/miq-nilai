-- Fix RLS policy untuk tabel score_details
ALTER TABLE public.score_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scores details viewable by everyone authenticated" ON public.score_details;
CREATE POLICY "Scores details viewable by everyone authenticated" 
ON public.score_details FOR SELECT 
TO authenticated USING (true);

DROP POLICY IF EXISTS "Examiners can insert score details" ON public.score_details;
CREATE POLICY "Examiners can insert score details" 
ON public.score_details FOR INSERT 
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Examiners can update score details" ON public.score_details;
CREATE POLICY "Examiners can update score details" 
ON public.score_details FOR UPDATE 
TO authenticated USING (true);

DROP POLICY IF EXISTS "Examiners can delete score details" ON public.score_details;
CREATE POLICY "Examiners can delete score details" 
ON public.score_details FOR DELETE 
TO authenticated USING (true);
