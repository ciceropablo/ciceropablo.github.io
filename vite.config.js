import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    cssMinify: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
