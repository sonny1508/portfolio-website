---
title: "Element-web"
slug: "element-web"
date: 2026-02-15
draft: false
weight: 5

summary: "Production used Synology Chat, management used Teams, and neither talked to the other. I deployed a forked Element + Synapse stack on k3s and unified the studio onto one self-hosted Matrix platform with Frappe integrations."
lede: "A forked Element + Synapse deployment on k3s, rebuilt to unify production and management on one self-hosted chat platform."

category: "platform"
tags: ["Element", "Matrix", "k3s"]

role: "Technical Owner"
stack: "Element, Matrix Synapse, k3s, Helm, Docker, PostgreSQL, Typescript, Github actions"
period: "2026 — Present"
status: "Maintaining"
---

## Context

The chat platform question splits along studio size. Big AAA studios run Teams plus email and it works, because the entire industry runs the same stack. My first AAA job operated that way and it was fine internally, but the moment you become an outsourcer you inherit every limitation of Teams without any of the leverage to fix them: painful offline setup, cross-organization rooms that hit tenant constraints, and zero room to customize for studio-specific needs because Teams is enterprise software shipped for the average enterprise, which is not us.
 
Smaller studios usually run Synology Chat because a NAS is already in the rack and the chat module is free. It works, but the UI is rough, mobile is effectively nonexistent, and the extensibility ceiling is low. Our production department was on Synology Chat. Upper management ran Teams in parallel for client comms. Two layers, no overlap, same fragmentation pattern as the AAA studio.
 
The webhook story for Synology Chat told me everything I needed to know about that platform. To get our **Frappe** instance to push notifications to a user, I had to manually generate a webhook key for each individual user and paste it into a Frappe field for them. For 70 people that is not a system, it is a chore.
 
I evaluated the realistic alternatives. Rocket Chat was heavily security-focused but rigid. Mattermost stood up in an afternoon but felt like Synology Chat in a new coat of paint. Element had the steepest learning curve of the three, since the backend was **Matrix** and the deployment story involved **k3s**, **Helm**, and pods, but it was also the only one that gave me real customization room and a protocol underneath it that was genuinely interesting.

## System

The Element stack is significantly heavier than Frappe. Where Frappe gave me a custom-app pattern that let me override behavior without forking, Element required forking **element-web** and managing my own branch, with selective rebases pulled in when upstream features or security patches mattered. The tradeoff is worth naming: a custom app keeps you close to upstream but limits you to the override hooks the framework exposes, while a fork gives you the whole codebase to modify and puts the burden of staying current on you. For Element, the fork was non-negotiable because the customizations I needed went deeper than any config layer would support.
 
The deployment stack itself was a step change. I built a **Docker** image of the forked Element-web client, packaged the Synapse server and supporting services into a **Helm** chart, and deployed the whole thing onto a **k3s** cluster on the same on-prem server that hosts Frappe. Synapse uses **PostgreSQL**, which now runs alongside the **MariaDB** instance Frappe uses, with resource allocation tuned so the two services do not step on each other under load. Element-web, the Synapse homeserver, and the desktop-app update endpoint each get their own subdomain, all routed through the existing nginx reverse proxy.

## The Cert Outage

The first time I installed k3s on the production server, the Frappe site went down within minutes. The browser showed 502 errors and a certificate expiration warning, which was bizarre because **Certbot** was running automatic renewal and the cert was nowhere near expiry. I confirmed the certificate on disk was valid, then checked which process was actually serving traffic on port 443 and realized nginx was not the one answering. **Traefik** was, because k3s installs Traefik as its default ingress controller, and it had silently started presenting its own self-signed cert in place of the real one.
 
The fix was a clean uninstall of k3s and a reinstall with the Traefik component disabled, since nginx was already doing the ingress job and there was no reason to have two competing reverse proxies on the same machine. Total outage was around 30 minutes, with about ten people pinging me as it happened, all inside the lunch-hour window where it could have been considerably worse. No real damage, but the lesson stuck: defaults in infrastructure tools are not always neutral, and a new component dropped onto a shared host needs to be checked for what it silently takes over.

## Details

