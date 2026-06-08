import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/modules/auth/login/root.dart';
import 'package:rentloop_manager/src/modules/auth/welcome/root.dart';
import 'package:rentloop_manager/src/modules/auth/workspace_select/root.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_application.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_booking.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_maintenance.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/booking_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/root.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/modules/main/notifications/root.dart';
import 'package:rentloop_manager/src/modules/main/money/add_payment.dart';
import 'package:rentloop_manager/src/modules/main/money/invoice_detail.dart';
import 'package:rentloop_manager/src/modules/main/money/root.dart';
import 'package:rentloop_manager/src/modules/main/properties/add.dart';
import 'package:rentloop_manager/src/modules/main/properties/settings/hub.dart';
import 'package:rentloop_manager/src/modules/main/properties/settings/general.dart';
import 'package:rentloop_manager/src/modules/main/properties/settings/members.dart';
import 'package:rentloop_manager/src/modules/main/properties/settings/add_member.dart';
import 'package:rentloop_manager/src/modules/main/properties/settings/documents.dart';
import 'package:rentloop_manager/src/modules/main/announcements/add.dart';
import 'package:rentloop_manager/src/modules/main/announcements/root.dart';
import 'package:rentloop_manager/src/modules/main/more/agreement.dart';
import 'package:rentloop_manager/src/modules/main/more/billing.dart';
import 'package:rentloop_manager/src/modules/main/more/documents.dart';
import 'package:rentloop_manager/src/modules/main/more/add_member.dart';
import 'package:rentloop_manager/src/modules/main/more/my_profile.dart';
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
      GoRoute(
        path: '/auth/workspace-select',
        builder: (_, __) => const WorkspaceSelectScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => MainShell(shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/properties',
                builder: (_, __) => const PropertiesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/activity',
                builder: (_, __) => const ActivityScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/money', builder: (_, __) => const MoneyScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/more', builder: (_, __) => const MoreScreen()),
            ],
          ),
        ],
      ),

      // home routes
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),

      //property routes
      GoRoute(
        path: '/properties/add',
        builder: (_, __) => const AddPropertyScreen(),
      ),
      GoRoute(
        path: '/properties/:id',
        builder:
            (_, state) => PropertyDetailScreen(id: state.pathParameters['id']!),
        routes: [
          GoRoute(
            path: 'settings',
            builder:
                (_, state) =>
                    PropertySettingsHubScreen(id: state.pathParameters['id']!),
            routes: [
              GoRoute(
                path: 'general',
                builder:
                    (_, state) => PropertyGeneralSettingsScreen(
                      id: state.pathParameters['id']!,
                    ),
              ),
              GoRoute(
                path: 'members',
                builder:
                    (_, state) =>
                        PropertyMembersScreen(id: state.pathParameters['id']!),
                routes: [
                  GoRoute(
                    path: 'add',
                    builder:
                        (_, state) => AddPropertyMemberScreen(
                          id: state.pathParameters['id']!,
                        ),
                  ),
                ],
              ),
              GoRoute(
                path: 'documents',
                builder:
                    (_, state) => PropertyDocumentsScreen(
                      id: state.pathParameters['id']!,
                    ),
              ),
            ],
          ),
        ],
      ),

      // activity routes
      GoRoute(
        path: '/activity/maintenances/add',
        builder: (_, __) => const AddMaintenanceScreen(),
      ),
      GoRoute(
        path: '/activity/maintenances/:id',
        builder:
            (_, state) =>
                MaintenanceDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/activity/bookings/add',
        builder: (_, __) => const AddBookingScreen(),
      ),
      GoRoute(
        path: '/activity/applications/add',
        builder: (_, __) => const AddApplicationScreen(),
      ),
      GoRoute(
        path: '/activity/bookings/:id',
        builder:
            (_, state) => BookingDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/activity/applications/:id',
        builder:
            (_, state) =>
                ApplicationDetailScreen(id: state.pathParameters['id']!),
      ),

      // money routes
      GoRoute(
        path: '/money/invoices/:id',
        builder:
            (_, state) => InvoiceDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/money/record-payment',
        builder: (_, __) => const RecordPaymentScreen(),
      ),

      // more routes
      GoRoute(
        path: '/more/my-profile',
        builder: (_, __) => const MyProfileScreen(),
      ),
      GoRoute(
        path: '/more/announcements',
        builder: (_, __) => const AnnouncementsScreen(),
        routes: [
          GoRoute(
            path: 'add',
            builder: (_, __) => const AddAnnouncementScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/more/documents',
        builder: (_, __) => const DocumentsScreen(),
      ),
      GoRoute(
        path: '/more/members',
        builder: (_, __) => const MembersScreen(),
        routes: [
          GoRoute(
            path: 'add',
            builder: (_, __) => const AddMemberScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/more/payment-accounts',
        builder: (_, __) => const PaymentAccountsScreen(),
      ),
      GoRoute(
        path: '/more/agreement',
        builder: (_, __) => const AgreementScreen(),
      ),
      GoRoute(path: '/more/billing', builder: (_, __) => const BillingScreen()),
      GoRoute(
        path: '/more/settings',
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/more/tenants',
        builder: (_, __) => const TenantsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder:
                (_, state) =>
                    TenantDetailScreen(id: state.pathParameters['id']!),
          ),
        ],
      ),
    ],
  );

  appRouter = router;
  return router;
}
