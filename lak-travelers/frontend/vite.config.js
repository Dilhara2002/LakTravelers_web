import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  // Prevent a Pages deployment from accidentally embedding the developer's localhost API.
  if (process.env.CF_PAGES) {
    let api
    try { api = new URL(env.VITE_API_URL) } catch { throw new Error('Set VITE_API_URL to your deployed HTTPS backend /api URL in Cloudflare Pages.') }
    if (api.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname) || api.username || api.password) {
      throw new Error('Cloudflare Pages requires a public HTTPS VITE_API_URL without credentials.')
    }
  }
  return { plugins: [react()] }
})
