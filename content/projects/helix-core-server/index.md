---
title: "Helix Core Server"
slug: "helix-core-server"
date: 2025-04-17
draft: false
weight: 2

summary: "Deployed and administered a Helix Core (Perforce) server for a 60-person studio, replacing a legacy VCS with proper branching, Virtual Asset hosting, and cross-server sync with an external AAA client."
lede: "Built the deployment and configuration backbone for a 60-person game studio from scratch."

category: "infrastructure"
tags: ["Perforce", "Version Control", "Server Administration"]

role: "Technical Owner"
stack: "Helix Core Server, P4V, P4 Python API, Elastic Search, Docker"
period: "2025 — Present"
status: "Maintaining"
---

## The problem

The studio's existing version control was NXN AlienBrain, a system nearly 20 years old that was never designed for the kind of projects we were running. Most of the studio's work was in Unreal Engine, where a single project could reach 200GB including all source files from DCCs (Maya, 3ds Max) and their outputs. AlienBrain couldn't handle depots at that scale, had limited storage tied to the aging 2005-era Windows Server, and only version-controlled a narrow set of specific files. The rest lived wherever artists decided to put it, usually local drives or the NAS, with no proper versioning.
 
On top of that, Virtual Assets (VA) were a constant problem. Each project generated around 400GB of VA data that Unreal references on launch. This package sat on the NAS, and every time it needed updating, there was no way to diff, so the update process would throttle network bandwidth for the entire studio.

The biggest pain point was the client workflow. Our primary client at the time, a AAA studio, used Perforce for all their projects. Every time they pushed a build update (new binaries, updated Unreal version), we had to copy the entire 200GB project to the NAS, distribute it to each artist's machine, and have them extract it. The deployment system I had built with Ansible could automate the file copy overnight, but without proper file diffing, every update was a full overwrite that wiped whatever the artist had in progress. Artists would save their work locally or dump files onto the NAS as a safety net, which just made the bandwidth problem worse. There was zero trust in the version control system, because it had never actually worked well enough to earn it.

## Setting up the server

Perforce was the obvious choice. I had used it at Sparx/Virtuos on AAA titles, and for handling large binary assets in game production, nothing else comes close. But this was my first time setting up and administering a **Helix Core** server from scratch. It was effectively my introduction to running a proper service: configuring networking, opening firewall ports on the Domain Controller, setting up the server process, and deploying **P4V** (the client application) to every workstation with the correct registry configurations.
 
Beyond the initial setup, the administration side was where the real depth came in. I configured depot storage locations, set up automated **journal backups**, managed the licensing lifecycle, and built out a full **permission table** with department-based groups so that artists, leads, and producers each had appropriate access levels. This is the kind of system administration work that most technical artists never get exposure to, but it was critical for making the server trustworthy and maintainable long-term.

{{< figure src="p4_admin.jpg" caption="P4 Admin for Studio's p4 account configuration" >}}

## Cross-server sync and branching

With our own P4 server running, the client update workflow improved dramatically. I set up a dedicated machine specifically for syncing from the client's Perforce server (accessed through their VPN), and then reconciling those files against our own server. Instead of copying 200GB wholesale, the sync machine pulls only the changed files from the client, and I reconcile and submit the diffs to our **main** branch.
 
From there, I maintain a **main** and **dev** branch structure. Artists always work on **dev**. When the client pushes an update, I merge from main into dev, so the update cycle is fast and non-destructive. Nobody loses work in progress, and the diff-based sync means we're only pushing actual changes, not full project overwrites. Perforce handles the heavy lifting natively, but the branch strategy and reconciliation workflow is what made it practical for production.
 
Virtual Assets also moved onto the P4 server, which eliminated the NAS bottleneck entirely. Updates now go through proper file diffing and spec lists, and artists get direct integration with Unreal Engine since Perforce is natively supported. The whole update cycle went from "download 400GB and wait" to incremental syncs that take minutes.

## Tooling and adoption

I built a workspace creation tool using the **P4 Python API** that automates the setup for each artist. Streams and workspace configurations are genuinely confusing for non-technical users, and asking 60 artists to set those up manually would have killed adoption. With the tool, they select their project, the workspace gets created with the correct stream mapping, and they're working within minutes.
 
The less visible work was migration and training. Moving everyone off AlienBrain meant retraining workflows, writing documentation, and building trust in a system that the team had every reason to be skeptical of, given how poorly the previous one had served them. Six months in, the server has accumulated over 20k changelists across all projects. Artists are actually versioning their files properly now, which was non-existent before.

## A detour worth mentioning
 
During the setup process, I explored two additional tools from the P4 ecosystem: **P4 Search** (built on Elastic Search with vector search capabilities) and **P4 DAM**, a web-based asset management frontend for Perforce. Getting these running was my first real introduction to **Docker**, because P4 DAM depends on a render service that processes every FBX on the server through a default lighting setup to generate thumbnails for web-based asset review.
 
It was functional, and it cost me a significant amount of time to configure. The idea was that leads could review assets directly in a browser instead of opening P4V. Ultimately we shelved it because the default lighting wasn't sufficient for proper asset review (textures and materials were missing from the renders), and the tooling was too niche to justify migrating everyone to yet another interface. But it was a valuable learning experience that directly led me toward the Frappe framework later, when the need for proper HRMS and project management tools came up.