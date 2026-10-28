import { fileURLToPath, URL } from 'node:url'

// Same alias as the apps, so tests can import editor code that uses @shared.
export default {
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
}
