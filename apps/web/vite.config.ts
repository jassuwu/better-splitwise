import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: 'src' }),
    // Nitro handles the server build + deploy presets (auto-detects Vercel on Vercel builds)
    nitro(),
    // react's plugin MUST come after the start plugin
    viteReact(),
  ],
});
