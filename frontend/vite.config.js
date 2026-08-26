import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts (heavy)
          'vendor-recharts': ['recharts'],
          // Excel export (heavy)
          'vendor-xlsx': ['xlsx'],
          // Icons (heavy)
          'vendor-icons': ['react-icons'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
})