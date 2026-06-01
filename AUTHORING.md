# Authoring Guide

How to add content and tweak the site without touching templates. Covers
the conventions chosen during scaffolding — keep this updated as we add
features.

---

## Repo map (what lives where)

```
content/_index.md         Home page bio prose (3 paragraphs)
content/projects/<slug>/  One folder per project (page bundle)
data/site.yaml            Name, role, stats, socials, nav links, section labels
data/background.yaml      Orb sizes/positions/durations, grain settings
data/experience.yaml      Professional + education entries
data/skills.yaml          Arsenal + technical skill groups
assets/fonts/             Source OTF font files (mounted to /fonts/)
assets/css/               Tokens + components
assets/js/                Vanilla JS modules
static/img/               Site-wide images (portrait, logo, favicons, OG)
layouts/                  Templates (rarely edited as a content author)
```

---

## Adding a project

### 1. Scaffold the bundle

```powershell
hugo new --kind projects projects/my-new-thing/index.md
```

This creates `content/projects/my-new-thing/index.md` with the full front
matter template (from `archetypes/projects.md`). Set `draft: false` when
ready to publish.

**Ordering:** the `weight` field (ascending) is the single source of truth
for project order. It controls the position in the home-page grid *and* the
Previous/Next links on each detail page — which are generated automatically
and **wrap around** (the first project's "previous" is the last, and vice
versa). No manual prev/next linking. The order stays consistent across tab
filters: switching categories only hides cards, it never reorders them. New
projects scaffold with `weight: 99` — give each a distinct weight to slot it
where you want.

### 2. Drop media in the same folder

The bundle is a single directory that contains the markdown **plus all
media for that project**. Anything you reference with a shortcode must
live next to `index.md`.

```
content/projects/my-new-thing/
  index.md
  cover.jpg          ← auto-becomes the card thumbnail + page cover
  diagram-01.png
  ui-shot.png
  loop-demo.mp4
```

### 3. Cover convention

Drop a file named `cover.jpg`, `cover.png`, or `cover.mp4` and it
auto-fills:

- The 16:9 card thumbnail on the Projects grid (cropped via `.Fill`)
- The cover slot at the top of the project detail page (width-scaled)

**Important sizing notes:**

- **Image covers**: any aspect ratio works for source — Hugo auto-crops to
  16:9 for the card. Ship a high-res original (≥1920×1080) so the cover on
  the detail page also looks sharp.
- **MP4 covers**: Hugo does **not** crop video. Author your MP4 cover at
  16:9 dimensions directly (e.g., 1920×1080). The card will autoplay it
  muted on loop.

### 4. Write the body

Standard markdown. Headings, paragraphs, lists, blockquotes, code blocks
all styled per spec. Drop media inline with shortcodes (next section).

---

## Media shortcodes

Three shortcodes handle all in-body media. The shortcode's position in
the markdown is its vertical position on the page — that's how you
control layout.

### `figure` — image with optional caption

```
{{</* figure src="diagram.png" caption="Topology overview" */>}}
{{</* figure src="ui-shot.png" caption="Editor UI" wide="true" */>}}
{{</* figure src="thing.png" alt="Custom alt text" */>}}
```

| Param   | Default | Notes                                                |
|---------|---------|------------------------------------------------------|
| `src`   | —       | Required. Filename inside the bundle.                |
| `caption` | —     | Optional. Renders below as italic figcaption.        |
| `wide`  | `false` | `"true"` = full article-column width (880px).        |
| `alt`   | caption | Optional. Falls back to caption text for a11y.       |

### `video-mp4` — short looping clip

```
{{</* video-mp4 src="loop.mp4" caption="Cache hit demo" */>}}
{{</* video-mp4 src="walkthrough.mp4" controls="true" poster="poster.jpg" */>}}
```

