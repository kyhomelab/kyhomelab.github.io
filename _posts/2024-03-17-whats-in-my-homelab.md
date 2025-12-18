---
title: What's in My HomeLab
layout: post
post-image: "https://i.imgur.com/mnMRGcK.jpg"
description: A detailed look into my HomeLab environment for learning and experimentation.
tags:
- homelab
- virtualization
- networking
---

## My HomeLab Project

Welcome to my HomeLab project! Here, I leverage the power of Proxmox to create a versatile and dynamic environment for testing and experimenting with various technologies. This robust home-based laboratory serves as a playground for honing my skills in virtualization, networking, and system administration.

## Hardware Components

* **Ryzen 5 5600X 6-core Processor**
* **MSI B550-A Pro Mobo**
* **128gb DDR4 RAM**
* **PNY 3060 GPU**
* **Be Quiet! A240mm AIO**

* **Cisco Business 110 Switch**
* **Cisco SG 300-28P Managed Switch (added 2/27/24)**
* **Dual Gigabit LAN Network Card (added 11/30/23)**

## Software Used

* **Proxmox** 

## Set Up and Proxmox Dashboard

**[ProxMox Dashboard](https://i.imgur.com/vMmtNNH.png)**  This image showcases the Proxmox Dashboard, the central hub for managing virtual machines and containers within my HomeLab.  Below this image, you'll find a list of currently running VMs and Containers.

## Virtual Machines

### Win 10 VM with GPU Passthrough

This virtual machine utilizes GPU passthrough (NVIDIA RTX 3060) for a variety of purposes, including coding, gaming, learning, and remote research.

**Purpose:**

* Go-to VM for coding, gaming, learning, and research.
* Leverages GPU passthrough for optimal gaming performance.

**Usage:**

1. Set up GPU passthrough in Proxmox for the NVIDIA RTX 3060.
2. Install Windows 10 on the VM and configure for remote access.
3. Utilize the VM for coding, gaming, learning, and remote research purposes.

### Kali Linux

Kali Linux serves as a dedicated virtual machine for penetration testing and ethical hacking within a secure and controlled environment.

**Purpose:**

* Provides a secure and controlled environment for ethical hacking and penetration testing.

**Usage Examples:**

* **Security Auditing:** Identify vulnerabilities in systems and networks through comprehensive security audits.
* **Wireless Network Assessment:** Test and secure wireless networks using tools like Aircrack-ng.
* **Web Application Testing:** Assess and secure web applications by identifying and fixing vulnerabilities.
* **Forensic Analysis:** Utilize forensic tools for digital forensics and incident response.
* **Password Cracking:** Test password strength using tools like John the Ripper and Hashcat.
* **Network Scanning:** Conduct network reconnaissance with tools like Nmap.

## Networking with Tailscale

Tailscale creates a secure mesh network, granting remote access to my HomeLab devices and services from anywhere in the world. This simplifies networking and eliminates the need for manual VPN setup and configuration, while offering encrypted connections and access control for enhanced security.

## PiHole Container

The Pi-hole container functions as a network-wide ad blocker, DNS sinkhole, and DHCP server. It enhances privacy, security, and network performance by blocking unwanted ads and malicious domains at the network level.

**Features and Functionality:**

* **Ad Blocking:** Pi-hole blocks ads, trackers, and malicious domains at the DNS level, providing an ad-free browsing experience for all devices on the network.
* **Web Interface:** Access the Pi-hole web interface to monitor statistics, manage blacklists/whitelists, and configure settings.
* **DHCP Server (Optional):** Pi-hole can optionally function as a DHCP server, simplifying IP address management on the network.
* **Logging and Analytics:** Pi-hole logs DNS queries, allowing for detailed analytics on network activity and blocked requests.

## Ubuntu VM for Learning Linux

This Ubuntu VM provides a platform for hands-on learning with the Linux operating system.

**Purpose:**

* Provides a platform to gain familiarity with the Linux operating system.
* **Learning Objectives:** Use this VM to practice Linux command-line operations, file manipulation, and system administration tasks.
* **Software Exploration:** Experiment with installing, updating, and removing software packages using the package manager.
* **Networking Concepts:** Explore networking configurations, IP addressing, and basic network troubleshooting.
* **Security Practices:** Learn about user authentication, firewall configuration, and system updates.

## TrueNAS for Network-Attached Storage

TrueNAS is deployed for efficient network-attached storage, providing a centralized storage solution for data management.

**Features and Benefits:**

* **Centralized Storage:** TrueNAS offers a centralized storage solution for all your data needs, simplifying data management and accessibility across your network.
* **Data Replication and Backups:** TrueNAS supports data replication and backups to ensure data redundancy and protection against data loss.
* **File Sharing Protocols:** TrueNAS supports various file sharing protocols like SMB, NFS, and AFP, enabling seamless integration with different operating systems and devices on your network.
* **Scalability and Flexibility:** TrueNAS offers scalability and flexibility, allowing you to expand storage capacity as your data needs grow.
* **ZFS File System:** TrueNAS leverages the ZFS file system, renowned for its data integrity, self-healing capabilities, and features like snapshots and replication.

**Implementation in My HomeLab:**

* Installed TrueNAS on a dedicated server within my HomeLab environment.
* Configured storage pools and datasets to organize and manage my data.
* Set up file sharing permissions to grant access to specific user groups and devices on the network.
* Utilize TrueNAS for data storage purposes, including backups, media files, and shared documents.

**Conclusion**

My HomeLab serves as a valuable platform for learning, experimentation, and honing my technical skills. By leveraging virtualization technologies like Proxmox and exploring various software solutions like TrueNAS, Pi-hole, and Kali Linux, I gain practical experience in system administration, networking, and security. This hands-on approach empowers me to confidently navigate emerging technologies and effectively manage my IT infrastructure.
