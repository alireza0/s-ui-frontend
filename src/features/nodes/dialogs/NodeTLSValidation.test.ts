import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/locales'
import TlsModal from '@/layouts/modals/Tls.vue'
import NodeSpecEntry from './NodeSpecEntry.vue'
import { newEntry } from '../types/nodeSpec'

const container = { template: '<div><slot /></div>' }
const global = {
  plugins: [i18n],
  renderStubDefaultSlot: true,
  stubs: {
    ...Object.fromEntries(['VDialog', 'VCard', 'VCardTitle', 'VCardText', 'VCardActions', 'VContainer', 'VRow', 'VCol', 'VDivider', 'VSpacer', 'VMenu', 'VList', 'VListItem', 'VSwitch', 'VAlert'].map(name => [name, { ...container, name }])),
    VBtn: { name: 'VBtn', props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' },
    VBtnToggle: { ...container, name: 'VBtnToggle' },
    VTextField: { name: 'VTextField', props: ['label', 'modelValue'], template: '<input />' },
    VSelect: { name: 'VSelect', props: ['label', 'modelValue', 'items'], template: '<div />' },
    DocLink: true, EchVue: true, Transport: true, Listen: true, Multiplex: true, Hysteria2: true,
  },
}

it('does not report an untouched empty REALITY form as an error, but refuses an incomplete save', async () => {
  const wrapper = mount(TlsModal, {
    props: {
      visible: false, id: 1, providers: [], managedMaterial: true, showName: false,
      data: JSON.stringify({ server: { enabled: true, reality: { enabled: true, handshake: { server: '', server_port: 443 } } }, client: {} }),
      validateRealityTarget: (server: string) => server.trim() ? '' : 'Handshake Server is required',
    },
    global,
  })
  await wrapper.setProps({ visible: true })
  const save = () => wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === i18n.global.t('actions.save'))!
  expect(wrapper.findComponent({ name: 'VAlert' }).exists()).toBe(false)
  expect(save().props('disabled')).toBe(true)
  const server = wrapper.findAllComponents({ name: 'VTextField' }).find(field => field.props('label') === i18n.global.t('types.shdwTls.hs'))!
  server.vm.$emit('blur')
  await wrapper.vm.$nextTick()
  expect(wrapper.getComponent({ name: 'VAlert' }).text()).toBe('Handshake Server is required')
  server.vm.$emit('update:modelValue', 'remote.example')
  await wrapper.vm.$nextTick()
  expect(wrapper.findComponent({ name: 'VAlert' }).exists()).toBe(false)
  expect(save().props('disabled')).toBe(false)
  wrapper.unmount()
})

it('shows no single TLS mode toggle when REALITY is unavailable', async () => {
  const wrapper = mount(TlsModal, {
    props: { visible: false, id: 1, providers: [], managedMaterial: true, allowReality: false, data: JSON.stringify({ server: { enabled: true }, client: {} }) },
    global,
  })
  await wrapper.setProps({ visible: true })
  expect(wrapper.findComponent({ name: 'VBtnToggle' }).exists()).toBe(false)
  wrapper.unmount()
})

it('allows a panel TLS template or disabled TLS without completing the REALITY draft', async () => {
  const entry = newEntry('vless')
  entry.options.tls = { enabled: true, reality: { enabled: true, handshake: { server: '', server_port: 443 } } }
  const wrapper = mount(NodeSpecEntry, {
    props: { visible: true, value: entry, tlsProfiles: [{ id: 7, name: 'Example REALITY', reality: true }] },
    global: { ...global, stubs: { ...global.stubs, TlsModal: true } },
  })
  const save = () => wrapper.findAllComponents({ name: 'VBtn' }).find(button => button.text() === i18n.global.t('actions.save'))!
  expect(save().props('disabled')).toBe(true)
  const profile = wrapper.findAllComponents({ name: 'VSelect' }).find(select => select.props('label') === i18n.global.t('nodeUI.tlsTemplate'))!
  profile.vm.$emit('update:modelValue', 7)
  await wrapper.vm.$nextTick()
  expect(save().props('disabled')).toBe(false)
  await save().trigger('click')
  expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(expect.objectContaining({ tls_profile_id: 7 }))
  profile.vm.$emit('update:modelValue', 0)
  await wrapper.vm.$nextTick()
  expect(save().props('disabled')).toBe(true)
  const enabled = wrapper.findAllComponents({ name: 'VSwitch' }).find(toggle => toggle.attributes('label') === i18n.global.t('enable') + ' REALITY')!
  enabled.vm.$emit('update:modelValue', false)
  await wrapper.vm.$nextTick()
  expect(save().props('disabled')).toBe(false)
  wrapper.unmount()
})