| Param      | Default | Notes                                              |
|------------|---------|----------------------------------------------------|
| `src`      | —       | Required. Filename inside the bundle.              |
| `caption`  | —       | Optional.                                          |
| `wide`     | `false` | `"true"` = full article-column width.              |
| `controls` | `false` | `"true"` = show controls + disable autoplay/loop.  |
| `poster`   | —       | Optional poster image filename for `controls` mode.|

**When to use:** short ambient/loop clips under ~30 seconds. Autoplay-muted-loop
by default acts like an animated figure. For anything longer, use YouTube.

### `video-youtube` — embed unlisted/private YouTube

```
{{</* video-youtube id="dQw4w9WgXcQ" caption="20-min architecture review" */>}}
{{</* video-youtube id="abc123" start="42" wide="true" */>}}
```

| Param     | Default | Notes                                                       |
|-----------|---------|-------------------------------------------------------------|
| `id`      | —       | Required. The bit after `?v=` in the YouTube URL.           |
| `caption` | —       | Optional.                                                   |
| `wide`    | `false` | `"true"` = full article-column width.                       |
| `start`   | —       | Optional. Seconds to seek to on play.                       |

Embeds via `youtube-nocookie.com` so no third-party cookies. Works
identically with unlisted videos.

**When to use:** anything longer than ~30s, anything you want a controls
bar on, anything you don't want hosted as part of the site bundle.

---

## Editing the home page

### Bio prose
`content/_index.md` — write 3 markdown paragraphs in the body. The front
matter `title` and `description` are used for SEO/OG, not displayed.

### Name, role line, stats, socials, nav
`data/site.yaml` — structured fields. Edit values directly.

### Experience entries
`data/experience.yaml` — two lists: `professional` and `education`. Each
entry has `title`, `organization`, `location`, `start`, `end`, `description`.
Order in the file = display order.

### Skills
`data/skills.yaml` — `arsenal` is a flat list of role identities (chunky
pills). `technical` is grouped skills with a `name` + `tags` array.

---

## Tweaking the background (orbs + grain)

`data/background.yaml` controls every orb's size, position, blur radius,
animation duration, **and gradient intensity**. Each orb maps to a
`<div class="orb-group">` that the templates render with CSS custom
properties from these values.

**Intensity** (the `intensity:` block at the top of the file) controls
how visible the orbs are:

- `light_center` / `dark_center` — alpha at the very center of the bloom
  (bump these to make orbs more prominent)
- `light_mid` / `dark_mid` — alpha at the bend in the gradient
- `mid_stop` — % of orb radius where the bend sits (smaller = tighter bloom)
- `outer_stop` — % of radius where the orb fully fades (smaller = sharper edge)

Want a particular orb stronger or softer than the others? Add an
`intensity:` block under that specific orb with any subset of the same
keys — those values override the globals for that orb only.

Rule from the spec: every orb's pivot (the `top`/`left` you set) must
sit **on or beyond the viewport edge**. Use negative percentages
(e.g. `-15%`) or values past 100% (`88%` for right edge) to keep the
pivot outside the visible area — only the soft bloom should drift inside.

The grain section controls noise opacity and turbulence parameters.

---

## Brand assets — logo, portrait, resume

All three are configured in `data/site.yaml`. The nav and hero templates
check if the file exists and either render it or fall back to a
placeholder block — so the layout never breaks while files are missing.

### Logo (`data/site.yaml` → `logo`)

**SVG (preferred)**: gets `readFile`-inlined into the nav, so it picks
up `currentColor` and flips between cream/purple when the nav contrast
flips. Set `fill="currentColor"` (or no fill) inside the SVG.

**PNG / JPG**: renders as a 44×44 `<img>` with `object-fit: contain`. It
will NOT color-flip with the nav — the same image is shown over both
backgrounds. If your logo's contrast works on both cream and purple
(e.g. a colored mark), that's fine. Otherwise use an SVG.

