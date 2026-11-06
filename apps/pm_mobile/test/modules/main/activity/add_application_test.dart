import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_application.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_form_widgets.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_unit_options_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _Api extends TenantApplicationApi {
  _Api() : super(tokenManager: TokenManager(_NoStorage()));

  TenantLookupModel? lookupResult;
  final lookupResults = <String, TenantLookupModel?>{};
  final lookups = <String>[];
  final created = <CreateTenantApplicationInput>[];

  @override
  Future<TenantLookupModel?> lookupTenantByPhone(String e164) async {
    lookups.add(e164);
    return lookupResults.containsKey(e164) ? lookupResults[e164] : lookupResult;
  }

  @override
  Future<TenantApplicationModel> createApplication({
    required String clientId,
    required String propertyId,
    required CreateTenantApplicationInput input,
  }) async {
    created.add(input);
    return TenantApplicationModel(id: 'new1', code: 'TA-1');
  }
}

class _FailingUpload extends R2UploadService {
  @override
  Future<String> uploadBytes(
    List<int> bytes, {
    required String objectKeyPrefix,
    String ext = 'png',
  }) async => throw Exception('nope');
}

class _FakePicker extends ApplicationImagePicker {
  @override
  Future<PickedImageBytes?> pick(ImageSource source) async =>
      PickedImageBytes(Uint8List.fromList([1, 2, 3]), 'png');
}

class _SignedIn extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

UnitModel _unit(String id, String name, String property) => UnitModel(
  id: id,
  name: name,
  type: 'Unit.Type.Apartment',
  status: 'Unit.Status.Available',
  rentFee: 1,
  rentFeeCurrency: 'GHS',
  propertyId: 'p1',
  property: UnitPropertyRef(id: 'p1', name: property),
);

TenantLookupModel _returning() => TenantLookupModel(
  id: 't1',
  firstName: 'Ama',
  lastName: 'Mensah',
  phone: '+233241234567',
  gender: 'FEMALE',
  dateOfBirth: DateTime.utc(1990, 5, 17),
  nationality: 'Ghanaian',
  currentAddress: '12 Palm Street',
  occupation: 'STUDENT',
  employer: 'Legon',
);

final _units = [_unit('u1', 'A1', 'Palm Court'), _unit('u2', 'B2', 'Oak Row')];

Future<_Api> _pump(
  WidgetTester tester, {
  Map<String, TenantLookupModel?> lookups = const {},
  List<UnitModel>? units,
  TenantLookupModel? lookup,
  bool failUploads = false,
}) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final api = _Api()
    ..lookupResult = lookup
    ..lookupResults.addAll(lookups);
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, __) => const AddApplicationScreen()),
      GoRoute(
        path: '/activity/applications/:id',
        builder: (_, s) => Text(
          'detail ${s.pathParameters['id']} ${s.uri.queryParameters['property_id']}',
        ),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        tenantApplicationApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        applicationUnitOptionsProvider(
          null,
        ).overrideWith((ref) async => units ?? _units),
        applicationImagePickerProvider.overrideWithValue(_FakePicker()),
        if (failUploads)
          r2UploadServiceProvider.overrideWithValue(_FailingUpload()),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

Future<void> _pickUnit(WidgetTester tester, String label) async {
  await tester.tap(find.text('Select unit'));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label));
  await tester.pumpAndSettle();
}

Future<void> _tapNext(WidgetTester tester) async {
  await tester.tap(find.text('Next'));
  await tester.pumpAndSettle();
}

