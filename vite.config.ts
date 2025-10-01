/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { portfolioStoragePlugin } from './vite-plugin-portfolio-storage.js';

export default defineConfig({
  plugins: [react(), portfolioStoragePlugin()],
  server: {
    port: 5173, // Force port 5173 to access your localStorage data
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
