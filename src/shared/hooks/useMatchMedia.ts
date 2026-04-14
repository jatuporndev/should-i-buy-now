import { useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query. Safe on first client render; defaults to `false`
 * when `window` is unavailable.
 */
export function useMatchMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () =>
      typeof window === 'undefined' ? false : window.matchMedia(query).matches,
    () => false,
  )
}
