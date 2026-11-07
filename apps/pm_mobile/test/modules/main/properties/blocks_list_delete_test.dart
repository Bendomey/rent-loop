import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/properties/blocks_list.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/real_notifier_support.dart';

class _Api extends PropertyBlockApi {
  _Api({this.fail = false}) : super(tokenManager: fakeTokenManager());

  final bool fail;
  var _deleted = false;

  @override
  Future<PropertyBlocksPage> getBlocks({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 100,
    String? status,
    String? search,
  }) async => PropertyBlocksPage(
    rows: [
      if (!_deleted)
        PropertyBlockModel(
          id: 'b1',
          name: 'Block A',
          status: 'ACTIVE',
          unitsCount: 0,
        ),
    ],
    meta: emptyMeta(),
  );

  @override
  Future<void> deleteBlock({
    required String clientId,
    required String propertyId,
    required String blockId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (fail) {
      throw ApiException(409, '{"errors":{"message":"UnitIsOccupied"}}');
    }
    _deleted = true;
  }
}

Future<RecordingToast> _pump(WidgetTester tester, _Api api) async {
  final toast = RecordingToast();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        propertyBlockApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
        rlToastProvider.overrideWith(() => toast),
        propertyDetailProvider('p1').overrideWith(
          (ref) async => PropertyModel(
            id: 'p1',
            name: 'Palm Court',
            type: 'MULTI',
            status: 'ACTIVE',
          ),
        ),
      ],
      child: const MaterialApp(home: BlocksListScreen(propertyId: 'p1')),
    ),
  );
  await tester.pumpAndSettle();
  return toast;
}

Future<void> _deleteBlock(WidgetTester tester) async {
  await tester.tap(find.byIcon(Icons.more_vert_rounded));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Delete').last);
  await tester.pumpAndSettle();
  await tester.tap(find.text('Delete').last);
  await pumpFrames(tester);
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('a deleted block toasts and leaves the list', (tester) async {
    final toast = await _pump(tester, _Api());

    await _deleteBlock(tester);

    expect(toast.shown.single.title, 'Block deleted');
    expect(find.text('Block A'), findsNothing);
  });

  testWidgets('a rejected block delete says why', (tester) async {
    await _pump(tester, _Api(fail: true));

    await _deleteBlock(tester);

    expect(
      find.text("This unit is occupied and can't be deleted."),
      findsOneWidget,
    );
  });
}
