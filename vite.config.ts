import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No special config needed for our manual service worker.
// This builds a fast, lightweight PWA that works offline after first load.
export default defineConfig({
  plugins: [react()]
});
