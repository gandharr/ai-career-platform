import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH is injected by the GitHub Actions deploy workflow.
  // Leave unset for local dev (defaults to '/').
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
  },
})
