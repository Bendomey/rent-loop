import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/modules/main/money/root.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

import '../../../support/options_fakes.dart';

class _StubBills extends BillsNotifier {
  static Map<BillsView, List<InvoiceModel>> items = {};
  static String? error;
  static bool fresh = false;
  static bool loadMoreFailed = false;
  static int nextPageCalls = 0;

  @override
  Future<void> loadNextPage() async => nextPageCalls++;

  @override
  BillsState build(BillsView view, String? propertyId, {bool picker = false}) =>
      error != null
      ? BillsState(error: error, hasLoaded: true)
      : fresh
      ? const BillsState()
      : BillsState(
          items: items[view] ?? const [],
          total: items[view]?.length ?? 0,
          hasLoaded: true,
          hasNextPage: loadMoreFailed,
          loadMoreFailed: loadMoreFailed,
        );

  @override
  Future<void> loadFirstPage({String? search}) async {}
}

String _daysFromNow(int d) =>
    DateTime.now().add(Duration(days: d)).toIso8601String();

InvoiceModel _bill(
  String id,
  String first, {
  required int total,
  int? dueIn,
  String propertyId = 'p1',
  List<InvoicePaymentModel> payments = const [],
  String status = 'ISSUED',
}) => InvoiceModel(
  id: id,
  code: 'INV-$id',
  status: status,
  totalAmount: total,
  currency: 'GHS',
  dueDate: dueIn == null ? null : _daysFromNow(dueIn),
  propertyId: propertyId,
  property: InvoicePropertyModel(id: propertyId, name: 'Cantonments'),
  payerLease: InvoiceLeaseModel(
    id: 'l$id',
    tenant: InvoiceTenantModel(
      id: 't$id',
      firstName: first,
      lastName: 'Boateng',
    ),
    unit: InvoiceUnitModel(id: 'u$id', name: 'Unit 5A'),
  ),
  payments: payments,
  contextType: 'LEASE',
);

InvoicePaymentModel _pending() => InvoicePaymentModel(
  id: 'pay1',
  amount: 30000,
  status: 'PENDING',
  rail: 'OFFLINE',
  provider: 'MTN',
  createdAt: '2026-11-01T00:00:00Z',
);

Future<Uri> _pumpAndTapKofiRow(WidgetTester tester) async {
  Uri? pushed;
  await _pump(
    tester,
    extraRoutes: [
      GoRoute(
        path: '/money/invoices/:id',
        builder: (_, s) {
          pushed = s.uri;
          return const Scaffold();
        },
      ),
    ],
  );
  await tester.tap(find.text('Kofi Boateng'));
  await tester.pumpAndSettle();
  return pushed!;
}

