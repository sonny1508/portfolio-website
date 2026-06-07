---
title: "Frappe Framework"
slug: "frappe-framework"
date: 2025-11-15
draft: false
weight: 4

summary: "The studio ran on Excel, Trello, and a brittle web app, and everyone agreed it was broken. I pitched, built, and now maintain a self-hosted Frappe + ERPNext deployment with a custom layer tying it all together."
lede: "A self-hosted, deeply customized HRMS and project management platform that became the studio's central data hub."

category: "platform"
tags: ["Frappe", "Nginx", "Self-Hosted"]

role: "Technical Owner"
stack: "Frappe Framework, ERPNext, HRMS, Python, MariaDB, Nginx, Certbot"
period: "2025-present"
status: "Maintaining"
---

## The problem

Game studios have a project management problem as old as game studios themselves. We needed a real **HRMS** (Human Resource Management System) and a real project tracker, and we needed them to talk to each other, and ideally we needed the whole thing to be extendable as the studio grew. The default path was hiring a web development firm, but at ~70 people and growing, paying a vendor every time we needed a new feature was a non-starter, and being locked into someone else's roadmap was worse.
 
What we had was a mess. A web tool commissioned before I joined, used only by producers and artists for basic task assignment. Trello layered on top for the producers, leads, and managers who needed something richer. Excel for HR. Three sources of truth, none of them speaking to each other, and the original tool's data schema getting more brittle every time the studio's structure changed.
 
This is not unique to us. My first job at an **AAA** studio had the same fragmentation, where producers held everything in their heads and ran their own tracking, and artists had no visibility into where their work sat in the pipeline. The industry's usual answer is something like **Kitsu** from CGWire, which is a fine product but locks you into one platform's idea of how a studio should work. I wanted modularity and extension room, which pushed me toward the open-source side of the world.

## System

I landed on the **Frappe Framework**, the platform underneath ERPNext and the official **HRMS** module. Frappe gave me a metadata-driven document system (**DocTypes**), a real role-and-permission model, a webhook system for integrations, and a development pattern where I could build a custom app *on top of* the existing modules without forking them. That last point mattered: I wanted to override behavior in **ERPNext** and **HRMS**, not chase upstream branches forever.
 
The pitch to my boss covered the business case, but I also had to spec the infrastructure. I picked components for a dedicated Linux server: RAM headroom for the database and worker processes, a CPU durable enough to host multiple services on the same box later, dual-LAN configuration so the platform would be reachable from both the open internet and the internal studio network, and DNS planning so the same domain resolves correctly in both environments. Pitch approved, server purchased, and I moved development off the Linux VM I'd been prototyping on.
 
{{< figure src="kanban_board.png" caption="Kanban Board showing the Task cards of 01 project" >}}

## Details

The development split into a few distinct fronts.
 
The first was the custom app itself. The deepest rework was the **Leave Application** DocType and everything around it: **Leave Allocation**, the **Leave Ledger**, the approval routing, all reworked to support hour-based leave instead of the default per-day model, because our studio operates on that granularity. Touching that subsystem was an education in how complex a real codebase gets, and how tightly the document, controller, and ledger layers tie together in a framework like Frappe.
 
The second was the project management side. I overrode ERPNext's **Task** DocType and rebuilt its kanban board into something at Trello's level of usability and beyond, with role-aware status transitions: an artist can move a task between certain statuses only, and when they push it into a review state the framework fires a webhook into our **Element** chat platform to notify the lead automatically. That single integration is what let the studio retire Trello entirely.
 
The third front was the hosting layer, which was my first real time inside **nginx**. I configured the reverse proxy to sit in front of Frappe, set up **Certbot** for automatic **TLS** renewal, and wired the domain through the Domain Controller's **DNS** Manager so artists can reach the same URL whether they are in the office or working remotely. The DNS work matters more than it sounds, since memorizing a domain instead of an IP is the difference between artists actually using a tool and not.
 
<!-- Visual 3: Either the server rack / hardware photo, or a clean view of the nginx config and TLS setup, or the Element notification arriving in a chat room when a task hits review state. Whichever best communicates "this is a real production service, not a prototype." -->

{{< figure src="webhook_notification.png" caption="Frappe running webhooks to our chat platform for Task Status notifications" >}}

## Rollout and Iteration
 
Shipping the platform was the start of the work, not the end. The migration was the first hurdle: I prepped documentation for every workflow we were changing, held seminars to walk staff through the new platform, and wrote internal best-practices guides for things like how to use the task status pipeline correctly. Behavior change is the hard part of any rollout, and that was where the bulk of the early effort went.
 
Once people were on the platform, requests started arriving from every direction, and that turned into an iteration phase that has not really ended. Artists wanted **QoL** (Quality of Life) improvements that made daily timesheet submission less painful, since they were the ones living inside the system the most. Producers and art leads wanted the **Task** DocType extended with more of the affordances they actually need to run a production. Managers and accountants did not care about the UI at all. What they wanted was clean report tables.
 
That last group pulled me deep into **MariaDB**. Frappe's report builder is fine for straightforward cases, but for the salary and tax reporting the finance team needed, I had to write **SQL** queries directly against the database, joining across multiple DocTypes (Leave Ledger, Timesheet, Salary Structure, and others) and laying the output so it exported cleanly into the Excel templates the accountants worked from. It was a crash course in Frappe's internal schema and in writing query layers that survive the framework's metadata model intact.
 
The unintended benefit of all this is that I ended up working with almost every department at the studio. Art leads, producers, HR, finance, and IT each touched the platform from different angles and needed different things from it, which gave me visibility into how the studio actually operates that I would not have gotten otherwise. The mentorship side grew from the same dynamic: as the team expanded, I onboarded new members onto the Frappe framework, the development workflow with pull requests and dev-site testing, the bench command surface, and the deployment process. Training engineers on a platform I had to teach myself first has been one of the more satisfying parts of the role.

## Impact
 
The platform is now the studio's single source of truth for HR and production data. Leave types, balances, approvals, and reporting all live in one place. Timesheet entries, extended from the default **Timesheet** DocType, feed accurate performance and capacity numbers that managers actually use. Custom DocTypes I've added since launch act as the integration glue between Frappe and the rest of the studio's services, with Element being the largest of those.
 
More than the features, the platform changed where information lives in the studio. There is a central place to look, a central place to write, and a central API surface to build against. New service integrations now start with the question of how they plug into Frappe, rather than where their data goes to die.
 
The project also changed my position at the studio. The pitch process put me in front of leadership for the first time, and the delivery is what earned my seat among the managers when I was promoted. I still ship updates to the platform every week.