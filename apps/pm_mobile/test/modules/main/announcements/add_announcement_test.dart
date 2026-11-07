import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:rentloop_manager/src/modules/main/announcements/add.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/post_announcement_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

import '../../../support/options_fakes.dart';

class _FakePost extends PostAnnouncementNotifier {
  _FakePost({this.outcome = 'sent'});

  final String outcome;
  final calls = <Map<String, Object?>>[];
  final gate = Completer<void>();

  @override
  Future<void> post({
    required String propertyId,
    required String title,
    required String content,
    required String type,
    required String priority,
    String? propertyBlockId,
    List<String>? targetUnitIds,
  }) async {
    calls.add({
      'propertyId': propertyId,
      'title': title,
      'content': content,
      'type': type,
      'priority': priority,
      'propertyBlockId': propertyBlockId,
      'targetUnitIds': targetUnitIds,
    });
    if (outcome == 'retry-pending') {
      state = PostAnnouncementState(
        status: ApiStatus.pending,
        draftId: 'd1',
        propertyId: propertyId,
      );
      await gate.future;
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 10));
    state = switch (outcome) {
      'sent' => PostAnnouncementState(status: ApiStatus.success, sent: true),
      'publish-failed' => PostAnnouncementState(
        status: ApiStatus.failed,
        errorMessage: 'Boom',
        draftId: 'd1',
        propertyId: propertyId,
      ),
      _ => PostAnnouncementState(
        status: ApiStatus.failed,
        errorMessage: 'Boom',
      ),
    };
  }
}

PropertyModel _prop(String id, String name) =>
    PropertyModel(id: id, name: name, type: 'Apartment', status: 'ACTIVE');

UnitModel _unit(String id, String name) => UnitModel(
  id: id,
  name: name,
  type: 'Unit.Type.Apartment',
  status: 'Unit.Status.Occupied',
  rentFee: 1,
  rentFeeCurrency: 'GHS',
);

