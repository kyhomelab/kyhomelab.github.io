---
layout: post
title: "Segmenting the Lab with OPNsense"
post-image: https://img.freepik.com/free-vector/cute-astronaut-flying-rocket-cartoon-vector-icon-illustration-science-technology-icon-isolated_138676-4767.jpg
date: 2025-12-16
description: "Establishing a secure, isolated SOC Lab environment using OPNsense as the edge gateway."
tags: [opnsense, homelab, security, network]
---

# Segmenting the Lab with OPNsense

## Project Overview
**Goal:** To establish a secure, isolated SOC Lab environment using OPNsense as the edge gateway. The objective is to ensure the Lab network (`10.0.0.1/24`) has internet access but is completely segmented from the existing Home network (`192.168.1.x`), preventing any accidental interaction or "bleed-over" from vulnerable/infected lab machines to personal devices.

## Network Topology
*   **WAN Interface (Home Network):** `192.168.1.159` (DHCP from Home Router)
*   **LAN Interface (Lab Network):** `10.0.0.1` (Static Gateway for Lab VMs)

## Challenge 1: The "Chicken and Egg" Access Issue
**The Problem:**
Upon initial installation, OPNsense blocks all access on the WAN port by default (security best practice). However, the management computer was located on the WAN network (`192.168.1.x`), making it impossible to access the web GUI to configure the LAN interface.

**The Solution (Console Override):**
1.  Accessed the OPNsense shell directly via the hypervisor console.
2.  Temporarily disabled the packet filter firewall to bypass block rules:
    ```bash
    pfctl -d
    ```
3.  Accessed the GUI via the WAN IP (`https://192.168.1.159`).
4.  Created a temporary firewall rule on the WAN interface to **allow HTTPS traffic** from the management PC.
5.  Re-enabled the packet filter (`pfctl -e`).

## Challenge 2: Configuring LAN and DHCP
**The Configuration:**
Using the OPNsense console **Option 2 (Set Interface IP Address)**, the LAN interface was configured:
*   **IP:** `10.0.0.1/24`
*   **DHCP Server:** Enabled (Range `10.0.0.100` - `10.0.0.200`)

**Troubleshooting:**
The Kali Linux VM on the LAN initially failed to connect. This was resolved by forcing a DHCP release/renew (`sudo dhclient -r && sudo dhclient -v`), confirming connectivity to the gateway.

## Challenge 3: Network Segmentation (Firewall Rules)
**The Goal:** Block Lab (LAN) $\rightarrow$ Home (WAN), but Allow Lab $\rightarrow$ Internet.

**Step 1: Creating the Alias**
To simplify rules, an Alias was created to represent all private network ranges.
*   **Name:** `RFC1918_Networks`
*   **Type:** Network(s)
*   **Content:**
    *   `192.168.0.0/16`
    *   `10.0.0.0/8`
    *   `172.16.0.0/12`

**Step 2: The Logic Error (DNS Blocking)**
Initially, a block rule was placed to deny access to `RFC1918_Networks`.
*   **Result:** Internet connectivity on the Lab machine ceased.
*   **Root Cause:** The OPNsense gateway itself (`10.0.0.1`) falls within the `10.0.0.0/8` range defined in the Alias. The block rule was preventing the Lab machine from reaching the gateway for DNS resolution (UDP 53). Internet IPs (`8.8.8.8`) were pingable, but domain names were not.

**Step 3: The Final Correct Rule Order**
The firewall rules were re-ordered to ensure the Gateway/DNS is accessible *before* the block rule applies.

**Final LAN Rule Hierarchy (Top to Bottom):**
1.  **Anti-Lockout Rule:** (System Default) Allows admin access.
2.  **Allow Gateway Access:**
    *   *Action:* Pass
    *   *Source:* LAN net
    *   *Destination:* LAN address (The Firewall itself)
    *   *Purpose:* Allows DNS, Gateway Ping, and GUI access.
3.  **Block Private Networks:**
    *   *Action:* Block
    *   *Source:* LAN net
    *   *Destination:* `RFC1918_Networks` (Alias)
    *   *Purpose:* Prevents Lab from accessing Home Network (Printer, NAS, PC).
4.  **Allow Internet (Default):**
    *   *Action:* Pass
    *   *Source:* LAN net
    *   *Destination:* * (Any)
    *   *Purpose:* Allows traffic to the internet (since it didn't match the private IP block rule).

## Outcome
The OPNsense router is now successfully routing traffic for the lab. The environment is isolated; the "infected" lab machines can reach the internet to download tools but cannot ping or access the host home network.
