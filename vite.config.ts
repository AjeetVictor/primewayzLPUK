import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  if (isProd) {
    process.env.NODE_ENV = 'production';
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
    ],
    base: '/',
    esbuild: {
      jsxDev: !isProd,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: !isProd,
      allowedHosts: ['uk.primewayz.com', 'localhost', '127.0.0.1'],
    },
  };
});
