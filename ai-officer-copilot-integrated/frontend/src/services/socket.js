import { API, token } from './api.js'

class DeferredSocket {
  constructor() {
    this.handlers = new Map()
    this.real = null
    this.queue = []
  }
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event).add(fn)
    if (this.real) this.real.on(event, fn)
    return this
  }
  off(event, fn) {
    this.handlers.get(event)?.delete(fn)
    if (this.real) this.real.off(event, fn)
    return this
  }
  emit(event, payload) {
    if (this.real) this.real.emit(event, payload)
    else this.queue.push([event, payload])
    return this
  }
  connect() {
    if (this.real) { this.real.connect(); return this }
    this.#load().catch((error) => this.#fireLocal('chat:error', { message: `WebSocket client could not load: ${error.message}` }))
    return this
  }
  disconnect() {
    if (this.real) this.real.disconnect()
    return this
  }
  #fireLocal(event, payload) {
    for (const fn of this.handlers.get(event) || []) fn(payload)
  }
  async #load() {
    if (!globalThis.io) {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-socket-io-client]')
        if (existing) {
          existing.addEventListener('load', resolve, { once: true })
          existing.addEventListener('error', () => reject(new Error('backend is not reachable')), { once: true })
          return
        }
        const script = document.createElement('script')
        script.dataset.socketIoClient = 'true'
        script.src = `${API}/socket.io/socket.io.js`
        script.onload = resolve
        script.onerror = () => reject(new Error('backend is not reachable'))
        document.head.appendChild(script)
      })
    }
    if (!globalThis.io) throw new Error('Socket.IO client unavailable')
    this.real = globalThis.io(API, {
      autoConnect: false,
      auth: { token: token() || '' },
      transports: ['websocket', 'polling'],
    })
    for (const [event, fns] of this.handlers) for (const fn of fns) this.real.on(event, fn)
    this.real.connect()
    for (const [event, payload] of this.queue.splice(0)) this.real.emit(event, payload)
  }
}

export function createChatSocket() {
  return new DeferredSocket()
}
