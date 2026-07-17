import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/architecture/app_startup/app_startup_notifier.dart';
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
import 'package:rentloop_manager/src/modules/main/properties/add_block.dart';
import 'package:rentloop_manager/src/modules/main/properties/add_unit.dart';
import 'package:rentloop_manager/src/modules/main/properties/blocks_list.dart';
import 'package:rentloop_manager/src/modules/main/properties/detail.dart';
import 'package:rentloop_manager/src/modules/main/properties/edit_block.dart';
import 'package:rentloop_manager/src/modules/main/properties/edit_unit.dart';
import 'package:rentloop_manager/src/modules/main/properties/root.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_detail.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_settings.dart';
import 'package:rentloop_manager/src/modules/main/properties/units_list.dart';
import 'package:rentloop_manager/src/modules/main/shell.dart';
import 'splash.dart';

// Used by notification-driven navigation from outside the widget tree.
GoRouter? appRouter;

class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) {
    _ref.listen<AppStartupState>(
      appStartupNotifierProvider,
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
      final startup = ref.read(appStartupNotifierProvider);
      final loc = state.matchedLocation;

      switch (startup.status) {
        case AppStartupStatus.loading:
          // `loading` is also set transiently during in-app actions (e.g.
          // AppStartupNotifier.completeLogin()), not just the initial
          // cold-start — don't force navigation to /splash mid-action, or
          // it races the in-flight action's own state transition (it also
          // re-triggers SplashScreen's init() call). The genuine cold-start
          // case already starts on /splash (it's initialLocation), so no
          // forced redirect is needed for it either.
          return null;

        case AppStartupStatus.error:
          if (loc == '/splash') return null;
          return '/splash';

        case AppStartupStatus.unauthenticated:
          // Only /auth/welcome and /auth/login are valid resting places
          // when unauthenticated — NOT /auth/workspace-select, which
          // requires an active session. A broader `loc.startsWith('/auth')`
          // check would (and did) leave a just-logged-out user stranded on
          // workspace-select instead of sending them to /auth/welcome.
          if (loc == '/auth/welcome' || loc == '/auth/login') return null;
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
        builder: (_, state) =>
            PropertyDetailScreen(id: state.pathParameters['id']!),
        routes: [
          GoRoute(
            path: 'units',
            builder: (_, state) => UnitsListScreen(
              propertyId: state.pathParameters['id']!,
              blockId: state.uri.queryParameters['block_id'],
              blockName: state.uri.queryParameters['block_name'],
            ),
            routes: [
              // 'add' must come before ':unitId' — GoRouter matches routes
              // in list order, and ':unitId' would otherwise swallow the
              // literal segment "add" as a unit id.
              GoRoute(
                path: 'add',
                builder: (_, state) =>
                    AddUnitScreen(propertyId: state.pathParameters['id']!),
              ),
              GoRoute(
                path: ':unitId',
                builder: (_, state) => UnitDetailScreen(
                  propertyId: state.pathParameters['id']!,
                  unitId: state.pathParameters['unitId']!,
                ),
                routes: [
                  GoRoute(
                    path: 'settings',
                    builder: (_, state) => UnitSettingsHubScreen(
                      propertyId: state.pathParameters['id']!,
                      unitId: state.pathParameters['unitId']!,
                    ),
                  ),
                  GoRoute(
                    path: 'edit',
                    builder: (_, state) => EditUnitScreen(
                      propertyId: state.pathParameters['id']!,
                      unitId: state.pathParameters['unitId']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: 'blocks',
            builder: (_, state) =>
                BlocksListScreen(propertyId: state.pathParameters['id']!),
            routes: [
              // 'add' must come before ':blockId' — same GoRouter ordering
              // gotcha as the units route above.
              GoRoute(
                path: 'add',
                builder: (_, state) =>
                    AddBlockScreen(propertyId: state.pathParameters['id']!),
              ),
              GoRoute(
                path: ':blockId/edit',
                builder: (_, state) => EditBlockScreen(
                  propertyId: state.pathParameters['id']!,
                  blockId: state.pathParameters['blockId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: 'settings',
            builder: (_, state) =>
                PropertySettingsHubScreen(id: state.pathParameters['id']!),
            routes: [
              GoRoute(
                path: 'general',
                builder: (_, state) => PropertyGeneralSettingsScreen(
                  id: state.pathParameters['id']!,
                ),
              ),
              GoRoute(
                path: 'members',
                builder: (_, state) =>
                    PropertyMembersScreen(id: state.pathParameters['id']!),
                routes: [
                  GoRoute(
                    path: 'add',
                    builder: (_, state) => AddPropertyMemberScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: 'documents',
                builder: (_, state) =>
                    PropertyDocumentsScreen(id: state.pathParameters['id']!),
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
        builder: (_, state) =>
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
        builder: (_, state) =>
            BookingDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/activity/applications/:id',
        builder: (_, state) =>
            ApplicationDetailScreen(id: state.pathParameters['id']!),
      ),

      // money routes
      GoRoute(
        path: '/money/invoices/:id',
        builder: (_, state) =>
            InvoiceDetailScreen(id: state.pathParameters['id']!),
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
          GoRoute(path: 'add', builder: (_, __) => const AddMemberScreen()),
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
        builder: (_, state) => TenantsScreen(
          propertyId: state.uri.queryParameters['property_id'],
          propertyName: state.uri.queryParameters['property_name'],
        ),
        routes: [
          GoRoute(
            path: ':id',
            builder: (_, state) =>
                TenantDetailScreen(id: state.pathParameters['id']!),
          ),
        ],
      ),
    ],
  );

  appRouter = router;
  return router;
}