Once the stack was stable, the customization work was the main story.
 
The branding pass was deep. Element ships with a recognizable color scheme and visual identity that we replaced wholesale: a new color palette built out in **SCSS**, a new default theme on first launch, and studio-specific assets throughout. I also disabled end-to-end encryption at the homeserver level, since for an internal tool the audit and recovery benefits of server-readable messages outweighed what **E2E** (End-to-End encryption) bought us. Finding the right config key to actually disable it took longer than I would like to admit, which is the kind of debugging story that gives you religion about good documentation.
 
Several front-end reworks were the reason a fork was necessary at all. Native Element forwarding, by design of the privacy-focused Matrix protocol, strips the original sender from a forwarded message. That is correct for the protocol's goals and wrong for ours, so I rebuilt forwarding to preserve the original sender, render it visually similar to a quoted reply, and support an optional message appended before the forward. The result was effectively Teams-style forwarding that everyone preferred immediately.
 
I also rebuilt the image-attachment renderer, which by default sends each uploaded image as a separate event stacking vertically in the conversation. When someone uploads ten reference images at once, that is unusable. The replacement lays them out as a proper gallery in a single bubble. This was the change that pushed me past config overrides and into the fork, since the rendering pipeline is not something the existing extension surface can touch.
 
The Poll component got similar treatment. Default Element leans toward anonymous voting, which is right for many use cases but not for studio decisions where transparency is the point. I rebuilt it to show who voted for what, allow undoing a vote before the poll closes, and surface full results visibility after closure. A more democratic poll for a context where hiding voter identity created more confusion than privacy.
 
<!-- Visual 2: A side-by-side screenshot. Default Element on one side, the customized studio build on the other. Show whichever combination of branding, the reworked forwarding bubble, or the image gallery best communicates the depth of the changes. -->
{{< figure src="studio_branding.png" caption="Element's frontend development for studio branding and custom features" >}}
 
**CI/CD** was the other major area. The studio runs on Windows workstations, but I develop on Linux, so building the desktop app locally was not an option. I set up **GitHub Actions** workflows to build the desktop client on every release, push the artifacts to a dedicated update subdomain, and let Element's built-in **Squirrel** auto-update mechanism pull the latest version to every workstation. **PDQ Deploy** handles the initial install across the studio, Squirrel handles every update afterward. That pipeline took me from "I have heard of CI/CD" to "I have a working software distribution chain," which is a competency leap worth naming on its own.
 
The last piece tied everything back to Frappe. I built a custom Matrix integration DocType that handles automatic onboarding: when a new employee is registered in Frappe and the integration is enabled, the system provisions their Matrix account, adds them to the relevant default rooms, and wires up the bot-to-user notification channel that Synology Chat needed manual key generation for. The webhook problem that defined the old setup is now a single checkbox.
 
<!-- Visual 3: Either the GitHub Actions workflow run building the desktop client, the Frappe Matrix integration DocType provisioning a new user, or the Squirrel auto-update arriving on a workstation. Pick whichever best communicates "this is a full software distribution pipeline, not just a deployed app." -->
{{< figure src="github_actions.png" caption="Github actions workflow for the latest desktop client" >}}

## Impact

Element is now the studio's single communication platform. Around 70 active users sit across roughly 30 production and management rooms, plus the private rooms people create for themselves, and the room-folder structure (inherited from upstream Element, credit where it is due) makes the volume manageable in a way Teams and Synology Chat never could.
 
The bigger shift is structural. Management and production now share one platform, which means project status, personnel issues, and cross-functional questions live in one place instead of two parallel systems that synced over coffee. Managers run the mobile app and stay reachable from anywhere, which was effectively impossible on Synology Chat's PC-bound client. Frappe automation flows through real integration instead of per-user webhook keys taped to user records.
 
For me, this project opened an entire problem domain I had not worked in before: container orchestration with k3s and Helm, CI/CD pipelines with GitHub Actions, software distribution with auto-update systems, and the realities of running a forked open-source codebase as a long-term commitment. Future work will push further into Synapse's admin API for room auditing and policy enforcement, but that is a story for a later writeup.
