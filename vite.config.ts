import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // 🛠️ AGREGAMOS ESTE BLOQUE AQUÍ: Evita que el empaquetador del navegador intente leer el backend
    build: {
      rollupOptions: {
        external: ['server.ts', 'express', 'dotenv', '@google/genai'],
      },
    },
    server: {
      // Si DISABLE_HMR es true, pasamos false para apagar el WebSocket por completo
      hmer: isHmrDisabled ? false : { protocol: 'ws', host: 'localhost' },
      // Desactiva el guardado/observador de archivos si HMR está deshabilitado
      watch: isHmrDisabled ? null : {},
    },
  };
});
