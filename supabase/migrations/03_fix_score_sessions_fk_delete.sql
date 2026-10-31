-- 03_fix_score_sessions_fk_delete.sql
-- Allow deleting examiner accounts without database error by setting examiner_id to NULL in score_sessions

ALTER TABLE public.score_sessions
  DROP CONSTRAINT IF EXISTS score_sessions_examiner_id_fkey,
  ADD CONSTRAINT score_sessions_examiner_id_fkey
    FOREIGN KEY (examiner_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
