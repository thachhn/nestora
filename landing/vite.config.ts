import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    viteSingleFile(),
  ],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 9003,
  },
});
