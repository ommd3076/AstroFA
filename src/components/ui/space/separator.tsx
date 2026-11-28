// Vendored from Space UI registry item: primitives-separator
// Source: https://www.spaceui.one/r/primitives-separator.json (target: components/ui/separator.tsx)
// License: MIT (Space UI free community primitives — https://www.spaceui.one/license)
// Adapted only '@/lib/', '@/hooks/', and '@/components/ui/' imports to local relative paths; omitted metadata-only @usespaceui/squircle.
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import type React from 'react'
import { cn } from './utils'

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props): React.ReactElement {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  )
}

export { SeparatorPrimitive }
