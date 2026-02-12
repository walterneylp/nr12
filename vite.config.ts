import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Garantir compatibilidade com browsers
    target: 'es2015',
    // Configuração de chunking para evitar problemas
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor em chunks menores
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@tanstack/react-query', 'lucide-react', 'recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas'],
        },
      },
    },
  },
  // Configuração do servidor de preview
  preview: {
    port: 4173,
    host: true,
  },
})
