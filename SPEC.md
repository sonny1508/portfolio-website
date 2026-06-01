# Sonny Nguyen — Portfolio Site Specification

This document describes the design and build requirements for a personal portfolio site for **Sonny Nguyen**, a game developer, infrastructure engineer, and tools programmer. The site is text-first and editorial in feel — a deliberate move away from showreel-style portfolios toward something that reads as a working professional's home on the web.

Tech stack, build tooling, hosting, and content workflow decisions are out of scope for this document and will be settled separately. **This spec describes the design and behavior only.**

---

## Reference Mockups

Two HTML files in this folder are the visual source of truth:

- `portfolio-mockup.html` — single-page main site (Profile → Projects → Experience → Skills → Contact)
- `project-detail.html` — individual project article page

Use these for exact CSS values and component appearance. The spec below describes the intent behind them. Where the spec and the mockups disagree, the spec wins (mockups have known issues, see end of document).

---

## Purpose & Audience

The site exists to present Sonny as a strong candidate for DevOps / Tools Programmer / Infrastructure roles. The immediate target is Project Borealis's DevOps position. Visitors are likely to be:

- Hiring managers at game studios or infrastructure teams
- Other developers evaluating Sonny for collaboration
- Recruiters scanning for keywords and proof points

The site needs to communicate: *this person has shipped real systems, can write about them clearly, and would be a low-risk hire.* Visual flair is restrained intentionally — the editorial design IS the differentiation.

---

## Design Tokens

All design decisions reduce to a small set of tokens defined in `:root`. Every component uses these — **no raw values in component CSS**.

### Colors

```css
--color-cream: #fff9e8;    /* primary light background */
--color-purple: #241040;   /* primary dark / text on cream */
--color-line-on-cream: rgba(36, 16, 64, 0.14);
--color-line-on-purple: rgba(255, 249, 232, 0.18);
--color-tint-on-cream: rgba(36, 16, 64, 0.04);
```

Two-color system, no accent colors. Sections alternate between **cream mode** (cream bg, purple text) and **purple mode** (purple bg, cream text). This rhythm is structural to the design — it provides visual breaks between content blocks without needing horizontal rules or background patterns.

### Typography

**Production fonts** (commercial — license required):
- Display / titles: **Degular Black Italic** (OHno Type)
- Body / UI: **Mrs Eaves XL Serif Narrow OT** (Emigre)

**Mockup fonts** (free, similar in spirit — use during development until commercial licenses are sorted):
- Display / titles: Bricolage Grotesque (Google Fonts, weights 400/600/800, italic)
- Body / UI: EB Garamond (Google Fonts, weights 400/500/600, italic variants)

Swap to commercial fonts once licensing is settled. Self-host them — don't load commercial fonts from third-party CDNs.

### Type Scale (modular, ~1.25 ratio)

```css
--text-xs:    0.75rem    /* 12px — labels, meta */
--text-sm:    0.875rem   /* 14px — small body, nav links */
--text-base:  1.0625rem  /* 17px — default body */
--text-lg:    1.25rem    /* 20px — emphasis body */
--text-xl:    1.5rem     /* 24px — card titles, h3 */
--text-2xl:   2rem       /* 32px — section subheads */
--text-3xl:   2.75rem    /* 44px — hero secondary */
--text-4xl:   4rem       /* 64px — section titles */
--text-stat:  4.5rem     /* 72px — stat numbers */
--text-5xl:   5.5rem     /* 88px — hero name, project title */
```

Large display sizes (`--text-4xl` and `--text-5xl`) should be wrapped in `clamp()` for fluid scaling on smaller viewports.

### Spacing (8px-based)

```css
--space-1: 0.25rem  through  --space-32: 8rem
```

### Layout Constraints

```css
--container-max: 1200px      /* outer wrapper */
--container-pad: 2rem        /* horizontal gutter */
--article-column: 880px      /* article content column on detail pages */
--nav-height: 4.5rem         /* fixed nav reservation */
```

