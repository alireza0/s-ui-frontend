import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/locales'
import NodeCard from './NodeCard.vue'

const stub = { props: ['disabled', 'modelValue'], template: '<div><slot /></div>' }
const global = {
  plugins: [i18n],
  stubs: Object.fromEntries(['VCard', 'VCardSubtitle', 'VRow', 'VCol', 'VCardText', 'VDivider', 'VCardActions', 'VOverlay', 'VCheckbox', 'VAlert', 'VBtn'].map(name => [name, { ...stub, name }])),
}

describe('node removal confirmation', () => {
  it('requires a separate confirmation when the agent cannot acknowledge shutdown', async () => {
    const wrapper = mount(NodeCard, { props: { title: 'Example', subtitle: '', confirming: true, requireStoppedConfirmation: true }, global })
    expect(wrapper.findComponent({ name: 'VBtn' }).props('disabled')).toBe(true)
    wrapper.findComponent({ name: 'VCheckbox' }).vm.$emit('update:modelValue', true)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:serverStoppedConfirmed')).toEqual([[true]])
    expect(wrapper.findComponent({ name: 'VBtn' }).props('disabled')).toBe(false)
    await wrapper.setProps({ busy: true })
    expect(wrapper.findComponent({ name: 'VBtn' }).props('disabled')).toBe(true)
    wrapper.unmount()
  })

  it('keeps ordinary confirmed shutdown deletion unchanged', () => {
    const wrapper = mount(NodeCard, { props: { title: 'Example', subtitle: '', confirming: true }, global })
    expect(wrapper.findComponent({ name: 'VCheckbox' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'VBtn' }).props('disabled')).toBe(false)
    wrapper.unmount()
  })
})
