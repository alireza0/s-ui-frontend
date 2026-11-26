import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/locales'
import type { SpecEntry } from '../types/nodes'
import NodeSpecEntry from './NodeSpecEntry.vue'

it('disables the current node as a REALITY target at the assigned listener port', async () => {
  const entry: SpecEntry = {
    connection_key: 'reality-fixture',
    name: 'Fixture',
    protocol: 'vless',
    enable: true,
    options: {
      listen: '::',
      listen_port: 443,
      tls: { enabled: true, server_name: 'remote.example', reality: { enabled: true, handshake: { server: 'remote.example', server_port: 443 } } },
    },
    sources: { '/listen_port': { kind: 'node_generated', purpose: 'listen_port' } },
  }
  const wrapper = mount(NodeSpecEntry, {
    props: {
      visible: true, value: entry, nodeOverride: true, tlsProfiles: [],
      nodeDomain: 'node.example', nodeAddress: 'node.example', nodeIP: '192.0.2.20',
    },
    global: {
      plugins: [i18n],
      renderStubDefaultSlot: true,
      stubs: {
        TlsModal: {
          name: 'TlsModal',
          props: ['visible', 'validateRealityTarget'],
          template: '<div v-if="visible"><slot name="handshake-source" :port="443"/></div>',
        },
        Transport: true, Listen: true, Multiplex: true,
        VDialog: true, VCard: true, VCardText: true, VCardTitle: true, VCardActions: true,
        VContainer: true, VDivider: true, VRow: true, VCol: true, VSpacer: true,
        VTextField: true, VSwitch: true,
        VSelect: { name: 'VSelect', props: ['items'], template: '<div/>' },
        VBtn: { template: '<button><slot/></button>' },
      },
    },
  })
  await wrapper.findAll('button').find(button => button.text() === i18n.global.t('nodeUI.tlsSettings'))!.trigger('click')
  const menu = wrapper.findAllComponents({ name: 'VSelect' }).find(select =>
    select.props('items')?.some((item: {value: string}) => item.value === 'node_address'),
  )
  expect(menu?.props('items')).toEqual(expect.arrayContaining([
    expect.objectContaining({value: 'manual'}),
    expect.objectContaining({value: 'primary_domain', props: {disabled: true}}),
    expect.objectContaining({value: 'node_address', props: {disabled: true}}),
  ]))
  const validate = wrapper.getComponent({ name: 'TlsModal' }).props('validateRealityTarget')
  expect(validate('node.example', 443)).toBe(i18n.global.t('nodeUI.errors.node_reality_handshake_loop'))
  expect(validate('node.example', 8443)).toBe('')
  wrapper.unmount()
})
