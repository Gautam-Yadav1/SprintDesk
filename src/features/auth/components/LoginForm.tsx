import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLogin } from '../hooks/useLogin'
import { PasswordStrength } from './PasswordStrength'

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginForm() {
  const { login, isPending, error } = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const errors: FieldErrors = {}
    if (!username.trim()) errors.username = 'Username is required.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    login({ username: username.trim(), password, rememberMe })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-brand-300 bg-brand-500/10 px-3 py-2 text-sm text-brand-700 dark:text-brand-300"
        >
          {error}
        </p>
      )}

      <Input
        label="Username"
        name="username"
        autoComplete="username"
        required
        value={username}
        error={fieldErrors.username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <div className="space-y-2">
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {password.length > 0 && <PasswordStrength password={password} />}
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-content">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          className="h-4 w-4 rounded border-line text-brand-600 accent-brand-600"
        />
        Remember me for 30 days
      </label>

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
