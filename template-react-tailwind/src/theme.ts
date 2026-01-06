export type ManifestTheme = {
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  surfaceColor?: string
  accentColor?: string
  fontFamily?: string
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill'
  density?: 'cozy' | 'comfortable' | 'compact'
  // Optional per-section overrides; keys are section.type values
  sectionStyles?: Record<string, unknown>
}

export type NormalizedTheme = {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    accent: string
    text: string
    muted: string
    border: string
  }
  fontFamily: string
  radius: {
    section: string
    pill: string
  }
  density: 'cozy' | 'comfortable' | 'compact'
  sectionStyles: Record<string, unknown>
}

const DEFAULT_THEME: NormalizedTheme = {
  colors: {
    primary: '#6366F1', // indigo-500
    secondary: '#0EA5E9', // sky-500
    background: '#020617', // slate-950
    surface: 'rgba(15,23,42,0.9)', // slate-900-ish
    accent: '#6366F1',
    text: '#E5E7EB', // slate-200
    muted: '#94A3B8', // slate-400
    border: 'rgba(148,163,184,0.4)', // slate-400-ish
  },
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Segoe UI", sans-serif',
  radius: {
    section: 'rounded-2xl',
    pill: 'rounded-full',
  },
  density: 'comfortable',
  sectionStyles: {},
}

export function createTheme(input?: ManifestTheme | null): NormalizedTheme {
  if (!input) return DEFAULT_THEME

  const {
    primaryColor,
    secondaryColor,
    backgroundColor,
    surfaceColor,
    accentColor,
    fontFamily,
    borderRadius,
    density,
    sectionStyles,
  } = input

  const resolvedPrimary = primaryColor || DEFAULT_THEME.colors.primary

  const mappedRadius = mapRadius(borderRadius)

  return {
    colors: {
      primary: resolvedPrimary,
      secondary: secondaryColor || DEFAULT_THEME.colors.secondary,
      background: backgroundColor || DEFAULT_THEME.colors.background,
      surface: surfaceColor || DEFAULT_THEME.colors.surface,
      accent: accentColor || resolvedPrimary,
      text: DEFAULT_THEME.colors.text,
      muted: DEFAULT_THEME.colors.muted,
      border: DEFAULT_THEME.colors.border,
    },
    fontFamily: fontFamily || DEFAULT_THEME.fontFamily,
    radius: mappedRadius,
    density: density || DEFAULT_THEME.density,
    sectionStyles: sectionStyles || {},
  }
}

function mapRadius(
  radius: ManifestTheme['borderRadius'],
): NormalizedTheme['radius'] {
  switch (radius) {
    case 'sm':
      return { section: 'rounded-lg', pill: 'rounded-full' }
    case 'md':
      return { section: 'rounded-xl', pill: 'rounded-full' }
    case 'lg':
      return { section: 'rounded-2xl', pill: 'rounded-full' }
    case 'xl':
    case '2xl':
      return { section: 'rounded-3xl', pill: 'rounded-full' }
    case 'pill':
      return { section: 'rounded-3xl', pill: 'rounded-full' }
    default:
      return DEFAULT_THEME.radius
  }
}

export type TypographyVariant =
  | 'heroTitle'
  | 'heroBody'
  | 'sectionTitle'
  | 'sectionBody'
  | 'label'

export function getTypographyClasses(variant: TypographyVariant): string {
  switch (variant) {
    case 'heroTitle':
      return 'text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight'
    case 'heroBody':
      return 'text-sm sm:text-base leading-relaxed'
    case 'sectionTitle':
      return 'text-lg sm:text-xl font-semibold tracking-tight'
    case 'sectionBody':
      return 'text-sm sm:text-base leading-relaxed'
    case 'label':
      return 'text-[10px] font-medium uppercase tracking-[0.18em]'
    default:
      return ''
  }
}

export function getSectionClasses(
  type: string,
  theme: NormalizedTheme,
): string {
  const baseSpacing =
    theme.density === 'compact'
      ? 'px-4 py-5 sm:px-5 sm:py-6'
      : theme.density === 'cozy'
        ? 'px-6 py-7 sm:px-8 sm:py-9'
        : 'px-6 py-6 sm:px-8 sm:py-8'

  if (type === 'hero') {
    return [
      'relative overflow-hidden border shadow-[0_22px_80px_rgba(15,23,42,0.9)]',
      theme.radius.section,
      baseSpacing,
    ].join(' ')
  }

  return ['border shadow-sm', theme.radius.section, baseSpacing].join(' ')
}

export type ButtonVariant = 'primary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

export function getButtonClasses(
  theme: NormalizedTheme,
  options?: { variant?: ButtonVariant; size?: ButtonSize; pill?: boolean },
): string {
  const variant = options?.variant ?? 'primary'
  const size = options?.size ?? 'md'
  const pill = options?.pill ?? false

  const sizeClasses =
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  const radiusClass = pill ? theme.radius.pill : theme.radius.section

  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'

  if (variant === 'ghost') {
    return [
      base,
      sizeClasses,
      radiusClass,
      'border border-transparent text-slate-200 hover:bg-slate-800/80',
    ].join(' ')
  }

  return [
    base,
    sizeClasses,
    radiusClass,
    'border border-transparent bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200',
  ].join(' ')
}
