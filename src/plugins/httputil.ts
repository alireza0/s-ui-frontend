import api from './api'
import { i18n } from '@/locales'
import router from '@/router'
import { push } from 'notivue'
import { clearAuthenticated } from './auth'
import Data from '@/store/modules/data'

export interface Msg {
  success: boolean
  msg: string
  obj: any | null
}

// sessionExpired reports whether a failed request means the session is gone.
// The status code is the authority; the string match is kept so a frontend
// newer than its backend still recognises the old 200-with-a-message answer.
function _sessionExpired(status: number | undefined, msg: string): boolean {
  return status === 401 || status === 403 || msg === "Invalid login"
}

function _handleMsg(msg: any): void {
  if (!isMsg(msg)) {
    return
  }
  if(msg.msg){
    if (!msg.success && _sessionExpired(undefined, msg.msg)) {
      push.error({
        title: i18n.global.t('invalidLogin'),
      })
      logout()
      return
    }
    if (msg.success) {
      push.success({
        message: i18n.global.t('success') + ": " + i18n.global.t('actions.' + msg.msg),
      })
    } else {
      push.error({
        title: i18n.global.t('failed'),
        message: msg.msg
      })
    }
  }
}

export const logout = async () => {
  try {
    await HttpUtils.get('api/logout')
  } catch {
    // The session is unusable either way; there is nothing to recover.
  } finally {
    // Always, whatever the server said. Leaving the flag set would bounce the
    // user straight back into a panel that cannot load anything, and leaving
    // the store populated would show the next account the previous one's data
    // for a moment.
    clearAuthenticated()
    Data().$reset()
    router.push('/login')
  }
}

function _respToMsg(resp: any): Msg {
  const data = resp.data
  if (data == null) {
    return { success: true, msg: "", obj: null }
  } else if (isMsg(data)) {
    if (data.hasOwnProperty('success')) {
        return { success: data.success, msg: data.msg, obj: data.obj || null }
    } else {
        return data
    }
  } else {
    return { success: false, msg: `unknown data: ${data}`, obj: null }
  }
}

function isMsg(obj: any): obj is Msg {
  return Object.hasOwn(obj,'success') && Object.hasOwn(obj,'msg') && Object.hasOwn(obj, 'obj')
}
  
const HttpUtils = {
  async get(url: string, data: object = {}, options: any[] = []): Promise<Msg> {
    let msg: Msg
    try {
        const resp = await api.get(url, { params: data, ...options })
        msg = _respToMsg(resp)
    } catch (e: any) {
        if (_sessionExpired(e?.response?.status, e?.response?.data?.msg)) {
            push.error({ title: i18n.global.t('invalidLogin') })
            logout()
            return { success: false, msg: "Invalid login", obj: null }
        }
        msg = { success: false, msg: e.toString(), obj: null }
    }
    _handleMsg(msg)
    return msg
  },
  async post(url: string, data: object | null, options: any = undefined): Promise<Msg> {
    let msg: Msg
    try {
        const resp = await api.post(url, data, options)
        msg = _respToMsg(resp)
    } catch (e: any) {
        if (_sessionExpired(e?.response?.status, e?.response?.data?.msg)) {
            push.error({ title: i18n.global.t('invalidLogin') })
            logout()
            return { success: false, msg: "Invalid login", obj: null }
        }
        msg = { success: false, msg: e.toString(), obj: null }
    }
    _handleMsg(msg)
    return msg
  },
}

export default HttpUtils