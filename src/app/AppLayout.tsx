import { Link, Outlet, NavLink } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { signOut } from '@/features/auth/services/authSession'
import { useAuthStore } from '@/features/auth/store/authStore'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/board', label: 'Board' },
  { to: '/analytics', label: 'Analytics' },
] as const

function navClasses({ isActive }: { isActive: boolean }) {
  return cn(
    // Same 36px height as the header's icon buttons, so the two rows agree.
    'flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
      : 'text-content-muted hover:bg-surface-sunken hover:text-content',
  )
}

/** Chrome shared by every authenticated route. */
export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  function handleSignOut() {
    signOut()
    // Drop cached server state so the next session never sees the last one's data.
    queryClient.clear()
  }

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-6">
          {/* The wordmark is the way home, as it is in most apps. This layout
              only renders behind the auth gate, so it always has somewhere to go. */}
          <Link
            to="/dashboard"
            className="flex h-9 shrink-0 items-center gap-2 rounded-lg px-1 font-semibold tracking-tight text-content transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white"
              aria-hidden="true"
            >
              SD
            </span>
            <span className="hidden sm:inline">SprintDesk</span>
            <span className="sr-only sm:hidden">SprintDesk — go to dashboard</span>
          </Link>

          <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            {user && (
              <span className="ml-1 flex h-9 items-center gap-2">
                <Avatar name={`${user.firstName} ${user.lastName}`} src={user.image} size="sm" />
                <span className="hidden text-sm text-content md:inline">{user.firstName}</span>
              </span>
            )}
            {/* Icon-only in the cramped mobile header, icon plus label above it.
                The hover state leans red because signing out ends the session. */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Sign out"
              onClick={handleSignOut}
              className={cn(
                // A 36px square on mobile, matching the bell and theme toggle.
                'ml-1 h-9 w-9 shrink-0 justify-center gap-0 px-0 text-content-muted',
                'hover:bg-red-50 hover:text-red-600 active:bg-red-100',
                'dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:active:bg-red-950/60',
                'sm:w-auto sm:gap-1.5 sm:px-3',
              )}
              leftIcon={
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M12.5 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6a1.5 1.5 0 0 0 1.5-1.5v-1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 10h8m0 0-2.5-2.5M16.5 10 14 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        {/* The three destinations split the width evenly rather than bunching left. */}
        <nav
          aria-label="Primary mobile"
          className="grid grid-cols-3 gap-1 border-t border-line px-3 py-1.5 sm:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClasses}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
