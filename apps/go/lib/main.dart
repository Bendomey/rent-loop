import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/navigation/routes.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:rentloop_go/src/lib/sentry_config.dart';

import 'src/app.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background message handler runs in an isolate — no UI access here.
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp();
  }
}

void _handleNotificationTap(RemoteMessage message) {
  final type = message.data['type'] as String?;
  switch (type) {
    case 'ANNOUNCEMENT':
      appRouter?.push('/more/announcements');
    case 'INVOICE':
      appRouter?.push('/payments');
    case 'LEASE':
      appRouter?.push('/more/lease-details');
  }
}

void main() async {
  SentryWidgetsFlutterBinding.ensureInitialized();
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp();
  }
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    final context = navigatorKey.currentContext;
    if (context != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message.notification?.title ?? 'New notification'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  });

  FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarBrightness: Brightness.dark,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  await SentryConfig.init();
  runApp(const ProviderScope(child: MyApp()));
}
