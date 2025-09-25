import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/BIM-Viewer/',
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    mimeTypes: {
      'application/wasm': ['.wasm']
    }
  },
   build: {
    chunkSizeWarningLimit: 2000 
  }
})
