# Manifest Theme Schema

This document describes the **theme** section of the site manifest used by the React + Vite + Tailwind renderer in this repository.

Backends (e.g. Laravel + Gemini) should generate this structure under `manifest.theme`. The renderer will then normalize it and apply the resulting design tokens across the layout and all sections.

---

## TypeScript Types

```ts
export type ManifestNavLink = { label: string; slug: string }

export type ManifestFooter = {
  text?: string
  links?: ManifestNavLink[]
}

export type ManifestSection = {
  type: string
  heading?: string
  body?: string
  // You may extend this per-project, e.g. image URLs, avatars, etc.
}

export type ManifestPage = {
  slug: string
  title: string
  sections: ManifestSection[]
}

export type ManifestTheme = {
  /** Primary brand color, used for key UI elements. */
  primaryColor?: string // Hex or CSS color, e.g. "#6366F1"

  /** Optional secondary accent color. */
  secondaryColor?: string // Hex or CSS color

  /** Background for the whole page. */
  backgroundColor?: string // Hex or CSS color

  /** Background for cards/sections/header/footer. */
  surfaceColor?: string // Hex or CSS color

  /** Accent color for chips, dots, active nav, etc. */
  accentColor?: string // Hex or CSS color

  /** Font stack for the whole site. */
  fontFamily?: string // e.g. 'Inter, system-ui, -apple-system, sans-serif'

  /** Global border radius scale. */
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill'

  /** Vertical spacing density for sections and cards. */
  density?: 'cozy' | 'comfortable' | 'compact'

  /** Optional per-section overrides (keyed by section.type). */
  sectionStyles?: Record<string, unknown>
}

export type ManifestResponse = {
  id: number
  business_name: string
  page_title: string
  meta_description: string
  cta: string | null
  manifest: {
    nav?: { links?: ManifestNavLink[] }
    footer?: ManifestFooter
    pages: ManifestPage[]
    /** Optional design + theme information. */
    theme?: ManifestTheme
  }
}
```

All fields in `ManifestTheme` are **optional**. The renderer supplies sensible defaults when fields are missing.

---

## Normalization in the Frontend

The React app uses `createTheme` from `src/theme.ts` to normalize any partial `ManifestTheme` into a `NormalizedTheme`:

```ts
const theme = createTheme(manifest.theme)
```

Normalization provides:

- A complete color palette (`background`, `surface`, `primary`, `secondary`, `accent`, `text`, `muted`, `border`).
- A consistent border radius scale for sections and pill-shaped elements.
- A density value that controls padding/spacing of cards.
- A font family applied to the whole layout.

The renderer then uses helpers:

- `getSectionClasses(type, theme)` – base Tailwind classes for card/section shells.
- `getButtonClasses(theme, options)` – Tailwind classes for navigation / CTA buttons.
- `getTypographyClasses(variant)` – size + weight for headings, body text, and labels.

Colors, radii, and spacing are applied with a mix of Tailwind utility classes and minimal inline styles (for the dynamic colors).

---

## Example `manifest.theme` JSON

Here is a complete example suitable for Gemini to generate:

```json
{
  "primaryColor": "#6366F1",
  "secondaryColor": "#0EA5E9",
  "backgroundColor": "#020617",
  "surfaceColor": "#020617",
  "accentColor": "#6366F1",
  "fontFamily": "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', sans-serif",
  "borderRadius": "lg",
  "density": "comfortable",
  "sectionStyles": {
    "hero": {
      "emphasis": "high"
    },
    "testimonial": {
      "tone": "soft",
      "layout": "stacked"
    }
  }
}
```

### Value Guidelines

- **Colors**
  - Use valid CSS color strings, preferably hex in `#RRGGBB` form.
  - Choose high-contrast combinations (background vs. text) for readability.
  - `primaryColor` and `accentColor` should usually be the same or closely related.

- **Font**
  - Use a full CSS font-family string, with safe fallbacks.
  - Example: `"Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"`.

- **Border radius**
  - One of: `"sm" | "md" | "lg" | "xl" | "2xl" | "pill"`.
  - Larger values produce softer, more pill-like cards and buttons.

- **Density**
  - `"cozy"` – extra spacious, more white space.
  - `"comfortable"` – balanced default (recommended).
  - `"compact"` – tighter padding and spacing.

---

## How the Manifest-Driven Renderer Works

At a high level:

1. The app fetches `VITE_MANIFEST_URL`, expecting a `ManifestResponse` JSON.
2. It sets `document.title` and the meta description from `page_title` and `meta_description`.
3. It builds navigation, footer, and a simple internal router from `manifest.nav` + `manifest.pages`.
4. It passes `manifest.theme` into `createTheme` to produce a normalized `theme` object.
5. A `Layout` shell renders a slim sticky header, centered main content, and a minimal footer, all styled using the normalized theme.
6. For the current page, a `SectionRenderer` iterates over `sections` and maps each `section.type` to a React component (Hero, TextBlock, ImageBlock, GenericSection, etc.), passing the theme into each.

The result is that **different sites can share the exact same React codebase**, but look and feel different solely based on their manifest content and theme.

---

## Guidance for Gemini (Theme Generation)

When generating a manifest for a new site, Gemini should:

1. Produce the usual content structure under `manifest.pages` (sections, headings, bodies, etc.).
2. Additionally, generate a `manifest.theme` object that:
   - Uses a single strong accent / primary color that matches the brand.
   - Picks a font stack appropriate to the business (but defaulting to a modern sans-serif).
   - Chooses a density that matches the tone (e.g. `"cozy"` for premium, spacious SaaS; `"compact"` for dashboards).
3. Ensure all colors are valid CSS values and that the JSON matches the `ManifestTheme` schema above.

The frontend will automatically apply this theme to all pages and sections without any further changes.
