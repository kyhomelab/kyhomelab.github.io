---
title: Daily Learning Archive
layout: post
# Add an image for your homelab here
post-image: "https://i.imgur.com/riNf4yT.png"
description: This is a personal log for my daily learning at my new job.
tags:
- Learning
- Applications
- Networking
- Journal
- Cybersecurity
---

## The Purpose of this

First off, I got a new job as an IT Specialist at Smartlink Group. My responsibilities cover a wide range of Infrastructure within the company. I'll update below what some of those responsibilities are once I start taking on more. I wanted to keep a personal log of the things I am learning everyday, the stuff I research, and the projects I am doing or participating in. This is a way to keep a log, as well as hold myself accountable. I will discuss the project outlines, and the stuff I learn, but will ultimately link it to my [Github](https://github.com/kyhomelab).

### Applications I use on a daily basis (Will be updated as I use them, or IT stack changes)
* Crowdstrike
* PhishER
* Meraki Dashboard
* Kace (for asset management)
* BookStack (Internal Knowledgebase)

---

## January 5, 2024

**Topic: Docker Bridge Networks**

Learned about Docker networking modes. Bridge networks provide network isolation between containers. Containers on the same bridge can communicate, but are isolated from other bridges. User-defined bridges are better than the default - they provide automatic DNS resolution and better isolation control.

---

## January 18, 2024

**Topic: Defense in Depth Principle**

Reviewed defense in depth security strategy. No single control is perfect - layer multiple defensive controls so if one fails, others still protect. Physical security, network security, endpoint security, application security, data security. The goal is to increase attacker cost and create multiple detection opportunities.

---

## February 1, 2024

**Topic: PE File Structure**

Studied portable executable (PE) file format for malware analysis. Key sections: DOS header, PE header, sections (.text for code, .data for variables, .rsrc for resources). Packers compress/encrypt sections - detectable by high entropy values. Understanding PE structure helps identify suspicious executables.

---

## February 14, 2024

**Topic: Log Analytics Agent vs AMA**

Learned the difference between the legacy Log Analytics Agent (MMA) and the new Azure Monitor Agent (AMA). AMA offers better performance, DCR-based configuration, and multi-homing. Microsoft is deprecating MMA in August 2024, so migrating to AMA is important for Sentinel data collection.

---

## February 28, 2024

**Topic: PowerShell Filtering Syntax**

Studied PowerShell filter syntax. Server-side filtering with `-Filter` is fastest (query runs on DC). Client-side with `Where-Object` fetches everything then filters locally. For AD queries, always use `-Filter` when possible. Example: `Get-ADUser -Filter {Enabled -eq $false}` is much faster than piping to `Where-Object`.

---

## March 12, 2024

**Topic: Zeek Network Analysis**

Learned about Zeek (formerly Bro) for network security monitoring. Unlike signature-based IDS, Zeek focuses on logging network activity and protocol analysis. It extracts metadata, files, and can detect behavioral anomalies. Great for threat hunting and understanding normal network baselines.

---

## March 25, 2024

**Topic: KQL Join Kinds**

Studied KQL join flavors: `innerunique` (default, deduplicates left side), `inner` (keeps all matches), `leftouter` (all left records, nulls for unmatched right), `leftanti` (records in left NOT in right). Most Sentinel hunting queries use `innerunique` to correlate events without duplicates.

---

## April 10, 2024

**Topic: Threat Actor Attribution**

Learned about threat actor classification for Security+. Nation-state actors (APTs) have significant resources and long-term objectives. Cybercriminals are financially motivated. Hacktivists pursue ideological goals. Script kiddies use existing tools without deep understanding. Insider threats have legitimate access but malicious intent.

---

## April 22, 2024

**Topic: TCP Three-Way Handshake**

Reviewed TCP handshake for packet analysis. Client sends SYN, server responds with SYN-ACK, client acknowledges with ACK. SYN flood attacks send SYN packets without completing the handshake, exhausting server resources. Wireshark filter: `tcp.flags.syn==1 && tcp.flags.ack==0` shows SYN packets.

---

## May 8, 2024

**Topic: Firewall Rule Best Practices**

Studied firewall rule management principles: deny by default, document every rule with owner and business justification, review rules quarterly, remove unused rules, use groups instead of individual IPs, log denies for troubleshooting. Most breaches involve misconfigured or forgotten firewall rules.

---

## May 20, 2024

**Topic: Azure RBAC Scopes**

Azure RBAC works at four scope levels: Management Group > Subscription > Resource Group > Resource. Permissions are inherited down the hierarchy. Assign roles at the highest level that makes sense - subscription for broad access, resource group for project teams, resource for specific exceptions.

---

## June 13, 2024

