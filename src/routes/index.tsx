import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { BookHeart, Heart, Lock, MessageCircleHeart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // If auth is already resolved and user is logged in, skip the landing page.
    if (!context.auth.isLoading && context.auth.isAuthenticated) {
      throw redirect({ to: '/app/groups' })
    }
  },
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  // Handle the case where auth resolves AFTER the component mounts
  // (restoreAuth is async so beforeLoad may run before the check completes).
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: '/app/groups' })
    }
  }, [isAuthenticated, isLoading, navigate])
  return (
    <div className="min-h-screen bg-background">
      {/* Warm glow behind hero */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, oklch(0.85 0.12 12 / 0.18), transparent)',
        }}
      />

      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookHeart className="size-5 text-primary" />
            <span className="font-bold">Friend Diaries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-5 pt-20 pb-16 text-center space-y-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>Private · Intimate · Yours</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Your private corner of the internet,{' '}
            <span className="text-primary">shared with the people you love</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Write your day. React with love. Stay close — no matter the distance.
            A diary built for two, or the small circle that matters most.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" asChild className="gap-2">
              <Link to="/signup">
                <Heart className="size-4" />
                Start for free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="container mx-auto px-5 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <MessageCircleHeart className="size-5" />,
                title: 'Write together',
                desc: 'Both of you can write throughout the day. Your notes appear side by side on the same timeline.',
              },
              {
                icon: <Heart className="size-5" />,
                title: 'React with care',
                desc: 'A ❤️, a 🫂, a ⭐ — small reactions that say "I read this and I felt it."',
              },
              {
                icon: <Lock className="size-5" />,
                title: 'Completely private',
                desc: 'Your diary is never public. Notes are only visible to the people you invite.',
              },
              {
                icon: <BookHeart className="size-5" />,
                title: 'Browse your story',
                desc: 'Every day is saved. Go back to any moment and relive it together.',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border bg-card p-6 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
                  {feat.icon}
                </div>
                <h3 className="font-semibold">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section className="border-t bg-card">
          <div className="container mx-auto px-5 py-14 text-center space-y-5">
            <h2 className="text-2xl font-bold">Ready to start your shared diary?</h2>
            <p className="text-muted-foreground">
              Free forever for two people. Create your first diary in under a minute.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Create your diary</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
