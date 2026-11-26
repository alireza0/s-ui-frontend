// Plugins
import vuetify from './vuetify'
import { registerNodeHttpHooks } from '@/features/nodes/integration'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  registerNodeHttpHooks()
  app
    .use(vuetify)
}