`--article-column` is critical for the project detail page. The cover image, hero metadata, body prose, article tags, and footer navigation all share this max-width and **must be horizontally centered** within the outer container. They share the same left and right edges so the article reads as one coherent vertical column.

### Motion

```css
--ease: cubic-bezier(0.22, 1, 0.36, 1)
--dur-fast: 200ms
--dur: 400ms
```

All transitions use these. No bouncy easing, no over-long durations — the site should feel responsive, not animated.

---

## Background System

The site has a distinctive ambient background that ties to Sonny's brand identity. Two layers:

### Orbs

**Three** large soft circles drift slowly across a fixed-position canvas (`.bg-canvas`, `position: fixed`, `z-index: 1`, `pointer-events: none`).

Each circle is an **orb-group** containing two stacked variants (`.orb--light` and `.orb--dark`):

- The pair lives at the exact same position
- `.orb--light` uses `mix-blend-mode: lighten` — visible only when over purple sections
- `.orb--dark` uses `mix-blend-mode: darken` — visible only when over cream sections
- As the user scrolls past a section boundary, **the shape stays in place** but its color flips. This is the key visual behavior — same circles, color-inverting per section background.

Each individual orb:
- Pure radial gradient in brand color (no SVG-as-background hacks, no overlay blends — those cause desaturation)
- `filter: blur(36px)` for soft naturally-diffused edges
- No mask needed; the blur + gradient fade does the work

**Orb positions:** all three pivots must sit **on or beyond the viewport edges**. The visible portion is just the bloom drifting in from off-screen. None of the orbs should have their center inside the visible content area.

Approximate placements (adjust during build to taste):
- Top-left, peeking in from the corner (negative `top` and `left`)
- Right edge, mid-page (`left: ~80%+` so pivot sits past the right edge)
- Bottom-left, peeking in from below (negative `left`)

Sizes: roughly **730–870px**. Animations: **28–33s** loops with asymmetric keyframe paths (`float-a` through `float-d`) so movement feels organic and non-synchronized.

**Performance requirements:**
- `transform: translate3d` for GPU acceleration
- `will-change: transform` hint
- `visibilitychange` listener pauses all orb animations (`animation-play-state: paused`) when the tab is backgrounded
- `@media (prefers-reduced-motion: reduce)` disables animation entirely

### Grain

Fixed-position SVG noise overlay (`position: fixed`, `inset: 0`, `mix-blend-mode: overlay`, opacity ~0.95). Gives the page a textured, printed quality — echoes the noise gradient in Sonny's logo.

The SVG uses `feTurbulence` with `baseFrequency='1.5'`, `numOctaves='2'`, and a contrast-boosting `feColorMatrix` to sharpen the grain particles.

Z-index sits above orbs but **below the nav** (so the nav stays clean).

---

## Main Page Sections

The main page is a single vertical scroll. Sections in order: **Profile → Projects → Experience → Skills → Contact**. Color rhythm: cream → cream → purple → cream → purple.

### Nav

Fixed top, full width, height `--nav-height`. **Solid color, no transparency, no backdrop blur.**

**Contrast model** (this is important):
- Default (over cream sections): purple background, cream text
- `.is-on-purple` (over purple sections): cream background, purple text

An `IntersectionObserver` watches each section with `rootMargin: '-50% 0px -50% 0px'` and toggles `.is-on-purple` based on the intersecting section's `data-mode` attribute. The same observer drives the active link underline.

**Initial state on page load** must be the **dark** (purple) version, because the Profile section is cream.

Contents:
- Left: logo image (square, 44px, links to `#profile`)
- Right: five nav links (Profile / Projects / Experience / Skills / Contact). Uppercase, letter-spaced 0.12em, font size `--text-sm`.

