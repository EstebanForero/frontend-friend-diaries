import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCreateGroup } from '@/features/groups/hooks/useGroups'
import { cn } from '@/lib/utils'
import type { MemoryBookColor, MemoryBookKind } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  timezone: z.string().optional(),
  kind: z.enum(['everyday', 'best-friends', 'family', 'long-distance', 'partner', 'adventure', 'memory-book']),
  emoji: z.string().min(1),
  color: z.enum(['rose', 'amber', 'emerald', 'sky', 'violet', 'slate']),
})

type FormData = z.infer<typeof schema>

const templates: Array<{
  kind: MemoryBookKind
  emoji: string
  label: string
  description: string
  suggestion: string
}> = [
  {
    kind: 'everyday',
    emoji: '✨',
    label: 'Everyday moments',
    description: 'The little things worth keeping.',
    suggestion: 'Our everyday moments',
  },
  {
    kind: 'best-friends',
    emoji: '🫶',
    label: 'Best friends',
    description: 'Stories, chaos, and everything between.',
    suggestion: 'The friendship archive',
  },
  {
    kind: 'family',
    emoji: '🏡',
    label: 'Family',
    description: 'Updates and memories across generations.',
    suggestion: 'Our family book',
  },
  {
    kind: 'long-distance',
    emoji: '🌍',
    label: 'Long-distance',
    description: 'Stay part of each other’s everyday life.',
    suggestion: 'Across the distance',
  },
  {
    kind: 'partner',
    emoji: '💛',
    label: 'Partners',
    description: 'A private record of life together.',
    suggestion: 'Our story',
  },
  {
    kind: 'adventure',
    emoji: '🧭',
    label: 'Trip or adventure',
    description: 'Collect a journey as it happens.',
    suggestion: 'Our adventure',
  },
  {
    kind: 'memory-book',
    emoji: '📖',
    label: 'Start from scratch',
    description: 'Make the space completely yours.',
    suggestion: 'Our memory book',
  },
]

const colors: Array<{
  value: MemoryBookColor
  className: string
  label: string
}> = [
  { value: 'rose', className: 'bg-rose-400', label: 'Rose' },
  { value: 'amber', className: 'bg-amber-400', label: 'Amber' },
  { value: 'emerald', className: 'bg-emerald-500', label: 'Emerald' },
  { value: 'sky', className: 'bg-sky-500', label: 'Sky' },
  { value: 'violet', className: 'bg-violet-500', label: 'Violet' },
  { value: 'slate', className: 'bg-slate-500', label: 'Slate' },
]

export const Route = createFileRoute('/app/groups/new')({
  component: NewMemoryBookPage,
})

function NewMemoryBookPage() {
  const router = useRouter()
  const { mutate: createGroup, isPending } = useCreateGroup()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      kind: 'everyday',
      emoji: '✨',
      color: 'rose',
      name: 'Our everyday moments',
    },
  })
  const selectedKind = watch('kind')
  const selectedColor = watch('color')

  const selectTemplate = (template: (typeof templates)[number]) => {
    setValue('kind', template.kind, { shouldValidate: true })
    setValue('emoji', template.emoji, { shouldValidate: true })
    setValue('name', template.suggestion, { shouldValidate: true })
  }

  const onSubmit = (data: FormData) => {
    createGroup(data, {
      onSuccess: (group) => {
        toast.success('Memory Book created!')
        void router.navigate({
          to: '/app/groups/$groupId',
          params: { groupId: group.id },
          search: { date: undefined, noteId: undefined },
        })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" /> A new place to remember together
        </div>
        <h1 className="text-2xl font-bold">Create a Memory Book</h1>
        <p className="text-sm text-muted-foreground">Choose a starting point. It never limits what you can add.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <button
              key={template.kind}
              type="button"
              onClick={() => selectTemplate(template)}
              className={cn(
                'relative rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm',
                selectedKind === template.kind && 'border-primary bg-primary/5 ring-1 ring-primary/20',
              )}
            >
              {selectedKind === template.kind && (
                <span className="absolute right-3 top-3 rounded-full bg-primary p-1 text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
              <span className="text-2xl">{template.emoji}</span>
              <p className="mt-2 text-sm font-semibold">{template.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Make it yours</CardTitle>
            <CardDescription>You can invite your people as soon as the book is created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Book name</Label>
              <Input id="name" placeholder="Our memory book" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Book color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={color.label}
                    title={color.label}
                    onClick={() => setValue('color', color.value, { shouldValidate: true })}
                    className={cn(
                      'size-9 rounded-full border-4 border-card shadow-sm transition-transform',
                      color.className,
                      selectedColor === color.value &&
                        'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background',
                    )}
                  />
                ))}
              </div>
            </div>

            <input type="hidden" {...register('kind')} />
            <input type="hidden" {...register('emoji')} />
            <input type="hidden" {...register('color')} />
            <input type="hidden" {...register('timezone')} />

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => router.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create Memory Book'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
