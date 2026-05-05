---
layout: post
title: "Building a Live HomeLab Dashboard with Prometheus and Grafana"
date: 2026-05-05 09:00:00 -0500
categories: [homelab, observability, devops]
tags: [grafana, prometheus, observability, monitoring, proxmox, truenas, devops, dashboarding, cyberpunk, css]
author: Kyle Stanley
description: "How I built a public-facing live dashboard for my homelab — Prometheus scrape pipeline, custom Grafana panels, cyberpunk neon theming, and the small disasters along the way."
excerpt: "I wanted my portfolio to do something most don't — show real, live infrastructure metrics from my actual lab. So I stood up a Prometheus + Grafana stack on TrueNAS, scraped Proxmox and the host nodes, built a curated public dashboard, and themed the whole thing in cyberpunk neon. Here's how it came together — and the small disasters along the way."
post-image: /assets/images/posts/placeholder-astronaut-golf.jpg
---

# Building a Live HomeLab Dashboard with Prometheus and Grafana

I had a problem with my portfolio site. The projects looked fine, the writing was solid, but everything was static — screenshots, descriptions, links to GitHub. None of it actually *did* anything. A recruiter clicking through couldn't see whether the lab I wrote about even existed anymore, let alone whether it was healthy.

So I decided to build something that solved that: a **live, public-facing dashboard** that pulls real-time metrics from my homelab and renders them on a page anyone can visit. No login. No screenshots. Just current numbers, updating every 30 seconds, straight from the actual hardware.

This post is how I built it, why I made the design choices I did, and a few of the small fires I had to put out along the way.

## Why a dashboard instead of more screenshots?

A screenshot tells you what something looked like at one point in time. A live dashboard tells you what's true *right now*. For a cybersecurity portfolio, that distinction matters — anybody can stage a clean screenshot, but a dashboard that's been running continuously for 78 days is harder to fake.

There's also a practical angle: I wanted to demonstrate the full stack of skills that go into modern infrastructure observability. PromQL, exporter selection, dashboard design, public-vs-private security boundaries, alert engineering. A dashboard is a single artifact that touches every one of those.

And honestly? It was the most fun project I've worked on in months.

## The stack

Architecture turned out to be straightforward:

```
[Proxmox host]
  └─ node_exporter         ← system metrics (CPU, RAM, disk, net)
  └─ PVE API token         ← read-only, auditor role

[TrueNAS — docker compose stack]
  ├─ prometheus-pve-exporter   ← translates PVE API → Prometheus metrics
  ├─ prometheus                 ← time series database, 30s scrape, 90d retention
  ├─ node-exporter (host PID)  ← TrueNAS host metrics including ZFS
  └─ grafana                    ← visualization + public dashboard sharing
```

Three exporters feeding one Prometheus server feeding one Grafana instance. Standard.

The whole thing lives in `/mnt/HDD-18tb/Docker/monitoring/` on TrueNAS as a single `docker-compose.yml` — easy to back up, version, and recreate. The Proxmox API token has only the `PVEAuditor` role, so even if the token leaks, all anyone can do is read metrics.

## Building the panels

I wanted the dashboard to tell a story top to bottom, not just be a pile of charts. So I structured it like a status page:

1. **System status banner** — one big tile that says either "ALL SYSTEMS OPERATIONAL" or shows a count of active issues. This is the first thing anyone sees.
2. **Stack health row** — six UP/DOWN indicators for every monitored component (Prometheus, Proxmox API, both node exporters, both ZFS pools).
3. **At-a-glance stats** — uptime, longest runtime, VM count, container count.
4. **Service availability** — rolling 24-hour SLO percentages. This is the section I'm most proud of, and it's also the one that bit me first (more on that below).
5. **Hardware inventory** — CPU threads, total RAM, pool capacity.
6. **Resource utilization** — gauges and time series, two hosts overlaid.
7. **Network and disk I/O time series**.
8. **Storage section** — bar gauges for every storage pool and filesystem.
9. **Workload distribution** — donut charts.

Building this in Grafana was satisfying in a way I haven't felt since the first time a SIEM dashboard lit up correctly. Every PromQL query I got right unlocked another panel. By the end I had something like 30 panels working off four scrape jobs.

## Going cyberpunk

The default Grafana theme is fine. But this is a *cybersecurity portfolio*, and the dashboard had to look the part.

I built a six-color cyberpunk palette: neon cyan for healthy/Proxmox, hot magenta for TrueNAS, electric yellow for highlights, neon green for OK states, amber for warnings, hot red for critical. Then I mapped every threshold in the dashboard to those colors.

