---
id: RENTL-18
title: Firebase project setup for FCM
status: To Do
assignee: []
created_date: '2026-03-09 20:38'
updated_date: '2026-03-09 20:41'
labels: []
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create and configure a Firebase project to enable FCM for the RentLoop Flutter app. Prerequisite for all other FCM tasks (RENTL-17).

1. Create Firebase project at console.firebase.google.com
2. Add Android app and download google-services.json → android/app/
3. Add iOS app and download GoogleService-Info.plist → ios/Runner/
4. Enable Cloud Messaging in Firebase console
5. Gitignore both config files
6. Store FCM service account JSON securely (1Password) for Go backend use

Acceptance criteria:
- Firebase project exists with Android and iOS apps registered
- google-services.json in android/app/ and GoogleService-Info.plist in ios/Runner/
- Both config files are gitignored
- FCM service account JSON stored securely for backend use
<!-- SECTION:DESCRIPTION:END -->
