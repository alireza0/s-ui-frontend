import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as vuetifyComponents from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/locales'
import type { Component } from 'vue'

// No test here should reach the network or raise a toast.
vi.mock('@/plugins/httputil', () => ({
  default: {
    get: vi.fn(async () => ({ success: true, msg: '', obj: [] })),
    post: vi.fn(async () => ({ success: true, msg: '', obj: {} })),
  },
}))
vi.mock('notivue', () => ({ push: { error: vi.fn(), success: vi.fn() } }))

const vuetify = createVuetify({ components: vuetifyComponents, directives })

type Props = Record<string, unknown>
type Case = {
  name: string
  load: () => Promise<{ default: Component }>
  // The object the parent owns. The component must edit THIS object, not a copy.
  model: () => Props
  // Which prop carries it, since the converted components kept their old names.
  modelProp?: string
  props?: Props
}

const dial = { server: 'seed.example', server_port: 443 }

const cases: Case[] = [
  { name: 'Addr', load: () => import('./Addr.vue'), modelProp: 'addr',
    model: () => ({ server: 'seed.example', server_port: 443, remark: 'seed' }), props: { hasTls: true } },
  { name: 'Dial', load: () => import('./Dial.vue'), modelProp: 'dial',
    model: () => ({ ...dial, detour: 'seed-detour', bind_interface: 'eth0' }) },
  { name: 'Listen', load: () => import('./Listen.vue'),
    model: () => ({ listen: '::', listen_port: 443, tag: 'seed-tag' }), props: { inTags: ['a'] } },
  { name: 'QuicFields', load: () => import('./QuicFields.vue'),
    model: () => ({ idle_timeout: '30s', ping_timeout: '15s' }) },
  { name: 'SimpleDNS', load: () => import('./SimpleDNS.vue'),
    model: () => ({ server: 'seed.example' }), props: { label: 'DNS' } },
  { name: 'Users', load: () => import('./Users.vue'),
    model: () => ({ model: 'client', values: [] }), props: { clients: [{ id: 1, name: 'alice', group: 'g' }] } },
  { name: 'WgPeer', load: () => import('./WgPeer.vue'),
    model: () => ({ address: 'seed.example', port: 51820, public_key: 'seed-key', allowed_ips: ['10.0.0.2/32'] }),
    props: { ext: { keys: [{ public_key: 'seed-key', private_key: 'seed-private' }] } } },

  { name: 'protocols/AnyTls', load: () => import('./protocols/AnyTls.vue'),
    model: () => ({ type: 'anytls', padding_scheme: ['stop=8'], password: 'seed' }), props: { direction: 'in' } },
  { name: 'protocols/Bridge', load: () => import('./protocols/Bridge.vue'),
    model: () => ({ type: 'bridge', ...dial }), props: { direction: 'out' } },
  { name: 'protocols/Cloudflared', load: () => import('./protocols/Cloudflared.vue'),
    model: () => ({ type: 'cloudflared', token: 'seed-token', protocol: 'auto' }) },
  { name: 'protocols/Direct', load: () => import('./protocols/Direct.vue'),
    model: () => ({ type: 'direct', override_address: 'seed.example', override_port: 80 }) },
  { name: 'protocols/Http', load: () => import('./protocols/Http.vue'),
    model: () => ({ type: 'http', ...dial, username: 'seed', password: 'seed' }) },
  { name: 'protocols/Hysteria', load: () => import('./protocols/Hysteria.vue'),
    model: () => ({ type: 'hysteria', ...dial, up_mbps: 100, down_mbps: 100, obfs: 'seed' }), props: { direction: 'in' } },
  { name: 'protocols/Hysteria2', load: () => import('./protocols/Hysteria2.vue'),
    model: () => ({ type: 'hysteria2', ...dial, up_mbps: 100, down_mbps: 100, password: 'seed' }), props: { direction: 'out' } },
  { name: 'protocols/Naive', load: () => import('./protocols/Naive.vue'),
    model: () => ({ type: 'naive', ...dial, username: 'seed', password: 'seed' }), props: { direction: 'out' } },
  { name: 'protocols/OpenConnect', load: () => import('./protocols/OpenConnect.vue'),
    model: () => ({ type: 'openconnect', ...dial, username: 'seed', password: 'seed' }) },
  { name: 'protocols/OpenVpn', load: () => import('./protocols/OpenVpn.vue'),
    model: () => ({ type: 'openvpn-client', ...dial, username: 'seed', password: 'seed' }) },
  { name: 'protocols/OutShadowTls', load: () => import('./protocols/OutShadowTls.vue'),
    model: () => ({ type: 'shadowtls', version: 3, password: 'seed' }) },
  { name: 'protocols/Selector', load: () => import('./protocols/Selector.vue'),
    model: () => ({ type: 'selector', outbounds: ['a'], default: 'a', interrupt_exist_connections: false }), props: { tags: ['a', 'b'] } },
  { name: 'protocols/ShadowTls', load: () => import('./protocols/ShadowTls.vue'),
    model: () => ({ type: 'shadowtls', version: 3, handshake: { ...dial }, handshake_for_server_name: {} }) },
  { name: 'protocols/Shadowsocks', load: () => import('./protocols/Shadowsocks.vue'),
    model: () => ({ type: 'shadowsocks', ...dial, method: 'aes-128-gcm', password: 'seed' }), props: { direction: 'in' } },
  { name: 'protocols/Snell', load: () => import('./protocols/Snell.vue'),
    model: () => ({ type: 'snell', version: 6, psk: 'seed' }), props: { direction: 'in' } },
  { name: 'protocols/Socks', load: () => import('./protocols/Socks.vue'),
    model: () => ({ type: 'socks', ...dial, username: 'seed', password: 'seed', version: '5' }) },
  { name: 'protocols/Ssh', load: () => import('./protocols/Ssh.vue'),
    model: () => ({ type: 'ssh', ...dial, user: 'seed', password: 'seed', client_version: 'seed' }) },
  { name: 'protocols/Tailscale', load: () => import('./protocols/Tailscale.vue'),
    model: () => ({ type: 'tailscale', auth_key: 'seed', hostname: 'seed', state_directory: 'seed' }) },
  { name: 'protocols/Tor', load: () => import('./protocols/Tor.vue'),
    model: () => ({ type: 'tor', executable_path: 'seed', data_directory: 'seed' }) },
  { name: 'protocols/Trojan', load: () => import('./protocols/Trojan.vue'),
    model: () => ({ type: 'trojan', ...dial, password: 'seed' }) },
  { name: 'protocols/Tuic', load: () => import('./protocols/Tuic.vue'),
    model: () => ({ type: 'tuic', ...dial, congestion_control: 'cubic', uuid: 'seed', password: 'seed' }), props: { direction: 'in' } },
  { name: 'protocols/Tun', load: () => import('./protocols/Tun.vue'),
    model: () => ({ type: 'tun', mtu: 9000, stack: 'system', udp_timeout: '5m', interface_name: 'seed' }) },
  { name: 'protocols/UrlTest', load: () => import('./protocols/UrlTest.vue'),
    model: () => ({ type: 'urltest', outbounds: ['a'], url: 'https://seed.example', interval: '3m', tolerance: 50 }), props: { tags: ['a', 'b'] } },
  { name: 'protocols/Vless', load: () => import('./protocols/Vless.vue'),
    model: () => ({ type: 'vless', ...dial, uuid: 'seed', flow: '' }) },
  { name: 'protocols/Vmess', load: () => import('./protocols/Vmess.vue'),
    model: () => ({ type: 'vmess', ...dial, uuid: 'seed', security: 'auto', alter_id: 0 }) },
  { name: 'protocols/Warp', load: () => import('./protocols/Warp.vue'),
    model: () => ({ type: 'warp', address: ['10.0.0.2/32'], private_key: 'seed', listen_port: 0, mtu: 1420, peers: [{ address: 'seed', port: 0, public_key: 'seed' }], ext: {} }) },
  { name: 'protocols/Wireguard', load: () => import('./protocols/Wireguard.vue'),
    model: () => ({ type: 'wireguard', address: ['10.0.0.2/32'], private_key: 'seed', listen_port: 51820, mtu: 1420, peers: [], ext: { public_key: 'seed', keys: [] } }) },

  { name: 'services/Api', load: () => import('./services/Api.vue'),
    model: () => ({ type: 'api', secret: 'seed', external_controller: 'seed' }) },
  { name: 'services/Ccm', load: () => import('./services/Ccm.vue'),
    model: () => ({ type: 'ccm', credential_path: 'seed' }) },
  { name: 'services/Derp', load: () => import('./services/Derp.vue'),
    model: () => ({ type: 'derp', config_path: 'seed', home: 'seed', mesh_psk: 'seed' }), props: { tsTags: ['a'], inTags: ['a'] } },
  { name: 'services/Ocm', load: () => import('./services/Ocm.vue'),
    model: () => ({ type: 'ocm', credential_path: 'seed' }) },
  { name: 'services/OomKiller', load: () => import('./services/OomKiller.vue'),
    model: () => ({ type: 'oom-killer', target_usage: 80 }) },
  { name: 'services/SSMAPI', load: () => import('./services/SSMAPI.vue'),
    model: () => ({ type: 'ssm-api', servers: { '/ss': 'a' } }), props: { ssTags: ['a'] } },

  { name: 'tls/InTLS', load: () => import('./tls/InTLS.vue'), modelProp: 'inbound',
    model: () => ({ type: 'vless', tls_id: 0 }), props: { tlsConfigs: [{ id: 1, name: 'one' }] } },
  { name: 'tls/OriginCa', load: () => import('./tls/OriginCa.vue'),
    model: () => ({ type: 'origin-ca', tag: 'seed', api_token: 'seed', hostnames: ['a.example'] }) },

  { name: 'transports/Http', load: () => import('./transports/Http.vue'), modelProp: 'transport',
    model: () => ({ type: 'http', path: '/seed', method: 'GET', host: ['seed.example'] }) },
  { name: 'transports/HttpUpgrade', load: () => import('./transports/HttpUpgrade.vue'), modelProp: 'transport',
    model: () => ({ type: 'httpupgrade', path: '/seed', host: 'seed.example' }) },
  { name: 'transports/WebSocket', load: () => import('./transports/WebSocket.vue'), modelProp: 'transport',
    model: () => ({ type: 'ws', path: '/seed', headers: { Host: 'seed.example' }, max_early_data: 0 }) },
  { name: 'transports/gRPC', load: () => import('./transports/gRPC.vue'), modelProp: 'transport',
    model: () => ({ type: 'grpc', service_name: 'seed' }) },

  { name: 'Rule', load: () => import('./Rule.vue'), modelProp: 'rule',
    model: () => ({ invert: false, outbound: 'direct', domain: ['seed.example'], ip_cidr: ['10.0.0.0/8'], port: [443] }),
    props: { clients: ['alice'], inTags: ['in-1'], outTags: ['direct'], rsTags: ['rs-1'] } },
  { name: 'DnsRule', load: () => import('./DnsRule.vue'), modelProp: 'rule',
    model: () => ({ invert: false, server: 'local', domain: ['seed.example'], query_type: 'A' }),
    props: { clients: ['alice'], inTags: ['in-1'], ruleSets: ['rs-1'], rsTags: ['rs-1'] } },
  { name: 'OutJson', load: () => import('./OutJson.vue'), modelProp: 'inData',
    model: () => ({ type: 'socks', tag: 'seed', out_json: { type: 'socks', ...dial, version: '5' } }),
    props: { type: 'socks' } },
  { name: 'SubClashExt', load: () => import('./SubClashExt.vue'), modelProp: 'settings',
    model: () => ({ subClashExt: 'port: 7890\n' }) },
  { name: 'tls/Ech', load: () => import('./tls/Ech.vue'), modelProp: 'oTls',
    model: () => ({ enabled: true, config: ['seed-config'] }),
    props: { iTls: { enabled: true, key: ['seed-key'] } } },
]

