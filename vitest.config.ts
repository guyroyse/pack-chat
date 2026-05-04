import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    isolate: false,
    exclude: ['**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '@packchat/codec': path.resolve(__dirname, './packages/codec/lib')
    }
  }
})
