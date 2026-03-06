---
id: DRAFT-23
title: Create Cloudflare Worker to serve R2 bucket objects privately
status: Draft
assignee: []
created_date: '2026-03-05 08:52'
labels:
  - infrastructure
  - security
  - cloudflare
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a Cloudflare Worker to reroute all bucket object access, then move our R2 bucket back to private access. This enables controlled public access with rate limiting, auth, and transformations.

Approach: Keep bucket private but serve through a Cloudflare Worker (most secure).

Example Worker route:
https://cdn.myapp.com/* → Worker → R2 bucket

This allows us to add access control, caching, image transformations, and rate limiting at the edge while keeping the underlying bucket fully private.
<!-- SECTION:DESCRIPTION:END -->
