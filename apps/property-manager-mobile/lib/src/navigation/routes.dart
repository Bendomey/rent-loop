import 'package:go_router/go_router.dart';

import '../modules/activity/activity_screen.dart';
import '../modules/auth/sign_in_screen.dart';
import '../modules/home/home_screen.dart';
import '../modules/money/money_screen.dart';
import '../modules/more/more_screen.dart';
import '../modules/notifications/notifications_screen.dart';
import '../modules/properties/properties_screen.dart';
import '../modules/workspace/choose_workspace_screen.dart';
import 'main_shell.dart';

GoRouter buildRouter() {
  return GoRouter(
    initialLocation: '/sign-in',
    routes: [
      GoRoute(
        path: '/sign-in',
        name: 'SignIn',
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: '/choose-workspace',
        name: 'ChooseWorkspace',
        builder: (context, state) => const ChooseWorkspaceScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'Notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                name: 'Home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/properties',
                name: 'Properties',
                builder: (context, state) => const PropertiesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/activity',
                name: 'Activity',
                builder: (context, state) => const ActivityScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/money',
                name: 'Money',
                builder: (context, state) => const MoneyScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                name: 'More',
                builder: (context, state) => const MoreScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
