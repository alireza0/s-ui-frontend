// Browser APIs that happy-dom does not implement but Vuetify's overlay layer
// reads when a dialog opens. Only dialog-based tests need them; they are
// harmless everywhere else.

if (!('visualViewport' in window)) {
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    value: {
      width: 1024,
      height: 768,
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  })
}

if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  })
}
