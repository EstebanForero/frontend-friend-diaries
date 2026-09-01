import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/utils'
import { cacheImage, cachedImageObjectUrl } from '@/lib/offline/media-cache'

interface OfflineImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
}

export function OfflineImage({ src, className, onError, ...props }: OfflineImageProps) {
  const resolved = resolveMediaUrl(src)
  const [displayUrl, setDisplayUrl] = useState(resolved)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setDisplayUrl(resolved)

    const prepare = async () => {
      if (navigator.onLine) {
        void cacheImage(src)
        return
      }
      objectUrl = await cachedImageObjectUrl(src)
      if (active && objectUrl) setDisplayUrl(objectUrl)
    }
    void prepare()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resolved, src])

  return (
    <img
      {...props}
      src={displayUrl}
      className={cn(className)}
      onError={async (event) => {
        onError?.(event)
        if (displayUrl.startsWith('blob:')) return
        const cached = await cachedImageObjectUrl(src)
        if (cached) setDisplayUrl(cached)
      }}
    />
  )
}
