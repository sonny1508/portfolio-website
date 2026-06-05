---
title: "Studio Deployment & Infrastructure"
slug: "studio-infrastructure"
date: 2025-04-17
draft: false
weight: 2

summary: "Designed and built a studio-wide deployment system using Ansible, a Windows Server 2022 Domain Controller, and PDQ Deploy, covering 60+ workstations from bare metal provisioning to ongoing software management."
lede: "Built the deployment and configuration backbone for a 60-person game studio from scratch."

category: "infrastructure"
tags: ["Ansible", "Windows Server", "PDQ Deploy"]

role: "Author"
stack: "Ansible (WSL), PDQ Deploy, Windows Server 2022, Active Directory, Group Policy"
period: "2025 — Present"
status: "Maintaining"
---

## The problem

When I joined the studio, software deployment meant two IT staff walking between desks. Every installation was manual: DCC applications (Maya, 3ds Max, Substance Painter), plugins, office utilities, all of it. Tool updates were worse. The lead would package everything into one bundle that sat untouched for a year because pushing updates required admin access on each machine individually. There was no way to track what was installed where, no remote access, and workstations drifted apart over time. Every machine was its own small problem.
 
This wasn't unique to the studio. Small-to-mid-size game studios in Vietnam commonly either outsource IT entirely or run a skeleton crew that manages everything by hand. The infrastructure I inherited ran off a 2005-era Windows Server whose only job was DNS for a legacy version control system (NXN AlienBrain), and artists were working on outdated, cracked software, stuck on base releases with no minor version updates, no bug fixes, no new features.

## Buiilding the pipeline

My first attempt was OpenSSH, configuring it on workstations and scripting file copies with robocopy. It worked in principle but broke down fast. Credential management was fragile, complex shell commands were unreliable across machines, and scaling it to 60+ seats wasn't realistic. I shelved it.
 
The turning point was discovering **Ansible**, and more specifically, learning it could run on **WSL** (Windows Subsystem for Linux). That removed the barrier of needing a dedicated Linux machine. I set up an Ansible environment on WSL, wrote inventory files organized by department, and stored domain admin credentials securely in vaults. The first playbooks were simple: copy tool files from the NAS to each artist's local machine. Then they grew into software presence checks, silent installations, registry edits, cleanup of old versions, and uninstalls. Within a few months I had around 50 playbooks covering nearly every routine operation.

{{< figure src="directory_structure.png" caption="Studio's Playbook Directory Structure" >}}

But Ansible alone couldn't solve everything. Workstation-level configuration (network profiles, WinRM, user shortcuts, default application settings) still required manual setup on each machine. The real unlock was pitching a proper **Domain Controller**. I spec'd a server with RAID and proper cooling, installed **Windows Server 2022**, and configured the full stack: **DNS Manager**, **Active Directory**, and **Group Policy**. I defined naming conventions, OU structure, and GPO rules, then migrated every user from the legacy system.

The Domain Controller also solved problems that went beyond deployment. DNS Manager became the foundation for internal domain resolution, which later allowed workstations to access on-prem web services (Frappe, Element) in an offline environment through proper local DNS entries. I configured domain firewall rules and opened specific ports for RDP remote access, for the Helix Core server (Perforce) that came later, and for other internal services as they were stood up. Without this, every new service would have meant another round of manual network configuration on every machine.
 
When a new machine comes online or a user switches workstations, Group Policy handles the baseline configuration automatically. Tools deploy on login, remote support works without manual port forwarding, and the correct licensed software versions are available immediately through a local Autodesk license server (**LMTools**) hosted on the same machine.

## Current state

**PDQ Deploy** was added later to handle the software management layer that Ansible wasn't ideal for: package deployment with version tracking, scheduled pushes, and reporting dashboards that show exactly what's running on every machine. Between Ansible for automation, GPO for configuration, and PDQ for software lifecycle, the studio runs on a system where I can provision a workstation from bare metal to production-ready without leaving my desk.

{{< figure src="pdq_deploy.png" caption="Managing production software with PDQ" >}}

What started as "just copy a file to the right folder" became the deployment backbone for the entire studio. More importantly, it freed the team from depending on someone walking over to fix their machine, and freed me to focus on building the next system instead of maintaining the last one.