Future<void> _pump(
  WidgetTester tester, {
  String role = 'MANAGER',
  List<GoRoute> extraRoutes = const [],
  List<PropertyModel> properties = const [],
}) async {
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, __) => const MoneyScreen()),
      ...extraRoutes,
    ],
  );
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        billsNotifierProvider(
          BillsView.owing,
          null,
        ).overrideWith(_StubBills.new),
        billsNotifierProvider(
          BillsView.paid,
          null,
        ).overrideWith(_StubBills.new),
        billsNotifierProvider(
          BillsView.owing,
          'p2',
        ).overrideWith(_StubBills.new),
        billsNotifierProvider(
          BillsView.paid,
          'p2',
        ).overrideWith(_StubBills.new),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': role}),
        propertyOptionsNotifierProvider().overrideWith(
          () => FakePropertyOptions(properties),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  setUp(() {
    _StubBills.error = null;
    _StubBills.fresh = false;
    _StubBills.loadMoreFailed = false;
    _StubBills.nextPageCalls = 0;
    _StubBills.items = {
      BillsView.owing: [
        _bill('1', 'Ama', total: 100000, dueIn: -2, payments: [_pending()]),
        _bill('2', 'Kofi', total: 250000, dueIn: 3),
      ],
      BillsView.paid: [
        _bill(
          '3',
          'Efua',
          total: 400000,
          status: 'PAID',
          payments: [
            InvoicePaymentModel(
              id: 'pay3',
              amount: 400000,
              status: 'SUCCESSFUL',
              rail: 'OFFLINE',
              createdAt: '2026-11-01T00:00:00Z',
            ),
          ],
        ),
      ],
    };
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('Rent property chip opens the picker and keeps the chosen name', (
    t,
  ) async {
    await _pump(
      t,
      properties: [
        PropertyModel(
          id: 'p1',
          name: 'Cantonments',
          type: 'Apartment',
          status: 'ACTIVE',
        ),
        PropertyModel(
          id: 'p2',
          name: 'Oak Row',
          type: 'Apartment',
          status: 'ACTIVE',
        ),
      ],
    );
    expect(find.text('All properties'), findsNothing);

    await t.tap(find.text('Property: All properties'));
    await t.pumpAndSettle();
    await t.enterText(find.byType(TextField), 'oak');
    await t.pumpAndSettle();
    expect(find.text('Cantonments'), findsNothing);
    await t.tap(find.text('Oak Row'));
    await t.pumpAndSettle();

    expect(find.text('Property: Oak Row'), findsOneWidget);

    await t.tap(find.text('All properties'));
    await t.pumpAndSettle();
    expect(find.text('Property: All properties'), findsOneWidget);
  });

  testWidgets('a single property hides the property chip', (t) async {
    await _pump(
      t,
      properties: [
        PropertyModel(
          id: 'p1',
          name: 'Cantonments',
          type: 'Apartment',
          status: 'ACTIVE',
        ),
      ],
    );
    expect(find.text('Property: All properties'), findsNothing);
  });

  testWidgets('owing rows show the remaining amount and how late', (t) async {
    await _pump(t);

    expect(find.text('Ama Boateng'), findsOneWidget);
    expect(find.text('Unit 5A · Cantonments'), findsWidgets);
    expect(find.text('2 days late'), findsOneWidget);
    expect(find.text('Due in 3 days'), findsOneWidget);
    expect(find.text('1,000.00'), findsOneWidget);
    expect(find.text('INV-1'), findsNothing);
  });

  testWidgets('the summary sums the remaining amounts', (t) async {
    await _pump(t);

    expect(find.text('3,500.00'), findsOneWidget);
    expect(find.text('2 bills not paid yet · 1 late'), findsOneWidget);
    expect(find.text('UNPAID BILLS'), findsOneWidget);
    expect(
      find.text("Rent not billed yet isn't counted here."),
      findsOneWidget,
    );
  });

  testWidgets('switching to Paid shows the paid rows', (t) async {
    await _pump(t);
    await t.tap(find.text('Paid'));
    await t.pumpAndSettle();

    expect(find.text('Efua Boateng'), findsOneWidget);
    expect(find.text('4,000.00'), findsOneWidget);
    expect(find.text('Ama Boateng'), findsNothing);
  });

  testWidgets('a manager sees Needs your OK', (t) async {
    await _pump(t);

    expect(find.text('Needs your OK'), findsOneWidget);
    expect(
      find.text('Ama Boateng says they paid GH₵ 300.00 · MTN MoMo'),
      findsOneWidget,
    );
  });

  testWidgets('staff do not see Needs your OK', (t) async {
    await _pump(t, role: 'STAFF');

    expect(find.text('Needs your OK'), findsNothing);
  });

  testWidgets('empty states', (t) async {
    _StubBills.items = {};
    await _pump(t);
    expect(find.text('No unpaid bills right now.'), findsOneWidget);

    await t.tap(find.text('Paid'));
    await t.pumpAndSettle();
    expect(find.text('No paid bills yet.'), findsOneWidget);
  });

  testWidgets('an error offers Try again', (t) async {
    _StubBills.items = {};
    _StubBills.error = 'boom';
    await _pump(t);

    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('the first frame shows the skeleton, not the empty state', (
    t,
  ) async {
    _StubBills.fresh = true;
    await _pump(t);

    expect(find.byType(Shimmer), findsWidgets);
    expect(find.text('No unpaid bills right now.'), findsNothing);
  });

  testWidgets('a failed next page shows an inline retry', (t) async {
    _StubBills.loadMoreFailed = true;
    await _pump(t);
    await t.drag(find.byType(CustomScrollView), const Offset(0, -2000));
    await t.pumpAndSettle();

    expect(_StubBills.nextPageCalls, 0);
    expect(find.text("Couldn't load more."), findsOneWidget);
    await t.tap(find.text('Try again'));
    expect(_StubBills.nextPageCalls, 1);
  });

  testWidgets('tapping a row opens the bill with its property', (t) async {
    final uri = await _pumpAndTapKofiRow(t);

    expect(uri.path, '/money/invoices/2');
    expect(uri.queryParameters['property_id'], 'p1');
  });
}
