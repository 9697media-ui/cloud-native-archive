-- Adiciona restrição para garantir que Admins Gerais estejam vinculados ao Evento Geral
-- e Gestores de Unidade estejam vinculados a uma unidade específica.

ALTER TABLE public.profiles
ADD CONSTRAINT check_user_unit_relation
CHECK (
    (permission_level = 'admin_geral' AND unit = 'Evento Geral do Grupo') OR
    (permission_level = 'gestor_unidade' AND unit IN ('DIC', 'Nilópolis', 'Santana')) OR
    (permission_level NOT IN ('admin_geral', 'gestor_unidade'))
);

-- Opcional: Garantir que o valor 'Evento Geral do Grupo' seja o padrão para novos admins se não especificado
-- (Isso seria melhor feito via trigger ou lógica de aplicação, mas o CHECK já garante a integridade)