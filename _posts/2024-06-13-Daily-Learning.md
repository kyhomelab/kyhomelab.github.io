---
title: 
layout: post
# Add an image for your homelab here
post-image: "https://i.imgur.com/V4nmErY.png"
description: This is a personal log for my daily learning at my new job.
tags:
- Learning
- Applications
- Networking
- Journal
---

## The Purpose of this

First off, I got a new job as an IT Specialist at Smartlink Group. My responsibilities cover a wide range of Infrastructure within the company. I'll update below what some of those responsibilities are once I start taking on more. I wanted to keep a personal log of the things I am learning everyday, the stuff I research, and the projects I am doing or participating in. This is a way to keep a log, as well as hold myself accountable. I will discuss the project outlines, and the stuff I learn, but will ultimately link it to my [Github]("https://github.com/kyhomelab").

### Applications I use on a daily basis (Will be updated as I use them, or IT stack changes)
* Crowdstrike
* PhishER
* Meraki Dashboard

#### June 13, 2024
Taking a look at PhishER for our reported phishing system, I wanted to look and try to learn a few things. I picked this email here, and wanted to dive into it and see what I can learn on the platform. You can probably see here that it is a very obvious phishing email.
[PhishER](https://imgur.com/a/vz4VNNl)
- What is SHA1
```bash
SHA-1 or Secure Hash Algorithm 1 is a cryptographic algorithm which takes an input and produces a 160-bit (20-byte) hash value.
The main application of SHA1 is to protect communications from being intercepted by outside parties.
From a given data input, SHA1 generates a fixed-size, singular, and irreversible hash value. 
The integrity of the data can then be confirmed by comparing this hash value to the original hash value. 
This makes it possible to confirm that the data was not changed or tampered with in any manner during transmission.
```
- The other important question, what is SHA256 then. SHA1 has been considered insecure since 2005.
```bash
Known as SHA2(256) it is the successor to SHA1 with a higher level of security
[Storing passwords in their raw form is risky. SHA 256 and salt (a random value) are employed to securely hash passwords before storing them. When users log in, their entered password is hashed and compared to the stored hash, verifying authenticity without revealing the actual password. This shields sensitive information from potential breaches](https://medium.com/@madan_nv/a-deep-dive-into-sha-256-working-principles-and-applications-a38cccc390d4) 
```