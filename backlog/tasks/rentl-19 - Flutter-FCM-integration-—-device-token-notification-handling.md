---
id: RENTL-19
title: Flutter FCM integration — device token + notification handling
status: To Do
assignee: []
created_date: '2026-03-09 20:38'
updated_date: '2026-03-09 20:48'
labels: []
dependencies: []
priority: medium
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate firebase_messaging into the Flutter app to receive push notifications and send the FCM device token to the Go backend. Depends on RENTL-18 (Firebase project setup).

Packages to add:
- firebase_core
- firebase_messaging

Implementation:
1. Initialize Firebase in main.dart (FirebaseOptions from config files)
2. Request notification permissions on app start (iOS requires explicit permission prompt)
3. Register FCM token after OTP verification succeeds — in lib/src/modules/auth/verify/root.dart _handleVerify(), after verifyOtp() returns success and before context.go('/'). At this point the JWT is already stored, so the backend call is authenticated:
   - Call FirebaseMessaging.instance.getToken()
   - POST token to backend via a new RegisterFcmTokenNotifier (calls RENTL-20 endpoint)
   - Fire-and-forget — do not block navigation on failure
4. Handle token refresh: listen to FirebaseMessaging.instance.onTokenRefresh and re-POST to backend
5. Handle foreground notifications: FirebaseMessaging.onMessage stream → show in-app SnackBar or banner
6. Handle background/terminated taps: FirebaseMessaging.onMessageOpenedApp → navigate to relevant screen
7. Store FCM token in tokenManagerProvider alongside JWT for easy access

References:
- lib/src/modules/auth/verify/root.dart:91 (_handleVerify success block — token registration hook point)
- lib/src/architecture/ (tokenManagerProvider)
- lib/src/navigation/splash.dart (auth init flow)
<!-- SECTION:DESCRIPTION:END -->
