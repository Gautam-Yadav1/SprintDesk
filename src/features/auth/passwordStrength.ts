/** Bonus feature: hand-rolled strength heuristic — no third-party estimator. */
export function scorePassword(password: string): { score: 0 | 1 | 2 | 3 | 4; hint: string } {
  if (!password) return { score: 0, hint: 'Enter a password' }

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^\w\s]/.test(password)) score += 1

  // Penalise the shapes that make a long password weak anyway.
  if (/^(.)\1+$/.test(password)) score -= 2
  if (/^[a-z]+$/i.test(password) && password.length < 12) score -= 1
  if (/(pass|1234|qwerty|admin)/i.test(password)) score -= 1

  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4
  const hints = [
    'Too weak — use at least 8 characters',
    'Weak — add numbers or symbols',
    'Fair — mix upper and lower case',
    'Good — a longer passphrase is even better',
    'Strong password',
  ] as const

  return { score: clamped, hint: hints[clamped] }
}
