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
    let allowedUnits: string[] = [];

    if (viewRestrictions && viewRestrictions.length > 0) {
      // User has custom restrictions
      allowedUnits = viewRestrictions;
    } else if (permissionLevel && configs?.role_defaults?.[permissionLevel]) {
      // Use role defaults
      allowedUnits = configs.role_defaults[permissionLevel];
    } else {
      // No restrictions found, see everything by default (safety fallback)
      return events;
    }

    // Filter events by unit
    return events.filter(event => allowedUnits.includes(event.unit));
  }, [events, viewRestrictions, permissionLevel, configs, isAdmin]);

  return filteredEvents;
}
