import { cn } from '@/lib/utils';

/**
 * Returns className for event status badges.
 * confirmado = green, pendente = yellow/amber, cancelado/conflito = red
 */
export function getStatusBadgeClass(status: string, hasConflict?: boolean): string {
  if (hasConflict) {
    return 'bg-red-500/15 text-red-700 border-red-300 dark:text-red-400 dark:border-red-700';
  }
  switch (status) {
    case 'confirmado':
      return 'bg-green-500/15 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700';
    case 'pendente':
      return 'bg-yellow-500/15 text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700';
    case 'cancelado':
      return 'bg-red-500/15 text-red-700 border-red-300 dark:text-red-400 dark:border-red-700';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Returns a dot color class for status indicators.
 */
export function getStatusDotClass(status: string): string {
  switch (status) {
    case 'confirmado':
      return 'bg-green-500';
    case 'pendente':
      return 'bg-yellow-500';
    case 'cancelado':
      return 'bg-red-500';
    default:
      return 'bg-muted-foreground';
  }
}
