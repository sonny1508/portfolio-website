# Sonny Nguyen — Portfolio

An editorial, text-first portfolio site. Built with [Hugo](https://gohugo.io)
(extended), deployed to GitHub Pages via Actions.

The design lives in [`SPEC.md`](SPEC.md). Content authoring conventions
live in [`AUTHORING.md`](AUTHORING.md). This file is for **building and
deploying** the site.

---

## Stack

| Concern         | Choice                                                          |
| --------------- | --------------------------------------------------------------- |
| SSG             | Hugo extended ≥ 0.162 (uses image processing + `js.Build`)      |
| Templating      | Hugo's Go templates                                             |
| Content model   | Page bundles under `content/projects/<slug>/`                   |
| Data            | YAML files under `data/` (site, background, experience, skills) |
| Styling         | Plain CSS, design tokens via custom properties, no framework    |
| JS              | Vanilla ES modules, bundled with `js.Build` (esbuild)           |
| Hosting         | GitHub Pages (Actions deploy)                                   |
| Analytics       | None (intentional)                                              |

---

## Repo map

```
SPEC.md                   Design spec (visual + behavioral)
AUTHORING.md              Content authoring guide
README.md                 This file
hugo.toml                 Hugo config
.github/workflows/        CI: build + deploy to Pages
archetypes/               Front-matter templates for new content
assets/
  css/                    Design tokens, base, per-component CSS
  fonts/                  Commercial OTF sources (gitignored — see Fonts §)
  js/                     ES module bundle
content/
  _index.md               Home page bio prose
  projects/<slug>/        One folder per project (index.md + media)
data/
  site.yaml               Name, role, stats, socials, nav, paths
  background.yaml         Orb sizes/positions/intensity, grain knobs
  experience.yaml         Professional + education entries
  skills.yaml             Arsenal pills + technical skill groups
layouts/
  _default/, partials/, shortcodes/, projects/
static/
  img/                    Portrait, logo, OG images
  resume.pdf              Optional CV (button hides if missing)
```

---

## Local dev

```powershell
hugo server                              # http://localhost:1313, live reload
hugo                                     # production build → ./public
hugo new --kind projects projects/foo/index.md   # scaffold a new project
```

Hugo extended is required (we use image processing + `js.Build`). Verify with:

```powershell
hugo version
# expect: hugo v0.x.x+extended ...
```

---

## Deploy

### First-time GitHub setup

1. **Create the repo on GitHub.** Public is required for free GitHub Pages.
   ```powershell
   gh repo create <repo-name> --public --source=. --remote=origin --push
   ```
   Or via the web UI, then add the remote and push manually (see below).

2. **Enable GitHub Pages.** In the repo on GitHub:
   *Settings → Pages → Source:* **GitHub Actions** *(not Deploy from a branch).*

3. **Push to main.** The `Deploy` workflow in `.github/workflows/deploy.yml`
   runs automatically on every push to `main`. First successful run takes
   ~1–2 minutes; Pages URL appears in the run's "deploy" job summary
   (and Settings → Pages).

### Notes

- The workflow sets `--baseURL` from GitHub Pages' configured URL at
  build time. You don't need to edit `baseURL` in `hugo.toml` for the
  deploy to work — that value is only used by `hugo server` locally.
- The workflow pins `HUGO_VERSION` (top of `deploy.yml`). Bump it when
  you upgrade Hugo locally.
- Concurrency is configured so only one deploy runs at a time; new
  pushes queue rather than racing.

### Custom domain (optional)

1. Add a `static/CNAME` file containing your domain (e.g. `sonnynguyen.dev`).
   Hugo copies it verbatim into `public/CNAME`, which Pages reads.
2. Configure DNS:
   - For an apex domain: A records → `185.199.108.153`, `.109.153`,
     `.110.153`, `.111.153`
   - For a subdomain (e.g. `www.`): CNAME → `<your-user>.github.io`
3. Re-run the deploy. Pages picks up the CNAME and adjusts.

---

## Fonts

The display + body fonts are commercial:

- **Degular** (OHno Type) — display / titles
- **Mrs Eaves XL Serif Narrow OT** (Emigre) — body / UI

The OTF source files are **gitignored** (`assets/fonts/Degular/` and
`assets/fonts/Mrs Eaves XL/`) because public GitHub repos would
redistribute them in violation of typical foundry licenses.

**Local dev** uses the OTFs (already on this machine).
**Deployed site** falls back to the next family in `--font-display` /
`--font-body` (Georgia + system-ui — readable, not branded).

When you want the real fonts on the deployed site, options:

- Make the repo private + upgrade to GitHub Pro (Pages from private
  repos requires Pro/Team/Enterprise).
- Host the OTFs in a private location (private repo, S3, etc.) and add
  a CI step that downloads them before `hugo build` using a repo secret.
- Convert to WOFF2 and self-host elsewhere (still needs to be a private
  source unless your license allows public hosting).

---

## What's intentionally NOT in this site

- No analytics (Google Analytics, Plausible, etc.). Add later only if
  needed — defaults to no cookies, no banner.
- No tag/category index pages (Hugo's `disableKinds` in `hugo.toml`).
- No RSS feed (single-page main site doesn't need one).
- No service worker / PWA shell.

If you change your mind on any of the above, the seams are clean —
see `hugo.toml` and the `layouts/` directory.

---

## Content workflow

See [`AUTHORING.md`](AUTHORING.md) for the full guide. The short version:

- **Edit prose**: `content/_index.md` (home bio).
- **Add a project**: `hugo new --kind projects projects/<slug>/index.md`,
  drop media files into the same folder, reference with shortcodes.
- **Tweak data**: `data/site.yaml`, `data/experience.yaml`,
  `data/skills.yaml`, `data/background.yaml`. Live-reloads with
  `hugo server`.

---

## License

Site code: MIT (use as a reference for your own portfolio if useful).
Content (prose, photos, project case studies): all rights reserved.
Commercial fonts: per their respective foundry licenses, not included.
