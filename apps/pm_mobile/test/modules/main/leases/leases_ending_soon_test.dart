import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/leases/root.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

class _Call {
  _Call(this.status, this.propertyId, this.endingSoon);
  final String? status;
  final String? propertyId;
  final bool endingSoon;
}

class _FakeLeaseApi extends LeaseApi {
  _FakeLeaseApi() : super(tokenManager: TokenManager(SecureStorage()));

  final calls = <_Call>[];

  @override
  Future<LeasesPage> getLeases({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? propertyId,
    bool endingSoon = false,
  }) async {
    calls.add(_Call(status, propertyId, endingSoon));
    return LeasesPage(
      rows: const [],
      meta: PaginationMetaModel(
        total: 0,
        page: 1,
        pageSize: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
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

Future<_FakeLeaseApi> _pump(WidgetTester tester, LeasesScreen screen) async {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
  final api = _FakeLeaseApi();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        leaseApiProvider.overrideWithValue(api),
      ],
      child: MaterialApp(home: screen),
    ),
  );
  await tester.pump();
  await tester.pump();
  return api;
}

void main() {
  testWidgets('opening with Ending soon loads only active ending leases', (
    tester,
  ) async {
    final api = await _pump(
      tester,
      const LeasesScreen(
        propertyId: 'p1',
        propertyName: 'Ama Court',
        initialFilter: leasesEndingSoonFilter,
      ),
    );

    final call = api.calls.single;
    expect(call.endingSoon, isTrue);
    expect(call.status, 'Lease.Status.Active');
    expect(call.propertyId, 'p1');
    expect(find.text('Property: Ama Court'), findsOneWidget);
  });

  testWidgets('the Ending soon chip toggles the real filter', (tester) async {
    final api = await _pump(tester, const LeasesScreen());
    expect(api.calls.single.endingSoon, isFalse);

    await tester.tap(find.text(leasesEndingSoonFilter));
    await tester.pump();
    expect(api.calls.last.endingSoon, isTrue);
    expect(api.calls.last.status, 'Lease.Status.Active');

    await tester.tap(find.text('Completed'));
    await tester.pump();
    expect(api.calls.last.endingSoon, isFalse);
    expect(api.calls.last.status, 'Lease.Status.Completed');

    await tester.tap(find.text('All'));
    await tester.pump();
    expect(api.calls.last.endingSoon, isFalse);
    expect(api.calls.last.status, isNull);
  });

  testWidgets('an unknown filter falls back to All', (tester) async {
    final api = await _pump(tester, const LeasesScreen(initialFilter: 'Nope'));
    expect(api.calls.single.status, isNull);
    expect(api.calls.single.endingSoon, isFalse);
  });
}
