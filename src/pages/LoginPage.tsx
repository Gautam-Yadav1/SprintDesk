import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <main className="w-full max-w-sm space-y-6">
        <header className="space-y-2 text-center">
          {/* The pin the notebook is tacked up with. */}
          <span
            className="mx-auto block h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-500/20"
            aria-hidden="true"
          />
          <h1 className="font-display text-4xl font-bold text-content">
            Sign in to SprintDesk
          </h1>
          <p className="text-sm text-content-muted">
            Track your sprint board, activity and analytics in one place.
          </p>
        </header>

        <div className="fn-card rounded-md p-5 sm:p-6">
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
