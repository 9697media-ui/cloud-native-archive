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
    // Admins sempre veem tudo
    if (isAdmin) return events;

    // Determinar unidades permitidas seguindo lógica de mercado
    let allowedUnits: string[] | null = null;

    if (configs?.enable_role_based_view) {
      // 1. MODO CARGO ATIVO: O padrão do cargo tem precedência TOTAL e ignora personalizações individuais
      // Isso garante conformidade com a regra do sistema
      if (permissionLevel && configs?.role_defaults?.[permissionLevel]) {
        allowedUnits = configs.role_defaults[permissionLevel];
      } else {
        // Se o sistema está ativo mas não há regra para o cargo, por segurança não mostramos nada
        return [];
      }
    } else {
      // 2. MODO CARGO DESATIVADO: Permite personalizações individuais ou acesso total
      if (viewRestrictions !== null && viewRestrictions !== undefined) {
        allowedUnits = viewRestrictions;
      } else {
        // Sem restrições de cargo E sem restrição individual = Acesso Total
        return events;
      }
    }

    if (allowedUnits === null) return [];

    // Filtra os eventos pelas unidades permitidas
    return events.filter(event => allowedUnits.includes(event.unit));
  }, [events, viewRestrictions, permissionLevel, configs, isAdmin]);

  return filteredEvents;
}