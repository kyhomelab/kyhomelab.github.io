---
layout: post
title: "What's in My HomeLab — 2026 Edition"
date: 2026-05-01 10:00:00 -0500
categories: [homelab, cybersecurity]
tags: [homelab, proxmox, truenas, soc, malware-analysis, sentinel, n8n, opnsense, virtualization, networking, plex]
author: Kyle Stanley
description: "A two-year update on my HomeLab — from a single Proxmox box running a few VMs to a segmented multi-purpose lab with a SOC environment, malware sandbox, automation layer, media stack, and 16 TB of ZFS storage."
excerpt: "When I wrote the first 'What's in My HomeLab' post in March 2024, the lab was a single Proxmox host with a handful of VMs. Two years later, it's grown into a segmented, multi-network environment with a full SOC stack, an automated malware sandbox, a TrueNAS media server, and SOAR automation. Here's the 2026 tour."
post-image: /assets/images/posts/2026-05-01-homelab-2026.jpg
---

# What's in My HomeLab — 2026 Edition

When I wrote [the first version of this post](/blog/whats-in-my-homelab) back in March 2024, the lab was simple: one Proxmox box, a Windows 10 VM with GPU passthrough, a Kali VM, Pi-hole in a container, and TrueNAS for storage. It was a learning sandbox.

Two years later, it's something very different. The lab is now the backbone of how I learn detection engineering, run malware analysis, host the family's media, and build the projects that show up on the rest of this site. This post is the tour.

## What Changed

The 2024 lab was built around general computing. The 2026 lab is built around **purpose-built segments**: security operations on one side, household services on the other, with shared infrastructure between them. That shift drove almost every change:

- **Network segmentation became non-negotiable** once I started detonating malware
- **Hardware got upgraded** — Ryzen 5 5600X out, 12th-gen Intel in
- **The SOC stack expanded** from a single Wazuh instance into a full purple-team lab
- **TrueNAS grew** from a storage box into an apps platform
- **Automation took over** — manual workflows don't scale

## Hardware Foundation

The 2024 build got rebuilt. Current spec:

- **Intel Core i5-12600K** (10 cores / 16 threads, P+E core hybrid)
- **96 GB DDR4** RAM — the single most important spec for a busy lab
- **Intel Arc A380** GPU (passed through to TrueNAS for hardware transcoding)
- **1 TB NVMe** boot drive (Proxmox + LVM-thin pool for VM disks)
- **1.8 TB NVMe** scratch / VM storage
- **16.4 TB HDD** — passed straight through to TrueNAS as a ZFS pool
- **Be Quiet! 240mm AIO** cooling

**Networking gear:**
- **Cisco SG 300-28P** managed switch (VLAN tagging makes the multi-bridge architecture practical)
- **Cisco Business 110** unmanaged switch
- **Dual Gigabit LAN NIC** in the Proxmox host

The two specs I'd push hardest if you're building toward this: **RAM and a managed switch**. Concurrent VMs eat memory before they eat CPU, and once you have more than one Proxmox bridge, an unmanaged switch starts limiting what you can build.

## Hypervisor: Proxmox VE 9

Proxmox is still the foundation. Currently on **PVE 9.0** with kernel 6.14. The features that have mattered most over two years:

- **Linux bridges** for software-defined network segmentation
- **Snapshots** — the most underrated feature for malware work; the analysis VM gets reverted after every detonation
- **PCI passthrough** — Intel Arc A380 lives inside TrueNAS, not on the host
- **Backups to TrueNAS** so a bad config change doesn't cost a weekend

## Network Architecture — The Big Change

This is the part that defines the modern lab. Three Proxmox-managed bridges:

| Bridge | Purpose |
|--------|---------|
| **vmbr0** | Home network — TrueNAS, daily-use VMs, containers, anything that needs internet |
| **vmbr1** | Isolated malware analysis network — no route to home, no real internet |
| **vmbrsoc1** | Isolated SOC lab network — attackers can punch endpoints without touching home |

Why this matters: when a real malware sample runs in the sandbox, it cannot reach my actual network, my router, or anything I care about. When Caldera runs an adversary emulation against a Windows endpoint in the SOC lab, the lateral movement traffic stays on the SOC bridge.

I wrote a [full post on segmenting the lab with OPNsense](/blog/segmenting-lab-opnsense) for the deep version.

## Always-On Infrastructure (vmbr0)

These run 24/7:

### TrueNAS Scale 25.04 — Storage and Apps
The 16 TB drive is passed straight through to a TrueNAS VM that runs a single ZFS pool (`HDD-18tb`). It's also the apps platform now — Scale's Docker integration runs the entire household stack:

- **Plex Media Server** (with Arc A380 transcoding)
- **Sonarr / Sonarr-Anime / Radarr / Prowlarr / SABnzbd** — full media automation pipeline
- **Profilarr** — quality profile sync across the *arr stack
- **Overseerr** — request management for the household
- **Gaseous** — self-hosted game library / metadata
- **Nginx Proxy Manager** — reverse proxy and Let's Encrypt for everything internal
- **Cloudflared** tunnels — secure external access without opening ports
- **Actual Budget** — self-hosted personal finance
- **Homepage** — dashboard tying it all together

This stack alone is what the 2024 lab couldn't do. Moving the HDD to passthrough and letting TrueNAS own the ZFS layer was the unlock.

### Tailscale (LXC)
Mesh VPN to reach the lab from anywhere. Replaces a traditional VPN with much less ceremony. It's a Proxmox container so it's tiny and always available.

### n8n (LXC)
The connective tissue I didn't know I needed in 2024. It runs workflows like:
- **CAPE sample submission** via webhook
- **Automated CAPE report → GitHub Gist** publishing on a schedule
- Cross-system event routing between SOC tools

Once you have a SIEM, a sandbox, and a case manager, the only thing missing is the glue. n8n is the glue.

### Docker host VM
A general-purpose docker box for one-off services and dev environments that don't earn a permanent home elsewhere.

### VS Code CLI VM
Browser-accessible dev environment ([documented here](https://github.com/kyhomelab/Gemini-CLI-VM)). Lets me work on lab code, write blog posts, and edit configs from anywhere on the home network — or via Tailscale from outside.

### Minecraft Server
Private server for friends and family, exposed via a dedicated Cloudflared tunnel. Yes, this counts as production workload — it has SLA expectations.

## SOC Lab Environment (vmbrsoc1)

These spin up on demand for security work. The "lab" segment is fully isolated from home:

- **OPNsense Firewall VM** — edge gateway, segmentation policy, inter-VLAN routing
- **CyberBlue SIEM** — unified Wazuh + Suricata + TheHive + Caldera deployment; replaced the standalone Wazuh from 2024
- **Soc-Kali** (dual-homed: home + SOC bridge) — attack box for hands-on red team work
- **Two Windows 10 endpoints** with Sysmon, Wazuh agent, Microsoft Defender — primary detection targets
- **MITRE Caldera** for automated adversary emulation

This is the environment behind my [Purple Team IR Campaign](/) and the detection rules in my [KQL query library](https://github.com/kyhomelab/kql-queries).

## Malware Analysis Sandbox (vmbr1)

Fully isolated, spun up only when there's a sample to analyze:

- **CAPEv2 host** — orchestrator, web UI, report storage
- **Windows 10 guest** with the CAPE agent — the actual detonation surface; reverted via Proxmox snapshot after every sample
- **INetSim** — fakes the internet (DNS, HTTP, SMTP, IRC) so malware "calls home" but actually phones a wall

Detailed in [Building an Automated Malware Analysis Pipeline](/blog/building-automated-malware-analysis-pipeline) and the [detection engineering lessons](/blog/malware-analysis-results-detection-engineering-lessons) post that followed.

## Cloud-Extended: Azure Honeypot

Not everything belongs in the basement. The [Cloud-to-Ground Honeypot](/blog/building-cloud-to-ground-honeypot-soar) project lives in Azure Sentinel because real-world attack telemetry needs a real-world internet-facing surface. The lab provides the analysis muscle; Azure provides the exposure surface. Detections, KQL rules, and IOC publishing all flow back through the n8n automation layer running on-prem.

## What's Next

Three projects are actively in flight as of this post:

- **Azure Identity Security Lab** — Entra ID attack detection, KQL rules in Sentinel, Graph API SOAR
- **Purple Team IR Campaign** — five-scenario adversary emulation campaign with documented IR playbooks
- **Unauthorized Software Detection** — Defender custom detection rules and PowerShell remediation for rogue RMM tools (early version in [hunting rogue software](/blog/hunting-rogue-software-automating-remediation))

## Conclusion

The 2024 lab was about learning IT. The 2026 lab is about **doing real work** — security operations on one side, household services on the other, with shared automation glue.

If I had to give one piece of advice to someone building toward this in 2026: **start with the network segmentation**. Everything else — the SIEM, the sandbox, the detection rules, the media stack — depends on having a place where things can break safely. Get the bridges right first. The rest follows.
