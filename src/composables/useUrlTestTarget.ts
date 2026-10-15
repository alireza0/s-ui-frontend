import { computed, ref, watch } from 'vue'

// The URL the outbound and endpoint tests fetch. Off by default, so the core
// uses sing-box's own default; kept per browser, since it is a diagnostic
// choice rather than a panel setting. Module-level, so both pages share it.
const enabled = ref(localStorage.getItem('urltest-enabled') === 'true')
const url = ref(localStorage.getItem('urltest-url') ?? '')

watch(enabled, (v) => localStorage.setItem('urltest-enabled', String(v)))
watch(url, (v) => localStorage.setItem('urltest-url', v))

const valid = computed((): boolean => {
  try {
    const u = new URL(url.value)
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.host !== ''
  } catch {
    return false
  }
})

// The link to send with a test, or undefined for sing-box's default. An
// invalid URL is not sent: the field shows the error instead of every test
// failing with one that does not point at it.
const link = computed((): string | undefined => enabled.value && valid.value ? url.value : undefined)

export function useUrlTestTarget() {
  return { enabled, url, valid, link }
}