Taking a look at PhishER for our reported phishing system, I wanted to look and try to learn a few things. I picked this email here, and wanted to dive into it and see what I can learn on the platform. You can probably see here that it is a very obvious phishing email.

[PhishER](https://imgur.com/a/vz4VNNl)

**What is SHA1?**

SHA-1 or Secure Hash Algorithm 1 is a cryptographic algorithm which takes an input and produces a 160-bit (20-byte) hash value. The main application of SHA1 is to protect communications from being intercepted by outside parties. From a given data input, SHA1 generates a fixed-size, singular, and irreversible hash value. The integrity of the data can then be confirmed by comparing this hash value to the original hash value. This makes it possible to confirm that the data was not changed or tampered with in any manner during transmission.

**What is SHA256?**

SHA1 has been considered insecure since 2005. Known as SHA2(256), it is the successor to SHA1 with a higher level of security. Storing passwords in their raw form is risky. SHA 256 and salt (a random value) are employed to securely hash passwords before storing them. When users log in, their entered password is hashed and compared to the stored hash, verifying authenticity without revealing the actual password. This shields sensitive information from potential breaches.

[Learn more about SHA-256](https://medium.com/@madan_nv/a-deep-dive-into-sha-256-working-principles-and-applications-a38cccc390d4)

---

## June 17, 2024

Today, did not do all too much.
I sent out some laptops, took in some inventory, and got a nice sub from The Big Cheese.
I took more look into using our Bookstack and even created a KB for provisioning a new laptop, from start to finish.
[Click Here](https://imgur.com/aIREPSz) if you want to see the first iteration of the KB I made. Trying to figure out some ways to make it look nice, kinda like my GitHub, but I think it gets the point across.

---

## June 18, 2024

Looking more into Crowdstrike, we got an alert through the Slack integration and was pinged at 11:37pm June 17th. Im going to go through my though process of learning about this detection and seeing what information I can gather, as well as any actions I have taken.

[See the detection SC Here](https://imgur.com/a/8KRlB8P.jpg)

First thing that I notice is the description:

> A file written to the file-system was classified as Adware/PUP based on its SHA256 hash.

So first, what is PUP?

> A PUP is a potentially unwanted program that is often installed when other software is installed on the computer. Typically, a PUP serves as a marketing tool and often modifies browser settings or displays unwanted advertisements. The most common form of PUP is adware.
>
> [source](https://usa.kaspersky.com/resource-center/definitions/what-is-pup-pua)

So, what is adware?

> A type of malware that displays unwanted advertisements on your computer or device. Adware is commonly activated unknowingly when users are trying to install legitimate applications that adware is bundled with.

The file that was quarantined was "f_00308a" with the file path "\AppData\Local\Google\Chrome\User Data\Profile 4\Cache\Cache_Data\f_00308a"

Since it was quarantined there is no other action that needs be taken, since it was classified as a low threat, as well as automatically quarantined. If any new info comes up about this, i'll put it here.

---

I was assigned my first project today.

I had pitched the idea 6/17 about the use of [Scribe](https://scribehow.com/)

I was doing documentation on setting up new computers, and assigning them to someone. Our asset manager is online, and when documenting steps for how to, where to click, etc etc, I remembered an application called Scribe.

Signed up for a new account, used the extension, and had showed my manager what it can do, and the usefulness of it.

He told me to create a task in Clickup, and now today, I'm tasked with reaching out to Sales and getting more information on the project. Here are the details of my first project:

> Go ahead and see what pricing would look like for 15 users.
>
> For Scribe, look at the team pro plan and the enterprise plan (believe you have to reach out to sales for the enterprise option).
>
> If there are some competitive alternatives lets investigate those as well.
>
> Key focuses
> - Export content into a format that we can easily import into our LMS system and Bookstack.
> - Ability to capture both web and desktop processes
>
> Nice to Have
> - SSO with SAML or Entra ID

I reached out to sales, so we shall see how this little project will go.
I'm all about streamlining processes and making things easier.

---

## June 25, 2024

**Topic: ATT&CK Navigator Heat Maps**

The MITRE ATT&CK Navigator uses color-coded matrices to visualize security coverage. You can layer multiple datasets - detection rules, red team tests, threat intel - to identify gaps. Export to JSON or Excel for reporting. Understanding coverage gaps helps prioritize security investments.

---

## July 3, 2024

**Topic: NIST Incident Response Lifecycle**

Reviewed the NIST 800-61 incident response framework: Preparation, Detection & Analysis, Containment/Eradication/Recovery, Post-Incident Activity. The key is that it's a cycle - lessons learned feed back into preparation. Most organizations fail at documentation and post-incident review.

---

## July 15, 2024

**Topic: Honeypot Types - Low vs High Interaction**

Studied honeypot classification. Low-interaction honeypots emulate services but don't allow deep attacker engagement - safer and easier to maintain. High-interaction honeypots are full systems that let attackers fully compromise them - riskier but provide better intelligence on TTPs. Medium-interaction is a balance between the two.

---

## July 28, 2024

**Topic: Wazuh Rule Levels and Frequency**

Learned about Wazuh rule severity levels (0-15) and how to use frequency/timeframe for alert aggregation. Level 0-4 = informational, 5-7 = notification, 8-11 = important, 12-15 = critical. The `<frequency>` tag with `<timeframe>` lets you detect repeated events - useful for brute force detection.

---

## August 10, 2024

**Topic: Azure NSG Default Rules**

Studied Azure NSG default security rules. Three inbound defaults: allow VNet traffic, allow Azure Load Balancer, deny all else. Three outbound: allow VNet traffic, allow internet, deny all else. You can't delete these, but you can override with higher priority (lower number) custom rules.

---

## August 23, 2024

**Topic: PowerShell Error Handling**

Learned proper error handling in PowerShell using Try/Catch/Finally blocks. Terminating errors stop execution and can be caught. Non-terminating errors continue running - use `-ErrorAction Stop` to make them terminating. The `$Error` automatic variable stores all errors from the current session.

---

## September 5, 2024

**Topic: Cipher Modes - CBC vs GCM**

Studied symmetric encryption cipher modes for Security+. CBC (Cipher Block Chaining) requires an IV and can be vulnerable to padding oracle attacks. GCM (Galois/Counter Mode) provides both encryption and authentication, making it more secure for modern applications. AES-GCM is the recommended standard for most use cases.

---

## September 19, 2024

**Topic: Kerberoasting Attack Technique**

Deep dive into Kerberoasting today. Attackers request TGS tickets for SPNs, then crack the tickets offline to recover service account passwords. Detection: look for RC4 encryption (0x17) in event 4769, or unusual volume of TGS requests. Prevention: strong passwords for service accounts, use gMSAs, monitor for offline cracking attempts.

---

## October 2, 2024

**Topic: Python Pandas DataFrames**

Learning pandas for log analysis and security data processing. DataFrames are like spreadsheets in Python - columns, rows, indexing. Key operations: `read_csv()`, `groupby()`, `merge()`, and `apply()`. Pandas makes it easy to correlate data from different sources and find patterns in large datasets.

---

## October 15, 2024

**Topic: Authentication Log Event IDs**

Memorized key Windows authentication event IDs for log analysis. 4624 = successful logon, 4625 = failed logon, 4768 = Kerberos TGT requested, 4769 = Kerberos service ticket requested, 4776 = NTLM authentication. Knowing these by heart speeds up incident investigation significantly.

---

## October 28, 2024

**Topic: Active Directory Tier Model**

Studied the AD administrative tier model for security. Tier 0 = domain controllers, enterprise admins. Tier 1 = servers and server admins. Tier 2 = workstations and end-user admins. The key principle: credentials should never flow from lower tiers to higher tiers. This prevents credential theft from workstations leading to domain compromise.

---

## November 10, 2024

**Topic: Suricata vs Snort IDS**

Compared Suricata and Snort intrusion detection systems. Both use signature-based detection, but Suricata offers multi-threading (better performance), native IPv6 support, and protocol detection regardless of port. Suricata also does file extraction and has better Lua scripting capabilities. Both are open-source and widely used.

---

## November 22, 2024

**Topic: KQL Query Performance Best Practices**

Learned key KQL optimization principles: filter early with `where`, use `summarize` instead of iterating, avoid wildcard searches when possible. The query execution order matters - parsers run before filters, so use native fields when you can. Understanding how KQL processes data helps write faster, more efficient queries.

---

## December 3, 2024

**Topic: MITRE ATT&CK Tactics vs Techniques**

Reviewed the structure of the MITRE ATT&CK framework. Tactics are the "why" - objectives like Initial Access, Persistence, Privilege Escalation. Techniques are the "how" - specific methods attackers use. Sub-techniques provide more granularity. Understanding this hierarchy helps organize detection rules and assess security coverage.

---

## December 15, 2024

**Topic: Logic Apps vs Azure Functions**

Studied the differences between Azure Logic Apps and Azure Functions for Sentinel automation. Logic Apps are low-code, GUI-based workflows - great for simple orchestration. Azure Functions require code but offer more flexibility and better performance for complex logic. Use Logic Apps for SOC playbooks, Functions for custom data processing.

---

## December 28, 2024

**Topic: STIX 2.1 Threat Intelligence Format**

Learned about STIX (Structured Threat Information Expression) 2.1 today - the standardized format for sharing threat intelligence. Key objects include Indicator, Malware, ThreatActor, and AttackPattern. Relationships connect these objects to show context. Understanding STIX is crucial for consuming and sharing IOCs across platforms.