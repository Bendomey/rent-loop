import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/repository/models/activity_counts_model.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:shimmer/shimmer.dart';

const _stats = HomeStats(
  collectedThisMonth: 450000,
  stillToCollect: 1200000,
  late: 300000,
  emptyUnits: 3,
  totalUnits: 12,
);

Future<void> _pump(
  WidgetTester tester, {
  Future<HomeStats> Function()? stats,
  Future<ActivityCounts> Function()? counts,
  GoRouter? router,
  Size size = const Size(1200, 3000),
  double textScale = 1,
  List<Override> workspaceOverrides = const [],
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );

  final overrides = [
    myPropertyRolesProvider.overrideWith((ref) async => {'p1': 'MANAGER'}),
    if (workspaceOverrides.isEmpty) ...[
      homeStatsProvider.overrideWith((ref) => (stats ?? () async => _stats)()),
      activityCountsProvider.overrideWith(
        (ref) =>
            (counts ??
            () async =>
                const ActivityCounts(maintenance: 2, applications: 1))(),
      ),
    ] else
      ...workspaceOverrides,
  ];
  Widget scaled(BuildContext context, Widget? child) => MediaQuery(
    data: MediaQuery.of(
      context,
    ).copyWith(textScaler: TextScaler.linear(textScale)),
    child: child!,
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: router == null
          ? MaterialApp(builder: scaled, home: const HomeScreen())
          : MaterialApp.router(builder: scaled, routerConfig: router),
    ),
  );
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
  testWidgets('shows real numbers', (tester) async {
    await _pump(tester);

    expect(find.text('Collected this month'), findsOneWidget);
    expect(find.text('4,500.00'), findsOneWidget);
    expect(find.text('Still to collect'), findsOneWidget);
    expect(find.text('GH₵ 12,000.00'), findsOneWidget);
    expect(find.text('GH₵ 3,000.00 of it is late'), findsOneWidget);
    expect(find.text('Empty units'), findsOneWidget);
    expect(find.text('3 of 12'), findsOneWidget);
    expect(find.text('Open repairs'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('Pending tenants'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
  });

  testWidgets('no late line when late is 0', (tester) async {
    await _pump(
      tester,
      stats: () async => const HomeStats(stillToCollect: 100000, totalUnits: 4),
    );

    expect(find.textContaining('of it is late'), findsNothing);
  });

  testWidgets('no sample numbers or old labels', (tester) async {
    await _pump(tester);

    expect(find.textContaining('184'), findsNothing);
    expect(find.text('Occupancy'), findsNothing);
    expect(find.text('Pending apps'), findsNothing);
    expect(find.text('Needs your attention'), findsNothing);
    expect(find.text('Leaking kitchen tap'), findsNothing);
  });

  testWidgets('stats failure keeps shortcuts and shows Try again', (
    tester,
  ) async {
    await _pump(tester, stats: () async => throw Exception('boom'));

    expect(find.text("Couldn't load your numbers."), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.text('Add tenant'), findsOneWidget);
    expect(find.text('Repairs'), findsOneWidget);
    expect(find.text('—'), findsOneWidget);
  });

  testWidgets('Try again reloads the numbers', (tester) async {
    var calls = 0;
    await _pump(
      tester,
      stats: () async {
        calls++;
        if (calls == 1) throw Exception('boom');
        return _stats;
      },
    );

    await tester.tap(find.text('Try again'));
    await tester.pump();
    await tester.pump();

    expect(find.text('Collected this month'), findsOneWidget);
    expect(find.text("Couldn't load your numbers."), findsNothing);
  });

  testWidgets('activity counts failure shows dashes on those cards only', (
    tester,
  ) async {
    await _pump(tester, counts: () async => throw Exception('boom'));

    expect(find.text('3 of 12'), findsOneWidget);
    expect(find.text('—'), findsNWidgets(2));
  });

  testWidgets('shimmer while loading, then numbers', (tester) async {
    final stats = Completer<HomeStats>();
    final counts = Completer<ActivityCounts>();
    await _pump(tester, stats: () => stats.future, counts: () => counts.future);

    expect(find.byType(Shimmer), findsWidgets);
    expect(find.text('Collected this month'), findsNothing);
    expect(find.text('Add tenant'), findsOneWidget);

    stats.complete(_stats);
    counts.complete(const ActivityCounts(maintenance: 2, applications: 1));
    await tester.pump();
    await tester.pump();

    expect(find.byType(Shimmer), findsNothing);
    expect(find.text('Collected this month'), findsOneWidget);
  });

  testWidgets('Open repairs card goes to /repairs', (tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(
          path: '/repairs',
          builder: (_, __) => const Scaffold(body: Text('repairs page')),
        ),
      ],
    );
    await _pump(tester, router: router);

    await tester.tap(find.text('Open repairs'));
    await tester.pumpAndSettle();

    expect(find.text('repairs page'), findsOneWidget);
  });

  group('workspace switch', () {
    late Map<String, Completer<HomeStats>> statsFor;
    late Map<String, Completer<ActivityCounts>> countsFor;

    Future<ProviderContainer> pumpSwitching(WidgetTester tester) async {
      statsFor = {'b': Completer()};
      countsFor = {'b': Completer()};
      await _pump(
        tester,
        workspaceOverrides: [
          currentWorkspaceNotifierProvider.overrideWith(_Workspace.new),
          homeStatsProvider.overrideWith((ref) async {
            final id = ref.watch(currentWorkspaceNotifierProvider)!.clientId;
            if (id == 'a') {
              return const HomeStats(
                stillToCollect: 5000000,
                totalUnits: 9,
                clientId: 'a',
              );
            }
            return statsFor[id]!.future;
          }),
          activityCountsProvider.overrideWith((ref) async {
            final id = ref.watch(currentWorkspaceNotifierProvider)!.clientId;
            if (id == 'a') {
              return const ActivityCounts(maintenance: 7, clientId: 'a');
            }
            return countsFor[id]!.future;
          }),
          myPropertyRolesProvider.overrideWith((ref) async => {}),
        ],
      );
      return ProviderScope.containerOf(tester.element(find.byType(HomeScreen)));
    }

    testWidgets('old numbers disappear while the new workspace loads', (
      tester,
    ) async {
      final container = await pumpSwitching(tester);
      expect(find.text('GH₵ 50,000.00'), findsOneWidget);
      expect(find.text('7'), findsOneWidget);

      (container.read(currentWorkspaceNotifierProvider.notifier) as _Workspace)
          .switchTo('b');
      await tester.pump();

      expect(find.text('GH₵ 50,000.00'), findsNothing);
      expect(find.text('7'), findsNothing);
      expect(find.byType(Shimmer), findsWidgets);

      statsFor['b']!.complete(
        const HomeStats(stillToCollect: 100000, totalUnits: 2, clientId: 'b'),
      );
      countsFor['b']!.complete(
        const ActivityCounts(maintenance: 1, clientId: 'b'),
      );
      await tester.pump();
      await tester.pump();

      expect(find.text('GH₵ 1,000.00'), findsOneWidget);
      expect(find.text('GH₵ 50,000.00'), findsNothing);
    });

    testWidgets(
      'a failed load for the new workspace shows the error, not the old numbers',
      (tester) async {
        final container = await pumpSwitching(tester);

        (container.read(currentWorkspaceNotifierProvider.notifier)
                as _Workspace)
            .switchTo('b');
        await tester.pump();
        statsFor['b']!.completeError(Exception('boom'));
        countsFor['b']!.completeError(Exception('boom'));
        await tester.pump();
        await tester.pump();

        expect(find.text('GH₵ 50,000.00'), findsNothing);
        expect(find.text("Couldn't load your numbers."), findsOneWidget);
        expect(find.text('Try again'), findsOneWidget);
        expect(find.text('7'), findsNothing);
        expect(find.text('—'), findsNWidgets(3));
      },
    );
  });

  testWidgets('Try again shows the shimmer while retrying', (tester) async {
    final retry = Completer<HomeStats>();
    var calls = 0;
    await _pump(
      tester,
      stats: () {
        calls++;
        if (calls == 1) return Future.error(Exception('boom'));
        return retry.future;
      },
    );

    await tester.tap(find.text('Try again'));
    await tester.pump();

    expect(find.text("Couldn't load your numbers."), findsNothing);
    expect(find.byType(Shimmer), findsWidgets);

    retry.complete(_stats);
    await tester.pump();
    await tester.pump();
    expect(find.text('Collected this month'), findsOneWidget);
  });

  group('pull to refresh', () {
    testWidgets('re-reads both providers and shows the new numbers', (
      tester,
    ) async {
      var statsCalls = 0;
      var countsCalls = 0;
      await _pump(
        tester,
        stats: () async {
          statsCalls++;
          return statsCalls == 1
              ? _stats
              : const HomeStats(stillToCollect: 777700, totalUnits: 12);
        },
        counts: () async {
          countsCalls++;
          return const ActivityCounts(maintenance: 2, applications: 1);
        },
      );

      await tester
          .widget<RefreshIndicator>(find.byType(RefreshIndicator))
          .onRefresh();
      await tester.pump();
      await tester.pump();

      expect(statsCalls, 2);
      expect(countsCalls, 2);
      expect(find.text('GH₵ 7,777.00'), findsOneWidget);
    });

    testWidgets('a failed refresh keeps the numbers on screen', (tester) async {
      var calls = 0;
      await _pump(
        tester,
        stats: () async {
          calls++;
          if (calls > 1) throw Exception('boom');
          return _stats;
        },
      );

      await tester
          .widget<RefreshIndicator>(find.byType(RefreshIndicator))
          .onRefresh();
      await tester.pump();
      await tester.pump();

      expect(calls, 2);
      expect(find.text('GH₵ 12,000.00'), findsOneWidget);
      expect(find.text('3 of 12'), findsOneWidget);
      expect(find.text("Couldn't load your numbers."), findsNothing);
    });
  });

  testWidgets('stat cards fit a 360px phone at 1.3x text', (tester) async {
    await _pump(
      tester,
      size: const Size(360, 780),
      textScale: 1.3,
      stats: () async => const HomeStats(emptyUnits: 12, totalUnits: 120),
      counts: () async =>
          const ActivityCounts(maintenance: 128, applications: 45),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Pending tenants'), findsOneWidget);
    expect(find.text('12 of 120'), findsOneWidget);
  });
}
