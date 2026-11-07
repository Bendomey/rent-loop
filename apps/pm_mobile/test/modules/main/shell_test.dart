import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/modules/main/tenants/root.dart';
import 'package:rentloop_manager/src/navigation/routes.dart';
import 'package:rentloop_manager/src/repository/notifiers/tenants/tenants_notifier.dart';

class _StubTenantsNotifier extends TenantsNotifier {
  @override
  TenantsState build(String? propertyId) => const TenantsState();

  @override
  Future<void> loadFirstPage([
    TenantsQuery query = const TenantsQuery(),
  ]) async {}
}

void main() {
  testWidgets('shell shows the five v1 tabs', (tester) async {
    final router = GoRouter(routes: appRoutes(), initialLocation: '/tenants');
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tenantsNotifierProvider(null).overrideWith(_StubTenantsNotifier.new),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Properties'), findsWidgets);
    expect(find.text('Tenants'), findsWidgets);
    expect(find.text('Rent'), findsWidgets);
    expect(find.text('More'), findsWidgets);
    expect(find.text('Activity'), findsNothing);
    expect(find.text('Money'), findsNothing);
  });

  testWidgets('tenants tab root shows no back control', (tester) async {
    final router = GoRouter(
      routes: [GoRoute(path: '/', builder: (_, __) => const TenantsScreen())],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tenantsNotifierProvider(null).overrideWith(_StubTenantsNotifier.new),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();

    expect(find.byIcon(Icons.chevron_left), findsNothing);
  });
}