Mobile (<720px): the section links are hidden entirely — only the logo (home) and the Resume button remain. No hamburger/toggle menu (the site is short enough that the in-page links aren't needed on small screens).

### Profile (Hero)

Cream section. Full viewport height (`min-height: 100vh`).

Two-column grid: ~320px photo column + flexible content column. Collapses to single column at <820px.

**Photo:** 3:4 vertical placeholder for a black-and-white portrait. Subtle drop shadow. No frame, no border.

**Content column:**
- Name — very large italic display (`--text-5xl`, clamped)
- Role one-liner — italic serif, `--text-xl`
- 3 paragraphs of bio (~250 words total) covering: who Sonny is, the journey from technical art into infrastructure, and what kind of work he's looking for
- **Stats strip below:** 4-column grid of tiles
  - 3+ Years of Experience
  - 5+ Games Shipped or Building
  - 4+ Services Hosted & Managed
  - 50+ Production Tools Built

  Each tile: large italic display number (`--text-stat`) with a small "+" superscript at 0.55em vertical-align 0.4em, followed by a small letter-spaced uppercase label. Tiles have a subtle tint background, thin border, and a hover lift.

  Mobile: stats reflow to 2×2.

### Projects

Cream section.

Structure:
- Section label ("01 — Selected Work") with leading horizontal rule glyph
- Section title — large italic display
- Tab bar — rounded-pill buttons. Default state: thin border, no fill. Active: solid purple bg, cream text. Tabs: `All` / `Infrastructure` / `Pipeline & Tooling` / `Game Dev` / `Technical Art`
- **Project grid** — 2-column responsive grid, **max 4 cards visible per page**
- **Pagination** — Prev/Next buttons positioned absolutely at the left/right edges of the grid. Solid purple circles with cream chevron icons. **Hidden entirely (opacity 0, scale 0.85, no pointer events) when no further page exists**, not just disabled.
- Page indicator below grid (e.g., "Page 1 of 2", or "N projects" when single page)

**Card structure** (each card is an `<a class="card" href="/projects/[slug]/">`):
- 16:9 thumbnail (placeholder or `cover_image`)
- Italic display title (`--text-2xl`)
- 2-3 sentence body (`--text-base`)
- Tag pills

Filter behavior: tabs filter by `data-tags` attribute (space-separated tag list). "All" shows everything. Switching tabs resets pagination to page 1.

### Experience

**Purple section** — first color flip.

Dual-column layout: **Professional** (left) and **Education** (right). Stacks vertically on mobile.

Each column:
- Small uppercase letter-spaced column title (`--text-xs`, 0.24em letter-spacing)
- List of items separated by thin horizontal rules

Each item:
- Italic display title (role / degree)
- Italic meta line: dates + organization/location, separated by `·`
- Body paragraph (2-3 sentences)

### Skills

Cream section.

Dual-column layout:

**Left column — Arsenal:** Large chunky pills in purple with cream text — italic display type at `--text-xl`. These represent role identities, not specific tools. Suggested:
- Infrastructure
- DevOps
- Tools Programmer
- Game Developer
- Technical Art
- System Admin

**Right column — Technical:** Grouped detailed skills. Each group has a small italic display header (`--text-lg`, weight 600) and a row of small tag pills (the same `.tag` style used on project cards).

Suggested groups (extensible — these are the launch set):
- **Infrastructure & Systems** — Linux, nginx, k3s, Ansible, Active Directory, PDQ Deploy, Frappe, Helix/Perforce
- **CI/CD & Automation** — GitHub Actions, Bash, PowerShell, PyInstaller, Electron Builder
- **Languages** — Python, C++, C#, JavaScript, TypeScript, SQL
- **Game Engines & DCC** — Unreal Engine, Unity, Maya, 3dsmax, Blender
- **Web** — HTML/CSS, JS/TS, [chosen SSG], Node
- **Currently Learning** — AWS Fundamentals, Terraform, Docker/Compose

### Contact

**Purple section** — closing color flip.

Center-aligned, vertical layout:
- Section label ("04 — Get in Touch")
- Large statement (`--text-4xl`, clamped): "Let's build cool things together."
- Email as italic underlined link, large
- Row of three social circles (GitHub, LinkedIn, itch.io) — inline SVG icons in bordered circles. On hover: invert to cream fill with purple icon.

**No traditional footer** with logo/contact details. The Contact section IS the footer. It closes with a single small credit line (`© <year> <name> · Built with Hugo`), centered and low-opacity — the year and name are rendered dynamically.

The Contact section is also rendered at the bottom of each **project detail page**, so visitors can reach out without navigating back.

---

## Project Detail Page

Each project gets its own page at `/projects/[slug]/`.

### Layout

All content blocks are horizontally centered within the outer container. The hero metadata, cover image, article tags, and footer nav row use the **main-page container width (`--container-max`, 1200px)** so the detail page reads 1:1 with the home page. The long-form **prose column narrows to `--article-column` (880px)** for comfortable line length, centered on the same axis as the wider blocks.

### Hero

- "Back to projects" link — small uppercase with leading `←`, anchors to `/#projects`
- Section meta line: category + "Case Study", small uppercase, leading horizontal rule glyph
- Giant italic title (project name, `--text-5xl` clamped)
- Italic serif lede paragraph — the hook, 1-2 sentences, max 60ch
- **Facts strip** — flex row with thin top border. Each fact is a label + value pair:
  - **Role** — what Sonny did on the project
  - **Stack** — technologies used (comma-separated brief)
  - **Period** — date range, e.g., "2024 — Present"
  - **Status** — e.g., "In production", "Shipped", "Active development"

### Cover Media

16:9 image or video at the top of the article body. Same width as article column. Soft drop shadow.

### Prose Body

Long-form article — typically 500-1500 words. Standard markdown elements styled:

- `h2` (italic display, `--text-2xl`, generous top margin)
- `h3` (italic display, `--text-xl`)
- Paragraphs (`--text-lg`, line-height 1.7)
- Inline links — thin underline, opacity fade on hover. **No bright color** — keep link color = body color, distinguish via underline only
- Blockquotes — left purple border, italic, `--text-xl`
- `code` inline (cream tint background, monospace, small)
- `<pre><code>` blocks (purple bg, cream text, monospace, `--text-sm`)
- Lists — `.bulleted` (disc) and `<ol>` (decimal)
- **Figures with images and captions** — column-width by default. `.is-wide` modifier expands to article column width (within the article column, which itself is centered)
- **Video embed** — 16:9 wrapper with `<iframe>` slot. Accepts YouTube unlisted/private embeds. Captions allowed.

### Article Tags

Below prose, separated by top border. Tag pill style, listing technologies and topics. Same width as prose (and article column).

### Project Footer Nav

Links to the previous and next project, derived automatically from the global project order (`weight` ascending — see Content Schema). The order **wraps around**: the first project's "previous" is the last, and the last project's "next" is the first. No per-project linking. Two-column grid (stacks on mobile).

Each cell:
- Small label — "← Previous Project" / "Next Project →" (uppercase, letter-spaced, low opacity)
- Italic display title of the linked project

Prev cell left-aligned; next cell right-aligned. Whole cell is a link with hover opacity fade.

---

## Interactive Behavior

All JavaScript should be **vanilla**. No frameworks required.

### Nav color toggle

`IntersectionObserver` per section watching when each crosses the viewport midline (`rootMargin: '-50% 0px -50% 0px'`, `threshold: 0`). Toggle `.is-on-purple` on the nav based on intersecting section's `data-mode` attribute. Same observer updates the active link state (underline + opacity).

### Project filtering + pagination

- Tabs filter cards by `data-tags` (space-separated tag list; "all" shows everything)
- Paginate at 4 cards per page
- Switching tabs resets to page 1
- Prev/Next buttons hide entirely (not just disable) when at the start/end of pagination

### Mobile nav

No toggle/menu. Below 720px the section links are hidden via CSS; the logo and Resume button stay. Nav links are absolute (`home/#section`) so they route correctly from project detail pages — except sections that also exist on the current page (Contact), which scroll locally.

### Scroll reveal

Each section fades in + translates up slightly when first entering the viewport. `IntersectionObserver` with `threshold: 0.05`. The observer unobserves each element after first reveal to avoid replaying on re-scroll.

### Animation pause on tab hide

`visibilitychange` event sets `animation-play-state` to `paused` on all orbs when the tab is backgrounded, reducing CPU when not visible. Resumes when tab is foregrounded.

---

## Responsive Breakpoints

Two breakpoints:

- **820px** — main layout transition. Two-column grids (hero, experience, skills) collapse to single column. Hero photo caps to smaller size.
- **720px** — mobile. Nav section links are hidden (logo + Resume only). Project grid goes single-column. Pagination buttons move inline below the grid (no longer absolutely positioned on the sides).

All sizes between scale fluidly via `clamp()` on display type.

---

## Content Schema

When choosing a content/data model during the build, each entity needs (at minimum) the following fields. Exact format (Markdown front matter, JSON, etc.) is a tech-stack decision.

### Project

```yaml
title: string
slug: string                    # url segment
date: YYYY-MM-DD                # for sorting only, never displayed
weight: int                     # global display order (asc); drives grid + footer prev/next
category: enum                  # infra | tooling | game | art
tags: string[]                  # free-form, displayed on card and article
summary: string                 # 2-3 sentence card body
cover_image: string?            # path; omit for placeholder
role: string                    # facts strip
stack: string                   # facts strip
period: string                  # facts strip, e.g. "2024 — Present"
status: string                  # facts strip, e.g. "In production"
body: markdown                  # the article body
```

### Experience entry

```yaml
type: enum                      # professional | education
title: string                   # role or degree
organization: string
location: string
start: YYYY-MM
end: YYYY-MM | "Present"
description: string             # 2-3 sentence body
```

### Skill group

```yaml
name: string                    # e.g. "Infrastructure & Systems"
tags: string[]
```

### Arsenal tag

```yaml
label: string                   # e.g. "Infrastructure"
```

### Profile / site config

```yaml
name: "Sonny Nguyen"
role_line: "Game developer, infrastructure engineer, tools programmer."
intro: markdown                 # 3 paragraphs
stats:
  - { value: "3",  suffix: "+", label: "Years of Experience" }
  - { value: "5",  suffix: "+", label: "Games Shipped or Building" }
  - { value: "4",  suffix: "+", label: "Services Hosted & Managed" }
  - { value: "50", suffix: "+", label: "Production Tools Built" }
contact:
  email: string
  github: url
  linkedin: url
  itch: url
logo: path                      # the sun logo
photo: path                     # B&W portrait for hero
```

---

## Known Issues to Fix in Production Build

1. ~~**Project Detail article column is left-aligned, should be centered.**~~ *Resolved.* The article blocks are now centered via `margin-inline: auto` on `.article-column` (see Project Detail § Layout for the current width model).

2. **One of the three orbs has its pivot too close to the page center.** The middle-right orb needs to be pushed further toward the right edge so its center sits past the viewport boundary. **All three orb pivots must sit on or beyond the viewport edges** — only the soft outer bloom should be visible inside the content area.

---

## Visual Identity — Things to Avoid

The design is deliberately editorial. Resist the urge to add:

- Color accents beyond cream + purple
- Gradient text or rainbow effects
- Neon glows, drop shadows on text
- Animated cursors, scroll-progress bars, or other "developer portfolio" tropes
- Bouncy easing on animation
- Fast or aggressive motion

The grain texture and floating orbs reference Sonny's logo (sun + handwritten signature on a noise gradient). These are not decorative — they ARE the brand language. Two colors + grain + italic display type is the entire visual vocabulary.

The site should feel **printed**, not **rendered**.

---

## Open Items (deferred to tech-stack discussion)

These need decisions during build but are not design choices:

- SSG / framework choice
- Content authoring workflow (frontmatter conventions, image organization)
- Image optimization pipeline
- Commercial font licensing and self-hosting setup
- Hosting and deploy pipeline
- Analytics
- SEO meta tags and Open Graph cards
- Sitemap and robots.txt
- Build/deploy automation
