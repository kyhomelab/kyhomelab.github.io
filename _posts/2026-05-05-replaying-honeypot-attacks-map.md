---
layout: post
title: "Replaying 2.7 Million Honeypot Attacks: From GitHub Gist to Interactive Map"
date: 2026-05-04 22:30:00 -0500
categories: [cybersecurity, threat-intelligence, dataviz]
tags: [honeypot, threat-intel, leaflet, mapbox, javascript, geoip, github-gist, dataviz, cyberpunk, attack-map]
author: Kyle Stanley
description: "How I turned 800 hourly snapshots of my honeypot blocklist gist into a live interactive attack map — git-cloning gists, GeoIP enrichment, and Leaflet heatmaps with cyberpunk neon."
excerpt: "I had 800 historical snapshots of my Azure honeypot's blocklist sitting in a public GitHub gist — 527 unique attackers, 2.7 million attempts, 69 countries, accumulated over 37 days. Static threat-feed text. So I built a replay map: scrub a slider through the timeline, watch IPs appear, see arcs fire toward the honeypot, toggle a heatmap. Here's how it came together."
post-image: /assets/images/posts/placeholder-astronaut-golf.jpg
---

# Replaying 2.7 Million Honeypot Attacks: From GitHub Gist to Interactive Map

> **▸ See it live:** [kyhomelab.github.io/honeypot-attacks](/honeypot-attacks/) — interactive replay of 527 IPs, 2.7M attempts, 37 days of capture.

