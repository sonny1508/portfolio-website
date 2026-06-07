---
title: "DCC Tooling Suite"
slug: "dcc-tooling"
date: 2026-06-05
draft: false
weight: 8

summary: "~70 tools across Maya (50+), Blender (10-15), and 3ds Max (8-10). Highlights: GS File Transfer for cross-DCC handoffs, a scene-wide topology validator, and a Maya auto-rigger that turns vehicle rigging into a one-button operation."
lede: "Cross-DCC tooling across Maya, Blender, and 3ds Max, plus the file-shuttle and auto-rig that feed the studio's vehicle pipeline."

category: "tooling"
tags: ["Maya", "Blender", "3ds Max", "Python"]

role: "Sole developer and maintainer"
stack: "Maya/Blender/3dsMax Python API, Mel, maxscript (MCR), PySide2/PyQT, GPO and Ansible deployment"
period: "2025 — 2026"
status: "Active"
---

The DCC tooling suite is the upstream half of the pipeline GSTools sits inside. Artists model, UV, and texture in Maya, Blender, or 3ds Max before anything reaches Unreal, so the suite covers the same 40 to 50 artists across the same 4 to 5 concurrent projects. Maya carries the most weight with **50+ tools** spanning UV operations, normals, mesh ops, and validation checkers. Blender sits at **10 to 15 tools**. 3ds Max has **8 to 10**, mostly validation. The split reflects where the studio actually works, not what I felt like building.

<!-- VISUAL 1: The Maya shelf with the studio toolset visible, ideally with the GSTools tab expanded so the tool count is legible. Bonus if a Blender screenshot can sit alongside to show the cross-DCC story visually. -->

## GS File Transfer

The cross-DCC shuttle is the most-used tool that artists don't think about. Three versions, one each for Maya, Blender, and 3ds Max, all reading the same data table on a NAS share. PDQ scans every workstation daily and writes the active username back into the table, so when an artist opens the transfer tool they see a live list of every other artist in the studio. Export drops the FBX onto a server location with a naming convention like `user.A_softwareA.to.softwareB_user.B`. The recipient's tool scans for files matching their own slot and pulls the right one in. About 10 to 20 artists use it daily, moving roughly 30 FBXs through it on an average day, all logged to a folder I monitor on the NAS for usage stats.

I chose server-mediated over peer-to-peer for two reasons: auditability (every transfer is visible from one place) and the fact that heavier files like full Maya scenes should travel through Perforce changelists anyway, not through a tool meant for component handoffs. The current setup is two buttons, sender and receiver, and it has held up well in production.

<!-- VISUAL 2: GS File Transfer UI in Maya, showing the live artist list and the send/receive flow. The Blender and 3ds Max variants alongside if space permits, to show the three versions sharing the same data layer. -->

{{< figure src="gs_file_transfer.png" caption="GS File Transfer in Maya - Blender - 3ds Max" >}}

## The topology validator

Of the Maya tools, the one artists run most is the topology checker inside the scene-wide validation tool. It covers Hard Edges, Lamina, Ngons, Non-Manifold Edges, Open Edges, Poles, Starlike, Triangles, Zero Area Faces, and Zero Length Edges. The first three (ngons, lamina, non-manifold) cover roughly 60% of the actual issues that show up in real models. The rest catch edge cases that only fail when a specific shader, exporter, or engine ingest pipeline trips over them.

The wider validation tool wraps topology with checks on materials, UV layouts, UV set names, naming conventions, and pivot positions. It runs twice per asset by convention: once by the artist before sending the file to a lead, and again by the lead during QA. That contract is what the tool really enforces. The lead never has to think about naming convention or UV set numbers and can spend their review time on art.

## The auto-rigger

The deepest single Maya tool in the suite, written for the same vehicle pipeline the Unreal Asset Organizer feeds. Vehicles are hardsurface, not characters, so the rigging problem is more tractable than it sounds: bones map to named components, and where two bones share influence over a single component the **volume value** defined per bone resolves the split. The artist places a premade skeleton onto the mesh, presses one button, and the tool walks the bone list, finds each component by name, applies skinning with the correct constraint and volume, and writes the rig. Most artists never touch weight painting again. The occasional cleanup pass handles the edge cases. For artists who genuinely don't enjoy rigging (which is most of the ones doing vehicle work), the bottleneck moved from "do you know how to rig" to "have you placed the bones correctly", which is a much shorter learning curve.

<!-- VISUAL 3: Before / after on a vehicle, ideally showing the premade skeleton placed on the mesh on the left, and the auto-rigged result with weight painting visible on the right. The vehicle context ties this card visually to the Unreal Asset Organizer card. -->

## The cross-pipeline chain

The full vehicle path, end to end, looks like this: model and UV in Maya, auto-rig in Maya, export through the project-specific FBX tool, GSTools imports and validates in Unreal, lead runs Asset Organizer to place everything in the right folders and relink materials, Asset Delivery pushes the result to the client. Each of those steps is its own tool. The chain works because every tool assumes the conventions the previous tool enforced. That assumption is the difference between a pipeline and a toolbox.

## The Python 2 / 3 problem

When I joined, projects were split between Maya 2018 (Python 2) and Maya 2022 (Python 3), and every shared tool had to work in both. I held that line for as long as I could with careful `from __future__` imports and a hard rule against Python 3-only syntax in shared code. After the outage that forced a deployment restructure, I migrated the whole studio to Maya 2022 and above, dropped Python 2 entirely, and let the code breathe.

3ds Max was the most painful of the three to bring under a plugin loader. Getting a toolbar to register automatically at launch took an embarrassing amount of trial-and-error against an API that does not reward exploration. Blender was a different category of pain: the entry point is a startup script that has to enable the studio's project scripts on launch, and the paths have to be conditional on Blender version because the studio runs **3.6, 4.2, and 4.5 LTS** side by side.

## The deployment lesson

When I started, the tools were referenced from a central NAS path. Every DCC pointed at it on launch. This is a pattern small and mid-sized studios fall into because it looks like the obvious answer when you have no deployment system. It is the wrong answer. A NAS hiccup during a backup, or one real power event, and every Maya and 3ds Max instance in the studio freezes simultaneously because the DCC cannot resolve its tool path. We hit that scenario, and I restructured the entire tooling pipeline immediately after to deploy locally onto each workstation through GPO and Ansible, with NAS reserved for the data layer (the GS File Transfer table, the rule files, the asset library content) but never for executable code.

The version of this lesson I would tell a junior technical artist: a centralized tool reference looks cheap because it does not require deployment, but you are paying for it in correlated failure. The first hour the NAS coughs, the whole studio coughs with it. Local on disk with automated deployment is the only setup that survives contact with production.

## Listening to artists

GS File Transfer in particular was shaped almost entirely by artist feedback. The first version was a plain FBX export-import roundtrip. Then a Maya artist needed to hand a vehicle component over to a 3ds Max artist and the normals broke on arrival, which led me to add a smoothing-group conversion toggle on export. Then artists working between Maya and Blender wanted to send a vehicle as separate components rather than one merged mesh, so I added a multi-FBX export mode and a matching multi-object import on the Blender side. Every option in the tool today is there because someone showed me a specific case where the previous version cost them an hour they did not have. That feedback loop is what separates a tools developer from a tools owner.