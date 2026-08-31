import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSendFriendRequest } from '../hooks/useFriends'

interface AddFriendDialogProps {
  trigger?: React.ReactNode
}

export function AddFriendDialog({ trigger }: AddFriendDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [appId, setAppId] = React.useState('')
  const { mutate: sendRequest, isPending } = useSendFriendRequest()

  const handleSend = () => {
    if (!appId.trim()) return
    sendRequest(appId.trim(), {
      onSuccess: () => {
        toast.success('Connection request sent!')
        setAppId('')
        setOpen(false)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button className="gap-1.5">
            <UserPlus className="size-4" />
            Add person
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-card border rounded-2xl shadow-xl p-6 space-y-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Dialog.Title className="font-semibold text-base">Connect with someone</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Enter their app ID to send a connection request.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="size-8 -mt-1 -mr-1 shrink-0">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="friend-app-id">App ID</Label>
            <Input
              id="friend-app-id"
              placeholder="e.g. sofia#4821"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">They can find their ID in Settings → Profile.</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button size="sm" onClick={handleSend} disabled={!appId.trim() || isPending}>
              {isPending ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
