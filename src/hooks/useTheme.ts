import { useEffect } from 'react'

export function useSystemTheme() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark)
    }

    apply(media.matches)

    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])
}
