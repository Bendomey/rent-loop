import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/modules/auth/login/root.dart';
import 'package:rentloop_manager/src/modules/auth/welcome/root.dart';
import 'package:rentloop_manager/src/modules/auth/workspace_select/root.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_application.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_booking.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/booking_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/root.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/modules/main/notifications/root.dart';
import 'package:rentloop_manager/src/modules/main/money/invoice_detail.dart';
import 'package:rentloop_manager/src/modules/main/money/root.dart';
import 'package:rentloop_manager/src/modules/main/properties/add.dart';
import 'package:rentloop_manager/src/modules/main/announcements/add.dart';
import 'package:rentloop_manager/src/modules/main/announcements/root.dart';
import 'package:rentloop_manager/src/modules/main/more/agreement.dart';
import 'package:rentloop_manager/src/modules/main/more/billing.dart';
import 'package:rentloop_manager/src/modules/main/more/documents.dart';
import 'package:rentloop_manager/src/modules/main/more/members.dart';
import 'package:rentloop_manager/src/modules/main/more/payment_accounts.dart';
import 'package:rentloop_manager/src/modules/main/more/root.dart';
import 'package:rentloop_manager/src/modules/main/more/settings.dart';
import 'package:rentloop_manager/src/modules/main/tenants/detail.dart';
import 'package:rentloop_manager/src/modules/main/tenants/root.dart';
import 'package:rentloop_manager/src/modules/main/properties/detail.dart';
import 'package:rentloop_manager/src/modules/main/properties/root.dart';
import 'package:rentloop_manager/src/modules/main/shell.dart';
import 'splash.dart';

// Used by notification-driven navigation from outside the widget tree.
GoRouter? appRouter;

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) {
    _ref.listen<AppStartupState>(
      appStartupProvider,
      (_, __) => notifyListeners(),
    );
  }
  final WidgetRef _ref;
}

GoRouter buildRoutes(WidgetRef ref) {
  final notifier = _RouterNotifier(ref);

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: notifier,
    redirect: (context, state) {
      final startup = ref.read(appStartupProvider);
      final loc = state.matchedLocation;

      switch (startup.status) {
        case AppStartupStatus.loading:
        case AppStartupStatus.error:
          if (loc == '/splash') return null;
          return '/splash';

        case AppStartupStatus.unauthenticated:
          if (loc.startsWith('/auth')) return null;
          return '/auth/welcome';

        case AppStartupStatus.workspaceSelect:
          if (loc == '/auth/workspace-select') return null;
          return '/auth/workspace-select';

        case AppStartupStatus.ready:
          if (loc == '/splash' || loc.startsWith('/auth')) return '/';
          return null;
      }
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/auth/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/auth/workspace-select', builder: (_, __) => const WorkspaceSelectScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => MainShell(shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                builder: (_, __) => const HomeScreen(),
                routes: [
                  GoRoute(
                    path: 'notifications',
                    builder: (_, __) => const NotificationsScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/properties',
                builder: (_, __) => const PropertiesScreen(),
                routes: [
                  GoRoute(path: 'add', builder: (_, __) => const AddPropertyScreen()),
                  GoRoute(
                    path: ':id',
                    builder: (_, state) => PropertyDetailScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/activity',
                builder: (_, __) => const ActivityScreen(),
                routes: [
                  GoRoute(
                    path: 'maintenance/:id',
                    builder: (_, state) => MaintenanceDetailScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'booking/:id',
                    builder: (_, state) => BookingDetailScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'application/:id',
                    builder: (_, state) => ApplicationDetailScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(path: 'add-booking',     builder: (_, __) => const AddBookingScreen()),
                  GoRoute(path: 'add-application', builder: (_, __) => const AddApplicationScreen()),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/money',
                builder: (_, __) => const MoneyScreen(),
                routes: [
                  GoRoute(
                    path: 'invoice/:id',
                    builder: (_, state) => InvoiceDetailScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                builder: (_, __) => const MoreScreen(),
                routes: [
                  GoRoute(
                    path: 'announcements',
                    builder: (_, __) => const AnnouncementsScreen(),
                    routes: [
                      GoRoute(path: 'add', builder: (_, __) => const AddAnnouncementScreen()),
                    ],
                  ),
                  GoRoute(path: 'documents',         builder: (_, __) => const DocumentsScreen()),
                  GoRoute(path: 'members',           builder: (_, __) => const MembersScreen()),
                  GoRoute(path: 'payment-accounts',  builder: (_, __) => const PaymentAccountsScreen()),
                  GoRoute(path: 'agreement',         builder: (_, __) => const AgreementScreen()),
                  GoRoute(path: 'billing',           builder: (_, __) => const BillingScreen()),
                  GoRoute(path: 'settings',          builder: (_, __) => const SettingsScreen()),
                  GoRoute(
                    path: 'tenants',
                    builder: (_, __) => const TenantsScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (_, state) => TenantDetailScreen(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  appRouter = router;
  return router;
}