For visual punch I added:

- A **gradient header** that animates across cyan → magenta → yellow on a six-second loop
- **CRT scanlines** as a subtle overlay on the whole page — barely visible, but they sell the aesthetic
- **Neon glow** on every stat value via `text-shadow: 0 0 20px currentColor`
- **Animated section headers** using the same gradient flow as the title
- **Custom scrollbars** with a cyan-to-magenta gradient
- Orbitron font for headings, JetBrains Mono for everything else

To inject custom CSS at all, I had to flip Grafana's `GF_PANELS_DISABLE_SANITIZE_HTML=true` env var. That sounds scarier than it is — it just lets text panels include raw `<style>` and `<script>` tags. For a single-author dashboard with no user-submitted content, the risk is fine.

## The small disasters

Nothing this layered comes together without a few facepalm moments.

**The retention setting that almost ate my data.** First night the stack ran, I configured Prometheus with `--storage.tsdb.retention.time=1d` because I was copy-pasting examples and didn't read carefully. The next morning my "longest runtime" panel showed `0s`. It turned out my Prometheus had been faithfully deleting everything older than 24 hours, including the boot-time samples I needed for the SLO calculations. Fixed with `--storage.tsdb.retention.time=90d` and a restart. Now I have three months of history, which is plenty.

**The gauge that thought 94 GB was 94 percent.** I built the memory utilization gauge with the query `node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes` and set the gauge max to 100. The gauge showed `94,000,000,000` and pegged the needle. Took me ten minutes of staring before I realized I'd skipped the percentage math entirely. The actual query needs to be `100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)`, which I now have memorized at the muscle level.

**Public dashboards have their own rules.** I built the dashboard, looked great, hit "share publicly", opened the URL, and watched every panel render `NULL`. Turns out Grafana's public dashboard renderer requires an explicit `datasource: { uid: "..." }` reference on every panel and every target — even though the authenticated UI auto-resolves the dashboard's default datasource. The error message in the Grafana logs said `invalid data source identifier datasources=[public-ds]`, which finally pointed me at the fix. Patched all 30+ panels with explicit datasource refs and everything came alive.

**The grey box around my gradient text.** This was the most annoying bug. I added `background-clip: text` to make my gradient title text show through, and immediately every styled element grew a grey rectangle around it. Spent thirty minutes in the browser inspector convinced it was a `box-shadow` problem. It wasn't. It was that `background-image: linear-gradient(...)` doesn't reset the element's `background-color`, so the inherited grey from Grafana's default styling was filling everything outside the text glyphs. One line fix: `background-color: transparent !important`. Lesson learned about CSS specificity, again.

**The CSS-in-JS class name lottery.** Grafana 13 uses Emotion for styling, which generates random class names at runtime. My first round of CSS selectors targeted things like `.dashboard-row__title` — a class that exists in the source code but never makes it to the browser as a stable selector. After trying half a dozen attribute selectors with `[class*="..."]` patterns, I gave up and replaced the row dividers with plain text panels containing inline-styled HTML. Way more control, zero specificity battles.

## What it demonstrates

For a portfolio dashboard, the technical surface I wanted to show:

- **Multi-source observability** — three exporters feeding one Prometheus
- **PromQL fluency** — subqueries (`max_over_time((expr)[30d:5m])`), regex matching, aggregations, range vectors
- **SLO thinking** — `avg_over_time(up[24h]) * 100` for rolling availability
- **Storage monitoring** — including ZFS pool state via `node_zfs_zpool_state{state="online"}`
- **Alert engineering** — six Grafana alert rules that catch the failure modes I care about most
- **Public sharing with security boundaries** — read-only public dashboard, admin login still locked

The dashboard right now sits at `http://192.168.1.180:3001/public-dashboards/...` on my LAN, and I'm wiring it up to `grafana.kyhomelab.com` via Cloudflare tunnel next so it'll be reachable from anywhere.

## What's next

A few follow-ups on the list:

- **Cloudflare tunnel** to expose the public dashboard at a stable URL
- **Telegram alert routing** so I get pinged when something trips overnight
- **Grafana dashboard JSON in version control** so the whole config is reproducible
- **A second drive in the ZFS pool** for actual redundancy — the pool is single-disk right now, which is the architectural problem this dashboard would have flagged earlier if I'd had it running

If you want to see a snapshot of what it looks like, the screenshot is up on my [portfolio homepage](/). If you're building something similar and want to compare notes, my GitHub is [kyhomelab](https://github.com/kyhomelab).

Most fun I've had with infrastructure code in a while.
