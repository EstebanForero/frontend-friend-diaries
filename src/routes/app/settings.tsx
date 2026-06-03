import { createFileRoute } from '@tanstack/react-router'
import { Image, Palette, RotateCcw, Type, Upload, X } from 'lucide-react'
import { useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  appearancePalettes,
  fontChoices,
  type BackgroundFit,
  type FontChoice,
  useAppearance,
} from '@/hooks/useAppearance'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useAuthStore()
  const { settings, setAppearance, resetAppearance } = useAppearance()
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  async function handleBackgroundUpload(file: File | undefined) {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setAppearance({
      backgroundImage: dataUrl,
      backgroundName: file.name,
    })
  }

  async function handleFontUpload(file: File | undefined) {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    setAppearance({
      fontChoice: 'custom',
      customFontData: dataUrl,
      customFontName: file.name,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public identity inside Friend Diaries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Display name</span>
            <span className="text-sm font-medium">{user?.display_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App ID</span>
            <div className="flex flex-col items-end gap-0.5">
              {user?.app_id && <CopyableId id={user.app_id} className="text-sm" />}
              <span className="text-[11px] text-muted-foreground">Share this so friends can invite you</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge variant={user?.is_premium ? 'default' : 'secondary'}>
              {user?.is_premium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            Themes
          </CardTitle>
          <CardDescription>Saved on this browser and device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {appearancePalettes.map((palette) => (
              <button
                key={palette.value}
                type="button"
                onClick={() => setAppearance({ palette: palette.value })}
                className={cn(
                  'rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  settings.palette === palette.value && 'border-primary bg-primary/5',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{palette.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{palette.description}</p>
                  </div>
                  <div className="flex shrink-0 overflow-hidden rounded-full border">
                    {palette.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="size-5"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="size-4 text-primary" />
            Background
          </CardTitle>
          <CardDescription>Images stay local to this browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {settings.backgroundName ?? 'No image selected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {settings.backgroundImage ? 'Custom device background' : 'Using the theme background'}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                ref={backgroundInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleBackgroundUpload(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => backgroundInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Upload
              </Button>
              {settings.backgroundImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remove background"
                  onClick={() =>
                    setAppearance({ backgroundImage: null, backgroundName: null })
                  }
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {settings.backgroundImage && (
            <div
              className="h-32 rounded-lg border bg-muted"
              style={{
                backgroundImage: `url("${settings.backgroundImage}")`,
                backgroundPosition: 'center',
                backgroundRepeat: settings.backgroundFit === 'repeat' ? 'repeat' : 'no-repeat',
                backgroundSize: settings.backgroundFit === 'repeat' ? 'auto' : settings.backgroundFit,
              }}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="background-fit">Image fit</Label>
              <select
                id="background-fit"
                value={settings.backgroundFit}
                onChange={(event) =>
                  setAppearance({ backgroundFit: event.target.value as BackgroundFit })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="repeat">Tile</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-opacity">Image strength</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="background-opacity"
                  type="range"
                  min="0"
                  max="0.45"
                  step="0.01"
                  value={settings.backgroundOpacity}
                  onChange={(event) =>
                    setAppearance({ backgroundOpacity: Number(event.target.value) })
                  }
                  className="px-0"
                />
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round(settings.backgroundOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="size-4 text-primary" />
            Fonts
          </CardTitle>
          <CardDescription>Uploaded font files are stored locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {fontChoices.map((font) => (
              <button
                key={font.value}
                type="button"
                disabled={font.value === 'custom' && !settings.customFontData}
                onClick={() => setAppearance({ fontChoice: font.value as FontChoice })}
                className={cn(
                  'rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                  settings.fontChoice === font.value && 'border-primary bg-primary/5',
                )}
                style={{ fontFamily: font.value === 'custom' && !settings.customFontData ? undefined : font.css }}
              >
                <p className="text-sm font-semibold">{font.label}</p>
                <p className="mt-1 text-lg">Dear diary</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {settings.customFontName ?? 'No custom font selected'}
              </p>
              <p className="text-xs text-muted-foreground">Supports WOFF, WOFF2, TTF, and OTF.</p>
            </div>
            <div className="flex gap-2">
              <Input
                ref={fontInputRef}
                type="file"
                accept=".woff,.woff2,.ttf,.otf,font/*"
                className="hidden"
                onChange={(event) => handleFontUpload(event.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => fontInputRef.current?.click()}>
                <Upload className="size-4" />
                Upload
              </Button>
              {settings.customFontData && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remove custom font"
                  onClick={() =>
                    setAppearance({
                      fontChoice: 'system',
                      customFontData: null,
                      customFontName: null,
                    })
                  }
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={resetAppearance}>
              <RotateCcw className="size-4" />
              Reset appearance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
