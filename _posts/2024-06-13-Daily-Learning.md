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

First off, I got a new job as an IT Specialist at Smartlink Group. My responsibilities cover a wide range of Infrastructure within the company. I'll update below what some of those responsibilities are once I start taking on more. I wanted to keep a personal log of the things I am learning everyday, the stuff I research, and the projects I am doing or participating in. This is a way to keep a log, as well as hold myself accountable. I will discuss the project outlines, and the stuff I learn, but will ultimately link it to my [Github]("https://github.com/kyhomelab").

### Applications I use on a daily basis (Will be updated as I use them, or IT stack changes)
* Crowdstrike
* PhishER
* Meraki Dashboard
* Kace (for asset management)
* BookStack (Internal Knowledgebase)

#### June 18, 2024
Looking more into Crowdstrike, we got an alert through the Slack integration and was pinged at 11:37pm June 17th. Im going to go through my though process of learning about this detection and seeing what information I can gather, as well as any actions I have taken.

[See the detection SC Here](https://imgur.com/a/8KRlB8P.jpg)

First thing that I notice is the description:

> A file written to the file-system was classified as Adware/PUP based on its SHA256 hash.

<br>
So first, what is PUP?

> A PUP is a potentially unwanted program that is often installed when other software is installed on the computer. Typically, a PUP serves as a marketing tool and often modifies browser settings or displays unwanted advertisements. The most common form of PUP is adware.
>
> [source](https://usa.kaspersky.com/resource-center/definitions/what-is-pup-pua)

<br>
So, what is adware?

> A type of malware that displays unwanted advertisements on your computer or device. Adware is commonly activated unknowingly when users are trying to install legitimate applications that adware is bundled with.

<br>
The file that was quarantined was "f_00308a" with the file path "\AppData\Local\Google\Chrome\User Data\Profile 4\Cache\Cache_Data\f_00308a"
Since it was quarantined there is no other action that needs be taken, since it was classified as a low threat, as well as automatically quarantined. If any new info comes up about this, i'll put it here.

#### June 17, 2024
Today, did not do all too much.
I sent out some laptops, took in some inventory, and got a nice sub from The Big Cheese.
I took more look into using our Bookstack and even created a KB for provisioning a new laptop, from start to finish. 
[Click Here](https://imgur.com/aIREPSz) if you want to see the first iteration of the KB I made. Trying to figure out some ways to make it look nice, kinda like my GitHub, but I think it gets the point across. 

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