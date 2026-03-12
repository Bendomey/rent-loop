import 'package:rentloop_go/src/architecture/architecture.dart';
// import 'package:rentloop_go/src/lib/analytics_service.dart';
import 'package:rentloop_go/src/modules/modules.dart';
// import 'package:rentloop_go/src/repository/repository.dart';
import 'splash.dart';
import 'main_navigator.dart';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

late GlobalKey<NavigatorState> navigatorKey;
late GlobalKey<NavigatorState> shellNavigatorKey;

GoRouter buildRoutes(WidgetRef ref, Listenable refreshListenable) {
  navigatorKey = GlobalKey();

  return GoRouter(
    observers: [
      // Track page views with Firebase Analytics
      // AnalyticsService.observer,
    ],
    navigatorKey: navigatorKey,
    restorationScopeId: 'rentloop-router',
    initialLocation: '/splash',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final startup = ref.read(appStartupNotifierProvider);
      final loc = state.matchedLocation;

      switch (startup.status) {
        case AppStartupStatus.loading:
        case AppStartupStatus.error:
          // Hold at splash; don't interrupt an active auth flow.
          if (loc == '/splash' || loc.startsWith('/auth')) return null;
          return '/splash';

        case AppStartupStatus.unauthenticated:
          if (loc.startsWith('/auth')) return null;
          return '/auth';

        case AppStartupStatus.ready:
          if (loc == '/splash' || loc.startsWith('/auth')) return '/';
          return null;
      }
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: "SplashScreen",
        builder: (context, state) => const NavigationLoader(),
      ),
      GoRoute(
        path: '/auth',
        name: "WelcomeScreen",
        builder: (context, state) => const WelcomeScreen(),
        routes: [
          GoRoute(
            path: 'login',
            name: "LoginScreen",
            builder: (context, state) => const LoginScreen(),
            routes: [
              GoRoute(
                path: 'verify/:phone',
                name: "VerifyScreen",
                builder: (context, state) {
                  final phone = state.pathParameters['phone']!;
                  return VerifyScreen(phone: phone);
                },
              ),
            ],
          ),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainNavigator(navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                name: "HomeScreen",
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/payments',
                name: "Payments",
                builder: (context, state) => const PaymentsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/maintenance',
                name: "Maintenance",
                builder: (context, state) {
                  return MaintenanceScreen(
                    statusFilter: state.uri.queryParameters['status'],
                  );
                },
                routes: [],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                name: "More",
                builder: (context, state) => const MoreScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/more/lease-details',
        name: 'LeaseDetails',
        builder: (context, state) => const LeaseDetailsScreen(),
      ),
      GoRoute(
        path: '/more/announcements',
        name: 'Announcements',
        builder: (context, state) => const AnnouncementsScreen(),
      ),
      GoRoute(
        path: '/more/delete-account',
        name: 'DeleteAccount',
        builder: (context, state) => const DeleteAccountScreen(),
      ),
      GoRoute(
        path: '/maintenance/new',
        name: "NewMaintenanceRequest",
        builder: (context, state) => const NewMaintenanceScreen(),
      ),
      GoRoute(
        path: '/maintenance/:id',
        name: "MaintenanceDetail",
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return MaintenanceDetailsScreen(requestId: id);
        },
      ),
    ],
  );
}
