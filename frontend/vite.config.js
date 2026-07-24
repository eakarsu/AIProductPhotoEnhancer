import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:3201',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.API_TARGET || 'http://localhost:3201',
        changeOrigin: true
      }
    }
  }
})
