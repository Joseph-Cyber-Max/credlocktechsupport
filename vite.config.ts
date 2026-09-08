import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// Keep GitHub Pages compatibility while serving the same app from the Vercel root.
const isVercel = process.env.VERCEL === '1'

export default defineConfig({
  base: isVercel ? '/' : '/credlocktechsupport/',
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      spa: {
        prerender: {
          outputPath: '/_shell.html',
          crawlLinks: true,
          retryCount: 2,
          failOnError: true,
        },
      },
    }),
    viteReact(),
  ],
})
