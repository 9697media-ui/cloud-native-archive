import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  hidden?: boolean;
  className?: string;
}

/**
 * Padronized header for all pages.
 * Layout: title + description on the left, actions/tools on the right.
 * On mobile stacks vertically.
 */
export default function PageHeader({ title, description, actions, hidden, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6", className)}>
      {!hidden ? (
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      ) : (
        <div />
      )}
      {actions && (
        <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3", hidden && "ml-auto")}>
          {actions}
        </div>
      )}
    </header>
  );
}
