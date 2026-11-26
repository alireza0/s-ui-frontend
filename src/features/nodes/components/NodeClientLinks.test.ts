import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import NodeClientLinks from './NodeClientLinks.vue'
import type { Link } from '@/types/clients'
vi.mock('@/plugins/httputil',()=>({default:{get:vi.fn(),post:vi.fn()}}))
beforeEach(()=>vi.clearAllMocks())
const global={plugins:[i18n],stubs:{VAlert:true,VProgressLinear:true}}
const slots = {
  default: ({ links }: { links: Link[] }) => links.map(link => h('p', link.uri)),
}
it('loads confirmed links read-only and never posts them to Client.Links',async()=>{
  vi.mocked(HttpUtils.get).mockResolvedValue({success:true,msg:'',obj:[{remark:'node / vless',uri:'vless://test@node.example:443'}]})
  const wrapper=mount(NodeClientLinks,{props:{clientId:1,active:true,localLinks:[]},global,slots})
  await flushPromises()
  expect(wrapper.text()).toContain('vless://test@node.example:443')
  expect(wrapper.find('input').exists()).toBe(false)
  expect(HttpUtils.post).not.toHaveBeenCalled()
  wrapper.unmount()
})
it('does not expose a late response after the dialog closes',async()=>{
  let finish:(value:{success:boolean,msg:string,obj:{remark:string,uri:string}[]})=>void=()=>{}
  vi.mocked(HttpUtils.get).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
  const wrapper=mount(NodeClientLinks,{props:{clientId:1,active:true,localLinks:[]},global,slots})
  await wrapper.setProps({active:false})
  finish({success:true,msg:'',obj:[{remark:'old',uri:'vless://old@node.example:443'}]});await flushPromises()
  expect(wrapper.text()).not.toContain('vless://old')
  wrapper.unmount()
})

it('keeps local links in the same list before and after loading confirmed node links', async () => {
  const local = { type: 'local' as const, uri: 'vless://test@panel.example:443' }
  const node = { remark: 'node / vless', uri: 'vless://test@node.example:443' }
  vi.mocked(HttpUtils.get).mockResolvedValue({ success: true, msg: '', obj: [node] })
  const wrapper = mount(NodeClientLinks, {
    props: { clientId: 1, active: false, localLinks: [local] }, global, slots,
  })
  expect(wrapper.findAll('p').map(row => row.text())).toEqual([local.uri])
  expect(HttpUtils.get).not.toHaveBeenCalled()
  await wrapper.setProps({ active: true })
  await flushPromises()
  expect(wrapper.findAll('p').map(row => row.text())).toEqual([local.uri, node.uri])
  expect(wrapper.props('localLinks')).toEqual([local])
  wrapper.unmount()
})
