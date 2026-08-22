import { describe, expect, it } from 'vitest'
import { scorePassword } from './passwordStrength'

describe('scorePassword', () => {
  it('reports nothing to score for an empty password', () => {
    expect(scorePassword('')).toEqual({ score: 0, hint: 'Enter a password' })
  })

  it('rates a short password as too weak', () => {
    expect(scorePassword('abc').score).toBe(0)
  })

  it('rewards length, case variety, digits and symbols', () => {
    expect(scorePassword('abcdefgh').score).toBeLessThan(scorePassword('Abcdefgh1').score)
    expect(scorePassword('Abcdefgh1').score).toBeLessThan(scorePassword('Abcdefghij1!').score)
    expect(scorePassword('Abcdefghij1!')).toEqual({ score: 4, hint: 'Strong password' })
  })

  it('penalises a single repeated character however long it is', () => {
    expect(scorePassword('aaaaaaaaaaaaaaaa').score).toBe(0)
  })

  it('penalises long lower-case-only passwords and common patterns', () => {
    expect(scorePassword('abcdefgh').score).toBe(0)
    expect(scorePassword('Qwerty12').score).toBeLessThan(scorePassword('Xkrtub42').score)
  })

  it('never leaves the 0-4 range', () => {
    for (const password of ['a', 'password', 'P@ssw0rd!Longer', '1234', '!!!!!!!!!!!!']) {
      const { score } = scorePassword(password)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(4)
    }
  })
})
