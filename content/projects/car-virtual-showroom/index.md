---
title: "Car Virtual Showroom"
slug: "car-virtual-showroom"
date: 2026-06-06
draft: false
weight: 7

summary: "A real-time car configurator built in Unity for DxC and deployed as an Android tablet app. I came in for lighting, ended up owning the rendering pipeline and Android build path. Lighting carryover from cinematic work, tuned for mobile."
lede: "Unity, URP, and Android Studio for a client outside the studio's usual Unreal-only orbit."

category: "product"
tags: ["Unity", "URP", "Lighting", "Mobile"]

role: "Lighting, rendering pipeline, and Android build setup"
stack: "Unity with URP, Android Studio, Gradle, Unity Frame Debugger"
period: "October 2025"
status: "Completed"
---

Glenda Studio's identity is AAA outsourcing, which in practice means almost all of our work happens inside Unreal or a client's proprietary engine. Unity is the exception. This was one of those exceptions: a real-time car configurator and virtual showroom for **DxC**, built in Unity for deployment as an Android tablet application, the kind of demo experience used in a dealership setting where a buyer or sales rep walks through a vehicle on a device. Our art team handled the vehicle modeling and texturing. I came in for what was initially scoped as lighting work, and ended up owning the lighting, the rendering pipeline, and the Android build path through to a device verification loop.

<!-- VISUAL 1: exterior money-shot render of the configurator on a tablet, or in-editor view showing the two-camera setup -->

## Two cameras, two render profiles

**URP** was the obvious choice once I worked through the requirements. The client wanted the highest visual quality the target hardware could carry, and URP's post-processing stack, particularly **bloom** and **MSAA**, was doing most of the heavy lifting on selling the interior detail of the car. The Built-in pipeline was briefly on the table during my first orientation in Unity, but the post-processing flexibility and the mobile-friendly forward renderer settled the question quickly.

The showroom is built around two camera modes, exterior and interior, switched via UI on the tablet. The user taps to open and close doors from the exterior camera, and navigates a first-person view around the cabin from the interior camera. Each camera gets its own dedicated render profile because the visual problems are different. The exterior view is dominated by reflections on a large continuous surface, the car body, where bloom needs to be restrained and reflection control matters most. The interior view is small detail work (buttons, stitching, trim, instrument lighting) where MSAA pulls more weight and the AA budget can run hotter to clean up the high-frequency edges. Two render profiles, two AA passes, tuned independently against where the eye is actually looking.

## Lighting the money shot

The interior is the money shot, and the lighting work in there is borrowed almost directly from cinematic work I did earlier in my career as a lighting artist on Marvel's Spider-Man 2. The Venom suit, in lighting terms, is a walking shiny object. Solving that taught me a small set of tricks I now reach for whenever the brief is "make this reflective surface look expensive."

The first trick is making the light source physically bigger so the specular highlight on a reflective surface dilutes across more pixels instead of stamping a hot pinprick. The second is splitting one logical key light into two: a **key-flection** light that contributes the visible specular reflection on the surface, and a fake key with shadow and reflection disabled that does the actual diffuse lifting. That separation lets me tune how much of the light reads as a reflection versus how much just brightens the form, independently.

For the car interior, strategic key lights were positioned to highlight the details the client had called out as priorities, with object masks excluding the surrounding geometry from those lights so a highlight on a button does not bleed out across the dashboard around it. On the exterior, some lights had their reflection contribution disabled entirely, because with a continuous reflective body panel the alternative was multiple specular hotspots stacking up and reading as cluttered rather than expensive.

<!-- VISUAL 2: interior detail shot showing the rim/highlight work on a button or trim element, ideally with the masked vs unmasked comparison -->
{{< figure src="car_interior.png" caption="Car's Interior detail shot" >}}

## Performance discipline

The hardware target was generic Android tablets rather than a specific device, so the budget had to hold up across a range of mobile GPUs. **Frame Debugger** was the main instrument for keeping draw calls and lighting cost in line. The discipline I settled into was 4 to 6 active lights at any given camera state, and spot lights almost exclusively. Point lights are roughly six times more expensive than spot lights on most renderers. That number is one I first read in a book early in my lighting career and have since confirmed across a few engines.

On the material side, the art team and I converged on a consolidation pass that worked like a tile map: multiple objects share one or two master materials, with variation driven by texture rather than by additional material instances. Fewer material switches per draw call, smaller shader variant set, more headroom for the post-processing that was carrying the visual quality.

## From editor to device

The project was originally scoped as a modeling job for the art team. It expanded to include lighting and rendering when the client pushed visual quality further, and expanded again when the client started reporting issues that were visible only on the final Android build. At that point I picked up the build path as well.

Two things stand out from that phase. The first was the moment I realized my Unity editor view looked materially different from the leads'. We could not figure out why until I traced it to the build profile setting. I had switched to the Android build profile early because that was the deployment target. The leads had stayed on the default Windows profile, and Unity renders reflective materials differently between the two. None of this was in the client documentation. I caught it by reading through the build pipeline notes carefully enough to connect that Android Studio expects an Android-profile build, and from there the discrepancy made sense.

The second was a hue variation function that drove subtle color shifts across the interior lights. It did not run inside the Unity editor at all. It only worked once the project was built and deployed to an Android device. That meant any iteration on the hue logic required a full build to verify. I set up the **Gradle** configuration, learned the part of Android Studio I needed to build and run the project on a virtual device, and from there the loop tightened: change the function, build, deploy, observe on device, and hand any model-side adjustments back to the art team.

<!-- VISUAL 3: side-by-side editor view vs. Android build view showing the rendering difference, or a screenshot of the Frame Debugger / Gradle build setup -->

## What this project gave me

Two things, neither of them about cars.

The first is engine flexibility. Coming from a portfolio that was almost entirely Unreal, the early days on this project had me questioning how transferable my pipeline instincts would be in Unity. The answer turned out to be: largely yes. URP and the Built-in pipeline are different from Unreal's renderers, the project structure is laid out differently, but the lighting work, the performance instincts, and the build-path mindset all carried across cleanly. After this project and a few subsequent months on our own Unity game, I stopped treating engine choice as an identity question and started treating engines the way I now treat DCCs: tools with different surface conventions but the same underlying production logic.

The second is technical authority without the title to match. The leads handed me producer and client conversations once they were comfortable with the work, well before I was promoted into a manager position. The lesson there has held: ownership is granted to whoever consistently steps into the scope, not to whoever has the right line on the org chart.