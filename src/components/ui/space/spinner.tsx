// Vendored from Space UI registry item: primitives-spinner
// Source: https://www.spaceui.one/r/primitives-spinner.json (target: components/ui/spinner.tsx)
// License: MIT (Space UI free community primitives — https://www.spaceui.one/license)
// Adapted imports to local relative paths and type-only React import for verbatimModuleSyntax.

import type * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './utils'

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>): React.ReactElement {
  return (
    <Loader2
      aria-label="Loading"
      className={cn('animate-spin', className)}
      role="status"
      data-slot="spinner"
      {...props}
    />
  )
}
