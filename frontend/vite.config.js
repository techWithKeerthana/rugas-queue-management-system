import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        // Avoid preloading heavy analytics code on first paint; it will load when /analytics is visited.
        if (filename.includes("AnalyticsPage") || filename.includes("charts")) {
          return deps;
        }

        return deps.filter((dep) => !dep.includes("charts-"));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'charts'
          }
          if (id.includes('node_modules/socket.io-client')) {
            return 'socket'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
})
