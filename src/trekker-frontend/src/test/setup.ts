import "@testing-library/jest-dom"

// jsdom does not implement ResizeObserver — stub it so components that use it don't throw
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
