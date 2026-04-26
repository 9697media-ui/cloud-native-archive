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

    // If role-based view is disabled, see everything
    if (configs && configs.enable_role_based_view === false) return events;

    // Determine allowed units
    let allowedUnits: string[] | null = null;

    if (viewRestrictions !== null && viewRestrictions !== undefined) {
      // User has custom restrictions (even if empty array [])
      allowedUnits = viewRestrictions;
    } else if (permissionLevel && configs?.role_defaults?.[permissionLevel]) {
      // Use role defaults
      allowedUnits = configs.role_defaults[permissionLevel];
    } else {
      // Se não houver restrições definidas e o sistema estiver ativo, por segurança não mostramos nada
      // ao invés de mostrar tudo (exceto para admins que já foram validados acima)
      return [];
    }

    if (allowedUnits === null) return [];


    // Filter events by unit
    return events.filter(event => allowedUnits.includes(event.unit));
  }, [events, viewRestrictions, permissionLevel, configs, isAdmin]);

  return filteredEvents;
}
