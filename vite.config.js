import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Firebase va en su propio archivo para que la encuesta cargue rápido en el celular.
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
            'firebase/app-check',
          ],
        },
      },
    },
  },
});
