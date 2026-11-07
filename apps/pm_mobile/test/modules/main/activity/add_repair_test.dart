import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_maintenance.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/modules/main/activity/root.dart';
import 'package:rentloop_manager/src/modules/main/repairs/root.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_maintenance_request_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/block_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

import '../../../support/options_fakes.dart';

class _FakeCreate extends CreateMaintenanceRequestNotifier {
  _FakeCreate({this.fail = false});

  final bool fail;
  final calls = <Map<String, Object?>>[];

  @override
  Future<void> submit({
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
    calls.add({
      'propertyId': propertyId,
      'unitIds': unitIds,
      'blockIds': blockIds,
      'title': title,
      'description': description,
      'priority': priority,
      'category': category,
      'visibility': visibility,
      'attachments': attachments,
    });
    await Future<void>.delayed(const Duration(milliseconds: 10));
    state = fail
        ? CreateMaintenanceRequestState(
            status: ApiStatus.failed,
            errorMessage: 'Boom from server',
          )
        : CreateMaintenanceRequestState(
            status: ApiStatus.success,
            createdId: 'new1',
          );
  }
}

const _pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

class _FakePicker extends ApplicationImagePicker {
  @override
  Future<PickedImageBytes?> pick(ImageSource source) async =>
      PickedImageBytes(base64Decode(_pngBase64), 'png');
}

class _FakeUpload extends R2UploadService {
  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) async => 'https://r2/x.jpg';
}

class _FailingUpload extends R2UploadService {
  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) async => throw Exception('upload failed');
}

class _StalledUpload extends R2UploadService {
  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
    String? contentType,
  }) => Completer<String>().future;
}

PropertyModel _prop(String id, String name) =>
    PropertyModel(id: id, name: name, type: 'Apartment', status: 'ACTIVE');

UnitModel _unit(
  String id,
  String name, {
  String? block,
  String status = 'Unit.Status.Occupied',
}) => UnitModel(
  id: id,
  name: name,
  type: 'Unit.Type.Apartment',
  status: status,
  rentFee: 1,
  rentFeeCurrency: 'GHS',
  propertyBlock: block == null ? null : UnitBlockRef(id: 'b1', name: block),
);

PropertyBlockModel _block(String id, String name) =>
    PropertyBlockModel(id: id, name: name, status: 'ACTIVE', unitsCount: 1);

Future<_FakeCreate> _pump(
  WidgetTester tester, {
  List<PropertyModel>? properties,
  String? propertyId,
  bool fail = false,
  bool stallUploads = false,
  R2UploadService? upload,
  List<PropertyBlockModel>? blocks,
  List<UnitModel>? units,
  List<String>? unitSearches,
  Map<String, String>? roles,
  bool hasMoreProperties = false,
  bool staleOnClear = false,
  PropertyModel? detail,
}) async {
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final fake = _FakeCreate(fail: fail);
  final props = properties ?? [_prop('p1', 'Palm Court')];
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => AddMaintenanceScreen(propertyId: propertyId),
      ),
      GoRoute(
        path: '/activity/maintenances/:id',
        builder: (_, s) => Text('detail ${s.pathParameters['id']} ${s.extra}'),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        propertyOptionsNotifierProvider(managerOnly: true).overrideWith(
          () => FakePropertyOptions(
            props,
            hasNextPage: hasMoreProperties,
            staleOnClear: staleOnClear,
          ),
        ),
        if (detail != null)
          propertyDetailProvider(detail.id).overrideWith((ref) async => detail),
        myPropertyRolesProvider.overrideWith(
          (ref) async => roles ?? {for (final p in props) p.id: 'MANAGER'},
        ),
        for (final id in ['p1', 'p2']) ...[
          blockOptionsNotifierProvider(id).overrideWith(
            () => FakeBlockOptions(blocks ?? [_block('b1', 'Block A')]),
          ),
          unitOptionsNotifierProvider(
            UnitOptionsQuery(propertyIds: [id]),
          ).overrideWith(
            () => FakeUnitOptions(
              units ??
                  [
                    _unit('u1', 'Unit 1', block: 'Block A'),
                    _unit('u2', 'Unit 2'),
                    _unit('u3', 'Unit 3', status: 'Unit.Status.Available'),
                  ],
              searches: unitSearches,
            ),
          ),
        ],
        createMaintenanceRequestNotifierProvider.overrideWith(() => fake),
        applicationImagePickerProvider.overrideWithValue(_FakePicker()),
        r2UploadServiceProvider.overrideWithValue(
          upload ?? (stallUploads ? _StalledUpload() : _FakeUpload()),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return fake;
}

final _doneButton = find.textContaining('Done (');

Future<void> _tapText(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text).first);
  await tester.tap(find.text(text).first);
  await tester.pumpAndSettle();
}