Future<void> _enterPhoneAndNext(WidgetTester tester) async {
  await _pickUnit(tester, 'A1 · Palm Court');
  await tester.enterText(find.byType(TextField).first, '024 123 4567');
  await _tapNext(tester);
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  group('isAdult', () {
    final now = DateTime(2026, 11, 6);

    test('accepts exactly 18 and rejects a day short of it', () {
      expect(isAdult(DateTime(2008, 11, 6), now), isTrue);
      expect(isAdult(DateTime(2008, 11, 7), now), isFalse);
    });

    test('rejects a minor and accepts an older adult', () {
      expect(isAdult(DateTime(2015, 1, 1), now), isFalse);
      expect(isAdult(DateTime(1980, 1, 1), now), isTrue);
    });
  });

  testWidgets('offers real units labelled with their property', (tester) async {
    await _pump(tester);

    await tester.tap(find.text('Select unit'));
    await tester.pumpAndSettle();

    expect(find.text('A1 · Palm Court'), findsOneWidget);
    expect(find.text('B2 · Oak Row'), findsOneWidget);
  });

  testWidgets('explains when there is no unit the caller manages', (
    tester,
  ) async {
    await _pump(tester, units: const []);

    expect(
      find.text('You can only add tenants to properties you manage.'),
      findsOneWidget,
    );
  });

  testWidgets('a returning tenant is prefilled and lands on Review', (
    tester,
  ) async {
    final api = await _pump(tester, lookup: _returning());

    await _enterPhoneAndNext(tester);

    expect(api.lookups, ['+233241234567']);
    expect(
      find.text('Returning tenant — we filled in their details'),
      findsOneWidget,
    );
    expect(find.text('Review details'), findsOneWidget);
    expect(find.textContaining('pplication'), findsNothing);
  });

  testWidgets('an unknown number continues to Basic information', (
    tester,
  ) async {
    await _pump(tester);

    await _enterPhoneAndNext(tester);

    expect(find.text('Basic information'), findsOneWidget);
  });

  testWidgets('Next stays on the unit step until a unit and phone are set', (
    tester,
  ) async {
    final api = await _pump(tester);

    await _tapNext(tester);

    expect(find.text('Unit & onboarding'), findsWidgets);
    expect(api.lookups, isEmpty);
  });

  testWidgets('a failed upload blocks the form until it is cleared', (
    tester,
  ) async {
    await _pump(tester, lookup: _returning(), failUploads: true);
    await _enterPhoneAndNext(tester);

    await tester.tap(find.byIcon(Icons.edit_outlined).at(2));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose image').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose from gallery'));
    await tester.pumpAndSettle();

    expect(find.text('Upload failed — tap to retry'), findsOneWidget);
    await _tapNext(tester);
    expect(find.text('Identity verification'), findsOneWidget);

    await tester.tap(find.text('Remove'));
    await tester.pumpAndSettle();
    await _tapNext(tester);
    expect(find.text('Emergency contact & background'), findsOneWidget);
  });

  testWidgets('Add tenant creates the tenant and opens its setup', (
    tester,
  ) async {
    final api = await _pump(tester, lookup: _returning());
    await _enterPhoneAndNext(tester);

    await tester.tap(find.text('Add tenant'));
    await tester.pumpAndSettle();

    expect(api.created, hasLength(1));
    final input = api.created.single;
    expect(input.desiredUnitId, 'u1');
    expect(input.phone, '+233241234567');
    expect(input.gender, 'FEMALE');
    expect(input.employerType, 'STUDENT');
    expect(input.dateOfBirth, DateTime.utc(1990, 5, 17));
    expect(find.text('detail new1 p1'), findsOneWidget);
  });

  testWidgets('a student is sent as STUDENT with no course field', (
    tester,
  ) async {
    final api = await _pump(tester, lookup: _returning());
    await _enterPhoneAndNext(tester);

    await tester.ensureVisible(find.byIcon(Icons.edit_outlined).at(3));
    await tester.tap(find.byIcon(Icons.edit_outlined).at(3));
    await tester.pumpAndSettle();
    expect(find.text('Course / programme', findRichText: true), findsNothing);
    expect(find.text('School', findRichText: true), findsOneWidget);
    await tester.tap(find.text('Preview'));
    await tester.pumpAndSettle();
    expect(find.text('Course / programme', findRichText: true), findsNothing);

    await tester.tap(find.text('Add tenant'));
    await tester.pumpAndSettle();

    final input = api.created.single;
    expect(input.occupation, 'STUDENT');
    expect(input.employerType, 'STUDENT');
    expect(input.employer, 'Legon');
  });

  testWidgets('two units with the same name submit the one chosen', (
    tester,
  ) async {
    final api = await _pump(
      tester,
      lookup: _returning(),
      units: [
        _unit('u1', 'Room 1', 'Palm Court'),
        _unit('u2', 'Room 1', 'Palm Court'),
      ],
    );

    await tester.tap(find.text('Select unit'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Room 1 · Palm Court').at(1));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '024 123 4567');
    await _tapNext(tester);
    await tester.tap(find.text('Add tenant'));
    await tester.pumpAndSettle();

    expect(api.created.single.desiredUnitId, 'u2');
  });

  testWidgets('a unit in a block is labelled with the block', (tester) async {
    final blocked = UnitModel(
      id: 'u3',
      name: 'Room 1',
      type: 'Unit.Type.Apartment',
      status: 'Unit.Status.Available',
      rentFee: 1,
      rentFeeCurrency: 'GHS',
      propertyId: 'p1',
      property: UnitPropertyRef(id: 'p1', name: 'Sunrise Court'),
      propertyBlock: UnitBlockRef(id: 'b1', name: 'Block A'),
    );
    await _pump(tester, units: [blocked]);

    await tester.tap(find.text('Select unit'));
    await tester.pumpAndSettle();

    expect(find.text('Room 1 · Block A · Sunrise Court'), findsOneWidget);
  });

  testWidgets('a failed upload keeps the photo that was already there', (
    tester,
  ) async {
    final changes = <String?>[];
    final blocking = <bool>[];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          applicationImagePickerProvider.overrideWithValue(_FakePicker()),
          r2UploadServiceProvider.overrideWithValue(_FailingUpload()),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: ApplicationUploadTile(
              label: 'Profile photo',
              objectKeyPrefix: 'tenant-applications/profile-photos',
              initialUrl: 'https://img/old.png',
              onChanged: changes.add,
              onBlockingChanged: blocking.add,
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Change image'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose from gallery'));
    await tester.pumpAndSettle();

    expect(find.text('Upload failed — tap to retry'), findsOneWidget);
    expect(changes, isNot(contains(null)));
    expect(blocking.last, isTrue);

    await tester.tap(find.text('Remove'));
    await tester.pumpAndSettle();
    expect(changes.last, isNull);
    expect(blocking.last, isFalse);
  });

  group('changing the number after a hit', () {
    final withPhotos = TenantLookupModel(
      firstName: 'Ama',
      lastName: 'Mensah',
      phone: '+233241234567',
      gender: 'FEMALE',
      idNumber: 'GHA-123',
      idFrontUrl: 'https://img/front.png',
      profilePhotoUrl: 'https://img/me.png',
    );

    Future<void> changePhoneTo(WidgetTester tester, String phone) async {
      await tester.tap(find.byIcon(Icons.edit_outlined).at(0));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField).first, phone);
      await _tapNext(tester);
    }

    testWidgets('a miss leaves an empty form', (tester) async {
      final api = await _pump(
        tester,
        lookups: {'+233241234567': withPhotos, '+233201112222': null},
      );
      await _enterPhoneAndNext(tester);

      await changePhoneTo(tester, '020 111 2222');

      expect(api.lookups, ['+233241234567', '+233201112222']);
      expect(find.text('Basic information'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'Ama'), findsNothing);
      expect(find.widgetWithText(TextField, 'Mensah'), findsNothing);
    });

    testWidgets('a new hit carries none of the old photos', (tester) async {
      await _pump(
        tester,
        lookups: {
          '+233241234567': withPhotos,
          '+233201112222': TenantLookupModel(firstName: 'Kofi'),
        },
      );
      await _enterPhoneAndNext(tester);
      expect(find.byType(Image), findsWidgets);

      await changePhoneTo(tester, '020 111 2222');

      expect(find.text('Review details'), findsOneWidget);
      expect(find.byType(Image), findsNothing);
      expect(find.text('GHA-123'), findsNothing);
    });
  });

  testWidgets('Next with the same number keeps edits and skips the lookup', (
    tester,
  ) async {
    final api = await _pump(tester, lookup: _returning());
    await _enterPhoneAndNext(tester);

    await tester.tap(find.byIcon(Icons.edit_outlined).at(1));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Ama'), 'Abena');
    await tester.tap(find.text('Back'));
    await tester.pumpAndSettle();
    await _tapNext(tester);

    expect(api.lookups, hasLength(1));
    expect(find.text('Review details'), findsOneWidget);
    expect(find.text('Abena'), findsOneWidget);
  });
}
