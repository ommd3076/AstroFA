// Vendored from Space UI registry item: hooks-lifecycle-use-isomorphic-layout-effect
// Source: https://www.spaceui.one/r/hooks-lifecycle-use-isomorphic-layout-effect.json (target: hooks/use-isomorphic-layout-effect.ts)
// License: MIT (Space UI free community primitives — https://www.spaceui.one/license)
// Adapted only '@/hooks/' imports to local relative paths.
'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * Custom `useLayoutEffect` that safely falls back to `useEffect` during SSR to prevent React hydration warnings.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
