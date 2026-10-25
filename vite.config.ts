/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/pastafinn/) and in Docker (/)
  base: './',
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // e2e/ holds Playwright specs, run with `npm run e2e`
  test: { include: ['src/**/*.test.ts'] },
})