A few months ago I built a [Cloud-to-Ground Honeypot](/blog/building-cloud-to-ground-honeypot-soar) on Azure. It captures real RDP attacks, runs them through n8n SOAR workflows, and publishes a public threat feed as a [GitHub gist](https://gist.github.com/kyhomelab/eb6f58df93df4ea994b1a2a66d8610e6) that updates hourly. By the time I came back to it, the gist had logged **2.7 million attempts** from **527 unique attackers** across **69 countries** over a 37-day window.

That's a lot of real signal sitting in a flat text file.

So I decided to do something with it: turn the static threat feed into an interactive map you can scrub through time, complete with a cyberpunk-neon theme to match my [live homelab dashboard](/blog/building-live-homelab-dashboard).

Here's how it came together.

## The data source — and one trick that unlocked everything

The gist itself is just a plain text file:

```
# Cloud Honeypot Threat Feed
# Generated: 2026-02-13T05:00:52.673Z
# Total Unique Attackers: 301

IP ADDRESS       | COUNTRY    | CITY         | ATTACK VOLUME
----------------------------------------------------------------------
37.187.24.235    | France     | Roubaix      | Attempts: 119589
5.181.86.102     | Ukraine    | Unknown      | Attempts: 49015
...
```

n8n overwrites this file every hour with the latest aggregated state. Useful, but **only the latest snapshot is exposed via the gist's "Raw" URL** — you can't see what the file looked like yesterday.

Here's the trick: **gists are git repositories.** Every revision is a real commit. The browser UI shows recent revisions; the GitHub API caps history at 30; but if you `git clone` the gist directly, you get **all 800 commits** going back to the day n8n first started publishing.

```bash
git clone https://gist.github.com/kyhomelab/eb6f58df93df4ea994b1a2a66d8610e6.git honeypot-gist
cd honeypot-gist
git log --oneline | wc -l
# 800
```

That's the difference between a static threat feed and a 37-day time series.

## Parsing the timeline

For each commit, I needed to extract the file content and find the **first revision in which each IP appeared** — that's the "first seen" timestamp for the replay.

```python
log = subprocess.check_output(
    ["git", "-C", WORK, "log", "--reverse", "--pretty=format:%H|%cI", "main"],
    text=True
).strip().splitlines()

ips = {}
for sha, ts in (line.split("|", 1) for line in log):
    body = subprocess.check_output(["git", "-C", WORK, "show", f"{sha}:honeypot_blocklist.txt"], text=True)
    for line in body.splitlines():
        m = LINE_RE.match(line.strip())
        if not m: continue
        ip = m.group(1)
        if ip not in ips:
            ips[ip] = {"first_seen": ts, ...}
```

Walk all 800 commits, keep the earliest `ts` per IP. Done. 527 unique attackers across the full window.

## GeoIP enrichment

The gist already had country and sometimes city — but not lat/lon, which Leaflet needs to render markers. I batched the IPs through `ip-api.com` (free, no API key, 100 IPs per request, 15 requests/min limit):

```python
payload = json.dumps([
    {"query": ip, "fields": "query,country,countryCode,city,lat,lon,as,asname,status"}
    for ip in batch
]).encode()
req = urllib.request.Request("http://ip-api.com/batch", data=payload)
```

527 IPs across 6 batches with 4.5-second sleeps. ~30 seconds total, fully automated, fully free.

Output: a single `honeypot-attacks.json` file with everything the page needs — committed alongside the HTML so the dashboard is fully self-contained, no backend, no API keys, no recurring infrastructure cost.

## Building the map

Stack:

- **Leaflet** for the map engine — free, open source, mature
- **CartoDB Dark Matter** as the basemap — pure dark grayscale that lets the neon pins pop
- **Leaflet.markercluster** for dense regions (cyan-bordered cluster bubbles with magenta count labels)
- **Leaflet.heat** for the optional density heatmap layer
- **Vanilla JavaScript** for state management — no framework, no build step

Each pin is a `circleMarker` sized logarithmically by attempt count:

```javascript
const radius = Math.max(4, Math.min(18, Math.log10(Math.max(a.attempts, 1)) * 3));
```

Smallest pin: a single-attempt drive-by. Largest: a single attacker that tried **120,000 times**.

## The replay slider

The whole point of a 37-day dataset is to *see how it built up*. So I added a time slider with play/pause/speed controls:

- Drag → instantly recompute everything at that point in time (filter pins, recount stats, reshuffle bar charts)
- ▶ Play → auto-advance through the timeline
- Speed selector → 100s / 20s / 10s / 4s / 2s for full replay

For each tick, the script filters markers where `m._ts <= cutoff`, totals attempts, and updates the country/ASN bar charts and the four big stat tiles. Five hundred markers re-rendering at 10 Hz turned out to be smooth even on mobile — Leaflet's `chunkedLoading` cluster mode does most of the work.

## Cyberpunk neon

Same palette as my Grafana dashboard: cyan `#00F5FF`, magenta `#FF00AA`, electric yellow `#FFFF00`, neon green `#00FF9F`. The header title uses an animated gradient that shifts through all three colors on a six-second loop:

```css
.attack-page h1 {
  background: linear-gradient(90deg, #00F5FF 0%, #FF00AA 50%, #FFFF00 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: flow 6s linear infinite;
}
@keyframes flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

Stat tiles glow in their semantic color (`text-shadow: 0 0 20px currentColor`). The slider thumb has a cyan halo. Cluster bubbles glow magenta over a cyan base.

## The visual extras

Three optional layers turned the page from "static map with a slider" into something that actually feels like a threat-intel platform:

**🔥 Heatmap toggle.** Switches from discrete pins to a density gradient running cyan → green → yellow → magenta → hot red. Same data, dramatically different viewpoint — at world zoom you immediately see the attack hotspots in Eastern Europe, Russia, and parts of Asia.

**📡 Attack arcs.** When the slider plays forward and a new IP first appears, a magenta polyline arcs from the attacker's location to the honeypot's pin (Azure East US — Virginia, geographic equivalent at `37.43, -78.66`). Each arc is a quadratic bezier with a control point above the midpoint:

```javascript
const midLat = (lat0 + lat1) / 2 + Math.min(35, dist * 0.4);
```

The arcs animate via CSS — `stroke-dasharray: 1000, stroke-dashoffset: 1000` paired with a keyframe that drives the offset to 0, giving the line a "drawing in" effect over 1.2 seconds, then a 2-second fade.

**🎯 Target marker.** A pulsing pin at the honeypot's location with two concentric rings expanding outward in a 2-second loop. Pure CSS — `box-shadow` and `transform: scale()` keyframes.

## The disasters

A few problems I tripped over and one I deserved:

**The page rendered the homepage.** First time I visited the live URL, instead of seeing my map I saw the entire homepage — hero section, certifications, projects, the works. Took me ten minutes to figure out: my page used `layout: default`, and on this Jekyll theme `default` *statically includes the homepage sections* and ignores the page's own content. Switched to `layout: page` and it rendered properly.

**Jekyll's compress layout ate my JavaScript.** All my `// line comments` got concatenated onto a single line during build, which means everything after `// Map setup` until the next semicolon got commented out. Page would load but nothing would render. The fix was moving the JS to an external `/assets/js/honeypot-attacks.js` file — Jekyll doesn't process or compress assets in that path.

**The play button did nothing.** I clicked play and nothing happened. After staring at the code for a while I realized: the slider's initial value is 100 (showing the full state by default). Clicking play tried to advance from 100, immediately tripped the `next >= 100` end-condition, and silently called pause. Added a guard: if playing from end, snap back to 0 first.

**The default speed was 26 minutes per replay.** I'd anchored the playback math to the actual time window length (37 days). At "20x" speed, full replay would have taken **26 minutes** of wall-clock time. Rebased to "% slider movement per real second" so the dropdown options now mean what they say: 100 seconds, 20, 10, 4, or 2.

**The pie charts said "Value" four times.** Each piechart segment showed up in the legend as "Value" because Grafana doesn't auto-translate `legendFormat` to the field's display name on multi-target panels. The fix was overrides keyed by `byFrameRefID`:

```javascript
{
  matcher: { id: "byFrameRefID", options: "A" },
  properties: [{ id: "displayName", value: "Virtual Machines" }]
}
```

(Wait — that was the dashboard. Same lesson, different page.)

**Navbar got eaten by Leaflet.** When you scrolled past the map, the map's tile pane rendered *over* the fixed navbar. Leaflet uses internal z-index up to ~800 for its panes; Bulma's fixed navbar defaults to 30. Bumped the navbar to 1100 (scoped to this page only) and the stacking order behaved.

**The grey box around gradient text.** When I added `background-clip: text` to the gradient row dividers in the dashboard, every styled element grew a grey rectangle around it. Took a frustrating debug session to figure out: `background-image: linear-gradient(...)` doesn't reset the element's `background-color`, so the inherited grey from default styling was filling everything outside the text glyphs. One line fix: `background-color: transparent !important`.

## What it demonstrates

The technical surface I wanted to show with this page:

- **Reading non-obvious sources** — gists are git repos, history is queryable, time series can be reconstructed from "just" a flat file
- **Light data engineering** — git log walking, regex parsing, dedup-by-first-seen, GeoIP batch enrichment
- **Frontend data viz** — Leaflet, marker clustering, heatmaps, animated SVG paths, time-bounded filtering
- **Performance-aware UX** — 500-marker filtering at 10 Hz, capped simultaneous arc rendering, mobile-optimized breakpoints
- **Production-grade hosting** — fully static, no backend, no API keys, no costs, served by GitHub Pages with no rebuild needed when n8n updates the gist

## What's next

A few directions worth considering:

- **Per-IP attempt timeline** — click a pin to see how that attacker's attempt count grew across the 800 revisions (mini sparkline)
- **AbuseIPDB enrichment** — lookup confidence score for each IP, color-code pins, add a "show only IPs with >75% confidence" filter
- **Reverse DNS / PTR records** — adds character to popups (`*.contabo.host` tells a story)
- **Country choropleth layer** — fill country shapes by attack volume for a complementary global view
- **Live updating** — fetch the gist's latest revision client-side so the page auto-reflects new attacks without a republish

For now, the static snapshot is what I have. Open the [live page](/honeypot-attacks/), click ▶ PLAY, and watch a month's worth of attacks build up over twenty seconds.

Most fun I've had with a frontend project in a long time.
