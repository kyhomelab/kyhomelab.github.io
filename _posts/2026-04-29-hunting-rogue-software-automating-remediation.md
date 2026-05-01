---
layout: post
title: "Hunting Rogue Software and Automating Remediation in Microsoft Defender"
date: 2026-04-29 10:00:00 -0500
categories: [cybersecurity, detection-engineering]
tags: [kql, microsoft-defender, powershell, remediation, threat-hunting, rogue-rmm, pua, detection-engineering, soc]
author: Kyle Stanley
description: "How I built KQL detection rules to hunt unauthorized browsers and rogue RMM tools across endpoints, then automated silent remediation with PowerShell scripts."
excerpt: "Unauthorized software running on corporate endpoints is a blind spot that attackers love to exploit. I built a detection and remediation pipeline using KQL, Defender custom detection rules, and PowerShell to find and remove rogue RMM tools and PUA browsers silently."
post-image: /assets/images/posts/2026-04-29-hunting-rogue-software.jpg
---

# Hunting Rogue Software and Automating Remediation in Microsoft Defender

Unauthorized software on corporate endpoints is one of those problems that sits in the gap between security and IT operations. Users install personal browsers. Free tools bundle PUAs. And sometimes, rogue remote management tools show up with no clear explanation — running as SYSTEM, calling home to relay servers, and sitting unnoticed for weeks.

This post walks through how I built a detection and remediation pipeline to find and remove unauthorized software across an enterprise environment using Microsoft Defender for Endpoint, KQL, and PowerShell.

## Why This Matters

Remote management tools like AnyDesk, TeamViewer, and RustDesk are legitimate software — but when they show up on endpoints without authorization, they're effectively backdoors. Attackers use them for persistence because they blend in with normal IT operations and don't trigger traditional malware detections.

PUA browsers like Wave Browser, Shift Browser, and OneStart are a different flavor of the same problem. They bundle themselves with other software, resist uninstallation, create scheduled tasks to relaunch themselves, and often ship with telemetry that sends browsing data to third parties.

Both categories need to be detected, investigated, and removed.

## Phase 1: Detection with KQL

The foundation of this project is a KQL query that runs in Microsoft Defender Advanced Hunting. The goal was to detect unauthorized software based on three signals:

1. **File name** — the obvious match
2. **Folder path** — catches software installed in vendor-specific directories even if the binary is renamed
3. **Product metadata** — pulls from the binary's version info, which persists even if someone renames the executable

```kql
DeviceProcessEvents
| where FileName has_any (
    "shift.exe",
    "wavebrowser.exe",
    "onestart.exe",
    "oneai.exe",
    "anydesk.exe",
    "teamviewer.exe",
    "TeamViewer_Service.exe",
    "SplashtopStreamer.exe",
    "rustdesk.exe",
    "meshagent.exe",
    "supremo.exe"
    )
    or FolderPath has_any (
    "Shift Technologies",
    "WaveBrowser",
    "OneStart",
    "OneAI",
    "AnyDesk",
    "TeamViewer"
    )
    or ProcessVersionInfoProductName has_any (
    "Shift",
    "Wave Browser",
    "OneStart",
    "OneAI",
    "AnyDesk",
    "TeamViewer"
    )
| summarize ExecutionCount = count(), LastSeen = max(Timestamp) by DeviceName, AccountName, FileName
| sort by ExecutionCount desc
```

The `ProcessVersionInfoProductName` field is the key differentiator. It's embedded in the binary's metadata — even if someone renames `wavebrowser.exe` to `chrome.exe`, the product name still reads "Wave Browser."

### Excluding Authorized Tools

Our environment uses ScreenConnect as the approved RMM tool. Any RMM tool that isn't ScreenConnect is unauthorized. The query naturally handles this because ScreenConnect isn't in the detection list.

## Phase 2: Investigation

When the query returned results, the first hit was AnyDesk running on an endpoint. The process details told a story:

- **Running as SYSTEM** — installed as a Windows service, not just a one-time user execution
- **Parent process: services.exe** — confirmed service-level persistence
- **Command line: `"AnyDesk.exe" --finish-update --silent`** — it was silently updating itself
- **Present since mid-February** — over a month of unauthorized access

The next step was checking what AnyDesk was actually doing on the network:

```kql
DeviceNetworkEvents
| where DeviceName == "affected-endpoint"
| where InitiatingProcessFileName has "anydesk"
| project Timestamp, RemoteIP, RemotePort, RemoteUrl, InitiatingProcessCommandLine
| sort by Timestamp desc
```

This revealed active outbound connections to `relay-e24ffb83.net.anydesk.com` on port 443 — a legitimate AnyDesk relay server. The binary hash checked clean on VirusTotal, confirming it was the real AnyDesk software, not a trojanized version.

The concern wasn't malware. It was an unauthorized remote access channel running as a system service that nobody in IT had deployed or was monitoring.

## Phase 3: Automated Alerting

A query you run manually is useful for investigations. A query that runs itself is useful for operations. I converted the detection query into a **Custom Detection Rule** in Defender:

1. **Advanced Hunting** → run and validate the query
2. **Create detection rule** from the results
3. Configure:
   - **Frequency:** Every 1 hour
   - **Severity:** Medium
   - **Category:** Unwanted software
   - **MITRE:** T1219 (Remote Access Software)
4. Map entities: Device → `DeviceName`, User → `AccountName`, File → `FileName`
5. Start with **alert only** — no automated response actions yet

Now every time an unauthorized tool executes on any endpoint, an alert lands in the Incidents & Alerts queue automatically.

## Phase 4: Remediation

