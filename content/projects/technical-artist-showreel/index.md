---
title: "Technical Art Showreel"
slug: "techart-showreel"
date: 2026-01-15
draft: false
weight: 9

summary: "A 90-second reel of lighting, rendering, and shader work across Unreal Engine and Houdini. Focuses on the ocean material system and foliage pipeline, with remaining procedural work grouped into a shorter inventory."
lede: "Two years of visual work from the era directly before the pivot into infrastructure and tools."

category: "techart"
tags: ["Unreal Engine", "Houdini", "Shaders", "Lighting", "VFX"]

role: "Sole artist and shader author"
stack: "Unreal Engine 5.5 material graph and HLSL, Houdini HDAs, Houdini Engine, PCG, Nuke"
period: "2023 to 2025"
status: "Completed"
---

This reel covers roughly two years of visual work between 2023 and 2025, when my focus was lighting, rendering, and shader authoring across Unreal Engine and Houdini. It is the era directly before the pivot into infrastructure and tools, kept here for range and as a reference point on the visual side of the craft. The video runs about ninety seconds. The writing below goes deep on the two pieces that warrant it and stays brief on the rest.

<!-- VISUAL 1: the reel itself, embedded as the page hero directly under the lede -->
{{< video-youtube id="0DKR2ImHCW8" caption="Technical Artist showreel" >}}

## Ocean shader system

The ocean was built entirely inside Unreal Engine 5.5's material graph, using a mix of custom HLSL expressions and native material nodes, and deliberately avoiding the built-in Water Plugin in favor of full control over the layered shading model. The architecture is organized around a central base attribute **Material Function** that consolidates the core shading parameters (light scattering, reflection, refraction) into one driving layer, keeping the master material clean and the parameter space well defined.

From that foundation, a suite of modular functions handles contextual behavior. **Fake Scattering** and **Fake Absorption** approximate volumetric light interaction without true volumetrics, at a fraction of the cost. Dedicated **Foam**, **Caustic**, **Shore Interaction**, and **Edge Blur** functions handle surface-level detail and world boundary reads. **Object Interaction** and **Debris** are their own modules, so floating or submerged assets influence and are influenced by the water surface in a consistent, art-directable way.

Wave motion is split between a standard **Gerstner** wave function and a **Distance Field Wave** variant for larger-scale surface reads. Both drive **World Position Offset** to displace mesh geometry at runtime and produce physically convincing surface undulation. Alongside the WPO displacement, dedicated UV distortion functions simulate the refractive warping and flow of the water surface, so detail normals, caustic projections, and foam textures all move coherently with the underlying wave motion rather than sliding independently across each other.

The whole system is parameter-driven, with a clear separation between global ocean mood (storm versus calm, tropical versus arctic) and local per-instance overrides. Artists art-direct a specific region of the world without touching the underlying material function logic.

<!-- VISUAL 2: material function graph for the ocean base attribute layer, or the master material with the modular function nodes wired in -->
{{< figure src="ocean_topology.png" caption="Ocean's animated topology through WPO and procedural UV's coordinate looping" >}}

## Foliage optimization

The foliage pipeline holds to two principles: keep material complexity as low as the eye allows, and author LOD chains deliberately rather than relying on auto-reduction.

On the material side, each foliage shader is stripped down to only what is perceptually necessary at a given distance. Expensive operations like multi-layer normal blending, detailed subsurface scattering, and high-frequency detail textures are either baked into the base textures or progressively removed across LOD transitions via separate material instances per LOD slot, rather than branching inside one monolithic material. The GPU never evaluates logic that camera distance makes invisible. Wind motion uses a lightweight WPO implementation with simple sine-based math, keeping instruction count low across hundreds of thousands of instances.

On the mesh side, LODs are hand-authored. Unreal's automatic reduction produces poor silhouettes on organic shapes like leaves and branches, so each LOD gets a purpose-built density and silhouette target, with the mid and far LODs leaning into flat intersecting planes to fake volume cheaply. **Nanite** is deliberately avoided here, since per-instance overdraw and opacity masking cost on thin leaf geometry outperforms traditional LOD pipelines at this scale.

The result is a foliage budget that comfortably holds 60 fps under dense coverage, with the heaviest scenes sitting well within draw call and triangle budgets.

<!-- VISUAL 3: side-by-side LOD comparison on a hero plant asset, or an in-engine wide shot of the dense foliage scene with the stat overlay visible -->
{{< figure src="foliage_ground_setup.png" caption="Foliage and Ground blending - closeup shot" >}}

## Procedural environment work

The rest of the reel is procedural environment work from my VFX-leaning years: a Houdini building generator authored as an **HDA** and bridged into Unreal via **Houdini Engine** for in-editor parameter editing, **PCG** tree scatter setups for forest population, and a stack of large-scale environment lighting and rendering tests. Underneath all of it sits a longer history with **Nuke**, where I did the same procedural-thinking work in 2D when the project did not warrant a round trip back into 3D. Looking back, the through line is the same instinct that drives the pipeline work I do now: build the system once, parameterize it well, hand it to the people who need it.