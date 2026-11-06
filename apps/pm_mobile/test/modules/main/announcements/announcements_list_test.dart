import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../money/bill_fixtures.dart';

import 'package:rentloop_manager/src/modules/main/announcements/root.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/announcements/announcements_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

class _StubAnnouncements extends AnnouncementsNotifier {
  static List<AnnouncementModel> items = [];
  static String? error;
  static bool fresh = false;
  static bool loadMoreFailed = false;
  static int nextPageCalls = 0;

  @override
  Future<void> loadNextPage() async => nextPageCalls++;

  @override
  AnnouncementsState build(String? propertyId) => error != null
      ? AnnouncementsState(error: error, hasLoaded: true)
      : fresh
      ? const AnnouncementsState()
      : AnnouncementsState(
          items: items,
          total: items.length,
          hasLoaded: true,
          hasNextPage: loadMoreFailed,
          loadMoreFailed: loadMoreFailed,
        );

  @override
  Future<void> loadFirstPage() async {}
}

PropertyModel _property(String name) => PropertyModel.fromJson({
  'id': 'p1',
  'name': name,
  'type': 'RESIDENTIAL',
  'status': 'ACTIVE',
});

AnnouncementModel _ann(
  String title, {
  String status = 'PUBLISHED',
  String content = 'Water will be off from 9am to 2pm.',
  bool withProperty = true,
  String? blockId,
  List<String> unitIds = const [],
}) => AnnouncementModel(
  id: title,
  title: title,
  content: content,
  type: 'MAINTENANCE',
  priority: 'URGENT',
  status: status,
  createdAt: '2026-11-01T10:00:00Z',
  publishedAt: status == 'PUBLISHED' ? '2026-11-02T10:00:00Z' : null,
  propertyId: withProperty ? 'p1' : null,
  property: withProperty ? _property('Cantonments Court') : null,
  propertyBlockId: blockId,
  targetUnitIds: unitIds,
);

Future<List<Uri>> _pump(
  WidgetTester tester, {
  String role = 'MANAGER',
  String? propertyId,
}) async {
  final pushed = <Uri>[];
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => AnnouncementsScreen(propertyId: propertyId),
      ),
      GoRoute(
        path: '/more/announcements/add',
        builder: (_, s) {
          pushed.add(s.uri);
          return const Scaffold();
        },
      ),
    ],
  );
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        announcementsNotifierProvider(
          propertyId,
        ).overrideWith(_StubAnnouncements.new),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': role}),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
  return pushed;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  mockHaptics();

  setUp(() {
    _StubAnnouncements.items = [];
    _StubAnnouncements.error = null;
    _StubAnnouncements.fresh = false;
    _StubAnnouncements.loadMoreFailed = false;
    _StubAnnouncements.nextPageCalls = 0;
  });

  testWidgets('lists real announcements with plain status labels', (
    tester,
  ) async {
    _StubAnnouncements.items = [
      _ann('Water off Saturday'),
      _ann('Draft notice', status: 'DRAFT'),
    ];
    await _pump(tester);

    expect(find.text('Water off Saturday'), findsOneWidget);
    expect(find.text('Sent'), findsOneWidget);
    expect(find.text('Draft'), findsOneWidget);
    expect(find.text('2 Nov'), findsOneWidget);
    expect(find.text('Cantonments Court'), findsWidgets);
  });

  testWidgets('audience line reflects block and unit targeting', (
    tester,
  ) async {
    _StubAnnouncements.items = [
      _ann('Block one', blockId: 'b1'),
      _ann('Two units', unitIds: ['u1', 'u2']),
    ];
    await _pump(tester);

    expect(find.text('Cantonments Court · one block'), findsOneWidget);
    expect(find.text('Cantonments Court · 2 units'), findsOneWidget);
  });

  testWidgets('broadcast with no property reads "All properties"', (
    tester,
  ) async {
    _StubAnnouncements.items = [_ann('Everyone', withProperty: false)];
    await _pump(tester);

    expect(find.text('All properties'), findsOneWidget);
  });

  testWidgets('no sample announcements', (tester) async {
    _StubAnnouncements.items = [_ann('Water off Saturday')];
    await _pump(tester);

    expect(find.text('Pool closed for cleaning'), findsNothing);
    expect(find.text('Water supply maintenance Sat'), findsNothing);
  });

  testWidgets('add action opens the form for managers', (tester) async {
    final pushed = await _pump(tester);

    await tester.tap(find.byIcon(Icons.add_rounded));
    await tester.pumpAndSettle();

    expect(pushed.single.path, '/more/announcements/add');
    expect(pushed.single.queryParameters, isEmpty);
  });

  testWidgets('add action carries the scoped property', (tester) async {
    final pushed = await _pump(tester, propertyId: 'p1');

    await tester.tap(find.byIcon(Icons.add_rounded));
    await tester.pumpAndSettle();

    expect(pushed.single.queryParameters['property_id'], 'p1');
  });

  testWidgets('add action hidden for STAFF-only users', (tester) async {
    await _pump(tester, role: 'STAFF');

    expect(find.byIcon(Icons.add_rounded), findsNothing);
  });

  testWidgets('tapping a row shows the full message', (tester) async {
    const long =
        'Water will be off from 9am to 2pm on Saturday while the main pipe is replaced. Please store water.';
    _StubAnnouncements.items = [_ann('Water off Saturday', content: long)];
    await _pump(tester);

    await tester.tap(find.text('Water off Saturday'));
    await tester.pumpAndSettle();

    expect(
      find.descendant(of: find.byType(RLSheet), matching: find.text(long)),
      findsOneWidget,
    );
    expect(find.text('Repairs & works'), findsOneWidget);
    expect(find.text('Urgent'), findsOneWidget);
  });

  testWidgets('empty list shows "No announcements yet."', (tester) async {
    await _pump(tester);

    expect(find.text('No announcements yet.'), findsOneWidget);
    expect(
      find.text('Post one to tell your tenants something.'),
      findsOneWidget,
    );
  });

  testWidgets('empty list for STAFF has no post prompt', (tester) async {
    await _pump(tester, role: 'STAFF');

    expect(find.text('No announcements yet.'), findsOneWidget);
    expect(find.text('Post one to tell your tenants something.'), findsNothing);
  });

  testWidgets('shows a skeleton until the first load finishes', (tester) async {
    _StubAnnouncements.fresh = true;
    await _pump(tester);

    expect(find.byType(Shimmer), findsWidgets);
    expect(find.text('No announcements yet.'), findsNothing);
  });

  testWidgets('shows the error state with Try again', (tester) async {
    _StubAnnouncements.error = 'Boom';
    await _pump(tester);

    expect(find.text('Boom'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('shows a footer when loading more failed', (tester) async {
    _StubAnnouncements.items = [_ann('Water off Saturday')];
    _StubAnnouncements.loadMoreFailed = true;
    await _pump(tester);

    expect(find.text("Couldn't load more."), findsOneWidget);
    await tester.tap(find.text('Try again'));
    expect(_StubAnnouncements.nextPageCalls, 1);
  });
}
