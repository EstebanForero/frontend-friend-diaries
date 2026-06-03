import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { BookOpen, Heart, Lock, Users } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <span className="font-bold text-lg">Friend Diaries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center space-y-16">
        <section className="space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your private shared diary
          </h1>
          <p className="text-xl text-muted-foreground">
            Write daily notes and share them with your partner, best friend, or a small group.
            Stay emotionally connected, one note at a time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Start for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            { icon: <Heart className="size-5" />, title: 'Built for closeness', desc: 'Perfect for couples, best friends, and small groups who want to stay connected.' },
            { icon: <BookOpen className="size-5" />, title: 'Daily shared timeline', desc: 'Write multiple notes throughout the day. React and reply to each other.' },
            { icon: <Lock className="size-5" />, title: 'Private by design', desc: 'Your diary is never public. Only your group members can see your notes.' },
            { icon: <Users className="size-5" />, title: 'Invite anyone', desc: 'Invite a friend with their unique ID. Free plan supports 2 members per group.' },
          ].map((feat) => (
            <div key={feat.title} className="rounded-xl border p-5 space-y-3">
              <div className="text-primary">{feat.icon}</div>
              <h3 className="font-semibold">{feat.title}</h3>
              <p className="text-sm text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