Detection without remediation is just a notification. I built PowerShell scripts designed to run through ScreenConnect Backstage (or Defender Live Response) to silently remove unauthorized software from endpoints.

### The Iteration Process

The first version was straightforward — kill the process, delete the folder, remove the scheduled task:

```powershell
$ErrorActionPreference = "SilentlyContinue"
Get-Process -Name "shift" | Stop-Process -Force
$UserProfiles = Get-ChildItem "C:\Users" -Directory
foreach ($Profile in $UserProfiles) {
    $ShiftPath = Join-Path $Profile.FullName "AppData\Local\Shift"
    if (Test-Path $ShiftPath) {
        Remove-Item -Path $ShiftPath -Recurse -Force
    }
}
Unregister-ScheduledTask -TaskName "ShiftLaunchTask" -Confirm:$false
```

It ran successfully and reported everything was removed — but the files were still there. The issue was that `$ErrorActionPreference = "SilentlyContinue"` was swallowing the removal errors, and `Remove-Item -Recurse` was failing silently on locked files.

### V2: Lessons Learned

The improved version addressed three problems:

1. **Kill the scheduled task first** — Shift's `ShiftLaunchTask` was relaunching the process before the script could delete the files
2. **Double process kill with a delay** — ensures handles are fully released
3. **Use `cmd /c rd /s /q` as the primary removal method** — more aggressive than `Remove-Item` for stubborn directories
4. **Verification step** — confirms deletion actually worked

```powershell
$ErrorActionPreference = "SilentlyContinue"
$Log = "C:\Windows\Temp\ShiftRemoval.log"

function Write-Log ($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $msg" | Out-File -Append -FilePath $Log
}

try {
    Write-Log "Starting Shift Browser removal"

    # Remove the scheduled task first so Shift can't relaunch
    Unregister-ScheduledTask -TaskName "ShiftLaunchTask" -Confirm:$false
    Write-Log "Removed ShiftLaunchTask scheduled task"

    # Double kill with delay
    Stop-Process -Name "shift" -Force
    Start-Sleep -Seconds 2
    Stop-Process -Name "shift" -Force
    Write-Log "Stopped Shift processes"

    $UserProfiles = Get-ChildItem "C:\Users" -Directory
    foreach ($Profile in $UserProfiles) {
        $ShiftPath = Join-Path $Profile.FullName "AppData\Local\Shift"
        if (Test-Path $ShiftPath) {
            cmd /c rd /s /q "$ShiftPath"
            if (Test-Path $ShiftPath) {
                Remove-Item -Path $ShiftPath -Recurse -Force
            }
            if (Test-Path $ShiftPath) {
                Write-Log "FAILED to remove $ShiftPath"
            } else {
                Write-Log "Removed $ShiftPath"
            }
        }
    }

    Write-Log "Shift Browser removal complete"
} catch {
    Write-Log "ERROR: $_"
}
```

Key design decisions:
- **Silent execution** — `$ErrorActionPreference = "SilentlyContinue"` with no `Write-Output`, so nothing is visible to the end user
- **Admin-only logging** — logs to `C:\Windows\Temp\` where only administrators have access
- **All user profiles** — loops through every profile under `C:\Users`, not just the logged-in user
- **Timestamped audit trail** — every action is logged for documentation

### Finding the Scheduled Tasks

One detail that required hands-on investigation was identifying the exact scheduled task names. Rather than using wildcards (which my manager flagged as too broad), I checked two machines with Shift installed:

```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "Shift*"} | Select-Object TaskName, TaskPath, State
```

Both machines only had `ShiftLaunchTask` at the root level. The update tasks (`ShiftUpdateTaskMachineCore`, `ShiftUpdateTaskMachineUA`) that a full installation would create weren't present — because Shift was installed as a PUA through software bundling, not a deliberate system-wide install.

## Phase 5: Prevention

Removing software after it's installed is reactive. Preventing it from running in the first place is the long-term goal.

### Custom Indicators

The quickest win is blocking by file hash in Defender:
- Settings → Endpoints → Indicators → File hashes
- Add the SHA256, set action to **Block and Remediate**
- Limitation: hash changes with every software update

### Web Content Filtering

Block the download sources:
- Settings → Endpoints → Web content filtering
- Block the **Web-based Email** and **Uncategorized** categories
- Add specific domains as URL indicators (e.g., `*.anydesk.com`)
- Requires **Network Protection** enabled in block mode for Chrome/Firefox coverage

### AppLocker (Long-term)

For persistent prevention that survives software updates:
- **Publisher-based rules** block based on the digital signature, not the hash
- Even if the version changes, the publisher ("Shift Technologies", "Wavesor") stays the same
- Deploy via Group Policy or Intune Custom OMA-URI
- Start in **Audit mode** before enforcing

## Takeaways

Building this pipeline reinforced a few things:

1. **Detection needs multiple signals.** File names catch the obvious cases. Folder paths catch renamed binaries. Product metadata catches everything else.

2. **Automated alerts beat manual hunting.** A Custom Detection Rule that runs every hour catches what a weekly hunting session would miss.

3. **Remediation scripts need iteration.** The first version looked correct and reported success — but the files were still there. Silent error suppression is a double-edged sword. Always add verification.

4. **Prevention is layered.** Hash indicators for immediate blocking, web filtering for download prevention, AppLocker for long-term enforcement. No single layer covers everything.

5. **PUAs are harder than malware.** Malware gets flagged by EDR. PUAs are technically legitimate software — they won't trigger antivirus detections. You need custom detection rules to find them.

The scripts and KQL queries from this project are available in my [PowerShell Scripts](https://github.com/kyhomelab/Powershell-Scripts) and [KQL Queries](https://github.com/kyhomelab/kql-queries) repositories.
