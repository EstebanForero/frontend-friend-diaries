import { createFileRoute, Link } from '@tanstack/react-router'
import { BookHeart, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

const LAST_UPDATED = 'June 2026'
const CONTACT_EMAIL = 'privacy@ourdiary.app'
const APP_NAME = 'Friend Diaries'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-5 py-3.5 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <BookHeart className="size-4 text-primary" />
            <span className="font-semibold text-sm">{APP_NAME}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-5 py-12 max-w-2xl space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Data Treatment Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Who we are">
          <p>
            {APP_NAME} provides private shared Memory Books for friends, families, partners, and small groups. We are
            committed to protecting your privacy and handling your personal data with the utmost care and transparency.
          </p>
        </Section>

        <Section title="2. Data we collect">
          <p>We collect only what is necessary to provide the service:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Account data:</strong> your display name, email address, and hashed password.
            </li>
            <li>
              <strong>Memory Book content:</strong> entries, reactions, replies, photos, and videos you add inside a
              shared book.
            </li>
            <li>
              <strong>Usage data:</strong> timestamps of account creation, note creation, and last login. No analytics
              or tracking pixels are used.
            </li>
            <li>
              <strong>Media:</strong> photos and Premium video memories are stored in our object storage and served
              through time-limited links.
            </li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <p>Your data is used exclusively to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide and maintain the {APP_NAME} service.</li>
            <li>Allow you and your Memory Book members to read and write shared entries.</li>
            <li>Send in-app notifications about activity in books you are a member of.</li>
          </ul>
          <p>We do not sell, rent, or share your data with third parties for advertising or marketing purposes.</p>
        </Section>

        <Section title="4. Data storage and security">
          <p>
            Your data is stored in a PostgreSQL database and your media in an S3-compatible object store (MinIO). All
            data is encrypted in transit via HTTPS. Passwords are hashed using bcrypt and never stored in plain text.
          </p>
          <p>
            Access to Memory Book content is restricted: only accepted members may request its entries, media, and
            replies. Media is served using time-limited signed URLs.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            Your account and Memory Book content are retained for as long as your account is active. If you delete your
            account, your personal information (name, email) is anonymised immediately, and your entries may remain in
            shared books to preserve the other members’ history. You may request full permanent deletion by contacting
            us.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>Depending on your jurisdiction, you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Access</strong> the personal data we hold about you.
            </li>
            <li>
              <strong>Rectify</strong> inaccurate data.
            </li>
            <li>
              <strong>Erase</strong> your data ("right to be forgotten").
            </li>
            <li>
              <strong>Portability</strong> — receive a copy of your data in a machine-readable format.
            </li>
            <li>
              <strong>Object</strong> to processing of your data.
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Cookies and local storage">
          <p>
            {APP_NAME} uses an httpOnly cookie to maintain your authentication session and localStorage to persist your
            session across page reloads. No third-party cookies or tracking cookies are used.
          </p>
        </Section>

        <Section title="8. Changes to this policy">
          <p>
            We may update this policy to reflect changes in the service or applicable law. We will notify you of
            material changes via a notice in the app. Continued use of the service after the effective date constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            For privacy-related questions, requests, or concerns, please contact:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <div className="pt-6 border-t text-xs text-muted-foreground">
          <p>
            By creating an account you confirm that you have read and accepted this Data Treatment Policy and that you
            are at least 13 years of age.
          </p>
        </div>
      </main>
    </div>
  )
}
