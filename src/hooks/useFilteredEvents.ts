import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useViewConfigs } from '@/hooks/useViewConfigs';
import { AppEvent } from '@/types';

export function useFilteredEvents() {
  const { events } = useApp();
  const { viewRestrictions, permissionLevel, isAdmin } = useUserRole();
  const { configs } = useViewConfigs();

  const filteredEvents = useMemo(() => {
    // Admins see everything
    if (isAdmin) return events;

    // Se o sistema de restrição por cargo estiver DESATIVADO, o usuário vê tudo 
    // (a menos que seja um admin que já vê tudo por padrão)
    if (configs && configs.enable_role_based_view === false) return events;

    // Determinar unidades permitidas seguindo lógica de mercado (Hierarquia de Permissão)
    let allowedUnits: string[] | null = null;

    // 1. Se o sistema por cargo está ATIVO, o padrão do cargo tem precedência TOTAL
    // Isso evita que personalizações individuais "esqueçam" de ser atualizadas
    if (permissionLevel && configs?.role_defaults?.[permissionLevel]) {
      allowedUnits = configs.role_defaults[permissionLevel];
    } 
    // 2. Fallback para restrição individual APENAS se não houver padrão de cargo ou se quisermos permitir overrides
    // (Mas seguindo o pedido do usuário, o cargo deve prevalecer)
    else if (viewRestrictions !== null && viewRestrictions !== undefined) {
      allowedUnits = viewRestrictions;
    } 
    else {
      // Se não houver restrições definidas e o sistema estiver ativo, por segurança não mostramos nada
      return [];
    }

    if (allowedUnits === null) return [];


    // Filter events by unit
    return events.filter(event => allowedUnits.includes(event.unit));
  }, [events, viewRestrictions, permissionLevel, configs, isAdmin]);

  return filteredEvents;
}
