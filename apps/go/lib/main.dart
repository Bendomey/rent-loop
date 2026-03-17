import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/navigation/routes.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:rentloop_go/src/lib/sentry_config.dart';

import 'src/app.dart';
import 'src/navigation/notification_handler.dart';
import 'src/repository/providers/maintenance_badge_provider.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background message handler runs in an isolate — no UI access here.
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp();
  }
}

Future<void> _handleNotificationTap(RemoteMessage message) async {
  final context = navigatorKey.currentContext;
  if (context == null || !context.mounted) return;

  final container = ProviderScope.containerOf(context);

  final leaseId = message.data['lease_id'] as String?;
  if (leaseId != null) {
    final activeLease = container.read(currentLeaseNotifierProvider);
    if (activeLease?.id != leaseId) {
      final leases = container.read(allLeasesProvider);
      final match = leases.where((l) => l.id == leaseId).firstOrNull;
      if (match == null) {
        appRouter?.go('/');
        return;
      }
      await container
          .read(currentLeaseNotifierProvider.notifier)
          .setLease(match);
    }
  }

  // Refresh the MR badge count in the background for any MAINTENANCE notification.
  if (message.data['type'] == 'MAINTENANCE') {
    container.invalidate(mrStatsProvider);
  }

  final path = notificationMessageToPath(message);
  if (path != null) appRouter?.push(path);
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

  // Handle notification tap when app was fully terminated (cold start).
  // Store the message and navigate once auth completes (see routes.dart redirect).
  pendingNotificationMessage = await FirebaseMessaging.instance
      .getInitialMessage();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarBrightness: Brightness.dark,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  await SentryConfig.init();
  runApp(const ProviderScope(child: MyApp()));
}
