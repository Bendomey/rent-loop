import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_edit_sheets.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

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

  final patches = <Map<String, dynamic>>[];

  @override
  Future<TenantApplicationModel> updateApplication({
    required String clientId,
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
  }) async {
    patches.add(patch);
    return TenantApplicationModel(id: id, code: 'TA-1');
  }
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

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('a blank email is sent as null, not an empty string', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(800, 2400);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    final api = _Api();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tenantApplicationApiProvider.overrideWithValue(api),
          currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () => showBasicInfoSheet(
                  context,
                  applicant: const ApplicationApplicant(
                    firstName: 'Ama',
                    lastName: 'Mensah',
                    email: '',
                    phone: '+233241234567',
                  ),
                  propertyId: 'p1',
                  id: 'a1',
                ),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(api.patches, hasLength(1));
    expect(api.patches.single.containsKey('email'), isTrue);
    expect(api.patches.single['email'], isNull);
  });
}
