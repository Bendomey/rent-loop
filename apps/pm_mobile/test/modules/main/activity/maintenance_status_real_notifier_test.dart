import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_board.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_detail.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/maintenance_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/real_notifier_support.dart';

const _rejection =
    'Rent has already been billed, so this can no longer be changed.';

MaintenanceRequestModel _request() => MaintenanceRequestModel(
  id: 'r1',
  code: 'MR-1',
  title: 'Leaky tap',
  category: 'PLUMBING',
  priority: 'LOW',
  status: 'NEW',
  propertyId: 'p1',
);

class _Api extends MaintenanceRequestApi {
  _Api() : super(tokenManager: fakeTokenManager());

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
        ? [_request()]
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

  @override
  Future<void> updateStatus({
    required String clientId,
    required String propertyId,
    required String requestId,
    required String statusLabel,
    String? cancellationReason,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    throw ApiException(409, '{"errors":{"message":"ChargesAlreadyBilled"}}');
  }
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('detail shows the server reason when a status change fails', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(400, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final toast = RecordingToast();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          maintenanceRequestApiProvider.overrideWithValue(_Api()),
          currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
          rlToastProvider.overrideWith(() => toast),
          maintenanceRequestDetailProvider(
            'r1',
            'p1',
          ).overrideWith((ref) async => _request()),
          maintenanceRequestActivityLogsProvider(
            'r1',
            'p1',
          ).overrideWith((ref) async => const []),
        ],
        child: const MaterialApp(
          home: MaintenanceDetailScreen(id: 'r1', propertyId: 'p1'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();

    await tester.tap(find.text('Change status'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('In Progress'));
    await pumpFrames(tester);

    expect(toast.shown.single.tone, RLToastTone.error);
    expect(toast.shown.single.body, _rejection);
  });

  testWidgets('board shows the server reason when a dragged move fails', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          maintenanceRequestApiProvider.overrideWithValue(_Api()),
          currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
        ],
        child: const MaterialApp(home: Scaffold(body: MaintenanceBoard())),
      ),
    );
    await tester.pump();
    await tester.pump();

    final width = tester.view.physicalSize.width / tester.view.devicePixelRatio;
    final gesture = await tester.startGesture(
      tester.getCenter(find.text('Leaky tap')),
    );
    await tester.pump(const Duration(milliseconds: 600));
    await gesture.moveTo(Offset(width - 10, 300));
    await tester.pump(const Duration(milliseconds: 100));
    await gesture.moveBy(const Offset(1, 0));
    await tester.pump(const Duration(milliseconds: 500));
    await gesture.moveTo(Offset(width / 2, 300));
    await tester.pump(const Duration(milliseconds: 100));
    await gesture.up();
    await pumpFrames(tester);

    expect(find.text(_rejection), findsOneWidget);
  });
}
