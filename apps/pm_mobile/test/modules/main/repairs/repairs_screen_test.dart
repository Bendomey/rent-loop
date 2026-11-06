import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/modules/main/repairs/root.dart';
import 'package:rentloop_manager/src/navigation/routes.dart';

Future<void> _pumpRouter(WidgetTester tester, GoRouter router) async {
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(child: MaterialApp.router(routerConfig: router)),
  );
  await tester.pump();
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('pushed repairs screen shows a back control that pops', (
    tester,
  ) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (_, __) => const Scaffold(body: Text('origin')),
        ),
        GoRoute(path: '/repairs', builder: (_, __) => const RepairsScreen()),
      ],
    );
    await _pumpRouter(tester, router);

    router.push('/repairs');
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.chevron_left), findsOneWidget);

    await tester.tap(find.byIcon(Icons.chevron_left));
    await tester.pumpAndSettle();
    expect(find.text('origin'), findsOneWidget);
    expect(find.byType(RepairsScreen), findsNothing);
  });

  testWidgets('repairs opened for a property pre-applies its filter', (
    tester,
  ) async {
    final router = GoRouter(
      routes: appRoutes(),
      initialLocation: '/repairs?property_id=p1&property_name=East%20Legon',
    );
    await _pumpRouter(tester, router);

    expect(find.text('1 Property'), findsOneWidget);
    expect(find.text('Repairs · East Legon'), findsOneWidget);
  });

  testWidgets('repairs opened without a property is unfiltered', (
    tester,
  ) async {
    final router = GoRouter(routes: appRoutes(), initialLocation: '/repairs');
    await _pumpRouter(tester, router);

    expect(find.text('1 Property'), findsNothing);
    expect(find.text('Repairs'), findsOneWidget);
  });
}
