import type { Plugin } from 'vite'

export function viteApiPlugin(): Plugin
export function resolveRecognizerLaunch(options?: {
  platform?: string
  root?: string
  exists?: (path: string) => boolean
  nodePath?: string
}): { command: string; args: string[]; backend: 'wasi' | 'native'; artifact: string }
