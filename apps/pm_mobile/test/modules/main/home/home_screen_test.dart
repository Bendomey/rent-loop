import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/rent_focus_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:shimmer/shimmer.dart';

import '../../../support/home_fakes.dart';
import '../../../support/options_fakes.dart';

const _late = 'GH₵ 150.00 rent is late · 1 property';
const _expiring = '2 leases are ending soon';
const _repairs = '3 open repairs · 1 urgent';

PropertyModel _property(String id, String name) => PropertyModel(
  id: id,
  name: name,
  type: 'Property.Type.Apartment',
  status: 'Property.Status.Active',
);

String _shown(GoRouterState s) => 'at ${s.uri}';

GoRouter _router() => GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    for (final path in [
      '/money',
      '/more/leases',
      '/repairs',
      '/properties',
      '/properties/:id',
      '/tenants',
    ])
      GoRoute(
        path: path,
        builder: (_, s) => Scaffold(body: Text(_shown(s))),
      ),
  ],
);

Future<ProviderContainer> _pump(
  WidgetTester tester, {
  HomeFakes? fakes,
  GoRouter? router,
  Size size = const Size(1200, 4000),
  double textScale = 1,
  List<Override> extra = const [],
  List<PropertyModel>? options,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );

  Widget scaled(BuildContext context, Widget? child) => MediaQuery(
    data: MediaQuery.of(
      context,
    ).copyWith(textScaler: TextScaler.linear(textScale)),
    child: child!,
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': 'MANAGER'}),
        propertyOptionsNotifierProvider().overrideWith(
          () => FakePropertyOptions(
            options ??
                [_property('p1', 'Ama Court'), _property('p2', 'Bay View')],
          ),
        ),
        ...(fakes ?? HomeFakes()).overrides(),
        ...extra,
      ],
      child: MaterialApp.router(
        builder: scaled,
        routerConfig: router ?? _router(),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
  return ProviderScope.containerOf(tester.element(find.byType(HomeScreen)));
}

Future<void> _settle(WidgetTester tester) async {
  await tester.pump();
  await tester.pump();
}

ClientUserModel _workspace(String clientId) => ClientUserModel(
  id: 'cu-$clientId',
  clientId: clientId,
  role: 'OWNER',
  status: 'ACTIVE',
);

class _Workspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => _workspace('a');

  void switchTo(String clientId) => state = _workspace(clientId);
}

