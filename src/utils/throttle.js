/**
 * Returns a version of `fn` that fires at most once per animation frame.
 * Extra calls within the same frame are silently dropped.
 *
 * @param {Function} fn - the function to throttle
 * @param {Function} [raf] - injectable requestAnimationFrame (for testing)
 */
export function rafThrottle(fn, raf = requestAnimationFrame) {
  let scheduled = false
  return function (...args) {
    if (scheduled) return
    scheduled = true
    raf(() => {
      fn.apply(this, args)
      scheduled = false
    })
  }
}
