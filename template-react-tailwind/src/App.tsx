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
        <div className="space-y-8">
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
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            className="text-lg font-semibold tracking-tight"
            onClick={() => onNavigate('/')}
          >
            {siteName}
          </button>
          {navLinks && navLinks.length > 0 && (
            <nav className="flex gap-4 text-sm">
              {navLinks.map((link) => {
                const path = slugToPath(link.slug)
                const isActive = path === currentPath
                return (
                  <button
                    key={link.slug}
                    type="button"
                    onClick={() => handleClick(link.slug)}
                    className={
                      'px-2 py-1 rounded-md transition-colors ' +
                      (isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-200 hover:bg-slate-800')
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
        <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
      </main>

      {footer && (
        <footer className="border-t border-slate-800 bg-slate-900/70 text-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-slate-400">{footer.text}</div>
            {footer.links && footer.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {footer.links.map((link) => (
                  <button
                    key={link.slug}
                    type="button"
                    onClick={() => handleClick(link.slug)}
                    className="text-slate-300 hover:text-white"
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
    <section className="text-center space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {heading}
      </h1>
      <p className="text-slate-300 max-w-2xl mx-auto">{body}</p>
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
    <section className="space-y-2">
      {heading && (
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      )}
      {body && <p className="text-slate-300 whitespace-pre-line">{body}</p>}
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
    <section className="space-y-2 border border-dashed border-slate-800 rounded-lg p-4">
      {heading && (
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      )}
      {body && <p className="text-slate-300">{body}</p>}
      <div className="h-40 rounded-md bg-slate-900/60 flex items-center justify-center text-slate-500 text-sm">
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
    <section className="space-y-2 border border-slate-800 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {type}
      </div>
      {heading && (
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      )}
      {body && <p className="text-slate-300 whitespace-pre-line">{body}</p>}
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
