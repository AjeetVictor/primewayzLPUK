import path from 'path';
import { defineConfig } from 'vite';
import { PW_CHAT_EMBED_VERSION } from './src/embed/chat/version.ts';

/**
 * Standalone build for the framework-free visitor chat embed (dist/embed/pw-chat.js).
 * Independent of vite.config.ts: no React, no Tailwind, no public assets.
 */
export default defineConfig({
  base: '/',
  publicDir: false,
  plugins: [],
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'es2019',
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, 'src/embed/chat/index.ts'),
      formats: ['iife'],
      name: 'PrimewayzChatEmbed',
      fileName: () => 'pw-chat.js',
    },
    rollupOptions: {
      output: {
        banner: `/*! Primewayz Chat Embed v${PW_CHAT_EMBED_VERSION} */`,
      },
    },
  },
});
