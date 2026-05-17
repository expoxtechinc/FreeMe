import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'FreeMe - Daily Liberation',
          short_name: 'FreeMe',
          description: 'Motivational quotes and daily reminders for a liberated mind.',
          theme_color: '#F9F7F2',
          background_color: '#F9F7F2',
          display: 'standalone',
          icons: [
            {
              src: 'https://www.image2url.com/r2/default/images/1779035830376-d6638cef-b7b7-48ac-a54e-241503dc3a5c.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://www.image2url.com/r2/default/images/1779035830376-d6638cef-b7b7-48ac-a54e-241503dc3a5c.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          shortcuts: [
            {
              name: "New Quotation",
              short_name: "New",
              description: "Seek instant inspiration",
              url: "/",
              icons: [{ src: "https://www.image2url.com/r2/default/images/1779035830376-d6638cef-b7b7-48ac-a54e-241503dc3a5c.png", sizes: "192x192" }]
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