Future<_FakePost> _pump(
  WidgetTester tester, {
  List<PropertyModel>? properties,
  String? propertyId,
  String outcome = 'sent',
  bool hasMoreProperties = false,
  bool staleOnClear = false,
}) async {
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final fake = _FakePost(outcome: outcome);
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => Scaffold(
          body: Builder(
            builder: (c) => TextButton(
              onPressed: () => c.push('/add'),
              child: const Text('open'),
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/add',
        builder: (_, __) => AddAnnouncementScreen(propertyId: propertyId),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        propertyOptionsNotifierProvider(managerOnly: true).overrideWith(
          () => FakePropertyOptions(
            properties ?? [_prop('p1', 'Palm Court')],
            hasNextPage: hasMoreProperties,
            staleOnClear: staleOnClear,
          ),
        ),
        myPropertyRolesProvider.overrideWith(
          (ref) async => {'p1': 'MANAGER', 'p2': 'MANAGER'},
        ),
        blockOptionsNotifierProvider(
          'p2',
        ).overrideWith(() => FakeBlockOptions(const [])),
        unitOptionsNotifierProvider(
          const UnitOptionsQuery(propertyIds: ['p2']),
        ).overrideWith(() => FakeUnitOptions([_unit('u9', 'Unit 9')])),
        blockOptionsNotifierProvider('p1').overrideWith(
          () => FakeBlockOptions([
            PropertyBlockModel(
              id: 'b1',
              name: 'Block A',
              status: 'ACTIVE',
              unitsCount: 1,
            ),
          ]),
        ),
        unitOptionsNotifierProvider(
          const UnitOptionsQuery(propertyIds: ['p1']),
        ).overrideWith(
          () => FakeUnitOptions([_unit('u1', 'Unit 1'), _unit('u2', 'Unit 2')]),
        ),
        postAnnouncementNotifierProvider.overrideWith(() => fake),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
  return fake;
}

Future<void> _tapText(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text).first);
  await tester.tap(find.text(text).first);
  await tester.pumpAndSettle();
}

Future<void> _fill(WidgetTester tester, {bool type = true}) async {
  await tester.enterText(find.byType(TextField).at(0), 'Water off');
  await tester.enterText(find.byType(TextField).at(1), 'Off from 9 to 2');
  if (type) {
    await _tapText(tester, 'Select type');
    await tester.tap(find.text('Repairs & works'));
    await tester.pumpAndSettle();
  }
}

Future<void> _post(WidgetTester tester, [String label = 'Post now']) async {
  await tester.ensureVisible(find.text(label));
  await tester.tap(find.text(label));
  await tester.pump(const Duration(milliseconds: 50));
  await tester.pumpAndSettle();
  await tester.pump(const Duration(seconds: 5));
}

final _doneButton = find.textContaining('Done (');

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('no sample data or schedule/draft controls', (tester) async {
    await _pump(tester);
    for (final t in [
      'Save as draft',
      'Post now or schedule',
      'Start date & time',
      'No expiry',
      'Domey',
    ]) {
      expect(find.textContaining(t), findsNothing, reason: t);
    }
    expect(find.text('Palm Court'), findsOneWidget);
    expect(
      find.text(
        'Tenants get this by SMS and in their app. Only tenants who have moved in receive it.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('no manager access shows the empty state', (tester) async {
    await _pump(tester, properties: []);
    expect(
      find.text(
        'You need manager access to a property to post an announcement.',
      ),
      findsOneWidget,
    );
    expect(find.text('Post now'), findsNothing);
  });

  testWidgets('posts whole-property with mapped values once on double tap', (
    tester,
  ) async {
    final fake = await _pump(tester);
    await _fill(tester);
    await tester.ensureVisible(find.text('Post now'));
    await tester.tap(find.text('Post now'));
    await tester.tap(find.text('Post now'));
    await tester.pumpAndSettle();
    expect(fake.calls, hasLength(1));
    expect(fake.calls.single, {
      'propertyId': 'p1',
      'title': 'Water off',
      'content': 'Off from 9 to 2',
      'type': 'MAINTENANCE',
      'priority': 'NORMAL',
      'propertyBlockId': null,
      'targetUnitIds': null,
    });
    expect(find.text('open'), findsOneWidget);
    final container = ProviderScope.containerOf(
      tester.element(find.text('open')),
    );
    expect(container.read(rlToastProvider)?.title, 'Announcement sent');
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('one block sends only propertyBlockId', (tester) async {
    final fake = await _pump(tester);
    await _fill(tester);
    await _tapText(tester, 'One block');
    await _tapText(tester, 'Select block');
    await tester.tap(find.text('Block A'));
    await tester.pumpAndSettle();
    await _post(tester);
    expect(fake.calls.single['propertyBlockId'], 'b1');
    expect(fake.calls.single['targetUnitIds'], isNull);
  });

  testWidgets('some units sends only targetUnitIds', (tester) async {
    final fake = await _pump(tester);
    await _fill(tester);
    await _tapText(tester, 'Some units');
    await _tapText(tester, 'Select units');
    await tester.tap(find.text('Unit 1'));
    await tester.tap(find.text('Unit 2'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    await _post(tester);
    expect(fake.calls.single['targetUnitIds'], ['u1', 'u2']);
    expect(fake.calls.single['propertyBlockId'], isNull);
  });

  testWidgets('switching from units to whole property drops the unit ids', (
    tester,
  ) async {
    final fake = await _pump(tester);
    await _fill(tester);
    await _tapText(tester, 'Some units');
    await _tapText(tester, 'Select units');
    await tester.tap(find.text('Unit 1'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    await _tapText(tester, 'Whole property');
    await _post(tester);
    expect(fake.calls.single['targetUnitIds'], isNull);
    expect(fake.calls.single['propertyBlockId'], isNull);
  });

  testWidgets('missing fields show their messages and send nothing', (
    tester,
  ) async {
    final fake = await _pump(tester);
    await _post(tester);
    expect(find.text('Add a title'), findsOneWidget);
    expect(find.text('Write a message'), findsOneWidget);
    expect(find.text('Pick a type'), findsOneWidget);

    await _fill(tester);
    await _tapText(tester, 'One block');
    await _post(tester);
    expect(find.text('Pick a block'), findsOneWidget);

    await _tapText(tester, 'Some units');
    await _post(tester);
    expect(find.text('Pick at least one unit'), findsOneWidget);
    expect(fake.calls, isEmpty);
  });

  testWidgets('publish failure shows "Saved, but not sent yet." and Send now', (
    tester,
  ) async {
    final fake = await _pump(tester, outcome: 'publish-failed');
    await _fill(tester);
    await _post(tester);
    expect(find.text('Saved, but not sent yet.'), findsOneWidget);
    expect(find.text('Send now'), findsOneWidget);
    expect(find.text('Post now'), findsNothing);
    expect(
      tester.widget<TextField>(find.byType(TextField).at(0)).enabled,
      isFalse,
    );

    await _post(tester, 'Send now');
    expect(fake.calls, hasLength(2));
  });

  testWidgets('a failure with no draft keeps the form editable', (
    tester,
  ) async {
    await _pump(tester, outcome: 'failed');
    await _fill(tester);
    await tester.ensureVisible(find.text('Post now'));
    await tester.tap(find.text('Post now'));
    await tester.pumpAndSettle();
    expect(find.text('Saved, but not sent yet.'), findsNothing);
    expect(find.text('Post now'), findsOneWidget);
    expect(
      tester.widget<TextField>(find.byType(TextField).at(0)).enabled,
      isTrue,
    );
    final container = ProviderScope.containerOf(
      tester.element(find.byType(AddAnnouncementScreen)),
    );
    expect(container.read(rlToastProvider)?.title, 'Boom');
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('counters cap title at 60 and message at 2000', (tester) async {
    await _pump(tester);
    await tester.enterText(find.byType(TextField).at(0), 'a' * 80);
    await tester.enterText(find.byType(TextField).at(1), 'b' * 2500);
    await tester.pump();
    expect(find.text('60/60'), findsOneWidget);
    expect(find.text('2000/2000'), findsOneWidget);
  });

  testWidgets('the property in the route is pre-selected when managed', (
    tester,
  ) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
      propertyId: 'p1',
    );
    expect(find.text('Palm Court'), findsOneWidget);
  });

  testWidgets('several properties start unselected and block posting', (
    tester,
  ) async {
    final fake = await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
    );
    expect(find.text('Select property'), findsOneWidget);
    await _fill(tester);
    await _post(tester);
    expect(find.text('Pick a property'), findsOneWidget);
    expect(fake.calls, isEmpty);
  });

  testWidgets('fields stay locked while the retry is in flight', (
    tester,
  ) async {
    final fake = await _pump(tester, outcome: 'retry-pending');
    await _fill(tester);
    await tester.ensureVisible(find.text('Post now'));
    await tester.tap(find.text('Post now'));
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.text('Saved, but not sent yet.'), findsOneWidget);
    expect(find.text('Send now'), findsOneWidget);
    for (final i in [0, 1]) {
      expect(
        tester.widget<TextField>(find.byType(TextField).at(i)).enabled,
        isFalse,
      );
    }
    fake.gate.complete();
    await tester.pumpAndSettle();
  });

  testWidgets('leaving with a draft asks first; Stay keeps the form', (
    tester,
  ) async {
    await _pump(tester, outcome: 'publish-failed');
    await _fill(tester);
    await _post(tester);

    await _tapText(tester, 'Cancel');
    expect(find.text('Leave without sending?'), findsOneWidget);
    expect(
      find.text("It's saved as a draft. You can send it later from the web."),
      findsOneWidget,
    );
    await tester.tap(find.text('Stay'));
    await tester.pumpAndSettle();
    expect(find.text('Leave without sending?'), findsNothing);
    expect(find.text('Send now'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.chevron_left).first);
    await tester.pumpAndSettle();
    expect(find.text('Leave without sending?'), findsOneWidget);
    await tester.tap(find.text('Leave'));
    await tester.pumpAndSettle();
    expect(find.text('open'), findsOneWidget);
  });

  testWidgets('system back with a draft asks first', (tester) async {
    await _pump(tester, outcome: 'publish-failed');
    await _fill(tester);
    await _post(tester);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.text('Leave without sending?'), findsOneWidget);
    expect(find.text('open'), findsNothing);
  });

  testWidgets('leaving without a draft does not ask', (tester) async {
    await _pump(tester);
    await _tapText(tester, 'Cancel');
    expect(find.text('Leave without sending?'), findsNothing);
    expect(find.text('open'), findsOneWidget);
  });

  testWidgets('changing the property clears the block and unit picks', (
    tester,
  ) async {
    final fake = await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
    );
    await _tapText(tester, 'Select property');
    await tester.tap(find.text('Palm Court'));
    await tester.pumpAndSettle();
    await _fill(tester);
    await _tapText(tester, 'Some units');
    await _tapText(tester, 'Select units');
    await tester.tap(find.text('Unit 1'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    expect(find.text('Unit 1'), findsOneWidget);

    await _tapText(tester, 'Palm Court');
    await tester.tap(find.text('Oak Row'));
    await tester.pumpAndSettle();
    expect(find.text('Select units'), findsOneWidget);
    await _post(tester);
    expect(find.text('Pick at least one unit'), findsOneWidget);
    expect(fake.calls, isEmpty);
  });

  testWidgets('a property_id the user does not manage is not preselected', (
    tester,
  ) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
      propertyId: 'p9',
    );
    expect(find.text('Select property'), findsOneWidget);
  });

  testWidgets('counters and caps count characters, not code units', (
    tester,
  ) async {
    await _pump(tester);
    await tester.enterText(find.byType(TextField).at(0), '😀' * 70);
    await tester.pump();
    expect(find.text('60/60'), findsOneWidget);
    expect(
      tester.widget<TextField>(find.byType(TextField).at(0)).controller!.text,
      '😀' * 60,
    );
  });

  testWidgets('a cancelled one-hit search does not preselect that property', (
    tester,
  ) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
      staleOnClear: true,
    );
    await _tapText(tester, 'Select property');
    await tester.enterText(
      find.descendant(
        of: find.byType(RLSearchBar),
        matching: find.byType(TextField),
      ),
      'Oak',
    );
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle();
    expect(find.text('Palm Court'), findsNothing);
    await tester.tap(find.byIcon(Icons.close).last);
    await tester.pumpAndSettle();

    expect(find.text('Select property'), findsOneWidget);
    expect(find.text('Oak Row'), findsNothing);
  });

  testWidgets('a lone property is not preselected while more pages exist', (
    tester,
  ) async {
    await _pump(tester, hasMoreProperties: true);
    expect(find.text('Select property'), findsOneWidget);
  });

  testWidgets('a property list failure offers Try again', (tester) async {
    tester.view.physicalSize = const Size(800, 3200);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          propertyOptionsNotifierProvider(
            managerOnly: true,
          ).overrideWith(_FailsOnce.new),
        ],
        child: const MaterialApp(home: AddAnnouncementScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text("Couldn't load your properties."), findsOneWidget);
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(find.text("Couldn't load your properties."), findsNothing);
    expect(find.text('Palm Court'), findsOneWidget);
  });
}

class _FailsOnce extends PropertyOptionsNotifier {
  @override
  OptionsState<PropertyModel> build({bool managerOnly = false}) =>
      const OptionsState(hasLoaded: true, error: 'offline');

  @override
  Future<void> refresh() async {
    state = OptionsState(items: [_prop('p1', 'Palm Court')], hasLoaded: true);
  }
}
