---
title: "Sample Project 04"
slug: "sample-project-04"
date: 2026-05-31
draft: false

summary: "A placeholder project showing the content shape. Replace with a real case study to validate the layout end-to-end."
lede: "A throwaway example so the build has something to render until real projects move in."

category: "tooling"
tags: ["Hugo", "Documentation"]

role: "Author"
stack: "Markdown, Hugo shortcodes"
period: "2026 — Present"
status: "Placeholder"

related_prev: ""
related_next: ""
---

## What this is

This is a sample project bundle. It exists so the build pipeline has something
to render and so you can see exactly how the content shape lays out before
authoring the real thing.

Replace the front matter, swap in real prose, drop media files alongside this
`index.md`, and reference them with shortcodes.

## How media works

Drop image and MP4 files into this same directory, then reference them inline:

<!-- Example shortcode usage (commented out — uncomment when real media exists):

{{</* figure src="diagram.png" caption="The architecture sketch" */>}}

{{</* video-mp4 src="loop.mp4" caption="Short looping demo" wide="true" */>}}

{{</* video-youtube id="dQw4w9WgXcQ" caption="Full walkthrough" */>}}

-->

The position of the shortcode in the markdown is the position the media
appears on the page. Width control is `wide="true"` (full article-column)
or default (narrower).

## Card cover

If you drop a file named `cover.jpg`, `cover.png`, or `cover.mp4` into this
bundle, it auto-fills the card thumbnail on the home page and the cover
slot on this detail page. No front matter required.
