import { useCallback, useEffect, useState } from 'react'

export type AppearancePalette =
  | 'classic'
  | 'blush'
  | 'sweethearts'
  | 'love-letter'
  | 'lavender'
  | 'midnight'
export type BackgroundFit = 'cover' | 'contain' | 'repeat'
export type FontChoice = 'system' | 'serif' | 'rounded' | 'mono' | 'custom'

export interface AppearanceSettings {
  palette: AppearancePalette
  backgroundImage: string | null
  backgroundName: string | null
  backgroundOpacity: number
  backgroundFit: BackgroundFit
  fontChoice: FontChoice
  customFontData: string | null
  customFontName: string | null
}

const STORAGE_KEY = 'fd-appearance'
const CUSTOM_FONT_FAMILY = 'FriendDiariesLocalFont'

export const defaultAppearance: AppearanceSettings = {
  palette: 'classic',
  backgroundImage: null,
  backgroundName: null,
  backgroundOpacity: 0.45,
  backgroundFit: 'contain',
  fontChoice: 'system',
  customFontData: null,
  customFontName: null,
}

export const appearancePalettes: Array<{
  value: AppearancePalette
  label: string
  description: string
  swatches: string[]
}> = [
  {
    value: 'classic',
    label: 'Classic rose',
    description: 'The original warm diary palette.',
    swatches: ['oklch(0.985 0.008 75)', 'oklch(0.56 0.22 12)', 'oklch(0.95 0.03 15)'],
  },
  {
    value: 'blush',
    label: 'Soft pink',
    description: 'Pink, bright, and gentle.',
    swatches: ['oklch(0.985 0.018 350)', 'oklch(0.62 0.2 350)', 'oklch(0.94 0.055 355)'],
  },
  {
    value: 'sweethearts',
    label: 'Sweethearts',
    description: 'Pink hearts with playful candy colors.',
    swatches: ['oklch(0.985 0.022 5)', 'oklch(0.63 0.22 8)', 'oklch(0.9 0.08 25)'],
  },
  {
    value: 'love-letter',
    label: 'Love letter',
    description: 'Romantic red with paper tones.',
    swatches: ['oklch(0.98 0.018 65)', 'oklch(0.5 0.2 25)', 'oklch(0.93 0.05 35)'],
  },
  {
    value: 'lavender',
    label: 'Lavender note',
    description: 'Soft violet and rose accents.',
    swatches: ['oklch(0.98 0.015 310)', 'oklch(0.55 0.17 315)', 'oklch(0.94 0.04 305)'],
  },
  {
    value: 'midnight',
    label: 'Midnight diary',
    description: 'Moody, quiet, and high contrast.',
    swatches: ['oklch(0.18 0.026 275)', 'oklch(0.72 0.17 345)', 'oklch(0.25 0.04 280)'],
  },
]

export const fontChoices: Array<{ value: FontChoice; label: string; css: string }> = [
  {
    value: 'system',
    label: 'System',
    css: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    value: 'serif',
    label: 'Literary serif',
    css: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    value: 'rounded',
    label: 'Rounded',
    css: '"Avenir Next", Avenir, "Nunito Sans", ui-sans-serif, system-ui, sans-serif',
  },
  {
    value: 'mono',
    label: 'Notebook mono',
    css: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },
  {
    value: 'custom',
    label: 'Uploaded font',
    css: `"${CUSTOM_FONT_FAMILY}", ui-sans-serif, system-ui, sans-serif`,
  },
]

function loadAppearance(): AppearanceSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultAppearance
    return { ...defaultAppearance, ...JSON.parse(stored) } as AppearanceSettings
  } catch {
    return defaultAppearance
  }
}

function saveAppearance(settings: AppearanceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Unable to save local appearance settings', error)
  }
}

function getFontCss(settings: AppearanceSettings) {
  const selected = fontChoices.find((font) => font.value === settings.fontChoice) ?? fontChoices[0]
  if (settings.fontChoice === 'custom' && !settings.customFontData) {
    return fontChoices[0].css
  }
  return selected.css
}

function applyCustomFont(settings: AppearanceSettings) {
  const existing = document.getElementById('fd-custom-font')
  existing?.remove()

  if (!settings.customFontData) return

  const style = document.createElement('style')
  style.id = 'fd-custom-font'
  style.textContent = `
    @font-face {
      font-family: "${CUSTOM_FONT_FAMILY}";
      src: url("${settings.customFontData}");
      font-display: swap;
    }
  `
  document.head.appendChild(style)
}

function applyBackgroundSize(settings: AppearanceSettings) {
  const root = document.documentElement

  if (!settings.backgroundImage || settings.backgroundFit === 'repeat') {
    root.style.setProperty('--fd-background-size', 'auto')
    root.style.setProperty('--fd-background-repeat', 'repeat')
    root.style.setProperty('--fd-background-position', 'top left')
    return
  }

  if (settings.backgroundFit === 'cover') {
    root.style.setProperty('--fd-background-size', 'cover')
    root.style.setProperty('--fd-background-repeat', 'no-repeat')
    root.style.setProperty('--fd-background-position', 'center')
    return
  }

  // 'contain' — detect image dimensions and adapt intelligently
  const img = new window.Image()
  img.onload = () => {
    const imgRatio = img.naturalWidth / img.naturalHeight
    const vpRatio = window.innerWidth / window.innerHeight

    if (imgRatio >= vpRatio) {
      // Image is wider relative to viewport → fit to width, tile downward
      root.style.setProperty('--fd-background-size', '100% auto')
      root.style.setProperty('--fd-background-repeat', 'repeat-y')
      root.style.setProperty('--fd-background-position', 'top center')
    } else {
      // Image is taller relative to viewport → fit to height, tile rightward
      root.style.setProperty('--fd-background-size', 'auto 100%')
      root.style.setProperty('--fd-background-repeat', 'repeat-x')
      root.style.setProperty('--fd-background-position', 'center left')
    }
  }
  img.src = settings.backgroundImage
}

function applyAppearance(settings: AppearanceSettings) {
  const root = document.documentElement
  root.dataset.appearancePalette = settings.palette
  root.style.setProperty('--fd-font-family', getFontCss(settings))
  root.style.setProperty(
    '--fd-background-image',
    settings.backgroundImage ? `url("${settings.backgroundImage}")` : 'none',
  )
  root.style.setProperty('--fd-background-opacity', String(settings.backgroundOpacity))
  applyBackgroundSize(settings)
  applyCustomFont(settings)
}

export function useAppearance() {
  const [settings, setSettingsState] = useState<AppearanceSettings>(loadAppearance)

  useEffect(() => {
    applyAppearance(settings)

    if (!settings.backgroundImage || settings.backgroundFit !== 'contain') return
    const onResize = () => applyBackgroundSize(settings)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [settings])

  const setAppearance = useCallback((next: Partial<AppearanceSettings>) => {
    setSettingsState((current) => {
      const updated = { ...current, ...next }
      saveAppearance(updated)
      applyAppearance(updated)
      return updated
    })
  }, [])

  const resetAppearance = useCallback(() => {
    saveAppearance(defaultAppearance)
    applyAppearance(defaultAppearance)
    setSettingsState(defaultAppearance)
  }, [])

  return { settings, setAppearance, resetAppearance }
}
