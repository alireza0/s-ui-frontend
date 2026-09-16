import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Deliberately not the app's vite config: the Vuetify plugin only matters for
// styling and auto-import, which no test renders. The Vue plugin is needed
// because the store reaches the router, and the router imports .vue files.
// happy-dom covers the localStorage the locale module reads at import time and
// the window.crypto that randomUtil uses.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
    server: {
      // Vuetify ships component CSS next to the components; Node cannot load a
      // .css file on its own, so the package has to go through Vite.
      deps: { inline: ['vuetify'] },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
