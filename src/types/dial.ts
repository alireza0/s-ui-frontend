export interface Dial {
  detour?: string
  bind_interface?: string
  inet4_bind_address?: string
  inet6_bind_address?: string
  bind_address_no_port?: boolean
  routing_mark?: number
  reuse_addr?: boolean
  connect_timeout?: string
  tcp_fast_open?: boolean
  tcp_multi_path?: boolean
  udp_fragment?: boolean
  fallback_delay?: string
  // A DNS server tag, or an inline block naming one plus its options.
  domain_resolver?: string | Record<string, unknown>
  disable_tcp_keep_alive?: boolean
  tcp_keep_alive?: string
  tcp_keep_alive_interval?: string
}