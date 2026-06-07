---
title: "Waddle Detour"
slug: "waddle-detour"
date: 2026-06-05
draft: false
weight: 6

summary: "Craft your own solution to help Waddly the penguin reach his destination by combining and stacking blocks in this cozy yet extremely challenging puzzle game. I am the sole programmer, taking the project from an inherited idea-validation prototype to a Steam demo with full release in the next 1-2 months."
lede: "A turn-based puzzle platformer launching on Steam, built sole-programmer over an inherited idea-validation prototype."

category: "product"
tags: ["Unity", "C#", "Game Systems"]

role: "Sole programmer (gameplay, systems, UI, audio, build pipeline)"
stack: "Unity, C#, DOTween, SOAP"
period: "2026 - Present"
status: "Ongoing"
---

## What it is

Waddle Detour is a turn-based puzzle platformer aimed at the hardcore puzzle audience: simple rules, deep solution space, levels that ask you to actually think. The player crafts their own path by combining and stacking blocks to guide Waddly the penguin from spawn to goal. Every level runs in two phases. In the **editing** phase the player assembles chunks of blocks freely. In the **platforming** phase those chunks become the level itself, and Waddly walks through it under turn-based input.

The team is three people: one artist, one game designer who also runs business and marketing, and me on all programming. I inherited the project from a friend who had built an idea-validation prototype with off-the-shelf packages bolted together. The prototype proved the central mechanic worked as a concept. Everything from "this could be a game" to "this is a product on Steam" was the work that followed.

{{< video-youtube id="qounpuSwTNw" caption="Waddle Detour's trailer" >}}

## What I inherited and what I rebuilt

The handoff was a Unity 2022 project that was best described as an idea-validation: it demonstrated that block stacking on a per-tile grid could carry a puzzle game, with three block types in a working sketch and a handful of test levels, but every system around that needed building. The first month was triage: upgrade to **Unity 6.0**, rip out the asset-store packages and Corgi Engine pieces that were holding the prototype upright, and start mapping the actual game I needed to build against what I had been handed.

Game systems programming was new ground for me when I started. My prior Unity experience came from studio pipeline tooling, not gameplay, and the early months were the steepest learning curve of my career. The work that followed touched everything: turn-based input that queues across state transitions, two distinct game phases that own different data, a character state machine that grew out of real edge cases rather than upfront design, a block system whose architecture I rebuilt twice before it stopped fighting me, and an internal documentation effort that turned the codebase from "a friend's prototype" into something a second engineer could navigate. The current build runs on **five block types** (up from the three I inherited) and sits on top of several large refactors of the editing-phase chunk system.

The audio system was the milestone that retired the last imported component. Once I wrote it, the game's only external dependencies were utility libraries: **DOTween** for tweening and **SOAP** for scriptable-object pipelines. The original Corgi Engine and MoreMountains assets that the prototype had been propped up on were fully gone. Functionally that meant the game was now mine end to end, with every system either written by me or chosen explicitly as a utility rather than a framework.

## System spotlight: the character

{{< video-mp4 src="chunk_interaction.mp4" caption="Character and chunk interaction" wide="true" >}}

Waddly's behavior is governed by a seven-state machine that runs on per-turn input rather than per-frame physics. That is non-obvious for a platformer, but it falls out of the game's turn-based design: every player action either resolves cleanly or it does not, and the state machine is what enforces that.

```
Freeze (phase→Editing)
            +-----------------------------------+
            |                                   |
            |    Unfreeze (phase→Platforming)   |
   +--------+--+                         +------+-----+    chunk-under-me (event)
   |  Frozen   |<------------------------|    Idle    |.......................>  +-----------+
   +-----------+                         +--+------+--+                         |   Riding   |
                                 jump press |      | MoveLeft/Right             +------+--+--+
                                            |      |                 chunk stops       |  |
                                            v      v                 (ground ok)       |  |
                                     +-------+  +-------+  <------------------------+  |  |
                                     |  Jump |  |  Move |                           |  |  |
                                     +---+---+  +---+---+                           |  |  |
                               no ground |      land |                 chunk stops  |  |  |
                                         |           +---------> Idle (no ground)   |  |  |
                                         |                               v          |  |  |
                                         v                          +----------+ <--+  |  |
                                  +-----------+   no ground         | Falling* | <-----+  |
                                  | Hovering* | ----------------->  |          | <--------+
                                  +--+-----+--+                     +----+-----+
        MoveLeft/Right (air step)    |     | pushed / ability close      |
                          +----------+     +-----------> Falling    land | off-screen
                          v                                              v           v
                      -> Move                                        -> Idle      (death)

  * perpetual state (re-evaluates each frame until exit condition)
  .....>  event-driven transition (chunk event)

  Idle   + chunk pushed into us safely  -> push tween (stays Idle)
  Idle   + chunk I stand on moves       -> Riding  (event-driven)
  Riding + chunk stops, ground ok       -> Idle
  Riding + chunk stops, no ground       -> Falling
  Falling + land                        -> Idle
  Falling + exits screen bottom         -> death (not a state)
```

