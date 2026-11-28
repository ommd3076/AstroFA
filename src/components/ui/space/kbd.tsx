// Vendored from Space UI registry item: primitives-kbd
// Source: https://www.spaceui.one/r/primitives-kbd.json (target: components/ui/kbd.tsx)
// License: MIT (Space UI free community primitives — https://www.spaceui.one/license)
// Adapted only '@/lib/', '@/hooks/', and '@/components/ui/' imports to local relative paths; omitted metadata-only @usespaceui/squircle.
import type * as React from 'react'
import { cn } from './utils'

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>): React.ReactElement {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded  bg-accent px-1 font-medium font-sans text-muted-foreground text-xs [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  )
}

export function KbdGroup({ className, ...props }: React.ComponentProps<'kbd'>): React.ReactElement {
  return <kbd className={cn('inline-flex items-center gap-1', className)} data-slot="kbd-group" {...props} />
}
