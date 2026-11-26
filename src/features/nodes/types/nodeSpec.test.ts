import {expect,it} from 'vitest'
import {newEntry,openEntry,saveEntry,overrideFromEntry,handshakePath,hostPath} from './nodeSpec'
it('keeps generated material out of shared templates and preserves identities',()=>{
  const e=newEntry(),state=openEntry(e);state.form.listen_port=8443;state.tls.server={enabled:true,server_name:'',reality:{enabled:true,private_key:'never-export',short_id:['bad'],handshake:{server:'www.example.com',server_port:443}}};
  const saved=saveEntry(e,state.form,state.tls,e.sources)
  expect(saved.connection_key).toBe(e.connection_key)
  expect(saved.sources['/tls/reality/private_key'].purpose).toBe('reality_private_key')
  expect(JSON.stringify(saved)).not.toContain('never-export')
  expect(saved.options).not.toHaveProperty('listen_port')
  expect(saved.sources).not.toHaveProperty('/tls/certificate_binding')
})
it('preserves supported client TLS settings in the template editor',()=>{
  const e=newEntry(),state=openEntry(e);state.tls.client.utls={enabled:true,fingerprint:'firefox'}
  const saved=saveEntry(e,state.form,state.tls,e.sources)
  expect(openEntry(saved).tls.client.utls?.fingerprint).toBe('firefox')
})
it('replaces a generated port with a literal override and removes unused sources',()=>{
  const base=newEntry(),edited=structuredClone(base);delete edited.sources['/listen_port'];edited.options.listen_port=8443;delete edited.sources['/tls/certificate_binding'];edited.options.tls={enabled:false}
  const overrides=overrideFromEntry(base,edited)
  expect(overrides.find(o=>o.path==='/listen_port')).toMatchObject({operation:'set',source:{kind:'literal',value:8443}})
  expect(overrides.find(o=>o.path==='/tls/certificate_binding')).toMatchObject({operation:'remove'})
})
it('does not convert unchanged inherited SNI and certificate sources into overrides',()=>{
  const base=newEntry(),edited=structuredClone(base);delete edited.sources['/listen_port'];edited.options.listen_port=8443
  expect(overrideFromEntry(base,edited)).toEqual([{connection_key:base.connection_key,path:'/listen_port',operation:'set',source:{kind:'literal',value:8443}}])
})
it('opens an explicit literal source without losing its value or identity',()=>{
  const base=newEntry();base.sources['/listen_port']={kind:'literal',value:23456}
  expect(openEntry(base).form.listen_port).toBe(23456)
})
it('turns an inherited target into a literal even when the manual address matches its stored value', () => {
  const base = newEntry()
  base.options.tls = { enabled: true, reality: { enabled: true, handshake: { server: 'tls.example', server_port: 8443 } } }
  base.sources[handshakePath] = { kind: 'node_parameter', name: 'primary_domain' }
  const edited = structuredClone(base)
  delete edited.sources[handshakePath]
  expect(overrideFromEntry(base, edited)).toEqual([{
    connection_key: base.connection_key,
    path: handshakePath,
    operation: 'set',
    source: { kind: 'literal', value: 'tls.example' },
  }])
})
it('keeps source bindings only for active fields and saves the visible handshake port',()=>{
  const entry = newEntry()
  entry.sources[hostPath] = {kind:'node_parameter', name:'primary_domain'}
  entry.sources[handshakePath] = {kind:'node_parameter', name:'node_address'}
  const state = openEntry(entry)
  if (!('transport' in state.form)) throw new Error('expected a VLESS transport')
  state.form.transport = {type:'http'}
  const reality = {enabled:true, private_key:'', short_id:[], handshake:{server:'',server_port:0}}
  state.tls.server.reality = reality
  const enabled = saveEntry(entry,state.form,state.tls,entry.sources)
  expect(enabled.sources[hostPath]).toEqual(entry.sources[hostPath])
  expect(enabled.sources[handshakePath]).toEqual(entry.sources[handshakePath])
  expect(enabled.options.tls).toMatchObject({reality:{handshake:{server_port:443}}})

  state.form.transport = {type:'grpc'} as typeof state.form.transport
  reality.enabled = false
  const disabled = saveEntry(entry,state.form,state.tls,entry.sources)
  expect(disabled.sources[hostPath]).toBeUndefined()
  expect(disabled.sources[handshakePath]).toBeUndefined()
})
