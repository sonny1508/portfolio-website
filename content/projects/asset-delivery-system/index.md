---
title: "Asset Delivery System"
slug: "asset-delivery-system"
date: 2025-09-15
draft: false
weight: 3

summary: "Clients limit us to 2-3 P4 machines per project, which made delivery a manual, lead-driven bottleneck. I built an internal P4 mirror and a pair of Python tools that move reviewed assets from artist workspaces to client depots in one changelist number, with p4 reconcile handling the rest."
lede: "A P4-to-P4 transfer pipeline that turns multi-hour manual deliveries into a two-step changelist hop."

category: "tooling"
tags: ["Perforce", "Python", "Pipeline"]

role: "Technical Owner"
stack: "Python, P4 Python API, PyInstaller, Perforce"
period: "2025"
status: "Completed"
---

## The problem

Every client we work with imposes their own folder structure and naming conventions, and these vary even between projects from the same client. For Unreal Engine projects this is brutal: 10+ levels of nested folders, separate locations for **.uasset** files, content sources like **.fbx**, and **DCC** (Digital Content Creation) source files like **.ma** or **.blend**. Managing all of that by hand is doable, but it's error-prone at the volume we work at.
 
The deeper structural problem is that clients do not want outsourcers writing directly into their **Perforce** servers. Their depots already carry hundreds of millions of changelists, and letting a vendor's QA mistakes or 50+ revisions of the same asset land in their history is a risk they will not take. So they cap us at 2-3 P4 client machines per project, each one a controlled gateway to their server.
 
That cap shaped our entire delivery workflow, badly. Artists with no **VCS** (Version Control System) discipline would zip up their work and hand it to art leads. Leads would review, then manually drop approved **.uasset** files into the right folders on a P4 client machine, check out everything that looked related, submit, and hope they caught all the dependencies. For a single building or vehicle that is often 10+ components and 20+ shared materials. The submissions did not cause client-side errors because leads verified the Unreal project on the P4 machine before submitting, but the changelists were enormous, the manual copying ate hours, and proper diffing was effectively impossible.

## Solution

I rebuilt the delivery workflow around three things: an internal mirror, a behavior change, and two custom tools.
 
The mirror is a 1:1 internal **Perforce** server that replicates each client's stream layout, depot structure, and naming conventions exactly. Artists now work against this mirror, which forces them to put **.uasset**, content, and source files in the correct locations from the start. On top of that, leads enforced a rule that each reviewable asset, including all of its components and shared dependencies, gets packed into a single changelist. That discipline is what makes everything downstream possible.
 
The first tool is **Asset Delivery**, which runs on the lead's workstation. It reads the lead's current P4 workspace, lets them pick a **CL** (Changelist) number, validates it through the **P4 Python API**, and replicates every file in that changelist to a hub directory on one of our internal servers. It writes a small meta file alongside the payload recording the CL number and the included files.
 
{{< figure src="asset_retrieval.png" caption="Asset Retrieval Tool" >}}
 
The second tool is **Asset Retrieval**, which runs on the P4 client machines. The lead walks over to one of those machines, opens the tool, enters the CL number, and the tool looks up the matching payload on the server hub, reads the meta file, extracts only the files belonging to that CL, and copies them into the correct positions in the local workspace mirroring the client's structure. It then runs **p4 reconcile** underneath to handle checkouts and adds automatically. The lead reviews the resulting changelist in P4V and submits.
 
The whole round trip is one CL number on the lead's machine, walk over, one CL number on the client machine, submit. Five to six months in, the leads describe it as a different job.

## Supporting Automation

The delivery tools are the centerpiece, but they rely on a layer of Python automation around them. I wrote utilities to bulk-sync the correct streams across every workspace whenever we get a large Unreal project update from a client, so nobody is working against stale content. There is also a workspace-creation tool that programmatically provisions client-project workspaces for every artist in the studio. P4 workspaces require an exact user-plus-host binding to function, and the tool pulls that mapping directly from **PDQ Deploy**, which maintains an authoritative table of every workstation and its current operator.
 
<!-- Visual 3: Either the workspace-creation tool's output table, or the virtual drive showing up in File Explorer with a P4 workspace mounted on it. The goal is to show how the studio-wide systems plug into each other. -->
 
Finally, the Domain Controller enforces a **GPO** (Group Policy Object) that maps a virtual drive on every workstation, the equivalent of **subst M: D:\Perforce**, so every P4 workspace resolves to the same path on every machine. That sounds trivial, but it eliminates a whole class of workspace-path issues and cleanly separates P4-managed files from everything else on the artist's drive.

## Outcome

Delivery is now fast, repeatable, and almost impossible to fumble. Leads spend their time reviewing art instead of shuffling files, artists are pushed into the structural discipline the rest of the pipeline depends on, and client-facing changelists arrive clean and scoped to one asset at a time. The system has been running daily for over five months across multiple client projects, and it has become one of those tools nobody at the studio thinks about anymore, which is the best outcome a pipeline tool can have.