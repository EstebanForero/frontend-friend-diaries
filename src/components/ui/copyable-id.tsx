import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyableIdProps {
  id: string
  className?: string
}

export function CopyableId({ id, className }: CopyableIdProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy"
      className={cn(
        'group inline-flex items-center gap-1.5 font-mono rounded px-1.5 py-0.5',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        'transition-colors cursor-pointer select-all',
        className,
      )}
    >
      <span>{id}</span>
      {copied ? (
        <Check className="size-3 text-primary shrink-0" />
      ) : (
        <Copy className="size-3 opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />
      )}
    </button>
  )
}
