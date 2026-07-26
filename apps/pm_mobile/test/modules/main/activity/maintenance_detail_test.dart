import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_detail.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_activity_log_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/maintenance_detail_provider.dart';

const _id = 'mr1';
const _propertyId = 'prop1';

/// Deliberately mixes a very long value (`Gideon Bempong`) with a very short
/// one (`Medium`) — the trailing chevrons only misalign when values differ in
/// width, which is what made the original bug invisible on the Assignments
/// card and obvious on Properties.
MaintenanceRequestModel _fixture() => MaintenanceRequestModel(
  id: _id,
  code: '260359RZMG',
  title: 'Testing push notifications',
  description: 'hello world',
  category: 'ELECTRICAL',
  priority: 'MEDIUM',
  status: 'RESOLVED',
  unitId: 'unit1',
  unit: MaintenanceUnitModel(
    id: 'unit1',
    name: "Domey's Residence",
    slug: 'domeys-residence',
    propertyId: _propertyId,
  ),
  leaseId: 'lease1',
  visibility: 'TENANT_VISIBLE',
  createdByClientUserId: 'm1',
  assignedWorkerId: 'w1',
  assignedManagerId: 'm1',
  assignedWorker: const MaintenanceAssigneeModel(
    id: 'w1',
    name: 'Gideon Bempong',
  ),
  assignedManager: const MaintenanceAssigneeModel(
    id: 'm1',
    name: 'Benjamin Domey',
  ),
  createdAt: '2026-03-15T20:01:00Z',
  updatedAt: '2026-03-16T12:08:00Z',
);

/// One entry per composition branch the History tab has to cover.
List<MaintenanceActivityLogModel> _logs() => [
  MaintenanceActivityLogModel(
    id: 'l1',
    maintenanceRequestId: _id,
    action: 'STATUS_CHANGED',
    metadata: const {'from': 'IN_REVIEW', 'to': 'RESOLVED'},
    createdAt: '2026-03-16T12:08:00Z',
  ),
  MaintenanceActivityLogModel(
    id: 'l2',
    maintenanceRequestId: _id,
    action: 'MANAGER_ASSIGNED',
    // Same id as the request's assigned manager — the self-assignment branch.
    performedByClientUser: const MaintenanceAssigneeModel(
      id: 'm1',
      name: 'Benjamin Domey',
    ),
    createdAt: '2026-03-16T11:52:00Z',
  ),
  MaintenanceActivityLogModel(
    id: 'l3',
    maintenanceRequestId: _id,
    action: 'WORKER_ASSIGNED',
    performedByClientUser: const MaintenanceAssigneeModel(
      id: 'm1',
      name: 'Benjamin Domey',
    ),
    createdAt: '2026-03-16T11:50:00Z',
  ),
  MaintenanceActivityLogModel(
    id: 'l4',
    maintenanceRequestId: _id,
    action: 'CREATED',
    performedByClientUser: const MaintenanceAssigneeModel(
      id: 'm1',
      name: 'Benjamin Domey',
    ),
    createdAt: '2026-03-15T20:01:00Z',
  ),
];

Future<void> _pumpScreen(WidgetTester tester) async {
  // Phone-width but very tall: the screen is a lazy ListView, so at the
  // default 600pt height the History timeline never gets built and every
  // assertion about it silently finds nothing.
  tester.view.physicalSize = const Size(400, 3000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        maintenanceRequestDetailProvider(
          _id,
          _propertyId,
        ).overrideWith((ref) async => _fixture()),
        maintenanceRequestActivityLogsProvider(
          _id,
          _propertyId,
        ).overrideWith((ref) async => _logs()),
      ],
      child: const MaterialApp(
        home: MaintenanceDetailScreen(id: _id, propertyId: _propertyId),
      ),
    ),
  );
  // One pump resolves the overridden futures, the next paints the loaded body.
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('renders the loaded request', (tester) async {
    await _pumpScreen(tester);

    expect(find.text('Gideon Bempong'), findsOneWidget);
    expect(find.text('Benjamin Domey'), findsOneWidget);
    expect(find.text('Medium'), findsOneWidget);
    expect(find.text('Electrical'), findsOneWidget);
    expect(find.text('Tenant Visible'), findsOneWidget);
    expect(find.text("Domey's Residence"), findsOneWidget);
    expect(find.text('View lease'), findsOneWidget);
  });

  testWidgets('every spec row trailing glyph shares one right edge', (
    tester,
  ) async {
    await _pumpScreen(tester);

    // Edit rows end in a chevron, navigation rows in an arrow; all seven must
    // land on the same right edge regardless of how wide their value is.
    List<double> rightEdges(IconData icon) {
      final finder = find.byIcon(icon);
      return List.generate(
        finder.evaluate().length,
        (i) => tester.getBottomRight(finder.at(i)).dx,
      );
    }

    final edges = [
      ...rightEdges(Icons.chevron_right_rounded),
      ...rightEdges(Icons.arrow_forward_rounded),
    ];

    expect(edges.length, 7, reason: '5 editable rows + 2 navigation rows');
    for (final edge in edges) {
      expect(
        edge,
        moreOrLessEquals(edges.first, epsilon: 0.5),
        reason: 'trailing glyphs must be flush to a single right edge',
      );
    }
  });

  group('history sentences', () {
    testWidgets('status change names both statuses by label', (tester) async {
      await _pumpScreen(tester);

      // Raw API enums (IN_REVIEW/RESOLVED) must surface as display labels.
      expect(
        find.textContaining('Changed from', findRichText: true),
        findsOneWidget,
      );
      expect(
        find.textContaining('In Review', findRichText: true),
        findsOneWidget,
      );
    });

    testWidgets('assignment reads the assignee off the request', (
      tester,
    ) async {
      await _pumpScreen(tester);

      // The log carries only the performer; "Gideon Bempong" can only come
      // from the request's assigned_worker, matching the web portal.
      expect(
        find.textContaining('Gideon Bempong', findRichText: true),
        findsWidgets,
      );
    });

    testWidgets('self-assignment is called out', (tester) async {
      await _pumpScreen(tester);

      expect(
        find.textContaining('assigned to themselves', findRichText: true),
        findsOneWidget,
      );
    });

    testWidgets('manager-created request says created, not submitted', (
      tester,
    ) async {
      await _pumpScreen(tester);

      expect(
        find.textContaining('Created by', findRichText: true),
        findsOneWidget,
      );
      expect(
        find.textContaining('Submitted by', findRichText: true),
        findsNothing,
      );
    });
  });
}
