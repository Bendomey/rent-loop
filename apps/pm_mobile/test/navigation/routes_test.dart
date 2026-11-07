import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/navigation/routes.dart';

bool isRegistered(String path) {
  final router = GoRouter(routes: appRoutes(), initialLocation: '/');
  addTearDown(router.dispose);
  return router.configuration.findMatch(Uri.parse(path)).isNotEmpty;
}

void main() {
  test('v1 tab and repair routes are registered', () {
    for (final p in [
      '/',
      '/properties',
      '/tenants',
      '/money',
      '/more',
      '/repairs',
      '/more/tenants',
      '/more/tenants/t1',
      '/more/leases',
      '/more/leases/l1',
      '/more/announcements',
      '/more/announcements/add',
      '/activity/maintenances/add',
      '/activity/maintenances/m1',
      '/activity/applications/add',
      '/activity/applications/a1',
      '/money/invoices/i1',
      '/money/record-payment',
      '/more/my-profile',
    ]) {
      expect(isRegistered(p), isTrue, reason: p);
    }
  });

  test('hidden v1 routes are not registered', () {
    for (final p in [
      '/notifications',
      '/activity/bookings/add',
      '/activity/bookings/b1',
      '/properties/p1/settings',
      '/properties/p1/settings/general',
      '/properties/p1/settings/members',
      '/properties/p1/settings/documents',
      '/properties/p1/settings/delete',
      '/properties/p1/units/u1/settings',
      '/more/documents',
      '/more/members',
      '/more/members/add',
      '/more/payment-accounts',
      '/more/archived-properties',
      '/more/agreement',
      '/more/billing',
      '/more/settings',
    ]) {
      expect(isRegistered(p), isFalse, reason: p);
    }
  });

  test('activity tab route is gone', () {
    expect(isRegistered('/activity'), isFalse);
  });
}