void main() {
  testWidgets('shows every section with real numbers', (tester) async {
    await _pump(tester);

    expect(find.text('Collected this month'), findsOneWidget);
    expect(find.text('2,200.00'), findsWidgets);
    expect(find.text('▲ 12% vs ${lastMonthName()}'), findsOneWidget);
    expect(find.text('Still to collect'), findsOneWidget);
    expect(find.text('GH₵ 6,150.00'), findsOneWidget);
    expect(find.text('GH₵ 150.00 of it is late'), findsOneWidget);

    expect(find.text('Needs your attention'), findsOneWidget);
    expect(find.text(_late), findsOneWidget);
    expect(find.text(_expiring), findsOneWidget);
    expect(find.text(_repairs), findsOneWidget);

    expect(find.text('50%'), findsOneWidget);
    expect(find.text('Occupied · 1 of 2'), findsOneWidget);
    expect(find.text('Empty unit'), findsOneWidget);
    expect(find.text('Active lease'), findsOneWidget);
    expect(find.text('Pending tenants'), findsOneWidget);

    expect(find.text('Rent collected — last 6 months'), findsOneWidget);
    expect(find.text('Your properties this month'), findsOneWidget);
    expect(find.text('Quick actions'), findsOneWidget);
    expect(find.textContaining('nvoice'), findsNothing);
  });

  group('comparison badge', () {
    testWidgets('hidden when last month was 0', (tester) async {
      await _pump(
        tester,
        fakes: HomeFakes(
          payments: (_, __) async => paymentsFor(thisMonth: 50000),
        ),
      );
      expect(find.textContaining('% vs'), findsNothing);
      expect(find.text('Collected this month'), findsOneWidget);
    });

    testWidgets('points down when collections fell', (tester) async {
      await _pump(
        tester,
        fakes: HomeFakes(
          payments: (_, __) async =>
              paymentsFor(thisMonth: 92000, lastMonth: 100000),
        ),
      );
      expect(find.text('▼ 8% vs ${lastMonthName()}'), findsOneWidget);
    });
  });

  group('needs your attention', () {
    testWidgets('a row with a count of 0 is hidden', (tester) async {
      await _pump(
        tester,
        fakes: HomeFakes(
          leases: (_, __) async => const HomeLeases(active: 3),
          repairs: (_, __) async => const HomeRepairs(open: 1),
        ),
      );
      expect(find.text(_late), findsOneWidget);
      expect(find.textContaining('ending soon'), findsNothing);
      expect(find.text('1 open repair'), findsOneWidget);
      expect(find.text('Nothing needs your attention.'), findsNothing);
    });

    testWidgets('all clear says so', (tester) async {
      await _pump(
        tester,
        fakes: HomeFakes(
          charges: (_, __) async => const HomeCharges(stillToCollect: 900),
          leases: (_, __) async => const HomeLeases(),
          repairs: (_, __) async => const HomeRepairs(),
        ),
      );
      expect(find.text('Nothing needs your attention.'), findsOneWidget);
      expect(find.textContaining('rent is late'), findsNothing);
      expect(find.textContaining('of it is late'), findsNothing);
    });

    testWidgets('late rent opens the Rent tab on Owing for all properties', (
      tester,
    ) async {
      final container = await _pump(tester);
      await tester.tap(find.text(_late));
      await tester.pumpAndSettle();

      expect(find.text('at /money'), findsOneWidget);
      final focus = container.read(rentFocusNotifierProvider)!;
      expect(focus.property, isNull);
      expect(focus.seq, 1);
    });

    testWidgets('ending-soon leases open the filtered leases list', (
      tester,
    ) async {
      await _pump(tester);
      await tester.tap(find.text(_expiring));
      await tester.pumpAndSettle();

      final text = tester.widget<Text>(find.textContaining('at /more/leases'));
      final uri = Uri.parse(text.data!.substring(3));
      expect(uri.queryParameters, {'filter': 'Ending soon'});
    });

    testWidgets('repairs open the repairs board', (tester) async {
      await _pump(tester);
      await tester.tap(find.text(_repairs));
      await tester.pumpAndSettle();

      expect(find.text('at /repairs'), findsOneWidget);
    });

    testWidgets('a chosen property scopes every target', (tester) async {
      final container = await _pump(tester);
      await tester.tap(find.text('All properties'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ama Court').last);
      await tester.pumpAndSettle();

      expect(find.text('GH₵ 150.00 rent is late'), findsOneWidget);
      await tester.tap(find.text('GH₵ 150.00 rent is late'));
      await tester.pumpAndSettle();
      expect(container.read(rentFocusNotifierProvider)!.property, (
        id: 'p1',
        name: 'Ama Court',
      ));

      final router = GoRouter.of(tester.element(find.text('at /money')));
      router.go('/');
      await tester.pumpAndSettle();
      await tester.tap(find.text(_repairs));
      await tester.pumpAndSettle();
      final repairs = tester.widget<Text>(find.textContaining('at /repairs'));
      expect(Uri.parse(repairs.data!.substring(3)).queryParameters, {
        'property_id': 'p1',
        'property_name': 'Ama Court',
      });

      router.go('/');
      await tester.pumpAndSettle();
      await tester.tap(find.text(_expiring));
      await tester.pumpAndSettle();
      final leases = tester.widget<Text>(find.textContaining('at /more'));
      expect(Uri.parse(leases.data!.substring(3)).queryParameters, {
        'filter': 'Ending soon',
        'property_id': 'p1',
        'property_name': 'Ama Court',
      });
    });
  });

  group('property switcher', () {
    HomeFakes scopedFakes() => HomeFakes(
      payments: (_, id) async => id == 'p1'
          ? paymentsFor(thisMonth: 150000, lastMonth: 150000)
          : paymentsFor(
              thisMonth: 220000,
              lastMonth: 196000,
              byProperty: {'p1': 150000, 'p2': 70000},
            ),
      charges: (_, id) async => id == 'p1'
          ? const HomeCharges(stillToCollect: 100000)
          : const HomeCharges(
              stillToCollect: 615000,
              late: 15000,
              lateProperties: 1,
            ),
      units: (_, id) async => id == 'p1'
          ? const HomeUnits(total: 4, occupied: 4)
          : const HomeUnits(total: 2, occupied: 1, empty: 1),
      pending: (_, id) async => HomePendingTenants(count: id == 'p1' ? 7 : 0),
    );

    testWidgets('every number follows the chosen property', (tester) async {
      final fakes = scopedFakes();
      await _pump(tester, fakes: fakes);
      expect(find.text('▲ 12% vs ${lastMonthName()}'), findsOneWidget);

      await tester.tap(find.text('All properties'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ama Court').last);
      await tester.pumpAndSettle();

      expect(find.text('1,500.00'), findsWidgets);
      expect(find.text('▲ 0% vs ${lastMonthName()}'), findsOneWidget);
      expect(find.text('GH₵ 1,000.00'), findsOneWidget);
      expect(find.text('GH₵ 6,150.00'), findsNothing);
      expect(find.textContaining('rent is late'), findsNothing);
      expect(find.text('100%'), findsOneWidget);
      expect(find.text('Occupied · 4 of 4'), findsOneWidget);
      expect(find.text('7'), findsOneWidget);
      expect(find.text('Your properties this month'), findsNothing);
      for (final s in [
        'payments',
        'charges',
        'leases',
        'repairs',
        'units',
        'pending',
      ]) {
        expect(fakes.calls['$s:p1'], 1, reason: s);
      }
    });

    testWidgets('going back to All reuses its cached numbers', (tester) async {
      final fakes = scopedFakes();
      await _pump(tester, fakes: fakes);
      await tester.tap(find.text('All properties'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ama Court').last);
      await tester.pumpAndSettle();

      await tester.tap(find.text('All properties'));
      await tester.pumpAndSettle();

      expect(find.text('GH₵ 6,150.00'), findsOneWidget);
      expect(find.text('Your properties this month'), findsOneWidget);
      expect(fakes.calls['payments:null'], 1);
      expect(fakes.calls['charges:null'], 1);
    });
  });

  group('section states', () {
    testWidgets('shimmer per section while loading', (tester) async {
      final charges = Completer<HomeCharges>();
      await _pump(tester, fakes: HomeFakes(charges: (_, __) => charges.future));

      expect(find.byType(Shimmer), findsNWidgets(2));
      expect(find.text('Collected this month'), findsNothing);
      expect(find.text(_late), findsNothing);
      expect(find.text('50%'), findsOneWidget);
      expect(find.text('Rent collected — last 6 months'), findsOneWidget);

      charges.complete(const HomeCharges(stillToCollect: 1, late: 1));
      await _settle(tester);
      expect(find.byType(Shimmer), findsNothing);
      expect(find.text('Collected this month'), findsOneWidget);
    });

    testWidgets('a failing payments cube leaves the other sections up', (
      tester,
    ) async {
      var calls = 0;
      await _pump(
        tester,
        fakes: HomeFakes(
          payments: (_, __) async {
            calls++;
            if (calls == 1) throw Exception('boom');
            return paymentsFor(thisMonth: 220000, lastMonth: 196000);
          },
        ),
      );

      expect(find.text("Couldn't load this."), findsNWidgets(3));
      expect(find.text(_late), findsOneWidget);
      expect(find.text('50%'), findsOneWidget);
      expect(find.text('Add tenant'), findsOneWidget);

      await tester.tap(find.text('Try again').first);
      await _settle(tester);

      expect(find.text("Couldn't load this."), findsNothing);
      expect(find.text('Collected this month'), findsOneWidget);
    });

    testWidgets('a failing charges cube fails the money card and attention', (
      tester,
    ) async {
      await _pump(
        tester,
        fakes: HomeFakes(charges: (_, __) async => throw Exception('boom')),
      );
      expect(find.text("Couldn't load this."), findsNWidgets(2));
      expect(find.text('Rent collected — last 6 months'), findsOneWidget);
      expect(find.text('Ama Court'), findsOneWidget);
      expect(find.text('50%'), findsOneWidget);
    });

    testWidgets('a failing units cube fails only the counts grid', (
      tester,
    ) async {
      await _pump(
        tester,
        fakes: HomeFakes(units: (_, __) async => throw Exception('boom')),
      );
      expect(find.text("Couldn't load this."), findsOneWidget);
      expect(find.text('Collected this month'), findsOneWidget);
      expect(find.text(_late), findsOneWidget);
    });

    testWidgets('a failing names lookup fails only the property list', (
      tester,
    ) async {
      await _pump(
        tester,
        fakes: HomeFakes(names: (_) async => throw Exception('boom')),
      );
      expect(find.text("Couldn't load this."), findsOneWidget);
      expect(find.text('Rent collected — last 6 months'), findsOneWidget);
    });
  });

  testWidgets('tapping a bar shows that month', (tester) async {
    await _pump(tester);
    final now = DateTime.now();
    final first = DateTime(now.year, now.month - 5, 1);

    await tester.tap(find.byKey(const ValueKey('rent-bar-0')));
    await tester.pump();

    expect(find.text(shortMonthName(first)), findsWidgets);
    expect(find.text('500.00'), findsOneWidget);
  });

  group('your properties this month', () {
    testWidgets('highest first and opens the property', (tester) async {
      await _pump(tester);
      final names = ['Ama Court', 'Bay View', 'Cedar'];
      final ys = [for (final n in names) tester.getTopLeft(find.text(n)).dy];
      expect(ys[0] < ys[1] && ys[1] < ys[2], isTrue);
      expect(find.text('GH₵ 0.00'), findsOneWidget);

      await tester.tap(find.text('Bay View'));
      await tester.pumpAndSettle();
      expect(find.text('at /properties/p2'), findsOneWidget);
    });

    testWidgets('long lists collapse to five', (tester) async {
      await _pump(
        tester,
        fakes: HomeFakes(
          payments: (_, __) async => paymentsFor(),
          names: (_) async => HomePropertyNames(
            names: {for (var i = 1; i <= 7; i++) 'x$i': 'House $i'},
          ),
        ),
      );
      expect(find.text('House 5'), findsOneWidget);
      expect(find.text('House 6'), findsNothing);

      await tester.tap(find.text('Show all 7'));
      await tester.pump();
      expect(find.text('House 7'), findsOneWidget);
      expect(find.text('Show fewer'), findsOneWidget);
    });
  });

  group('workspace switch', () {
    testWidgets('old numbers never show while the new workspace loads', (
      tester,
    ) async {
      final b = Completer<HomeCharges>();
      final container = await _pump(
        tester,
        fakes: HomeFakes(
          payments: (ref, _) async => paymentsFor(
            thisMonth: 220000,
            clientId: ref.watch(currentWorkspaceNotifierProvider)!.clientId,
          ),
          charges: (ref, _) async {
            final id = ref.watch(currentWorkspaceNotifierProvider)!.clientId;
            if (id == 'a') {
              return const HomeCharges(stillToCollect: 5000000, clientId: 'a');
            }
            return b.future;
          },
        ),
        extra: [currentWorkspaceNotifierProvider.overrideWith(_Workspace.new)],
      );
      expect(find.text('GH₵ 50,000.00'), findsOneWidget);

      (container.read(currentWorkspaceNotifierProvider.notifier) as _Workspace)
          .switchTo('b');
      await tester.pump();

      expect(find.text('GH₵ 50,000.00'), findsNothing);
      expect(find.byType(Shimmer), findsWidgets);

      b.complete(const HomeCharges(stillToCollect: 100000, clientId: 'b'));
      await _settle(tester);
      expect(find.text('GH₵ 1,000.00'), findsOneWidget);
    });
  });

  group('pull to refresh', () {
    testWidgets('re-reads every section', (tester) async {
      var charges = 0;
      final fakes = HomeFakes(
        charges: (_, __) async {
          charges++;
          return HomeCharges(stillToCollect: charges == 1 ? 615000 : 777700);
        },
      );
      await _pump(tester, fakes: fakes);

      await tester
          .widget<RefreshIndicator>(find.byType(RefreshIndicator))
          .onRefresh();
      await _settle(tester);

      for (final s in [
        'payments:null',
        'charges:null',
        'leases:null',
        'repairs:null',
        'units:null',
        'pending:null',
        'names',
      ]) {
        expect(fakes.calls[s], 2, reason: s);
      }
      expect(find.text('GH₵ 7,777.00'), findsOneWidget);
    });

    testWidgets('a failed refresh keeps the numbers on screen', (tester) async {
      var calls = 0;
      await _pump(
        tester,
        fakes: HomeFakes(
          charges: (_, __) async {
            calls++;
            if (calls > 1) throw Exception('boom');
            return const HomeCharges(stillToCollect: 615000);
          },
        ),
      );

      await tester
          .widget<RefreshIndicator>(find.byType(RefreshIndicator))
          .onRefresh();
      await _settle(tester);

      expect(calls, 2);
      expect(find.text('GH₵ 6,150.00'), findsOneWidget);
      expect(find.text("Couldn't load this."), findsNothing);
    });
  });

  for (final scale in [1.3, 2.0]) {
    testWidgets('fits a 360px phone at ${scale}x text', (tester) async {
      await _pump(
        tester,
        size: const Size(360, 4000),
        textScale: scale,
        fakes: HomeFakes(
          payments: (_, __) async => paymentsFor(
            thisMonth: 123456789,
            lastMonth: 100000000,
            byProperty: {'p1': 98765432},
          ),
          charges: (_, __) async => const HomeCharges(
            stillToCollect: 987654321,
            late: 123456789,
            lateProperties: 12,
          ),
          leases: (_, __) async => const HomeLeases(active: 1234, expiring: 56),
          repairs: (_, __) async => const HomeRepairs(open: 789, urgent: 12),
          units: (_, __) async =>
              const HomeUnits(total: 1200, occupied: 1100, empty: 100),
          pending: (_, __) async => const HomePendingTenants(count: 456),
          names: (_) async => const HomePropertyNames(
            names: {
              'p1': 'The Very Long Named Residence at East Legon Hills',
              'p2': 'Bay View',
            },
          ),
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.text('Pending tenants'), findsOneWidget);
      expect(find.textContaining('rent is late · 12 properties'), findsOne);
    });
  }

  testWidgets('a long property name fits the switcher at 360px', (
    tester,
  ) async {
    await _pump(
      tester,
      size: const Size(360, 4000),
      textScale: 1.3,
      options: [_property('p1', 'The Very Long Named Residence at East Legon')],
    );
    await tester.tap(find.text('All properties'));
    await tester.pumpAndSettle();
    await tester.tap(
      find.text('The Very Long Named Residence at East Legon').last,
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('All properties'), findsOneWidget);
  });
}
