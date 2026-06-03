import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/shared/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegister } from '@/features/auth/hooks/useAuth'

const schema = z
  .object({
    display_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
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
  const { register: rf, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    register(
      { email: data.email, password: data.password, display_name: data.display_name },
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
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" placeholder="Your name" {...rf('display_name')} />
          {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...rf('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...rf('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" type="password" {...rf('confirm_password')} />
          {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
