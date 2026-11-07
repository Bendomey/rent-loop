import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_maintenance.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/options_fakes.dart';
import '../../../support/real_notifier_support.dart';

class _Api extends MaintenanceRequestApi {
  _Api({this.fail = false}) : super(tokenManager: fakeTokenManager());

  final bool fail;
  int creates = 0;

  @override
  Future<List<MaintenanceRequestModel>> createMaintenanceRequest({
    required String clientId,
    required String propertyId,
    required List<String> unitIds,
    required List<String> blockIds,
    required String title,
    required String description,
    required String priority,
    required String category,
    required String visibility,
    required List<String> attachments,
  }) async {
    creates++;
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (fail) throw Exception('boom');
    return [
      MaintenanceRequestModel.fromJson({
        'id': 'r1',
        'code': 'ABC',
        'title': title,
        'category': category,
        'priority': priority,
        'status': 'NEW',
        'property_id': propertyId,
      }),
    ];
  }
}

Future<RecordingToast> _pump(WidgetTester tester, _Api api) async {
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final toast = RecordingToast();
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) => const AddMaintenanceScreen(propertyId: 'p1'),
      ),
      GoRoute(
        path: '/activity/maintenances/:id',
        builder: (_, s) => Text('detail ${s.pathParameters['id']}'),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        maintenanceRequestApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
        rlToastProvider.overrideWith(() => toast),
        propertyOptionsNotifierProvider(managerOnly: true).overrideWith(
          () => FakePropertyOptions([
            PropertyModel(
              id: 'p1',
              name: 'Palm Court',
              type: 'Apartment',
              status: 'ACTIVE',
            ),
          ]),
        ),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': 'MANAGER'}),
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
          UnitOptionsQuery(propertyIds: ['p1']),
        ).overrideWith(
          () => FakeUnitOptions([
            UnitModel(
              id: 'u1',
              name: 'Unit 1',
              type: 'Unit.Type.Apartment',
              status: 'Unit.Status.Occupied',
              rentFee: 1,
              rentFeeCurrency: 'GHS',
            ),
          ]),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return toast;
}

Future<void> _fillAndSubmit(WidgetTester tester) async {
  Future<void> tapText(String text) async {
    await tester.ensureVisible(find.text(text).first);
    await tester.tap(find.text(text).first);
    await tester.pumpAndSettle();
  }

  await tapText('Add units');
  await tester.tap(find.text('Unit 1'));
  await tester.pumpAndSettle();
  await tester.tap(find.textContaining('Done ('));
  await tester.pumpAndSettle();
  await tester.enterText(find.byType(TextField).at(0), 'Leaking tap');
  await tester.enterText(find.byType(TextField).at(1), 'Kitchen tap drips');
  await tapText('Select urgency');
  await tester.tap(find.text('High'));
  await tester.pumpAndSettle();
  await tapText('Select category');
  await tester.tap(find.text('Plumbing'));
  await tester.pumpAndSettle();
  await tapText('Create repair');
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('a created repair toasts and opens its detail', (tester) async {
    final api = _Api();
    final toast = await _pump(tester, api);

    await _fillAndSubmit(tester);

    expect(api.creates, 1);
    expect(toast.shown.single.title, 'Repair added');
    expect(find.text('detail r1'), findsOneWidget);
  });

  testWidgets('a rejected create toasts the error and stays on the form', (
    tester,
  ) async {
    final api = _Api(fail: true);
    final toast = await _pump(tester, api);

    await _fillAndSubmit(tester);

    expect(toast.shown.single.tone, RLToastTone.error);
    expect(find.text('Create repair'), findsOneWidget);
  });
}
