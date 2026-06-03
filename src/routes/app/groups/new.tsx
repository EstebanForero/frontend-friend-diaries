import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCreateGroup } from '@/features/groups/hooks/useGroups'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  timezone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export const Route = createFileRoute('/app/groups/new')({
  component: NewGroupPage,
})

function NewGroupPage() {
  const router = useRouter()
  const { mutate: createGroup, isPending } = useCreateGroup()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  const onSubmit = (data: FormData) => {
    createGroup(data, {
      onSuccess: (group) => {
        toast.success('Diary created!')
        void router.navigate({ to: '/app/groups/$groupId', params: { groupId: group.id } })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a new diary</h1>
        <p className="text-muted-foreground text-sm">Give your shared diary a name</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diary details</CardTitle>
          <CardDescription>You can invite others after creation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Our diary" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" {...register('timezone')} />
              <p className="text-xs text-muted-foreground">Used to determine when today ends</p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create diary'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
