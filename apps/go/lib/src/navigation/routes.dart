import 'package:rentloop_go/src/architecture/architecture.dart';
// import 'package:rentloop_go/src/lib/analytics_service.dart';
import 'package:rentloop_go/src/modules/modules.dart';
// import 'package:rentloop_go/src/repository/repository.dart';
import 'splash.dart';
import 'main_navigator.dart';

import 'package:flutter/widgets.dart';

late GlobalKey<NavigatorState> navigatorKey;
late GlobalKey<NavigatorState> shellNavigatorKey;

GoRouter buildRoutes() {
  navigatorKey = GlobalKey();

  return GoRouter(
    observers: [
      // Track page views with Firebase Analytics
      // AnalyticsService.observer,
    ],
    navigatorKey: navigatorKey,
    restorationScopeId: 'rentloop-router',
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        name: "SplashScreen",
        builder: (context, state) => const NavigationLoader(),
      ),
      GoRoute(
        path: '/auth',
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
                builder: (context, state) => const MaintenanceScreen(),
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
    ],
  );
}
