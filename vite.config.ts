import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages keeps the repository sub-path; Vercel serves from the domain root.
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
    nitro(),
    viteReact(),
  ],
})
