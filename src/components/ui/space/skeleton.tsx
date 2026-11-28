// Vendored from Space UI registry item: primitives-skeleton
// Source: https://www.spaceui.one/r/primitives-skeleton.json (target: components/ui/skeleton.tsx)
// License: MIT (Space UI free community primitives — https://www.spaceui.one/license)
// Adapted only '@/lib/', '@/hooks/', and '@/components/ui/' imports to local relative paths; omitted metadata-only @usespaceui/squircle.
import type React from 'react'
import { cn } from './utils'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn(
        'animate-skeleton rounded-sm [--skeleton-highlight:--alpha(var(--color-white)/64%)] [background:linear-gradient(120deg,transparent_40%,var(--skeleton-highlight),transparent_60%)_var(--color-muted)_0_0/200%_100%_fixed] dark:[--skeleton-highlight:--alpha(var(--color-white)/4%)]',
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  )
}
