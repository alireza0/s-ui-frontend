import {expect,it,vi} from 'vitest'
import {flushPromises,mount} from '@vue/test-utils'
import {i18n} from '@/locales'
import Http from '@/plugins/httputil'
import NodeHostSetup from '@/features/nodes/dialogs/NodeHostSetup.vue'
import type {NodeProvisionRequest,NodeRecord} from '@/features/nodes/types/nodes'

const stub={props:['modelValue','label','disabled','value','items'],template:'<div><slot /></div>'}
const global={plugins:[i18n],renderStubDefaultSlot:true,stubs:Object.fromEntries(['VDialog','VCard','VCardTitle','VDivider','VCardText','VRow','VCol','VTextField','VTextarea','VSelect','VSwitch','VCheckbox','VAlert','VBtn','VCardActions','VSpacer'].map(name=>[name,{...stub,name}]))}
const base={visible:true,templates:[],profiles:[],tlsProfiles:[],recover:false,busy:false,error:''}

it('keeps one create request across a failed response and clears bootstrap secrets on close',async()=>{
 const w=mount(NodeHostSetup,{props:base,global})
 const inputs=w.findAllComponents({name:'VTextField'});expect(inputs).toHaveLength(5)
 inputs[0].vm.$emit('update:modelValue','Test node');inputs[1].vm.$emit('update:modelValue','192.0.2.10');inputs[4].vm.$emit('update:modelValue','fixture-password');await w.vm.$nextTick()
 const submit=()=>w.findAllComponents({name:'VBtn'}).at(-1)!.vm.$emit('click')
 submit();await w.setProps({error:'fixture network response failure'});submit()
 const requests=w.emitted('save')!.map(e=>e[0] as NodeProvisionRequest)
 expect(requests[0]).toMatchObject({model_version:2,name:'Test node',ip:'192.0.2.10',protocols:[],template_id:0})
 expect(requests[0].request_key).toBe(requests[1].request_key)
 expect(requests[0]).not.toHaveProperty('control_tls');expect(requests[0]).not.toHaveProperty('config');expect(requests[0]).not.toHaveProperty('domain')
 await w.setProps({visible:false});expect(w.findAllComponents({name:'VTextField'})[4].props('modelValue')).toBe('')
 w.unmount()
})

it('assigns a DNS profile automatically for TLS without asking for PEM or server keys',async()=>{
 const profile={id:2,name:'Fixture',auth_type:'token' as const,zones:[{id:'00000000000000000000000000000001',name:'example.com'}],version:1,secret_configured:true}
 const requestTemplate=vi.spyOn(Http,'get').mockResolvedValueOnce({
  success:true, msg:'', obj:{spec:{entries:[{enable:true,sources:{'/tls/certificate_binding':{kind:'node_certificate'}}}]}}
 })
 const w=mount(NodeHostSetup,{props:{...base,profiles:[profile]},global})
 const inputs=w.findAllComponents({name:'VTextField'});inputs[0].vm.$emit('update:modelValue','Test node');inputs[1].vm.$emit('update:modelValue','192.0.2.10');inputs[4].vm.$emit('update:modelValue','fixture-password')
 const select=w.findComponent({name:'VSelect'})
 select.vm.$emit('update:modelValue',[3])
 await flushPromises()
 expect(requestTemplate).toHaveBeenCalledWith('api/node-template-version',{id:3})
 requestTemplate.mockRestore()
 expect(w.findAllComponents({name:'VTextarea'})).toHaveLength(0)
 const button=w.findAllComponents({name:'VBtn'}).at(-1)!;expect(button.props('disabled')).toBe(false);button.vm.$emit('click')
 const request=w.emitted('save')![0][0] as NodeProvisionRequest
 expect(request.domain).toMatchObject({mode:'managed',profile_id:2,zone_id:profile.zones[0].id,automatic_prefix:true,certificate_mode:'auto'})
 w.unmount()
})

it('retains the opened settings version during polling and requires password for a new host key',async()=>{
 const node:NodeRecord={id:7,name:'Node',address:'https://node.example',linkaddress:'node.example',template_id:4,enable:true,desired_revision:3,applied_revision:3,last_seen:1,settings_version:9}
 const installation={node_id:7,ip:'192.0.2.10',ssh_port:22,ssh_user:'root',host_fingerprint:'',domain:'node.example',protocols:['vless'],control_port:16500,ready:true}
 const w=mount(NodeHostSetup,{props:{...base,node,installation,recover:true},global})
 await w.setProps({node:{...node,settings_version:10}})
 w.findAllComponents({name:'VCheckbox'})[0].vm.$emit('update:modelValue',true);await w.vm.$nextTick()
 expect(w.findAllComponents({name:'VBtn'}).at(-1)!.props('disabled')).toBe(true)
 w.findAllComponents({name:'VTextField'})[4].vm.$emit('update:modelValue','fixture-password');await w.vm.$nextTick()
 w.findAllComponents({name:'VBtn'}).at(-1)!.vm.$emit('click')
 expect(w.emitted('save')![0][0]).toMatchObject({node_id:7,expected_version:9,action:'recover',replace_host_key:true,template_id:4})
 w.unmount()
})
