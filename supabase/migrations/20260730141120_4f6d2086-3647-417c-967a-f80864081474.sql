CREATE OR REPLACE FUNCTION public.is_marketing_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT public.check_is_admin(_user_id)
  ), false)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND bond_type = 'marketing' AND is_active = true
  );
$$;

CREATE TABLE public.journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Nova edição',
  unit_id text,
  profile_unit text,
  reference_month text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','finalizado','arquivado')),
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journals TO authenticated;
GRANT ALL ON public.journals TO service_role;

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing pode ver jornais"
ON public.journals FOR SELECT TO authenticated
USING (public.is_marketing_user(auth.uid()));

CREATE POLICY "Marketing pode criar jornais"
ON public.journals FOR INSERT TO authenticated
WITH CHECK (public.is_marketing_user(auth.uid()));

CREATE POLICY "Marketing pode editar jornais"
ON public.journals FOR UPDATE TO authenticated
USING (public.is_marketing_user(auth.uid()))
WITH CHECK (public.is_marketing_user(auth.uid()));

CREATE POLICY "Marketing pode excluir jornais"
ON public.journals FOR DELETE TO authenticated
USING (public.is_marketing_user(auth.uid()));

CREATE INDEX idx_journals_updated_at ON public.journals (updated_at DESC);

CREATE TRIGGER update_journals_updated_at
BEFORE UPDATE ON public.journals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();