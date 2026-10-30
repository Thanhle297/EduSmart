import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv, type Plugin } from 'vite'
import { createSubstitutionAiMiddleware } from './server/substitution-ai'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const middleware = createSubstitutionAiMiddleware({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  })
  const ai: Plugin = {
    name: 'edusmart-substitution-ai',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
  return {
    plugins: [react(), tailwindcss(), ai],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: true,
    },
  }
})
