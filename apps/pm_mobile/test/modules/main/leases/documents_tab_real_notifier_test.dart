import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/lease_agreement_document_api.dart';
import 'package:rentloop_manager/src/api/signing_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/leases/documents_tab.dart';
import 'package:rentloop_manager/src/repository/models/lease_agreement_document_model.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/signing_token_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_agreement_document_provider.dart';
import 'package:rentloop_manager/src/repository/providers/leases/signing_tokens_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../support/real_notifier_support.dart';

final _token = SigningTokenModel(id: 't1', token: 'abc', role: 'TENANT');

class _SigningApi extends SigningApi {
  _SigningApi() : super(tokenManager: fakeTokenManager());

  @override
  Future<SigningTokenModel> generateToken({
    required String clientId,
    required String propertyId,
    required String documentId,
    required String role,
    required String leaseId,
    String? signerName,
    String? signerEmail,
    String? signerPhone,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    return _token;
  }

  @override
  Future<SigningTokenModel> resendToken({
    required String clientId,
    required String propertyId,
    required String tokenId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    return _token;
  }
}

class _DocumentApi extends LeaseAgreementDocumentApi {
  _DocumentApi() : super(tokenManager: fakeTokenManager());

  @override
  Future<void> deleteDocument({
    required String clientId,
    required String propertyId,
    required String leaseId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }
}

Future<RecordingToast> _pump(
  WidgetTester tester, {
  List<SigningTokenModel> tokens = const [],
}) async {
  final toast = RecordingToast();
  final lease = LeaseModel(
    id: 'l1',
    code: 'L-1',
    status: 'ACTIVE',
    unitId: 'u1',
    tenantId: 't1',
    rentFee: 100,
    rentFeeCurrency: 'GHS',
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        signingApiProvider.overrideWithValue(_SigningApi()),
        leaseAgreementDocumentApiProvider.overrideWithValue(_DocumentApi()),
        currentWorkspaceNotifierProvider.overrideWith(SignedInWorkspace.new),
        rlToastProvider.overrideWith(() => toast),
        leaseAgreementDocumentProvider('p1', 'l1').overrideWith(
          (ref) async => LeaseAgreementDocumentModel(
            id: 'd1',
            leaseId: 'l1',
            mode: 'ONLINE',
            status: 'FINALIZED',
          ),
        ),
        signingTokensProvider(
          'p1',
          'd1',
          'l1',
        ).overrideWith((ref) async => tokens),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: Column(children: buildDocumentsTab('p1', lease)),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return toast;
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('requesting a signature confirms the link was created', (
    tester,
  ) async {
    final toast = await _pump(tester);

    await tester.tap(find.text('Request Signature'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send'));
    await pumpFrames(tester);

    expect(toast.shown.single.title, 'Signing link created');
  });

  testWidgets('resending a signing link confirms it was resent', (
    tester,
  ) async {
    final toast = await _pump(tester, tokens: [_token]);

    await tester.tap(find.text('Resend'));
    await pumpFrames(tester);

    expect(toast.shown.single.title, 'Signing link resent');
  });

  testWidgets('removing the document confirms it was deleted', (tester) async {
    final toast = await _pump(tester);

    await tester.tap(find.text('Remove Document'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Remove'));
    await pumpFrames(tester);

    expect(toast.shown.single.title, 'Document deleted');
  });
}
