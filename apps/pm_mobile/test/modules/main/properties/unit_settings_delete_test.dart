import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/properties/unit_settings.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/unit_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/real_notifier_support.dart';

class _Api extends UnitApi {
  _Api({this.fail = false}) : super(tokenManager: fakeTokenManager());

  final bool fail;

  @override
  Future<void> deleteUnit({
    required String clientId,
    required String propertyId,
    required String unitId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (fail) {
      throw ApiException(409, '{"errors":{"message":"UnitIsOccupied"}}');
    }
  }

  @override
  Future<UnitsPage> getUnits({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? blockId,
  }) async => UnitsPage(rows: const [], meta: emptyMeta());
}

Future<RecordingToast> _pump(WidgetTester tester, _Api api) async {
  final toast = RecordingToast();
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) =>
            const UnitSettingsHubScreen(propertyId: 'p1', unitId: 'u1'),
      ),
      GoRoute(
        path: '/properties/:id/units',
        builder: (_, _) => const Text('units list'),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        unitApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
        rlToastProvider.overrideWith(() => toast),
        unitDetailProvider('p1', 'u1').overrideWith(
          (ref) async => UnitModel(
            id: 'u1',
            name: 'Unit 1',
            type: 'Unit.Type.Apartment',
            status: 'Unit.Status.Available',
            rentFee: 1,
            rentFeeCurrency: 'GHS',
          ),
        ),
        propertyDetailProvider('p1').overrideWith(
          (ref) async => PropertyModel(
            id: 'p1',
            name: 'Palm Court',
            type: 'MULTI',
            status: 'ACTIVE',
          ),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return toast;
}

Future<void> _confirmDelete(WidgetTester tester) async {
  await tester.tap(find.text('Delete unit'));
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

  testWidgets('a deleted unit toasts and returns to the unit list', (
    tester,
  ) async {
    final toast = await _pump(tester, _Api());

    await _confirmDelete(tester);

    expect(toast.shown.single.title, 'Unit deleted');
    expect(find.text('units list'), findsOneWidget);
  });

  testWidgets('a rejected delete says why and stays put', (tester) async {
    await _pump(tester, _Api(fail: true));

    await _confirmDelete(tester);

    expect(
      find.text("This unit is occupied and can't be deleted."),
      findsOneWidget,
    );
    expect(find.text('units list'), findsNothing);
  });
}
