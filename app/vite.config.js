import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const page = (p) => resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: page('index.html'),
        bingo: page('bingo/index.html'),
        games: page('games/index.html'),
        impressum: page('impressum/index.html'),
        datenschutz: page('datenschutz/index.html'),
        terms: page('terms/index.html'),
      },
    },
  },
});
