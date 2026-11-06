import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/modules/main/activity/add_application.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/invite_tenant_notifier.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

class _SignedIn extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

class _FakeInvite extends InviteTenantNotifier {
  static final calls = <Map<String, String?>>[];
  static bool fail = false;

  @override
  Future<void> submit({
    required String propertyId,
    required String unitId,
    String? email,
    String? phone,
  }) async {
    calls.add({
      'propertyId': propertyId,
      'unitId': unitId,
      'email': email,
      'phone': phone,
    });
    state = fail
        ? InviteTenantState(status: ApiStatus.failed, errorMessage: 'nope')
        : InviteTenantState(status: ApiStatus.success);
  }
}

final _unit = UnitModel(
  id: 'u1',
  name: 'A1',
  type: 'Unit.Type.Apartment',
  status: 'Unit.Status.Available',
  rentFee: 1,
  rentFeeCurrency: 'GHS',
  propertyId: 'p1',
);

Future<({List<String> closed, List<String> sent, ProviderContainer container})>
_pump(WidgetTester tester) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final closed = <String>[];
  final sent = <String>[];
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        inviteTenantNotifierProvider.overrideWith(_FakeInvite.new),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: Stack(
            children: [
              InviteTenantSheet(
                unit: _unit,
                onClose: () => closed.add('x'),
                onSent: () => sent.add('x'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  final container = ProviderScope.containerOf(
    tester.element(find.byType(InviteTenantSheet)),
  );
  return (closed: closed, sent: sent, container: container);
}

void main() {
  final clipboard = <String?>[];

  setUp(() {
    _FakeInvite.calls.clear();
    _FakeInvite.fail = false;
    clipboard.clear();
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    messenger.setMockMethodCallHandler(
      const MethodChannel('haptic_feedback'),
      (_) async => null,
    );
    messenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.setData') {
        clipboard.add((call.arguments as Map)['text'] as String?);
      }
      return null;
    });
  });

  testWidgets('titles the sheet with the unit and shows the real link', (
    tester,
  ) async {
    await _pump(tester);

    expect(find.text('Send A1 setup link to the tenant'), findsOneWidget);
    expect(find.textContaining('unit=u1&referred_by=cu1'), findsOneWidget);
  });

  testWidgets('copy puts the link on the clipboard', (tester) async {
    final r = await _pump(tester);
    final container = r.container;

    await tester.tap(find.text('Copy link'));
    await tester.pumpAndSettle();

    expect(clipboard.single, contains('unit=u1&referred_by=cu1'));
    expect(container.read(rlToastProvider)?.title, 'Link copied');
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('send is disabled until the phone is valid', (tester) async {
    await _pump(tester);

    await tester.tap(find.text('Send link'));
    await tester.pumpAndSettle();
    expect(_FakeInvite.calls, isEmpty);

    await tester.enterText(find.byType(TextField), '024');
    await tester.tap(find.text('Send link'));
    await tester.pumpAndSettle();
    expect(_FakeInvite.calls, isEmpty);
  });

  testWidgets('sends a normalised phone and closes on success', (tester) async {
    final r = await _pump(tester);
    final container = r.container;

    await tester.enterText(find.byType(TextField), '0241234567');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send link'));
    await tester.pumpAndSettle();

    expect(_FakeInvite.calls.single, {
      'propertyId': 'p1',
      'unitId': 'u1',
      'email': null,
      'phone': '+233241234567',
    });
    expect(r.sent, hasLength(1));
    expect(container.read(rlToastProvider)?.title, 'Link sent');
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('sends an email from the Email tab', (tester) async {
    await _pump(tester);

    await tester.tap(find.text('Email'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'ama@example.com');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send link'));
    await tester.pumpAndSettle();

    expect(_FakeInvite.calls.single['email'], 'ama@example.com');
    expect(_FakeInvite.calls.single['phone'], isNull);
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('stays open and shows the error on failure', (tester) async {
    _FakeInvite.fail = true;
    final r = await _pump(tester);

    await tester.enterText(find.byType(TextField), '0241234567');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send link'));
    await tester.pumpAndSettle();

    expect(r.sent, isEmpty);
    expect(find.text('nope'), findsOneWidget);
  });
}
