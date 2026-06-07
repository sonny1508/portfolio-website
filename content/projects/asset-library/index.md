---
title: "Offline Asset Library"
slug: "asset-library"
date: 2025-06-15
draft: false
weight: 11

summary: "A pair of offline asset browsers letting artists on air-gapped machines use the studio's Megascans and Substance libraries. Going from a slow file-crawling tool to a precomputed database, learning threading and caching along the way."
lede: "Turning two terabytes of locked-up assets into something an offline artist can actually browse."

category: "tooling"
tags: ["Python", "PySide6", "SQLite", "Substance Painter"]

role: "Sole designer and developer"
stack: "Python, PySide6, SQLite, Substance 3D Painter Python API, Ansible and PDQ deployment"
period: "2025"
status: "Active"
---

This was one of the first systems I built at the studio, before the Helix Core server, when there was almost no shared infrastructure in place. Artists work fully offline for security, with no internet on their workstations. That constraint broke the two asset libraries the studio most wanted to use: a near-complete **Quixel Megascans** collection, and a large set of Adobe **Substance** materials. Both sat on the network drive, and both were effectively unusable.

<!-- VISUAL 1: the Megascans browser in use, full thumbnail grid with the filter tree on the left -->

## The problem

Megascans was free at the time and the collection was valuable, but the Quixel client expects an internet connection. On an offline machine it would run for a while and then freeze, so it was not something I could put in front of an artist. The Substance side failed differently. We owned the licenses and had downloaded a large library of **.sbsar** files, the parametric material format Painter uses, but there was no offline client to browse and import them, so in practice only leads ever touched those assets.

The scale ruled out manual browsing: around 10,000 Megascans assets at close to 2 TB, and around 14,000 .sbsar files at roughly 700 GB. Nobody navigates that through a file explorer. What was needed was a desktop browser like Quixel's Bridge, with a thumbnail grid, tag and category filters, and a fast path from finding an asset to getting it into a scene.

## Two browsers, built in sequence

I built the Megascans browser first, in Python with **PySide6**. Each asset ships a JSON file describing its tags, section, category, and previews, which became the metadata backbone. The browser shows a filterable thumbnail grid, and a double-click opens the asset's folder so the artist imports manually, which is fine for large mesh-and-texture assets.

The Substance library came second and reused everything I learned from the first. Because it runs inside Painter, it could go further than opening a folder: clicking an asset calls the **Substance 3D Painter Python API** to drop the .sbsar straight into the current session's shelf. In hindsight a single tool managing both libraries would have been cleaner, and that is on the rework list.

<!-- VISUAL 2: the Substance material library tool docked inside Painter, with a material being clicked into the shelf -->
{{< video-mp4 src="substance_material_manager.mp4" caption="Material Manager (library tool) inside Substance Painter" wide="true" >}}

## The road to a cache

The first versions were slow. The naive approach crawled the network drive and loaded every thumbnail on each browse, reading something like 14,000 files every time the view changed. This is where I first hit the cost of doing heavy disk and network work on the UI thread, and where I started reading seriously into threading.

My first fix was a thumbnail cache held in memory, populated at launch. That did not solve it, it just moved the cost to startup. So I studied how Quixel Bridge stays responsive, how it buffers thumbnails and how little it re-reads, and landed on the insight that mattered: our library is effectively static. Only leads can write to the library folder on the **NAS** (network-attached storage), and we already hold nearly the whole collection, so the asset set almost never changes.

If the data barely changes, there is no reason to recompute it on every launch. I split the system in two: an admin-only builder that crawls the drive once, parses every asset's JSON, and writes a precomputed **SQLite** database, and a read-only browser the artists run. The database flattens folder paths, display names, resolved preview paths, sections, and categories into queryable columns, so at runtime the browser never walks the directory tree or touches the original JSON.

## How it works now

The browser reads the database instead of the file system. A worker thread issues the SQL so the interface never freezes, building its filter clause dynamically from the active section, category, and search. Pagination is hybrid: SQL narrows the set, the result list lives in memory, and the grid renders a slice at a time, 40 to start and 20 more on each scroll. Thumbnails load lazily, each cell reading its image only once it becomes visible, on a background thread.

The database is around 50 MB. My first deployment put it on the shared drive for every workstation to read over the network, which tanked bandwidth. So I flipped it: the builder produces the database centrally, and the deployment system pushes a local copy to each machine, so there is no network round-trip on launch.

## Where it stands

The tool is far faster than the first iterations and reliable enough that artists use it daily, but it is not yet as fast as Bridge, and I know why. The grid does not recycle widgets as you scroll, the in-memory thumbnail cache is not shared across the grid as well as it should be, and search is a substring scan rather than a full-text index. None of these are mysteries, they are the next round of work. I built this early, learned a great deal about caching and threading in the process, and then priorities pulled me toward the heavier platform systems. It does the job it was built for, and I will come back to make it fast.