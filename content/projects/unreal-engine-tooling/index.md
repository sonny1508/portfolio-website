---
title: "Unreal Engine Tooling"
slug: "unreal-engine-tooling"
date: 2026-05-31
draft: false
weight: 7

summary: "Two in-editor toolbars covering ~45 tools that 40 to 50 artists rely on daily across every active Unreal project. Config-driven validation, batch asset preparation, and a vehicle pipeline that collapsed half-day audits into 30 minutes."
lede: "Studio-wide Unreal tooling shipped through Perforce, used daily by 40+ artists across every active project."

category: "tooling"
tags: ["Unreal Engine", "Python"]

role: "Sole developer and maintainer"
stack: "Unreal Engine Python API, Editor Utility Widgets, Blueprint, PySide6"
period: "2025 — 2026"
status: "Active"
---

## Context

Every project at the studio ships with the same two toolbars docked into the Unreal Editor: **GSTools** for daily validation and **GSAutomation** for the heavy batch operations art leads run before delivery. Around 45 tools sit between them, distributed through our **Helix Core** depot so artists get the latest versions the moment they sync a project. No installers, no manual updates, no version drift across workstations.
 
The first thing I did when I joined was rip out the old panel. It was four buttons firing four ad-hoc scripts, hardcoded to a single project, with no shared styling and no UX consistency. I rebuilt it with a shared **PySide6** CSS sheet across every tool window, proper menu structures behind each button, and a clear split between general tools and lead-only automation. Later tools migrated further into Blueprint when content-browser integration mattered more than scripting speed.
 
<!-- VISUAL 1: Screenshot of the two toolbars (GSTools and GSAutomation) docked in the Unreal Editor, showing the button layouts and menu structure. The "before" state would be a powerful contrast if I can recover it. -->
 
## The validation layer 

GSTools is what artists actually touch every day. **Texture Checker**, **Mesh Checker**, and a **LOD slider** sit at the core, processing roughly 500 to 1000 texture validations per week studio-wide during active production. The interesting part is the rule engine behind them, not any single check. A central Python module reads the active Unreal project, looks up a matching JSON rule file in the rules directory, and applies the right validation set. Texture Checker dispatches on the asset suffix to pick a ruleset:
 
```python
ENVIRONMENT_TEXTURE_RULES = {
    "BC": {"compression_settings": "TC_DEFAULT",   "srgb": True,  "size": (2048, 2048)},
    "N":  {"compression_settings": "TC_NORMALMAP", "srgb": False, "size": (2048, 2048)},

    # Additiona suffix rules as per different project
}
```
 
Mesh Checker covers LOD count, UV channel count, and simple collision presence. Every check has a paired fixer, so artists can validate, review the diff, and apply corrections without leaving the editor.

{{< figure src="texture_checker.png" caption="Texture Checker Tool in Action" >}}
 
## The automation layer

GSAutomation is denser and reserved for art leads. The flagship is **Asset Organizer**, built for a vehicle project where each bike breaks into 40 to 50 individual assets (static meshes, skeletal meshes, skeletons, physics assets, materials, textures) that all need to land in a deeply nested per-vehicle folder structure with the right cross-references between shared and local materials. Over 50 vehicles have been processed through it, each representing two to three weeks of artist work, so the validation step matters more than the tool's own complexity.
 
Asset Organizer moves freshly imported FBXs into the correct component directories, relinks meshes to the right material instances, and rebuilds source-file paths after migration. The mapping is data-driven through dictionaries like **COMPONENT_CATEGORIES** and **CUSTOMIZATION_DATA_MAPPING** that define every component category, its expected meshes, and the slot-to-material relationships. Before the tool, configuration was half a day of careful clicking per vehicle and leads routinely stayed late at end-of-week deliveries. With it, the same work runs in about 30 minutes per vehicle and is consistent enough that errors became rare after a few iteration passes.
 
Most of the build effort went into discovering Unreal's Python API by reading docs and source comments. Materials on a Skeletal Mesh and a Static Mesh look identical to an artist but live on completely different editor properties (`materials` vs `static_materials`) and require different `unreal.Array` types when reassigned. I wrote two parallel functions, `_assign_skel_mesh_materials` and `_assign_static_mesh_materials`, that present the same interface to the rest of the tool but handle the divergence underneath. Early versions had subtle bugs that only surfaced under lead spot-checks: material lookup matching **glass** before **glassdecal** because of substring order, slot-name casing mismatches, paths that resolved in one project but broke in another. Each pass tightened the edges, including a longest-keyword-first matching pass that closed the substring class of bugs.
 
<!-- VISUAL 3: Asset Organizer in action, ideally a side-by-side of the unsorted import folder and the resulting per-vehicle folder structure with the relinking log panel visible. -->

{{< figure src="asset_organizer.png" caption="Asset Organizer Tool doing batch material assignment for multiple Mesh Component" >}}
 
## The Blueprint shift

Python iterates fast but cannot give artists a content-browser-aware UI. One tool scans a level for static mesh actors matching a name pattern and lets the user drag a replacement mesh from the content browser into a slot to swap it in. There is no clean way to do that from a PySide6 window, so I rebuilt it in Blueprint, used proper component slots inside an Editor Utility Widget, and the result is faster, visually accurate, and matches the rest of the editor's interaction model. The LOD slider followed the same path when Unreal 5.7 changed the Python API and broke the original script. Rewriting it in Blueprint made it instant to invoke and removed an entire class of upgrade-fragility.

{{< video-mp4 src="unreal_lod_checker.mp4" caption="Unreal Engine LOD Checker tool revamped with blueprint in Editor Utility Widget" wide="true" >}}

The client we work with ships a forked engine binary with custom mesh component classes and no C++ source. Most of GSAutomation works by iterating over those custom component types through Blueprint reflection and the Python API, so the tools are aware of project-specific component structures without needing engine source.
 
What this toolset really represents is six months of compounding decisions: every project hits production with a known-good validation surface, every lead has the same automation primitives, and every artist gets the latest version of all of it just by syncing.