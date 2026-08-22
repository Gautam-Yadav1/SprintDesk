import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

/**
 * The jsdom build used by Vitest here exposes a `localStorage` object without
 * the Storage methods, which breaks anything persisted with Zustand. Install a
 * spec-shaped in-memory Storage instead, and clear it between tests so no case
 * inherits another's persisted state.
 */
class MemoryStorage implements Storage {
  #entries = new Map<string, string>()

  get length(): number {
    return this.#entries.size
  }

  clear(): void {
    this.#entries.clear()
  }

  getItem(key: string): string | null {
    return this.#entries.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#entries.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#entries.set(key, String(value))
  }
}

if (typeof window.localStorage?.setItem !== 'function') {
  const storage = new MemoryStorage()
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
}

beforeEach(() => {
  window.localStorage.clear()
})
