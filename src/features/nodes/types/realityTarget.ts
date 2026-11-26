export function normalizeRealityHost(host: string): string {
  const name = host.trim().toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
  return name.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '')
}

export function realityTargetIsListener(
  listener: string, listenerPort: number | undefined, port: number, target: string,
  localTarget: boolean, targetIP?: string,
): boolean {
  const bind = normalizeRealityHost(listener)
  const host = normalizeRealityHost(target)
  const ip = normalizeRealityHost(targetIP ?? '')
  if (!host || !listenerPort || listenerPort !== port) return false
  if (host === bind || ip !== '' && ip === bind) return true

  const loopbackName = host === 'localhost' || host.endsWith('.localhost')
  const loopback4 = /^127\.(\d{1,3}\.){2}\d{1,3}$/.test(host)
  const loopback6 = host === '::1'
  if (!bind || bind === '::') return localTarget || loopbackName || loopback4 || loopback6 || host === '0.0.0.0'
  if (bind === '0.0.0.0') return loopback4 || loopbackName || localTarget && (!!ip && !ip.includes(':') || /^\d+(\.\d+){3}$/.test(host))
  return loopbackName && (bind === '127.0.0.1' || bind === '::1')
}
