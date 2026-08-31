import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ArrowRight, BookHeart, Camera, Film, LockKeyhole, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.isAuthenticated) {
      throw redirect({ to: '/app/groups' })
    }
  },
  component: LandingPage,
})

const stories = [
  {
    emoji: '🫶',
    title: 'Best friends',
    copy: 'Keep the jokes, voice-of-the-day stories, and ordinary wins.',
  },
  {
    emoji: '🏡',
    title: 'Families',
    copy: 'A calm place for updates, photos, and moments across generations.',
  },
  {
    emoji: '🌍',
    title: 'Long-distance',
    copy: 'Stay part of the everyday life happening between calls.',
  },
  {
    emoji: '🧭',
    title: 'Adventures',
    copy: 'Turn a trip, project, or season of life into a story together.',
  },
]

function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) void navigate({ to: '/app/groups' })
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,oklch(0.88_0.11_30/0.22),transparent_35%),radial-gradient(circle_at_90%_20%,oklch(0.86_0.09_270/0.16),transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <BookHeart className="size-5 text-primary" />
            </span>
            <span className="font-bold">Friend Diaries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Create a book</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:pt-24">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-primary" /> Private Memory Books for real relationships
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Keep life with <span className="text-primary">your people.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Create a private Memory Book with a friend, sibling, partner, family, or small group. Share everyday
                moments and build a story you can return to.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to="/signup">
                  Create your Memory Book <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Open your books</Link>
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="size-4 text-primary" /> No public feed. Only the people you invite.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-violet-400/10 blur-2xl" />
            <div className="relative rotate-1 rounded-[2rem] border bg-card p-4 shadow-2xl">
              <div className="rounded-[1.4rem] bg-gradient-to-br from-amber-100 to-rose-100 p-5 text-slate-900 dark:from-amber-950 dark:to-rose-950 dark:text-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🧭</span>
                  <span className="text-xs font-medium opacity-60">July memories</span>
                </div>
                <h2 className="mt-7 text-xl font-bold">Our summer adventure</h2>
                <p className="mt-1 text-sm opacity-70">Esteban, Sofia, Daniel</p>
              </div>
              <div className="space-y-3 p-2 pt-5">
                <div className="rounded-2xl bg-muted/70 p-4">
                  <p className="text-xs font-semibold">Sofia · 9:42 AM</p>
                  <p className="mt-2 text-sm">Found the tiny café we talked about. Saving it for all of us ☕</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-sky-200 to-blue-400" />
                  <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Film className="size-7" />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <span>❤️ 3</span>
                  <span>✨ 2</span>
                  <span>2 replies</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card/60 py-20">
          <div className="container mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary">A book for every kind of connection</p>
              <h2 className="mt-2 text-3xl font-bold">Not another group chat</h2>
              <p className="mt-3 text-muted-foreground">
                Chats move on. Memory Books are designed to keep what mattered.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stories.map((story) => (
                <article key={story.title} className="rounded-2xl border bg-background/70 p-5">
                  <span className="text-2xl">{story.emoji}</span>
                  <h3 className="mt-3 font-semibold">{story.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{story.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border bg-card p-7">
              <Camera className="size-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">Capture the small moments</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Write a thought, add photos, or save a compressed three-minute video memory on Premium.
              </p>
            </article>
            <article className="rounded-3xl border bg-card p-7">
              <Users className="size-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">Together, without pressure</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Contribute when you can. React and reply without turning the space into an always-on chat.
              </p>
            </article>
            <article className="rounded-3xl border bg-card p-7">
              <BookHeart className="size-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">Build something lasting</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Browse by day and watch an ordinary collection become a shared history.
              </p>
            </article>
          </div>
        </section>

        <section className="border-t bg-card">
          <div className="container mx-auto max-w-3xl space-y-5 px-5 py-16 text-center">
            <h2 className="text-3xl font-bold">Today is worth keeping.</h2>
            <p className="text-muted-foreground">Start a private Memory Book and invite the people who belong in it.</p>
            <Button size="lg" asChild>
              <Link to="/signup">Create your first book</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