Future<void> _pickUnit(WidgetTester tester, String name) async {
  await _tapText(tester, 'Add units');
  await tester.tap(find.text(name));
  await tester.pumpAndSettle();
  await tester.tap(_doneButton);
  await tester.pumpAndSettle();
}

Future<void> _fillRest(WidgetTester tester) async {
  await tester.enterText(find.byType(TextField).at(0), 'Leaking tap');
  await tester.enterText(find.byType(TextField).at(1), 'Kitchen tap drips');
  await _tapText(tester, 'Select urgency');
  await tester.tap(find.text('High'));
  await tester.pumpAndSettle();
  await _tapText(tester, 'Select category');
  await tester.tap(find.text('Plumbing'));
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

  testWidgets('no sample blocks or units', (tester) async {
    await _pump(tester);
    expect(find.text('Cantonments Court'), findsNothing);
    expect(find.textContaining('Unit 4B'), findsNothing);
    expect(find.text('Palm Court'), findsOneWidget);
  });

  testWidgets('only offered properties; several options start unselected', (
    tester,
  ) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
    );
    expect(find.text('Select property'), findsOneWidget);
    expect(find.text('Pick a property first.'), findsOneWidget);
    await _tapText(tester, 'Select property');
    expect(find.text('Oak Row'), findsOneWidget);
  });

  testWidgets('the property in the route is pre-selected', (tester) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
      propertyId: 'p2',
    );
    expect(find.text('Oak Row'), findsOneWidget);
    expect(find.text('Pick a property first.'), findsNothing);
  });

  testWidgets('no managed property shows the manager-access message', (
    tester,
  ) async {
    await _pump(tester, properties: const []);
    expect(
      find.text('You need manager access to a property to add a repair.'),
      findsOneWidget,
    );
    expect(find.text('Create repair'), findsNothing);
  });

  testWidgets('changing property clears picked units', (tester) async {
    await _pump(
      tester,
      properties: [_prop('p1', 'Palm Court'), _prop('p2', 'Oak Row')],
      propertyId: 'p1',
    );
    await _pickUnit(tester, 'Unit 1');
    expect(find.textContaining('Unit 1 '), findsOneWidget);

    await _tapText(tester, 'Palm Court');
    await tester.tap(find.text('Oak Row'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Unit 1 '), findsNothing);
    expect(find.text('Add units'), findsOneWidget);
  });

  testWidgets('submits ids, mapped values and photo urls once', (tester) async {
    final fake = await _pump(tester);
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Choose image');
    await tester.tap(find.text('Choose from gallery'));
    await tester.pumpAndSettle();

    final button = find.text('Create repair');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.tap(button);
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));

    expect(fake.calls, hasLength(1));
    final call = fake.calls.single;
    expect(call['propertyId'], 'p1');
    expect(call['unitIds'], ['u1']);
    expect(call['blockIds'], isEmpty);
    expect(call['priority'], 'HIGH');
    expect(call['category'], 'PLUMBING');
    expect(call['visibility'], 'TENANT_VISIBLE');
    expect(call['attachments'], ['https://r2/x.jpg']);
  });

  testWidgets('Add repair unit picks survive a search and are all submitted', (
    tester,
  ) async {
    final searches = <String>[];
    final fake = await _pump(tester, unitSearches: searches);
    await _tapText(tester, 'Add units');
    await tester.tap(find.text('Unit 1'));
    await tester.pump();

    await tester.enterText(
      find.descendant(
        of: find.byType(RLSearchBar),
        matching: find.byType(TextField),
      ),
      '3',
    );
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle();
    expect(searches, ['3']);
    expect(find.text('Unit 1'), findsNothing);

    await tester.tap(find.text('Unit 3'));
    await tester.pump();
    await tester.tap(find.text('Done (2)'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Unit 1 '), findsOneWidget);
    expect(find.textContaining('Unit 3'), findsOneWidget);

    await _fillRest(tester);
    await _tapText(tester, 'Create repair');
    await tester.pump(const Duration(seconds: 5));
    expect(fake.calls.single['unitIds'], unorderedEquals(['u1', 'u3']));
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
    expect(find.text('Palm Court'), findsNothing);
  });

  testWidgets('a scoped property missing from page one is found by role', (
    tester,
  ) async {
    await _pump(
      tester,
      propertyId: 'p2',
      properties: [_prop('p1', 'Palm Court')],
      roles: {'p1': 'MANAGER', 'p2': 'MANAGER'},
      detail: _prop('p2', 'Oak Row'),
    );
    expect(find.text('Oak Row'), findsOneWidget);
  });

  testWidgets('a scoped property the user only staffs is not preselected', (
    tester,
  ) async {
    await _pump(
      tester,
      propertyId: 'p2',
      properties: [_prop('p1', 'Palm Court')],
      roles: {'p1': 'MANAGER', 'p2': 'STAFF'},
      detail: _prop('p2', 'Oak Row'),
    );
    expect(find.text('Oak Row'), findsNothing);
    expect(find.text('Select property'), findsOneWidget);
  });

  testWidgets('a block forces "Only staff can see this"', (tester) async {
    final fake = await _pump(tester);
    await _tapText(tester, 'Add blocks');
    await tester.tap(find.text('Block A'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();

    expect(find.text('Only staff can see this'), findsOneWidget);
    await _fillRest(tester);
    await _tapText(tester, 'Create repair');
    await tester.pump(const Duration(seconds: 5));
    expect(fake.calls.single['visibility'], 'INTERNAL_ONLY');
    expect(fake.calls.single['blockIds'], ['b1']);
  });

  testWidgets('missing fields show their messages and nothing is sent', (
    tester,
  ) async {
    final fake = await _pump(tester);
    await _tapText(tester, 'Create repair');

    expect(find.text('Pick at least one block or unit'), findsOneWidget);
    expect(find.text('Add a title'), findsOneWidget);
    expect(find.text('Add a description'), findsOneWidget);
    expect(find.text('Pick how urgent it is'), findsOneWidget);
    expect(find.text('Pick a category'), findsOneWidget);
    expect(fake.calls, isEmpty);
  });

  testWidgets('a blocking photo disables Create repair', (tester) async {
    final fake = await _pump(tester, stallUploads: true);
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Choose image');
    await tester.tap(find.text('Choose from gallery'));
    await tester.pump();
    await tester.pump();

    await tester.ensureVisible(find.text('Create repair'));
    await tester.tap(find.text('Create repair'));
    await tester.pump();
    expect(fake.calls, isEmpty);
  });

  testWidgets('server error keeps the form and shows the message', (
    tester,
  ) async {
    final fake = await _pump(tester, fail: true);
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Create repair');

    expect(fake.calls, hasLength(1));
    expect(find.text('Leaking tap'), findsOneWidget);
    expect(find.text('New repair'), findsWidgets);
    final container = ProviderScope.containerOf(
      tester.element(find.byType(AddMaintenanceScreen)),
    );
    expect(container.read(rlToastProvider)?.title, 'Boom from server');
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('success replaces the form with the repair detail', (
    tester,
  ) async {
    await _pump(tester);
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Create repair');

    expect(find.text('detail new1 p1'), findsOneWidget);
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('scoped property that is not managed is left empty', (
    tester,
  ) async {
    await _pump(tester, propertyId: 'pX');
    expect(find.text('Select property'), findsOneWidget);
    expect(find.text('Palm Court'), findsNothing);
  });

  testWidgets('empty units show the empty copy while blocks still work', (
    tester,
  ) async {
    await _pump(tester, units: <UnitModel>[]);
    await _tapText(tester, 'Add units');
    expect(find.text('No units in this property'), findsOneWidget);
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    await _tapText(tester, 'Add blocks');
    expect(find.text('Block A'), findsOneWidget);
  });

  testWidgets('empty blocks show the empty copy', (tester) async {
    await _pump(tester, blocks: <PropertyBlockModel>[]);
    await _tapText(tester, 'Add blocks');
    expect(find.text('No blocks in this property'), findsOneWidget);
  });

  testWidgets('visibility returns to the user choice when the lock clears', (
    tester,
  ) async {
    final fake = await _pump(tester);
    await _tapText(tester, 'Tenant can see this');
    await tester.tap(find.text('Only staff can see this'));
    await tester.pumpAndSettle();
    await _tapText(tester, 'Add blocks');
    await tester.tap(find.text('Block A').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Block A').last);
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    await _pickUnit(tester, 'Unit 1');
    expect(find.text('Only staff can see this'), findsOneWidget);

    await _tapText(tester, 'Only staff can see this');
    await tester.tap(find.text('Tenant can see this'));
    await tester.pumpAndSettle();
    await _tapText(tester, 'Add units');
    await tester.tap(find.text('Unit 2'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    expect(find.text('Only staff can see this'), findsOneWidget);

    await _tapText(tester, 'Add units');
    await tester.tap(find.text('Unit 2').last);
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    expect(find.text('Tenant can see this'), findsOneWidget);
    expect(fake.calls, isEmpty);
  });

  testWidgets('a single vacant unit shows the staff-only note', (tester) async {
    await _pump(tester);
    await _pickUnit(tester, 'Unit 1');
    expect(find.textContaining('No tenant lives here yet'), findsNothing);

    await _tapText(tester, 'Add units');
    await tester.tap(find.text('Unit 1').last);
    await tester.tap(find.text('Unit 3'));
    await tester.pumpAndSettle();
    await tester.tap(_doneButton);
    await tester.pumpAndSettle();
    expect(
      find.text(
        'No tenant lives here yet, so only staff will see this repair.',
      ),
      findsOneWidget,
    );
    expect(find.text('Tenant can see this'), findsOneWidget);
  });

  testWidgets('urgent uses the danger tone', (tester) async {
    await _pump(tester);
    await _tapText(tester, 'Select urgency');
    final dots = tester.widgetList<RLDot>(find.byType(RLDot)).toList();
    expect(dots.first.tone, RLTone.danger);
  });

  testWidgets('a failed upload blocks Create repair and says why', (
    tester,
  ) async {
    final fake = await _pump(tester, upload: _FailingUpload());
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Choose image');
    await tester.tap(find.text('Choose from gallery'));
    await tester.pumpAndSettle();

    expect(find.text('Wait for the photos to finish.'), findsOneWidget);
    await tester.ensureVisible(find.text('Create repair'));
    await tester.tap(find.text('Create repair'), warnIfMissed: false);
    await tester.pump();
    expect(fake.calls, isEmpty);
  });

  testWidgets('a stalled upload explains the disabled button', (tester) async {
    await _pump(tester, stallUploads: true);
    await _tapText(tester, 'Choose image');
    await tester.tap(find.text('Choose from gallery'));
    await tester.pump();
    await tester.pump();
    expect(find.text('Wait for the photos to finish.'), findsOneWidget);
  });

  testWidgets('Remove drops the photo url from the submission', (tester) async {
    final fake = await _pump(tester);
    await _pickUnit(tester, 'Unit 1');
    await _fillRest(tester);
    await _tapText(tester, 'Choose image');
    await tester.tap(find.text('Choose from gallery'));
    await tester.pumpAndSettle();
    await _tapText(tester, 'Remove');
    await _tapText(tester, 'Create repair');
    await tester.pump(const Duration(seconds: 5));

    expect(fake.calls.single['attachments'], isEmpty);
  });

  testWidgets('photo cap stops at five', (tester) async {
    await _pump(tester);
    for (var i = 0; i < 4; i++) {
      await _tapText(tester, 'Add another photo');
    }
    expect(find.byType(ApplicationUploadTile), findsNWidgets(5));
    expect(find.text('Add another photo'), findsNothing);
  });

  group('entry points', () {
    Widget host(Widget child, Map<String, String> roles) => ProviderScope(
      overrides: [myPropertyRolesProvider.overrideWith((ref) async => roles)],
      child: MaterialApp.router(
        routerConfig: GoRouter(
          routes: [GoRoute(path: '/', builder: (_, __) => child)],
        ),
      ),
    );

    testWidgets('Repairs FAB hidden for STAFF-only users', (tester) async {
      await tester.pumpWidget(host(const RepairsScreen(), {'p1': 'STAFF'}));
      await tester.pump();
      await tester.pump();
      expect(find.text('Add repair'), findsNothing);
    });

    testWidgets('Repairs FAB shown for managers', (tester) async {
      await tester.pumpWidget(host(const RepairsScreen(), {'p1': 'MANAGER'}));
      await tester.pump();
      await tester.pump();
      expect(find.text('Add repair'), findsOneWidget);
    });

    testWidgets('scoped Repairs FAB needs MANAGER on that property', (
      tester,
    ) async {
      await tester.pumpWidget(
        host(const RepairsScreen(propertyId: 'p1'), {
          'p1': 'STAFF',
          'p2': 'MANAGER',
        }),
      );
      await tester.pump();
      await tester.pump();
      expect(find.text('Add repair'), findsNothing);
    });

    testWidgets('scoped Repairs FAB pushes property_id', (tester) async {
      String? pushed;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            myPropertyRolesProvider.overrideWith(
              (ref) async => {'p1': 'MANAGER'},
            ),
          ],
          child: MaterialApp.router(
            routerConfig: GoRouter(
              routes: [
                GoRoute(
                  path: '/',
                  builder: (_, __) => const RepairsScreen(propertyId: 'p1'),
                ),
                GoRoute(
                  path: '/activity/maintenances/add',
                  builder: (_, s) {
                    pushed = s.uri.toString();
                    return const Text('form');
                  },
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.tap(find.text('Add repair'));
      await tester.pumpAndSettle();
      expect(pushed, '/activity/maintenances/add?property_id=p1');
    });

    testWidgets('Activity repair action hidden for STAFF-only users', (
      tester,
    ) async {
      await tester.pumpWidget(host(const ActivityScreen(), {'p1': 'STAFF'}));
      await tester.pump();
      await tester.pump();
      expect(find.text('Repair'), findsNothing);
    });
  });
}
