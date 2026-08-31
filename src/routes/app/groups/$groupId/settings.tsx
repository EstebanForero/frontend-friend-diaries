import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useGroup, useUpdateGroup } from '@/features/groups/hooks/useGroups'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { MemoryBookColor } from '@/types'

export const Route = createFileRoute('/app/groups/$groupId/settings')({
  component: MemoryBookSettingsPage,
})

const colors: Array<{ value: MemoryBookColor; className: string }> = [
  { value: 'rose', className: 'bg-rose-400' },
  { value: 'amber', className: 'bg-amber-400' },
  { value: 'emerald', className: 'bg-emerald-500' },
  { value: 'sky', className: 'bg-sky-500' },
  { value: 'violet', className: 'bg-violet-500' },
  { value: 'slate', className: 'bg-slate-500' },
]

function MemoryBookSettingsPage() {
  const { groupId } = Route.useParams()
  const { data: group } = useGroup(groupId)
  const { mutate: update, isPending } = useUpdateGroup(groupId)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📖')
  const [color, setColor] = useState<MemoryBookColor>('rose')

  useEffect(() => {
    if (!group) return
    setName(group.name)
    setEmoji(group.emoji || '📖')
    setColor(group.color || 'rose')
  }, [group])

  const save = () => {
    if (!group || !name.trim()) return
    update(
      {
        name: name.trim(),
        emoji: emoji.trim() || '📖',
        color,
        kind: group.kind,
        timezone: group.timezone,
      },
      {
        onSuccess: () => toast.success('Memory Book updated'),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/groups/$groupId" params={{ groupId }} search={{ date: undefined, noteId: undefined }}>
          <ArrowLeft className="size-4" /> Back to book
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Memory Book settings</h1>
        <p className="text-sm text-muted-foreground">Shape the shared space without changing what is already inside.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Book identity</CardTitle>
          <CardDescription>Everyone in this book will see these details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="emoji">Icon</Label>
              <Input
                id="emoji"
                value={emoji}
                maxLength={8}
                onChange={(event) => setEmoji(event.target.value)}
                className="text-center text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => setColor(choice.value)}
                  className={cn(
                    'size-9 rounded-full border-4 border-card shadow-sm',
                    choice.className,
                    color === choice.value && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  )}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={group?.timezone ?? ''} readOnly />
            <p className="text-xs text-muted-foreground">The timezone determines when a new memory day begins.</p>
          </div>
          <Button onClick={save} disabled={isPending || !name.trim()}>
            <Save className="size-4" /> {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
