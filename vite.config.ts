import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3002,
    host: '0.0.0.0'
  },
  preview: {
    port: 3002,
    host: '0.0.0.0'
  }
});
