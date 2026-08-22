import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { useDocumentVisibility } from '@/hooks/useDocumentVisibility'
import { queryKeys } from '@/lib/queryKeys'
import { listSeedNotifications } from '@/services/data/localData'
import { useCurrentMemberId } from '@/features/board/hooks/useCurrentMember'
import { fetchFeed } from '../services/notificationsApi'
import { useNotificationsStore } from '../store/notificationsStore'

/** Poll cadence. Short enough to demo, long enough not to hammer the API. */
const POLL_INTERVAL_MS = 20_000

export interface NotificationPollingOptions {
  /**
   * Toast on arrival. The panel passes `false` while it is open, because the
   * list updating in place is already the feedback.
   */
  announce: boolean
}

/**
 * Drives the simulated real-time feed: seeds the store once from the local
 * service, then polls JSONPlaceholder while the tab is visible, ingesting each
 * page of previously unseen post ids as notifications.
 */
export function useNotificationPolling({ announce }: NotificationPollingOptions): void {
  const isVisible = useDocumentVisibility()
  // Notifications are addressed to a workspace member, so the feed fills the
  // inbox of whoever is signed in rather than one list shared by everybody.
  const memberId = useCurrentMemberId()
  const seededFor = useNotificationsStore((state) => state.seededFor)
  const seed = useNotificationsStore((state) => state.seed)
  const ingest = useNotificationsStore((state) => state.ingest)
  const { toast } = useToast()

  const needsSeed = memberId !== undefined && !seededFor.includes(memberId)

  const seedQuery = useQuery({
    queryKey: queryKeys.notificationSeed,
    queryFn: listSeedNotifications,
    enabled: needsSeed,
    staleTime: Infinity,
  })

  const seedData = seedQuery.data
  useEffect(() => {
    if (seedData && memberId !== undefined) seed(memberId, seedData)
  }, [seedData, seed, memberId])

  const feed = useQuery({
    queryKey: queryKeys.notificationFeed,
    // The offset is read at call time, so advancing it never re-keys the query
    // (which would fire an immediate extra request instead of waiting a tick).
    queryFn: () => fetchFeed(useNotificationsStore.getState().offset),
    enabled: memberId !== undefined,
    refetchInterval: isVisible ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    // A page is only worth fetching once per interval. Without this the
    // default `refetchOnMount` polled immediately on every remount — an HMR
    // save or a route change would inject a whole extra page of notifications
    // on the spot. The interval refetch ignores `staleTime`, so the cadence
    // itself is unaffected.
    staleTime: POLL_INTERVAL_MS,
    retry: 1,
  })

  const lastProcessed = useRef(0)
  const isFirstResponse = useRef(true)
  const { data, dataUpdatedAt } = feed

  useEffect(() => {
    if (!data || memberId === undefined || dataUpdatedAt === lastProcessed.current) return
    lastProcessed.current = dataUpdatedAt

    const fresh = ingest(memberId, data)
    const wasFirst = isFirstResponse.current
    isFirstResponse.current = false

    // The first response of a session is history, not an event; and everything
    // that piled up while the tab was hidden arrives as one settled batch.
    if (wasFirst || !announce || fresh.length === 0) return

    toast(
      fresh.length === 1
        ? { title: 'New notification', description: fresh[0]!.title }
        : { title: `${fresh.length} new notifications`, description: 'Open the bell to review them.' },
    )
  }, [data, dataUpdatedAt, ingest, announce, toast, memberId])
}
