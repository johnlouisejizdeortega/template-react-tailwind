import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { ManifestTheme, NormalizedTheme } from './theme'
import {
  createTheme,
  getButtonClasses,
  getSectionClasses,
  getTypographyClasses,
} from './theme'

type ManifestNavLink = {
  label: string
  slug: string
}

type ManifestFooter = {
  text?: string
  links?: ManifestNavLink[]
}

type ManifestSection = {
  type: string
  heading?: string
  body?: string
}

type ManifestPage = {
  slug: string
  title: string
  sections: ManifestSection[]
}

type ManifestResponse = {
  id: number
  business_name: string
  page_title: string
  meta_description: string
  cta: string | null
  manifest: {
    nav?: { links?: ManifestNavLink[] }
    footer?: ManifestFooter
    pages: ManifestPage[]
    theme?: ManifestTheme
  }
}

const manifestUrl = import.meta.env.VITE_MANIFEST_URL as string | undefined
const siteNameEnv = import.meta.env.VITE_SITE_NAME as string | undefined

function slugToPath(slug: string) {
  if (!slug || slug === '/' || slug === 'home') return '/'
  return `/${slug.replace(/^\//, '')}`
}

function App() {
  const [data, setData] = useState<ManifestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname || '/',
  )

  useEffect(() => {
    if (!manifestUrl) return

    setIsLoading(true)
    setError(null)

    fetch(manifestUrl)
      .then((res) => res.json())
      .then((json: ManifestResponse) => {
        setData(json)
      })
      .catch((err) => {
        console.error('Error fetching manifest', err)
        setError('Failed to load site configuration.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [manifestUrl])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!data) return

    const siteName = siteNameEnv || data.business_name
    const title = data.page_title || siteName
    const description = data.meta_description

    document.title = title

    if (description) {
      let meta = document.querySelector(
        'meta[name="description"]',
      ) as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [data])

  const handleNavigate = (path: string) => {
    const normalized = path || '/'
    if (normalized === currentPath) return

    window.history.pushState({}, '', normalized)
    setCurrentPath(normalized)
  }

  if (!manifestUrl) {
    return <div className="p-6 text-center">Missing VITE_MANIFEST_URL</div>
  }

  if (isLoading && !data) {
    return <div className="p-6 text-center">Loading...</div>
  }

  if (error && !data) {
    return <div className="p-6 text-center">{error}</div>
  }

  if (!data) {
    return <div className="p-6 text-center">No manifest data</div>
  }

  const siteName = siteNameEnv || data.business_name
  const pages = data.manifest.pages || []
  const hasPages = pages.length > 0
  const theme = createTheme(data.manifest.theme)
  const currentPage = hasPages
    ? pages.find((page) => slugToPath(page.slug) === currentPath) || pages[0]
    : undefined

  return (
    <Layout
      navLinks={data.manifest.nav?.links}
      footer={data.manifest.footer}
      siteName={siteName}
      currentPath={currentPath}
      theme={theme}
      onNavigate={handleNavigate}
    >
      {currentPage ? (
        <div className="space-y-8 sm:space-y-10">
          {currentPage.sections.map((section, index) => (
            <SectionRenderer key={index} section={section} theme={theme} />
          ))}
        </div>
      ) : hasPages ? (
        <div>Page not found</div>
      ) : (
        <div>No pages defined in manifest</div>
      )}
    </Layout>
  )
}

type LayoutProps = {
  navLinks?: ManifestNavLink[]
  footer?: ManifestFooter
  siteName: string
  currentPath: string
  theme: NormalizedTheme
  onNavigate: (path: string) => void
  children: ReactNode
}

function Layout({
  navLinks,
  footer,
  siteName,
  currentPath,
  theme,
  onNavigate,
  children,
}: LayoutProps) {
  const handleClick = (slug: string) => {
    const path = slugToPath(slug)
    onNavigate(path)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fontFamily,
      }}
   >
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            className="text-base font-semibold tracking-tight"
            onClick={() => onNavigate('/')}
          >
            {siteName}
          </button>
          {navLinks && navLinks.length > 0 && (
            <nav className="hidden sm:flex gap-3 text-sm text-slate-300">
              {navLinks.map((link) => {
                const path = slugToPath(link.slug)
                const isActive = path === currentPath
                const className = getButtonClasses(theme, {
                  variant: isActive ? 'primary' : 'ghost',
                  size: 'sm',
                  pill: true,
                })
                return (
                  <button
                    key={link.slug}
                    type="button"
                    onClick={() => handleClick(link.slug)}
                    className={className}
                    style={
                      isActive
                        ? {
                            backgroundColor: theme.colors.accent,
                            color: theme.colors.background,
                          }
                        : undefined
                    }
                  >
                    {link.label}
                  </button>
                )
              })}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {children}
        </div>
      </main>

      {footer && (
        <footer
          className="border-t text-xs sm:text-sm"
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-slate-400">{footer.text}</div>
            {footer.links && footer.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {footer.links.map((link) => (
                  <button
                    key={link.slug}
                    type="button"
                    onClick={() => handleClick(link.slug)}
                    className="text-slate-300 hover:text-indigo-300 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}

function SectionRenderer({
  section,
  theme,
}: {
  section: ManifestSection
  theme: NormalizedTheme
}) {
  return renderSection(section, theme)
}

function Hero({
  heading,
  body,
  theme,
}: {
  heading: string
  body: string
  theme: NormalizedTheme
}) {
  return (
    <section
      className={getSectionClasses('hero', theme)}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div
        className="absolute -top-24 right-0 h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: theme.colors.accent + '1A' }}
      />
      <div className="relative mx-auto max-w-2xl text-center space-y-4 sm:space-y-5">
        <h1 className={getTypographyClasses('heroTitle')} style={{ color: theme.colors.text }}>
          {heading}
        </h1>
        <p
          className={getTypographyClasses('heroBody')}
          style={{ color: theme.colors.muted }}
        >
          {body}
        </p>
      </div>
    </section>
  )
}

function TextBlock({
  heading,
  body,
  theme,
}: {
  heading?: string
  body?: string
  theme: NormalizedTheme
}) {
  return (
    <section
      className={getSectionClasses('text-block', theme)}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="space-y-3">
        {heading && (
          <h2
            className={getTypographyClasses('sectionTitle')}
            style={{ color: theme.colors.text }}
          >
            {heading}
          </h2>
        )}
        {body && (
          <p
            className={getTypographyClasses('sectionBody') + ' whitespace-pre-line'}
            style={{ color: theme.colors.muted }}
          >
            {body}
          </p>
        )}
      </div>
    </section>
  )
}

function ImageBlock({
  heading,
  body,
  theme,
}: {
  heading?: string
  body?: string
  theme: NormalizedTheme
}) {
  return (
    <section
      className={getSectionClasses('image-block', theme)}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="space-y-4">
        {heading && (
          <h2
            className={getTypographyClasses('sectionTitle')}
            style={{ color: theme.colors.text }}
          >
            {heading}
          </h2>
        )}
        {body && (
          <p
            className={getTypographyClasses('sectionBody')}
            style={{ color: theme.colors.muted }}
          >
            {body}
          </p>
        )}
        <div className="h-40 sm:h-48 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/80 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
          Image placeholder
        </div>
      </div>
    </section>
  )
}

function GenericSection({
  type,
  heading,
  body,
  theme,
}: {
  type: string
  heading?: string
  body?: string
  theme: NormalizedTheme
}) {
  return (
    <section
      className={getSectionClasses(type, theme)}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: theme.colors.accent }}
          />
          <span
            className={getTypographyClasses('label')}
            style={{ color: theme.colors.muted }}
          >
            {type.replace('-', ' ')}
          </span>
        </div>
        {heading && (
          <h2
            className={getTypographyClasses('sectionTitle')}
            style={{ color: theme.colors.text }}
          >
            {heading}
          </h2>
        )}
        {body && (
          <p
            className={
              getTypographyClasses('sectionBody') + ' whitespace-pre-line'
            }
            style={{ color: theme.colors.muted }}
          >
            {body}
          </p>
        )}
      </div>
    </section>
  )
}

function renderSection(section: ManifestSection, theme: NormalizedTheme) {
  switch (section.type) {
    case 'hero':
      return (
        <Hero
          heading={section.heading ?? ''}
          body={section.body ?? ''}
          theme={theme}
        />
      )
    case 'text-block':
    case 'content-block':
      return (
        <TextBlock heading={section.heading} body={section.body} theme={theme} />
      )
    case 'image-block':
      return (
        <ImageBlock heading={section.heading} body={section.body} theme={theme} />
      )
    case 'profile-row':
    case 'testimonial':
    case 'faq':
    case 'contact-form':
      return (
        <GenericSection
          type={section.type}
          heading={section.heading}
          body={section.body}
          theme={theme}
        />
      )
    default:
      return null
  }
}

export default App
