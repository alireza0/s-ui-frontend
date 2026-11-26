import {beforeEach,expect,it,vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia,setActivePinia} from 'pinia'
import {i18n} from '@/locales'
import Nodes from '@/features/nodes/state/nodes'
import NodeSelect from './NodeSelect.vue'
vi.mock('@/plugins/httputil',()=>({default:{get:vi.fn().mockResolvedValue({success:false}),post:vi.fn()}}))
beforeEach(()=>setActivePinia(createPinia()))
it('offers whole nodes and keeps unavailable selections removable without listing unsupported nodes',async()=>{
 const store=Nodes();store.nodes=[{id:1,name:'Whole',assignment_mode:'node',agent_protocol:2,template_target_version:1},{id:2,name:'Prototype',assignment_mode:'prototype'}] as typeof store.nodes
 const wrapper=mount(NodeSelect,{props:{modelValue:[9]},global:{plugins:[i18n],stubs:{VSelect:{name:'VSelect',props:['items','modelValue'],template:'<div />'},VAlert:true,VBtn:true}}})
 const select=wrapper.findComponent({name:'VSelect'});expect(select.props('items')).toEqual([{value:1,title:'Whole'},{value:9,title:expect.any(String)}])
 select.vm.$emit('update:modelValue',[1]);expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1]])
 wrapper.unmount()
})

it('selects all assignable nodes and excludes stale selections and unsupported nodes', async () => {
  const store = Nodes()
  store.loaded = true
  store.nodes = [
    { id: 1, name: 'First', assignment_mode: 'node', agent_protocol: 2, template_target_version: 1 },
    { id: 2, name: 'Prototype', assignment_mode: 'prototype' },
    { id: 3, name: 'Second', assignment_mode: 'node', agent_protocol: 2, template_target_version: 1 },
  ] as typeof store.nodes
  vi.spyOn(store, 'load').mockResolvedValue(undefined)
  const wrapper = mount(NodeSelect, {
    props: { modelValue: [1, 9] },
    global: {
      plugins: [i18n],
      directives: { tooltip: {} },
      stubs: {
        VSelect: { template: '<div><slot name="append" /></div>' },
        VIcon: { template: '<button type="button" />' },
        VAlert: true,
        VBtn: true,
      },
    },
  })
  const all = wrapper.get('button')
  await all.trigger('click')
  await all.trigger('keydown', { key: 'Enter' })
  expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 3]], [[1, 3]]])
  store.failed = true
  await all.trigger('click')
  expect(wrapper.emitted('update:modelValue')).toHaveLength(2)
  wrapper.unmount()
})
