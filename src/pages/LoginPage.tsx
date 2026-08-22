import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <main className="w-full max-w-sm space-y-6">
        <header className="space-y-2 text-center">
          <span
            className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            SD
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-content">
            Sign in to SprintDesk
          </h1>
          <p className="text-sm text-content-muted">
            Track your sprint board, activity and analytics in one place.
          </p>
        </header>

        <div className="rounded-2xl border border-line bg-surface-raised p-5 shadow-sm sm:p-6">
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
