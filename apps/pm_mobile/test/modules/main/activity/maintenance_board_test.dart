import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_board.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _FakeRequestApi extends MaintenanceRequestApi {
  _FakeRequestApi() : super(tokenManager: TokenManager(_NoStorage()));

  @override
  Future<MaintenanceRequestsPage> getMaintenanceRequests({
    required String clientId,
    String? statusLabel,
    int page = 1,
    int pageSize = 20,
    String? priorityLabel,
    String? categoryLabel,
    String? assignedWorkerId,
    String? assignedManagerId,
    List<String> propertyIds = const [],
    List<String> unitIds = const [],
  }) async {
    final rows = statusLabel == 'New'
        ? [
            MaintenanceRequestModel(
              id: 'r1',
              code: 'MR-1',
              title: 'Leaky tap',
              category: 'PLUMBING',
              priority: 'LOW',
              status: 'NEW',
              propertyId: 'p1',
            ),
          ]
        : <MaintenanceRequestModel>[];
    return MaintenanceRequestsPage(
      rows: rows,
      meta: PaginationMetaModel(
        total: rows.length,
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
}

class _FakePeopleApi extends ClientUserPropertyApi {
  _FakePeopleApi() : super(tokenManager: TokenManager(_NoStorage()));

  final List<String> started = [];
  final Completer<List<MaintenanceAssigneeModel>> gate = Completer();

  @override
  Future<List<MaintenanceAssigneeModel>> getClientUserProperties({
    required String clientId,
    required String propertyId,
  }) {
    started.add(propertyId);
    return gate.future;
  }
}

class _PropertiesApi extends ClientUserPropertyApi {
  _PropertiesApi() : super(tokenManager: TokenManager(_NoStorage()));

  final searches = <String?>[];

  @override
  Future<PropertiesPage> getMyProperties({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? order,
    String? orderBy,
  }) async {
    searches.add(search);
    final all = [
      for (final name in ['Palm Court', 'Oak Row'])
        PropertyModel(
          id: name == 'Oak Row' ? 'p2' : 'p1',
          name: name,
          type: 'Apartment',
          status: 'ACTIVE',
        ),
    ];
    final rows = [
      for (final p in all)
        if (search == null ||
            search.isEmpty ||
            p.name.toLowerCase().contains(search))
          p,
    ];
    return PropertiesPage(
      rows: rows,
      meta: PaginationMetaModel(
        total: rows.length,
        page: 1,
        pageSize: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
}

class _SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

void main() {
  testWidgets('mounts without throwing and shows the New page', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: Scaffold(body: MaintenanceBoard())),
      ),
    );
    await tester.pump();

    expect(find.text('New'), findsWidgets);
  });

  testWidgets('board does not fetch assignees until the people filter opens', (
    tester,
  ) async {
    final people = _FakePeopleApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          maintenanceRequestApiProvider.overrideWithValue(_FakeRequestApi()),
          clientUserPropertyApiProvider.overrideWithValue(people),
          currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
        ],
        child: const MaterialApp(home: Scaffold(body: MaintenanceBoard())),
      ),
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('Leaky tap'), findsOneWidget);
    expect(people.started, isEmpty);

    await tester.tap(find.text('Assigned Worker'));
    await tester.pump();

    expect(people.started, ['p1']);
    expect(find.byType(Shimmer), findsWidgets);

    people.gate.complete([
      const MaintenanceAssigneeModel(id: 'a1', name: 'Al Worker'),
    ]);
    await tester.pumpAndSettle();

    expect(find.text('Al Worker'), findsOneWidget);
  });

  testWidgets('board property filter searches the server', (tester) async {
    final properties = _PropertiesApi();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          maintenanceRequestApiProvider.overrideWithValue(_FakeRequestApi()),
          clientUserPropertyApiProvider.overrideWithValue(properties),
          currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
        ],
        child: const MaterialApp(home: Scaffold(body: MaintenanceBoard())),
      ),
    );
    await tester.pump();
    await tester.pump();

    await tester.tap(find.text('Property'));
    await tester.pumpAndSettle();
    expect(find.text('Palm Court'), findsOneWidget);
    expect(find.text('Oak Row'), findsOneWidget);

    await tester.enterText(
      find.descendant(
        of: find.byType(RLSearchBar),
        matching: find.byType(TextField),
      ),
      'oak',
    );
    await tester.pumpAndSettle();
    expect(properties.searches.last, 'oak');
    expect(find.text('Palm Court'), findsNothing);

    await tester.tap(find.text('Oak Row'));
    await tester.pump();
    await tester.tap(find.text('Done (1)'));
    await tester.pumpAndSettle();

    expect(find.text('Oak Row'), findsOneWidget);
    expect(find.text('Property'), findsNothing);
  });
}
