---
title: "{{ replace .File.ContentBaseName `-` ` ` | title }}"
slug: "{{ .File.ContentBaseName }}"
date: {{ .Date }}
draft: true
weight: 99                  # global display order (asc) — grid + prev/next follow this

# Card body — 2-3 sentences
summary: ""

# Hero lede — 1-2 sentence hook, max ~60 characters per line ideal
lede: ""

# Filtering + display
category: ""                # infra | tooling | game | art
tags: []                    # free-form, shown on card and article

# Facts strip
role:   ""
stack:  ""
period: ""                  # e.g. "2024 — Present"
status: ""                  # e.g. "In production"

# Footer prev/next is automatic — it follows the global `weight` order and
# wraps around (first ↔ last). No per-project linking needed.

# Optional: override default OG image (defaults to cover.*)
og_image: ""
---

{{/* Body lives below. Use shortcodes to drop media inline:

  {{</* figure src="diagram-01.png" caption="Initial topology" */>}}
  {{</* figure src="screenshot.png" caption="UI shot" wide="true" */>}}
  {{</* video-mp4 src="loop.mp4" caption="Cache demo" wide="true" */>}}
  {{</* video-youtube id="dQw4w9WgXcQ" caption="Walkthrough" */>}}

See AUTHORING.md for full convention. */}}