The seven states are **Frozen** (editing phase, visible but inert), **Idle** (consuming input each turn), **Moving** (one-tile walk), **Jumping** (diagonal one-up-one-over), **Falling** (continuous drop to landing or off-screen death), **Hovering** (a one-turn mid-air rest after a jump landed without ground), and **Riding** (snapped to a moving block chunk).

The hardest state to get right was Riding. The decision I am most proud of in this system is making it **data-first**: the moment a chunk begins to move and announces it, the character's logical tile position updates immediately, even while the visual is still mid-tween. Queries that ask "where is the character right now" see the post-ride answer instantly, and the visual catches up by following the chunk frame by frame. That decision eliminated an entire class of bugs that came from racing the visual against the data.

The state machine grew organically. We did not write a **GDD** (Game Design Document) up front, and the design space rewarded building, playtesting, and reacting more than it would have rewarded planning. New states earned their place when the game asked for them: Hovering gives the player a one-turn beat to react after a jump landed without ground, Riding is what makes chunk-carries-character interactions feel solid by locking input until the carrier settles. The current shape is the third or fourth revision, and the internal documentation I wrote for it after stabilization is genuine engineering documentation rather than a postmortem.

## System spotlight: the block system

If the character is the soul of the game, the block system is its skeleton. Every level is built from blocks. Every solution is the player arranging blocks. The architecture I converged on after several rewrites rests on one central abstraction:

{{< video-mp4 src="chunk_placement.mp4" caption="Chunk placement mechanic" wide="true" >}}

**One logical block is represented by three different runtime objects over its lifetime, and the three are never alive at the same time.**

At level load each block is a **RestBlock**, a static prop sitting on the level grid waiting to be selected. When the player drags a group of blocks together in editing phase, the RestBlocks are hidden and each one becomes a **DraggableBlock** child of a **ChunkEntity** that the player can reposition and rotate. When the player triggers platforming phase, the editing chunks are hidden and a fresh set of **BlockPlatformingEntity** objects is spawned from the editing data, this time driven by a turn-based state machine that responds to ability taps (arrow push, bomb explosion) and Waddly's interactions.

The reason the three-representation design beat the alternatives is that each representation has a genuinely different lifecycle, prefab, and input surface. A RestBlock answers taps that select and create chunks. A DraggableBlock answers drags that reposition existing ones. A BlockPlatformingEntity answers ability triggers and reacts to the character pushing into it. Trying to unify them under one component gave me a class whose behavior was gated on the current phase, which was the source of nearly every bug for the two months I tried to make it work.

```
LEVEL LOAD                EDITING                         PLATFORMING
──────────                ───────                         ───────────
SpawnBlockEntity          player groups blocks            StartPlatformingPhase
  → RestBlock (ABlockEntity)  → ChunkEntity + DraggableBlock   → hide ChunkEntity (not destroy)
     on the level tilemap        children                      → spawn ChunkPlatformEntity
                                                                  + BlockPlatformingEntity
                          ◄──────────────────────────────  ReturnToEditingPhase
                          revert (chunk → RestBlocks)       (destroy platforming, show ChunkEntity)
```

The split also forced me to formalize data ownership. Each representation reads and writes its own data hub, and one hub (the RestBlock data hub) is authoritative and write-once. The others are derived. This is what makes the editing → platforming → editing transition a pure re-activation rather than a rebuild: the authoritative truth survives every phase change, so returning to editing simply un-hides the chunks where they were.

## Beyond the core systems

The character and block systems are the two I am most proud of, but the project covered a lot of surrounding ground: a turn manager that brackets every game action so input can be locked during animations, a gameplay input listener that queues player intent across state transitions for **QoL** (Quality of Life) responsiveness, save and checkpoint handling, an internal documentation push that grew alongside the code, and the build pipeline that ships the game to Steam.

## Where it is now

Waddle Detour is live on Steam as a demo, with a trailer, full store page, and active wishlist campaign. Full release is targeted for one to two months from now. The remaining work is final polish, mid-game level rebalancing based on demo feedback, and platform certification.

The project is also what gave me the most respect for engineers who work in this discipline full-time. Pipeline and infrastructure problems have constraints that are external to the work and known up front. Game systems problems generate their own constraints as you go, and good ones earn their complexity. Waddle Detour is the proof, for me, that I can do both.