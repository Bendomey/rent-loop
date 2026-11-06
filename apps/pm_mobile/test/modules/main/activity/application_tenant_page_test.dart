import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

TenantApplicationModel _app({String? docStatus}) =>
    TenantApplicationModel.fromJson({
      'id': 'a1',
      'code': 'APP-1',
      'status': 'TenantApplication.Status.InProgress',
      'property_id': 'p1',
      'first_name': 'Ama',
      'last_name': 'Mensah',
      'other_names': 'Kofi',
      'email': 'ama@example.com',
      'phone': '+233241234567',
      'date_of_birth': '2000-01-31T00:00:00Z',
      'gender': 'FEMALE',
      'marital_status': 'SINGLE',
      'emergency_contact_name': 'Akosua Ofori',
      'emergency_contact_phone': '+233201234567',
      'relationship_to_emergency_contact': 'Spouse',
      'employer_type': 'WORKER',
      'employer': 'Bollore',
      'id_front_url': 'https://cdn.test/front.jpg',
      'id_back_url': 'https://cdn.test/back.jpg',
      if (docStatus != null) 'lease_agreement_document_status': docStatus,
    });

class _FakeUpdate extends UpdateApplicationNotifier {
  static final patches = <Map<String, dynamic>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
    String? accountId,
  }) async {
    patches.add(patch);
    state = UpdateApplicationState(status: ApiStatus.success);
  }
}

Future<void> _openTenantPage(
  WidgetTester tester,
  TenantApplicationModel app,
) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async => app),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': 'MANAGER'}),
        updateApplicationNotifierProvider.overrideWith(_FakeUpdate.new),
      ],
      child: const MaterialApp(
        home: ApplicationDetailScreen(id: 'a1', propertyId: 'p1'),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
  await tester.tap(find.text('Add tenant details'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    _FakeUpdate.patches.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('saving basic info sends date_of_birth as YYYY-MM-DD', (
    tester,
  ) async {
    await _openTenantPage(tester, _app());
    await tester.tap(find.text('Edit').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches, hasLength(1));
    expect(_FakeUpdate.patches.single['date_of_birth'], '2000-01-31');
    expect(_FakeUpdate.patches.single['phone'], '+233241234567');
    expect(find.text('Save'), findsNothing);
  });

  testWidgets('clearing other names sends an explicit null', (tester) async {
    await _openTenantPage(tester, _app());
    await tester.tap(find.text('Edit').first);
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Kofi'), '');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final patch = _FakeUpdate.patches.single;
    expect(patch.containsKey('other_names'), isTrue);
    expect(patch['other_names'], isNull);
  });

  testWidgets('clearing employer sends an empty string, not null', (
    tester,
  ) async {
    await _openTenantPage(tester, _app());
    await tester.tap(find.text('Edit').at(2));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Bollore'), '');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final patch = _FakeUpdate.patches.single;
    expect(patch['employer'], '');
    expect(patch['occupation_address'], '');
    expect(patch['proof_of_income_url'], isNull);
  });

  testWidgets('a signed lease agreement hides every Edit button', (
    tester,
  ) async {
    await _openTenantPage(tester, _app(docStatus: 'SIGNED'));

    expect(find.text('Basic Information'), findsOneWidget);
    expect(find.text('Edit'), findsNothing);
  });

  testWidgets('the identity card shows the stored ID images', (tester) async {
    await _openTenantPage(tester, _app());

    bool isImage(String url) => find
        .byWidgetPredicate(
          (w) =>
              w is Image &&
              w.image is NetworkImage &&
              (w.image as NetworkImage).url == url,
        )
        .evaluate()
        .isNotEmpty;

    expect(isImage('https://cdn.test/front.jpg'), isTrue);
    expect(isImage('https://cdn.test/back.jpg'), isTrue);
  });
}
