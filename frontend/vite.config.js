import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/paste': 'http://localhost:8081',
      '/api': 'http://localhost:8081',
      '/p': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/p/, '/paste/p')
      }
    }
  }
});