// A field the user can type into must land on the object the parent handed in,
// not on a copy of it. Every one of these components mutates in place, which is
// why they declare the object with defineModel. If one is ever switched to a
// copy the form goes quiet: no error, no save, just lost edits.
describe('components write through to the object their parent owns', () => {
  it.each(cases)('$name', async ({ load, model, modelProp = 'data', props = {} }) => {
    setActivePinia(createPinia())
    const component = (await load()).default
    const owned = model()

    const wrapper = mount(component, {
      props: { [modelProp]: owned, ...props },
      global: { plugins: [vuetify, i18n] },
    })

    const changed = (run: () => unknown | Promise<unknown>) => async () => {
      const before = JSON.stringify(owned)
      await run()
      return JSON.stringify(owned) !== before
    }

    // Typeable fields first.
    const typeable = [...wrapper.findAll('input'), ...wrapper.findAll('textarea')]
      .filter(f => {
        const el = f.element as HTMLInputElement
        return !el.readOnly && !el.disabled && el.type !== 'checkbox' && el.type !== 'radio'
      })
      .map(f => changed(() => f.setValue((f.element as HTMLInputElement).type === 'number' ? '7' : 'typed-by-user')))

    // Some forms are nothing but selects and switches, which carry no typeable
    // input, so drive those through the event their v-model listens for.
    const pickers = wrapper.findAllComponents({ name: 'VSelect' })
      .concat(wrapper.findAllComponents({ name: 'VCombobox' }))
      .concat(wrapper.findAllComponents({ name: 'VSwitch' }))
      .concat(wrapper.findAllComponents({ name: 'VCheckbox' }))
      .map(picker => changed(() => {
        const current = picker.props('modelValue')
        const next =
          typeof current === 'boolean' ? !current :
          typeof current === 'number' ? current + 1 :
          Array.isArray(current) ? [...current, 'chosen-by-user'] :
          'chosen-by-user'
        return picker.vm.$emit('update:modelValue', next)
      }))

    const attempts = [...typeable, ...pickers]
    expect(attempts.length, 'the form rendered no editable control to test').toBeGreaterThan(0)

    // Some controls stage a value locally before it is committed, so the
    // contract is that at least one edited control reaches the parent's object.
    let reached = false
    for (const attempt of attempts) {
      if (await attempt()) {
        reached = true
        break
      }
    }
    expect(reached, 'editing this form never reached the parent object').toBe(true)
  })
})

