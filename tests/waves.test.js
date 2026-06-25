import { describe, it, expect } from 'vitest'
import { computeWaveY, computeMagneticDisplacement } from '../src/background/waves.js'

describe('computeWaveY', () => {
  it('returns 0 when amplitude is 0', () => {
    expect(computeWaveY(100, 1, 0, 0.005, 0)).toBe(0)
  })

  it('returns amplitude at the peak of the sine (sin = 1)', () => {
    // sin(π/2) = 1  →  x*freq + t + phase = π/2
    // With x=0, t=0, phase=π/2
    const result = computeWaveY(0, 0, 10, 0, Math.PI / 2)
    expect(result).toBeCloseTo(10, 5)
  })

  it('returns negative amplitude at the trough (sin = -1)', () => {
    const result = computeWaveY(0, 0, 10, 0, (3 * Math.PI) / 2)
    expect(result).toBeCloseTo(-10, 5)
  })

  it('returns 0 at phase 0, t 0, x 0', () => {
    expect(computeWaveY(0, 0, 8, 0.005, 0)).toBeCloseTo(0, 5)
  })

  it('is periodic with period 2π / frequency', () => {
    const freq = 0.005
    const period = (2 * Math.PI) / freq
    const y1 = computeWaveY(0, 0, 8, freq, 0)
    const y2 = computeWaveY(period, 0, 8, freq, 0)
    expect(y1).toBeCloseTo(y2, 5)
  })

  it('scales linearly with amplitude', () => {
    const y1 = computeWaveY(50, 1, 1, 0.005, 0.5)
    const y2 = computeWaveY(50, 1, 3, 0.005, 0.5)
    expect(y2).toBeCloseTo(y1 * 3, 5)
  })
})

describe('computeMagneticDisplacement', () => {
  it('returns { x: 0, y: 0 } when point is exactly on the cursor', () => {
    const result = computeMagneticDisplacement(100, 100, 100, 100, 1400, 9000)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('displacement points toward the cursor', () => {
    // cursor is directly to the right of the point
    const result = computeMagneticDisplacement(0, 0, 100, 0, 1400, 9000)
    expect(result.x).toBeGreaterThan(0)
    expect(result.y).toBeCloseTo(0, 5)
  })

  it('displacement points toward cursor above the point', () => {
    // cursor is directly above (y decreases upward in screen coords)
    const result = computeMagneticDisplacement(0, 100, 0, 0, 1400, 9000)
    expect(result.y).toBeLessThan(0)
    expect(result.x).toBeCloseTo(0, 5)
  })

  it('magnitude decreases as distance increases', () => {
    const near = computeMagneticDisplacement(0, 0, 10, 0, 1400, 9000)
    const far  = computeMagneticDisplacement(0, 0, 200, 0, 1400, 9000)
    const magNear = Math.hypot(near.x, near.y)
    const magFar  = Math.hypot(far.x, far.y)
    expect(magNear).toBeGreaterThan(magFar)
  })

  it('is symmetric: same magnitude on both sides of the cursor', () => {
    const left  = computeMagneticDisplacement(-50, 0, 0, 0, 1400, 9000)
    const right = computeMagneticDisplacement(50, 0, 0, 0, 1400, 9000)
    expect(Math.hypot(left.x, left.y)).toBeCloseTo(Math.hypot(right.x, right.y), 5)
  })

  it('larger force constant produces larger displacement', () => {
    const weak   = computeMagneticDisplacement(0, 0, 50, 0, 500, 9000)
    const strong = computeMagneticDisplacement(0, 0, 50, 0, 2000, 9000)
    expect(Math.hypot(strong.x, strong.y)).toBeGreaterThan(Math.hypot(weak.x, weak.y))
  })

  it('larger falloff constant produces smaller displacement', () => {
    const tight  = computeMagneticDisplacement(0, 0, 50, 0, 1400, 100)
    const spread = computeMagneticDisplacement(0, 0, 50, 0, 1400, 100000)
    expect(Math.hypot(tight.x, tight.y)).toBeGreaterThan(Math.hypot(spread.x, spread.y))
  })
})
