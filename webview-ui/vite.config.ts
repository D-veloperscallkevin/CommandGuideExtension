import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// El build se consume desde la extensión (webview), así que va a ../dist/webview
// con nombres de archivo fijos para poder referenciarlos sin leer un manifest.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../dist/webview',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
