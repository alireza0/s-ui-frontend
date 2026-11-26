import { i18n } from '@/locales'
import { registerHttpHooks } from '@/plugins/httputil'
import Nodes, { invalidateNodesRequests } from './state/nodes'
import { nodeErrorCode } from './types/nodeErrors'

export function registerNodeHttpHooks(): void {
  registerHttpHooks({
    onLogout() {
      invalidateNodesRequests()
      Nodes().$reset()
    },
    errorMessage(message) {
      const key = 'nodeUI.errors.' + nodeErrorCode(message)
      return i18n.global.te(key) ? i18n.global.t(key) : undefined
    },
  })
}
