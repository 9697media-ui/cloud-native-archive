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
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700", className)}>
      {!hidden ? (
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground font-medium max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      ) : (
        <div />
      )}
      {actions && (
        <div className={cn("flex flex-wrap items-center gap-3", hidden && "ml-auto")}>
          {actions}
        </div>
      )}
    </header>
  );
}