**EPS → SVG conversion** (free, vector-preserving):
- Install [Inkscape](https://inkscape.org), open the EPS, *File → Save As → Plain SVG*.
- Or use an online converter (CloudConvert, Convertio) — upload EPS, download SVG.
- If you only have raster sources, you can trace to SVG in Inkscape
  (*Path → Trace Bitmap*) but the result is approximate.

Drop the file at `static/img/logo.svg` (or whatever path you set in
`site.yaml`).

### Portrait (`data/site.yaml` → `photo`)

A 3:4 image at the path you set (default `static/img/portrait.jpg`).
Recommended ≥800×1067 for sharpness on retina. Renders a 3:4 placeholder
if the file is missing.

### Resume (`data/site.yaml` → `resume`)

Optional. Drop a PDF at `static/resume.pdf` (or your configured path)
and the **Resume** button appears in the nav, rightmost position, with
a `download` attribute so browsers trigger a save dialog. If the file
isn't there, the button hides entirely — no broken link.

I'd recommend direct PDF over a Google Drive link: no third-party
tracking, no extra click, no "request access" risk. Hiring managers
expect a direct download.

---

## Icons

Inline SVG icon set lives in `layouts/partials/icons.html`. Use:

```
{{ partial "icons.html" (dict "name" "github") }}
{{ partial "icons.html" (dict "name" "linkedin" "size" 22) }}
```

Available names: `github`, `linkedin`, `itch`, `download`.

To add an icon: open `icons.html`, copy an existing `else if` branch,
paste the new SVG markup, and add the name to the list above. Icons
use `currentColor` so they always match the surrounding text.

---

## Fonts

Source OTFs live in `assets/fonts/{Degular,Mrs Eaves XL}/`. The `[module]`
mount in `hugo.toml` serves them at `/fonts/...`. `assets/css/fonts.css`
declares `@font-face` for the variants we ship:

- Degular: Bold, Bold Italic, Black, Black Italic
- Mrs Eaves XL Serif Narrow OT: Reg, RegItalic, Bold, BoldItalic

**Later optimization** (not urgent): convert OTFs to WOFF2 for ~80% size
savings. When ready, install [`fonttools`](https://github.com/fonttools/fonttools)
(`pip install fonttools brotli`) and run `fonttools ttLib.woff2 compress
<file.otf>` on each. Then update the `src: url(...)` paths in
`fonts.css` from `.otf` to `.woff2` and the `format(...)` hint from
`"opentype"` to `"woff2"`.

---

## Adding a new CSS component

CSS files are concatenated in load order by `layouts/partials/head-css.html`
(plain `@import` doesn't get inlined by Hugo's resource pipeline, so the
list is explicit). When you add a file under `assets/css/components/`:

1. Drop the file in.
2. Add its path to the `$files` slice in `head-css.html` in the right
   load-order slot (tokens → fonts → base → shared → components → page sections).

JS modules are different — `assets/js/main.js` uses ES `import` statements,
and Hugo's `js.Build` (esbuild) bundles them. No template edit needed when
adding a JS module — just import it from `main.js`.

---

## Building locally

```powershell
hugo server                # dev server with live reload at http://localhost:1313
hugo                       # production build into /public/
hugo new --kind projects projects/foo/index.md   # new project bundle
```

---

## Deploy

GitHub Pages via Actions (`.github/workflows/deploy.yml`). Push to `main`
triggers build + deploy. First-time setup: in the GitHub repo settings →
Pages, set Source to "GitHub Actions".

---

## Open conventions to lock in later

- **OG image per project**: defaults to `cover.*`; override via `og_image`
  front matter if needed.
- **Image dimensions**: portrait (3:4, ≥800×1067), card cover (16:9, ≥1920×1080),
  body figures (any aspect, ≥1280 wide for sharpness).
- **MP4 encoding**: H.264 baseline, AAC audio (or no audio for silent loops),
  ≤5MB target for inline body clips, ≤2MB for card covers.
