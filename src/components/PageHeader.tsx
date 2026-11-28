import React from 'react';
import { cn } from './ui/space/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared Costellar editorial atlas header with warm-white hierarchy,
 * concise context metadata, action cluster, and a single hairline divider.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  titleId,
  description,
  meta,
  actions,
  children,
  className,
}) => {
  return (
    <header
      className={cn(
        'shrink-0 border-b border-[var(--border-subtle)] pb-3.5 space-y-3',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1
              id={titleId}
              className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]"
            >
              {title}
            </h1>
            {meta && (
              <span className="text-xs font-mono tabular-nums text-[var(--ink-muted)]">
                {meta}
              </span>
            )}
          </div>
          {description && (
            <p className="max-w-3xl text-xs sm:text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {children}
    </header>
  );
};
