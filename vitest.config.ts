import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Окрема конфігурація для тестів (Vitest), щоб тестові типи не потрапляли
// у продакшн-збірку (vite.config.ts лишається чистим).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/types/**', 'src/test/**'],
    },
  },
})
