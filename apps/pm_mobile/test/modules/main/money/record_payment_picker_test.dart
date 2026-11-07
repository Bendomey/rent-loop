import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:rentloop_manager/src/modules/main/money/add_payment.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

import 'bill_fixtures.dart';

class _StubBills extends BillsNotifier {
  static List<InvoiceModel> items = [];
  static List<String?> searches = [];
  static bool hasNextPage = false;
  static int nextPageCalls = 0;

  @override
  BillsState build(BillsView view, String? propertyId, {bool picker = false}) =>
      BillsState(
        items: items,
        total: items.length,
        hasLoaded: true,
        hasNextPage: hasNextPage,
      );

  @override
  Future<void> loadNextPage() async {
    nextPageCalls++;
    state = state.copyWith(
      items: [...state.items, _bill('x$nextPageCalls', 'p2')],
      currentPage: state.currentPage + 1,
    );
  }

  @override
  Future<void> loadFirstPage({String? search}) async => searches.add(search);
}

InvoiceModel _bill(
  String id,
  String propertyId, {
  bool paid = true,
  bool waiting = false,
}) {
  final base = billFixture();
  return InvoiceModel(
    id: id,
    code: 'INV-$id',
    status: base.status,
    totalAmount: base.totalAmount,
    currency: base.currency,
    dueDate: base.dueDate,
    propertyId: propertyId,
    property: base.property,
    payerLease: base.payerLease,
    payments: [if (paid) successfulPayment(), if (waiting) pendingPayment()],
    contextType: base.contextType,
  );
}

Future<void> _pump(
  WidgetTester tester, {
  String role = 'MANAGER',
  Map<String, String>? roles,
  Future<InvoiceModel> Function(String id)? detail,
  List<Uri>? pushed,
}) async {
  mockHaptics();
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, __) => const RecordPaymentScreen()),
      GoRoute(
        path: '/money/invoices/:id',
        builder: (_, state) {
          pushed?.add(state.uri);
          return const Scaffold();
        },
      ),
    ],
  );
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        billsNotifierProvider(
          BillsView.owing,
          null,
          picker: true,
        ).overrideWith(_StubBills.new),
        myPropertyRolesProvider.overrideWith(
          (ref) async => roles ?? {'p1': role, 'p2': 'STAFF'},
        ),
        billDetailProvider(
          'p1',
          '1',
        ).overrideWith((ref) => (detail ?? (id) async => _bill(id, 'p1'))('1')),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  setUp(() {
    _StubBills.searches = [];
    _StubBills.hasNextPage = false;
    _StubBills.nextPageCalls = 0;
    _StubBills.items = [_bill('1', 'p1'), _bill('2', 'p2')];
  });

  testWidgets('lists owing bills in properties the user manages', (t) async {
    await _pump(t);
    expect(find.text('Which bill did they pay?'), findsOneWidget);
    expect(find.text('INV-1'), findsOneWidget);
    expect(find.text('INV-2'), findsNothing);
  });

  testWidgets('tapping a bill opens the record payment sheet', (t) async {
    await _pump(t);
    await t.tap(find.text('INV-1'));
    await t.pumpAndSettle();
    expect(find.text('Record a payment'), findsOneWidget);
  });

  testWidgets('fetches the bill first when it has no payments loaded', (
    t,
  ) async {
    _StubBills.items = [_bill('1', 'p1', paid: false)];
    final fetched = <String>[];
    await _pump(
      t,
      detail: (id) async {
        fetched.add(id);
        return _bill(id, 'p1');
      },
    );
    await t.tap(find.text('INV-1'));
    await t.pumpAndSettle();
    expect(fetched, ['1']);
    expect(find.text('Record a payment'), findsOneWidget);
  });

  testWidgets('skips the fetch when payments are already on the bill', (
    t,
  ) async {
    final fetched = <String>[];
    await _pump(
      t,
      detail: (id) async {
        fetched.add(id);
        return _bill(id, 'p1');
      },
    );
    await t.tap(find.text('INV-1'));
    await t.pumpAndSettle();
    expect(fetched, isEmpty);
  });

  testWidgets('shows the error and no sheet when the fetch fails', (t) async {
    _StubBills.items = [_bill('1', 'p1', paid: false)];
    await _pump(t, detail: (_) async => throw Exception('boom'));
    await t.tap(find.text('INV-1'));
    await t.pumpAndSettle();
    expect(find.text('Record a payment'), findsNothing);
    expect(find.byType(SnackBar), findsOneWidget);
  });

  testWidgets('staff see the empty state', (t) async {
    await _pump(t, roles: {'p1': 'STAFF', 'p2': 'STAFF'});
    expect(find.text('No bills to record a payment on.'), findsOneWidget);
    expect(find.text('INV-1'), findsNothing);
  });

  testWidgets('searching reloads the list after the debounce', (t) async {
    await _pump(t);
    await t.enterText(find.byType(TextField), 'INV-9');
    await t.pump(const Duration(milliseconds: 500));
    expect(_StubBills.searches.last, 'INV-9');
  });

  testWidgets('a bill with a waiting report opens its detail instead', (
    t,
  ) async {
    _StubBills.items = [_bill('1', 'p1', waiting: true)];
    final pushed = <Uri>[];
    await _pump(t, pushed: pushed);
    await t.tap(find.text('INV-1'));
    await t.pumpAndSettle();

    expect(find.text('Record a payment'), findsNothing);
    expect(pushed.single.path, '/money/invoices/1');
    expect(pushed.single.queryParameters['property_id'], 'p1');
  });

  testWidgets('keeps paging when the visible page holds nothing to manage', (
    t,
  ) async {
    _StubBills.items = [_bill('2', 'p2')];
    _StubBills.hasNextPage = true;
    await _pump(t);
    await t.pumpAndSettle();

    expect(_StubBills.nextPageCalls, 5);
    expect(find.text('No bills to record a payment on.'), findsOneWidget);
  });
}