// Regression: the key accessors look the peer up in the endpoint's key store by
// public key. The getters allowed for a miss, the setters did not, so editing a
// peer the store does not know threw on keys[-1]. Vue turns that into a handled
// error rather than a thrown one, so the visible symptom is a lost keystroke:
// the line that updates the peer itself never runs. A peer added outside the
// panel, or one from a restored endpoint with an empty store, lands there.
describe('WgPeer with a peer the key store does not know', () => {
  const mountPeer = async (ext?: { keys: { public_key: string, private_key: string }[] }) => {
    setActivePinia(createPinia())
    const component = (await import('./WgPeer.vue')).default
    const peer = { address: 'seed.example', port: 51820, public_key: 'unknown-key', allowed_ips: ['10.0.0.2/32'] }
    const errors: unknown[] = []
    const wrapper = mount(component, {
      props: { data: peer, ...(ext ? { ext } : {}) },
      global: { plugins: [vuetify, i18n], config: { errorHandler: (e: unknown) => { errors.push(e) } } },
    })
    // The public key field is the second text field in the form.
    const publicKeyField = wrapper.findAll('input').filter(f => (f.element as HTMLInputElement).type !== 'number')[1]
    return { wrapper, peer, errors, publicKeyField }
  }

  it('still records the new public key on the peer when the store has no entry', async () => {
    const { peer, errors, publicKeyField } = await mountPeer()
    await publicKeyField.setValue('typed-by-user')
    expect(errors).toEqual([])
    expect(peer.public_key).toBe('typed-by-user')
  })

  it('still records it when the store holds only someone else\'s key', async () => {
    const { peer, errors, publicKeyField } = await mountPeer({ keys: [{ public_key: 'someone-else', private_key: 'theirs' }] })
    await publicKeyField.setValue('typed-by-user')
    expect(errors).toEqual([])
    expect(peer.public_key).toBe('typed-by-user')
  })

  it('leaves another peer\'s stored pair alone', async () => {
    const ext = { keys: [{ public_key: 'someone-else', private_key: 'theirs' }] }
    const { publicKeyField } = await mountPeer(ext)
    await publicKeyField.setValue('typed-by-user')
    expect(ext.keys[0]).toEqual({ public_key: 'someone-else', private_key: 'theirs' })
  })

  it('keeps the stored pair in step for a peer the store does know', async () => {
    setActivePinia(createPinia())
    const component = (await import('./WgPeer.vue')).default
    const ext = { keys: [{ public_key: 'known-key', private_key: 'stored-private' }] }
    const peer = { address: 'seed.example', port: 51820, public_key: 'known-key', allowed_ips: <string[]>[] }
    const wrapper = mount(component, { props: { data: peer, ext }, global: { plugins: [vuetify, i18n] } })
    const publicKeyField = wrapper.findAll('input').filter(f => (f.element as HTMLInputElement).type !== 'number')[1]
    await publicKeyField.setValue('rotated-key')
    expect(peer.public_key).toBe('rotated-key')
    expect(ext.keys[0].public_key).toBe('rotated-key')
  })
})

