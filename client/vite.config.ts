import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
const backendEnvDirectory = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig(({ mode }) => {
  const { PORT } = loadEnv(mode, backendEnvDirectory, 'PORT')
  const backendPort = PORT || process.env.PORT || '5000'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
