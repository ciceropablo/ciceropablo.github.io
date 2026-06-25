import { describe, it, expect, vi } from 'vitest'
import { rafThrottle } from '../src/utils/throttle.js'

function makeMockRaf() {
  let pending = null
  const raf = vi.fn((cb) => { pending = cb; return 1 })
  const flush = () => { if (pending) { const cb = pending; pending = null; cb() } }
  return { raf, flush }
}

describe('rafThrottle', () => {
  it('calls the wrapped function on the next frame', () => {
    const { raf, flush } = makeMockRaf()
    const fn = vi.fn()
    const throttled = rafThrottle(fn, raf)

    throttled()
    expect(fn).not.toHaveBeenCalled()

    flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments to the wrapped function', () => {
    const { raf, flush } = makeMockRaf()
    const fn = vi.fn()
    const throttled = rafThrottle(fn, raf)

    throttled(42, 'hello')
    flush()

    expect(fn).toHaveBeenCalledWith(42, 'hello')
  })

  it('drops extra calls within the same frame', () => {
    const { raf, flush } = makeMockRaf()
    const fn = vi.fn()
    const throttled = rafThrottle(fn, raf)

    throttled(1)
    throttled(2)
    throttled(3)
    flush()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)
  })

  it('accepts a new call after the frame has flushed', () => {
    const { raf, flush } = makeMockRaf()
    const fn = vi.fn()
    const throttled = rafThrottle(fn, raf)

    throttled('first')
    flush()
    throttled('second')
    flush()

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'first')
    expect(fn).toHaveBeenNthCalledWith(2, 'second')
  })

  it('does not call raf again if no calls are made after the frame', () => {
    const { raf, flush } = makeMockRaf()
    const fn = vi.fn()
    const throttled = rafThrottle(fn, raf)

    throttled()
    flush()
    // No new calls
    expect(raf).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
