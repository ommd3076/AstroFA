import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteApiPlugin } from './server/api.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteApiPlugin()],
})
