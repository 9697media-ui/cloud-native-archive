-- Adiciona restrições de integridade para perfis
ALTER TABLE public.profiles ADD CONSTRAINT check_gestor_unit CHECK (
  (permission_level != 'gestor_unidade') OR (unit != 'Evento Geral do Grupo')
);

ALTER TABLE public.profiles ADD CONSTRAINT check_admin_unit CHECK (
  (permission_level != 'admin_geral') OR (unit = 'Evento Geral do Grupo')
);