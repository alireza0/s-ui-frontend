import api from './api'
import { i18n } from '@/locales'
import router from '@/router'
import { push } from 'notivue'
import { clearAuthenticated } from './auth'
import Data from '@/store/modules/data'
import type { AxiosRequestConfig } from 'axios'

// The envelope every endpoint answers with. What rides in `obj` depends on the
// endpoint, so it is unknown until a caller names it: HttpUtils.get<Foo>(url).
export interface Msg<T = unknown> {
  success: boolean
  msg: string
  obj: T
}

// What a rejected request carries. A request can fail before it ever reaches
// the server, so nothing below the error itself is guaranteed to be there.
interface RequestError {
  response?: {
    status?: number
    data?: {
      msg?: string
    }
  }
}

// An answer that carries no object, for the cases that never produced one.
function _objectlessMsg<T>(success: boolean, msg: string): Msg<T> {
  return { success: success, msg: msg, obj: null as unknown as T }
}

// sessionExpired reports whether a failed request means the session is gone.
// The status code is the authority; the string match is kept so a frontend
// newer than its backend still recognises the old 200-with-a-message answer.
function _sessionExpired(status: number | undefined, msg: string | undefined): boolean {
  return status === 401 || status === 403 || msg === "Invalid login"
}

function _handleMsg(msg: unknown): void {
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

function _respToMsg<T>(resp: { data: unknown }): Msg<T> {
  const data = resp.data
  if (data == null) {
    return _objectlessMsg<T>(true, "")
  } else if (isMsg(data)) {
    if (Object.hasOwn(data, 'success')) {
        return { success: data.success, msg: data.msg, obj: (data.obj || null) as T }
    } else {
        return data as Msg<T>
    }
  } else {
    return _objectlessMsg<T>(false, `unknown data: ${String(data)}`)
  }
}

function isMsg(obj: unknown): obj is Msg {
  return Object.hasOwn(obj as object,'success') && Object.hasOwn(obj as object,'msg') && Object.hasOwn(obj as object, 'obj')
}

const HttpUtils = {
  async get<T = unknown>(url: string, data: object = {}, options: object = {}): Promise<Msg<T>> {
    let msg: Msg<T>
    try {
        const resp = await api.get(url, { params: data, ...options })
        msg = _respToMsg<T>(resp)
    } catch (e: unknown) {
        const err = e as RequestError
        if (_sessionExpired(err?.response?.status, err?.response?.data?.msg)) {
            push.error({ title: i18n.global.t('invalidLogin') })
            logout()
            return _objectlessMsg<T>(false, "Invalid login")
        }
        msg = _objectlessMsg<T>(false, String(e))
    }
    _handleMsg(msg)
    return msg
  },
  async post<T = unknown>(url: string, data: object | null, options: AxiosRequestConfig | undefined = undefined): Promise<Msg<T>> {
    let msg: Msg<T>
    try {
        const resp = await api.post(url, data, options)
        msg = _respToMsg<T>(resp)
    } catch (e: unknown) {
        const err = e as RequestError
        if (_sessionExpired(err?.response?.status, err?.response?.data?.msg)) {
            push.error({ title: i18n.global.t('invalidLogin') })
            logout()
            return _objectlessMsg<T>(false, "Invalid login")
        }
        msg = _objectlessMsg<T>(false, String(e))
    }
    _handleMsg(msg)
    return msg
  },
}

export default HttpUtils
