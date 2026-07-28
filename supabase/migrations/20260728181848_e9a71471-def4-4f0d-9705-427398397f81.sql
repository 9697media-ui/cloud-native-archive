CREATE TABLE public.news_bulletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  profile_unit text NOT NULL,
  title text NOT NULL DEFAULT '',
  category text,
  header_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_bulletins TO authenticated;
GRANT ALL ON public.news_bulletins TO service_role;

ALTER TABLE public.news_bulletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_bulletins_admin_all" ON public.news_bulletins
  FOR ALL TO authenticated
  USING (public.check_is_admin(auth.uid()))
  WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "news_bulletins_unit_select" ON public.news_bulletins
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.has_unit_access(profile_unit));

CREATE POLICY "news_bulletins_unit_insert" ON public.news_bulletins
  FOR INSERT TO authenticated
  WITH CHECK (public.has_unit_access(profile_unit) AND created_by = auth.uid());

CREATE POLICY "news_bulletins_unit_update" ON public.news_bulletins
  FOR UPDATE TO authenticated
  USING (public.has_unit_access(profile_unit))
  WITH CHECK (public.has_unit_access(profile_unit));

CREATE POLICY "news_bulletins_unit_delete" ON public.news_bulletins
  FOR DELETE TO authenticated
  USING (public.has_unit_access(profile_unit));

CREATE INDEX idx_news_bulletins_profile_unit ON public.news_bulletins (profile_unit);
CREATE INDEX idx_news_bulletins_updated_at ON public.news_bulletins (updated_at DESC);

CREATE TRIGGER trg_news_bulletins_updated_at
  BEFORE UPDATE ON public.news_bulletins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();