// These two carry a visibility control rather than a form, so the write-through
// contract shows up on their close control instead of a typed field. They hold
// it through defineModel for the same reason the forms do. Their body lives in
// a dialog, which only renders when open and teleports out of the wrapper.
describe('modals close through the control object their parent owns', () => {
  it.each([
    ['Backup', () => import('@/layouts/modals/Backup.vue')],
    ['Logs', () => import('@/layouts/modals/Logs.vue')],
  ] as const)('%s', async (_name, load) => {
    setActivePinia(createPinia())
    // The dialog teleports its body out of the wrapper, so a previous failure
    // could otherwise leave a close icon behind for this one to find.
    document.body.innerHTML = ''
    const control = { visible: true }
    const wrapper = mount((await load()).default, {
      // modelValue opens the dialog: the parent binds it with v-model on the
      // component and Vue passes it down to the dialog as a fallthrough attr.
      props: { control, visible: true, modelValue: true },
      attachTo: document.body,
      global: { plugins: [vuetify, i18n] },
    })
    await wrapper.vm.$nextTick()

    const closer = document.querySelector('.mdi-close')
    expect(closer, 'the modal rendered no close control').not.toBeNull()
    closer?.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(control.visible, 'closing did not reach the parent control').toBe(false)

    wrapper.unmount()
  })
})
