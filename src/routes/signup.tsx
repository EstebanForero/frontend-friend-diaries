import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/shared/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useRegister } from '@/features/auth/hooks/useAuth'

const schema = z
  .object({
    display_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    consent_given: z.boolean().refine((v) => v === true, {
      message: 'You must accept the data treatment policy to continue',
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const { mutate: register, isPending } = useRegister()
  const router = useRouter()
  const {
    register: rf,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    register(
      { email: data.email, password: data.password, display_name: data.display_name, consent_given: data.consent_given },
      {
        onSuccess: () => {
          toast.success('Account created! Please sign in.')
          void router.navigate({ to: '/login' })
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <AuthLayout title="Create your account" description="Start your shared diary journey">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" placeholder="Your name" {...rf('display_name')} />
          {errors.display_name && (
            <p className="text-xs text-destructive">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...rf('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="At least 8 characters" {...rf('password')} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <PasswordInput id="confirm_password" placeholder="Repeat your password" {...rf('confirm_password')} />
          {errors.confirm_password && (
            <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
          <input
            id="consent_given"
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-primary cursor-pointer"
            {...rf('consent_given', { setValueAs: (v) => v === true || v === 'true' })}
          />
          <label htmlFor="consent_given" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I have read and accept the{' '}
            <Link to="/privacy" className="text-primary underline underline-offset-2 hover:no-underline" target="_blank">
              Data Treatment Policy
            </Link>
            . I understand that my data is stored securely and used only to provide the Our Diary service.
          </label>
        </div>
        {errors.consent_given && (
          <p className="text-xs text-destructive">{errors.consent_given.message}</p>
        )}

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
