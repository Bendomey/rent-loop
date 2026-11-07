import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/leases/checklist_detail.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_checklists_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/real_notifier_support.dart';

class _Api extends LeaseChecklistApi {
  _Api() : super(tokenManager: fakeTokenManager());

  int deletes = 0;

  @override
  Future<void> deleteItem({
    required String clientId,
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String itemId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    deletes++;
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

  testWidgets('removing an item confirms it with a toast', (tester) async {
    final api = _Api();
    final toast = RecordingToast();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          leaseChecklistApiProvider.overrideWithValue(api),
          currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
          rlToastProvider.overrideWith(() => toast),
          leaseChecklistsProvider('p1', 'l1').overrideWith(
            (ref) async => [
              LeaseChecklistModel(
                id: 'c1',
                type: 'CHECK_IN',
                status: 'DRAFT',
                items: [
                  LeaseChecklistItemModel(
                    id: 'i1',
                    leaseChecklistId: 'c1',
                    description: 'Kitchen: Sink',
                    status: 'PENDING',
                  ),
                ],
              ),
            ],
          ),
        ],
        child: const MaterialApp(
          home: ChecklistDetailScreen(
            propertyId: 'p1',
            leaseId: 'l1',
            checklistId: 'c1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.delete_outline_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Remove'));
    await pumpFrames(tester);

    expect(api.deletes, 1);
    expect(toast.shown.single.title, 'Item deleted');
  });
}
