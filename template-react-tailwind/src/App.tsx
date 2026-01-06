import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

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
  const currentPage = hasPages
    ? pages.find((page) => slugToPath(page.slug) === currentPath) || pages[0]
    : undefined

  return (
    <Layout
      navLinks={data.manifest.nav?.links}
      footer={data.manifest.footer}
      siteName={siteName}
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      {currentPage ? (
        <div className="space-y-8 sm:space-y-10">
          {currentPage.sections.map((section, index) => (
            <SectionRenderer key={index} section={section} />
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
  onNavigate: (path: string) => void
  children: ReactNode
}

function Layout({
  navLinks,
  footer,
  siteName,
  currentPath,
  onNavigate,
  children,
}: LayoutProps) {
  const handleClick = (slug: string) => {
    const path = slugToPath(slug)
    onNavigate(path)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            className="text-base font-semibold tracking-tight text-slate-50"
            onClick={() => onNavigate('/')}
          >
            {siteName}
          </button>
          {navLinks && navLinks.length > 0 && (
            <nav className="hidden sm:flex gap-3 text-sm text-slate-300">
              {navLinks.map((link) => {
                const path = slugToPath(link.slug)
                const isActive = path === currentPath
                return (
                  <button
                    key={link.slug}
                    type="button"
                    onClick={() => handleClick(link.slug)}
                    className={
                      'px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ' +
                      (isActive
                        ? 'bg-indigo-500 text-slate-50 shadow-sm'
                        : 'text-slate-200 hover:bg-slate-800/80')
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
        <footer className="border-t border-slate-800/60 bg-slate-950/80 text-xs sm:text-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-slate-500">{footer.text}</div>
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

function SectionRenderer({ section }: { section: ManifestSection }) {
  return renderSection(section)
}

function Hero({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 shadow-[0_22px_80px_rgba(15,23,42,0.9)] px-6 py-10 sm:px-10 sm:py-14">
      <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-slate-500/40 to-transparent" />
      <div className="relative mx-auto max-w-2xl text-center space-y-4 sm:space-y-5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
          {heading}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {body}
        </p>
      </div>
    </section>
  )
}

function TextBlock({
  heading,
  body,
}: {
  heading?: string
  body?: string
}) {
  return (
    <section className="rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-sm px-6 py-6 sm:px-8 sm:py-8 space-y-3">
      {heading && (
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50">
          {heading}
        </h2>
      )}
      {body && (
        <p className="text-sm sm:text-base text-slate-300 whitespace-pre-line leading-relaxed">
          {body}
        </p>
      )}
    </section>
  )
}

function ImageBlock({
  heading,
  body,
}: {
  heading?: string
  body?: string
}) {
  return (
    <section className="rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-sm px-6 py-6 sm:px-8 sm:py-8 space-y-4">
      {heading && (
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50">
          {heading}
        </h2>
      )}
      {body && (
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {body}
        </p>
      )}
      <div className="h-40 sm:h-48 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/80 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
        Image placeholder
      </div>
    </section>
  )
}

function GenericSection({
  type,
  heading,
  body,
}: {
  type: string
  heading?: string
  body?: string
}) {
  return (
    <section className="rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-sm px-6 py-6 sm:px-8 sm:py-8 space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        {type.replace('-', ' ')}
      </div>
      {heading && (
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50">
          {heading}
        </h2>
      )}
      {body && (
        <p className="text-sm sm:text-base text-slate-300 whitespace-pre-line leading-relaxed">
          {body}
        </p>
      )}
    </section>
  )
}

function renderSection(section: ManifestSection) {
  switch (section.type) {
    case 'hero':
      return (
        <Hero
          heading={section.heading ?? ''}
          body={section.body ?? ''}
        />
      )
    case 'text-block':
    case 'content-block':
      return <TextBlock heading={section.heading} body={section.body} />
    case 'image-block':
      return <ImageBlock heading={section.heading} body={section.body} />
    case 'profile-row':
    case 'testimonial':
    case 'faq':
    case 'contact-form':
      return (
        <GenericSection
          type={section.type}
          heading={section.heading}
          body={section.body}
        />
      )
    default:
      return null
  }
}

export default App
