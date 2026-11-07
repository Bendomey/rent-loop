import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';
import 'package:rentloop_manager/src/modules/main/money/invoice_detail.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_printer_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import 'bill_fixtures.dart';

Future<List<Uri>> _pump(
  WidgetTester tester, {
  String role = 'MANAGER',
  Future<InvoiceModel> Function()? bill,
  String? propertyId = 'p1',
  Future<Map<String, String>> Function()? roles,
  BillPrinter? printer,
}) async {
  mockHaptics();
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final opened = <Uri>[];
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        billDetailProvider(
          'p1',
          'b1',
        ).overrideWith((ref) => (bill ?? () async => billFixture())()),
        myPropertyRolesProvider.overrideWith(
          (ref) => (roles ?? () async => {'p1': role})(),
        ),
        billPrinterProvider.overrideWithValue(printer ?? (_) async {}),
        urlOpenerProvider.overrideWithValue((url) async {
          opened.add(url);
          return true;
        }),
      ],
      child: MaterialApp(
        home: InvoiceDetailScreen(id: 'b1', propertyId: propertyId),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
  return opened;
}

void main() {
  testWidgets('the bill code shows only as a Bill number line', (tester) async {
    await _pump(tester);
    expect(find.text('Bill number · INV-2041'), findsOneWidget);
    expect(find.text('INV-2041'), findsNothing);
  });

  testWidgets('shows the headline, line items and payments', (tester) async {
    await _pump(tester);
    expect(
      find.text('Kofi Boateng still owes GH₵ 3,000.00 of GH₵ 4,000.00.'),
      findsOneWidget,
    );
    expect(find.text("WHAT'S ON THIS BILL"), findsOneWidget);
    expect(find.text('Rent'), findsOneWidget);
    expect(
      find.text('1 payment, GH₵ 1,000.00 in all — GH₵ 3,000.00 to go.'),
      findsOneWidget,
    );
    expect(
      find.text('Waiting for you to confirm · GH₵ 300.00'),
      findsOneWidget,
    );
    expect(find.text('Block B · Unit 5A'), findsOneWidget);
  });

  testWidgets('a manager can confirm and record', (tester) async {
    await _pump(tester);
    expect(find.text('Payment received'), findsOneWidget);
    expect(find.text('Not received'), findsOneWidget);
  });

  testWidgets('a manager can record when no report is waiting', (tester) async {
    await _pump(
      tester,
      bill: () async => billFixture(payments: [successfulPayment()]),
    );
    expect(find.text('They paid — record it'), findsOneWidget);
    expect(
      find.text('Check the payment the tenant told you about first.'),
      findsNothing,
    );
  });

  testWidgets('a waiting report replaces the record button with a note', (
    tester,
  ) async {
    await _pump(tester);
    expect(find.text('They paid — record it'), findsNothing);
    expect(
      find.text('Check the payment the tenant told you about first.'),
      findsOneWidget,
    );
  });

  testWidgets('staff see no actions', (tester) async {
    await _pump(tester, role: 'STAFF');
    expect(
      find.text('Waiting for you to confirm · GH₵ 300.00'),
      findsOneWidget,
    );
    expect(find.text('Payment received'), findsNothing);
    expect(find.text('Not received'), findsNothing);
    expect(find.text('They paid — record it'), findsNothing);
  });

  testWidgets('no record action once nothing remains', (tester) async {
    await _pump(
      tester,
      bill: () async =>
          billFixture(payments: [successfulPayment(amount: 400000)]),
    );
    expect(find.text('They paid — record it'), findsNothing);
  });

  testWidgets('failed payments read Not received', (tester) async {
    await _pump(
      tester,
      bill: () async => billFixture(payments: [failedPayment()]),
    );
    expect(find.text('Not received · GH₵ 50.00'), findsOneWidget);
  });

  testWidgets('Call and WhatsApp go through the opener', (tester) async {
    final opened = await _pump(tester);
    await tester.tap(find.text('Call'));
    await tester.pump();
    await tester.tap(find.text('WhatsApp'));
    await tester.pump();
    expect(opened.map((u) => u.toString()), [
      'tel:+233240000000',
      'https://wa.me/233240000000',
    ]);
  });

  testWidgets('hides contact buttons without a phone', (tester) async {
    await _pump(tester, bill: () async => billFixture(phone: null));
    expect(find.text('Call'), findsNothing);
    expect(find.text('kofi@example.com'), findsOneWidget);
  });

  testWidgets('shows a skeleton while loading', (tester) async {
    mockHaptics();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          billDetailProvider('p1', 'b1').overrideWith(
            (ref) => Future<InvoiceModel>.delayed(
              const Duration(seconds: 5),
              billFixture,
            ),
          ),
          myPropertyRolesProvider.overrideWith((ref) async => {}),
        ],
        child: const MaterialApp(
          home: InvoiceDetailScreen(id: 'b1', propertyId: 'p1'),
        ),
      ),
    );
    await tester.pump();
    expect(find.byType(Shimmer), findsWidgets);
    await tester.pump(const Duration(seconds: 6));
  });

  testWidgets('shows an error with Retry', (tester) async {
    await _pump(tester, bill: () async => throw Exception('boom'));
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('a missing property id shows the error state', (tester) async {
    mockHaptics();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [myPropertyRolesProvider.overrideWith((ref) async => {})],
        child: const MaterialApp(
          home: InvoiceDetailScreen(id: 'b1', propertyId: null),
        ),
      ),
    );
    await tester.pump();
    expect(find.text('Try again'), findsNothing);
    expect(find.text("We couldn't open this bill."), findsOneWidget);
  });

  testWidgets('manager actions stay hidden while roles load', (tester) async {
    await _pump(
      tester,
      roles: () =>
          Future.delayed(const Duration(seconds: 5), () => {'p1': 'MANAGER'}),
    );
    expect(find.text('Payment received'), findsNothing);
    expect(find.text('They paid — record it'), findsNothing);
    await tester.pump(const Duration(seconds: 6));
  });

  testWidgets('a 00233 number opens WhatsApp on 233', (tester) async {
    final opened = await _pump(
      tester,
      bill: () async => billFixture(phone: '00233240000000'),
    );
    await tester.tap(find.text('WhatsApp'));
    await tester.pump();
    expect(opened.single.toString(), 'https://wa.me/233240000000');
  });

  testWidgets('a pending card payment reads Processing', (tester) async {
    await _pump(
      tester,
      bill: () async => billFixture(
        payments: [
          InvoicePaymentModel(
            id: 'c1',
            amount: 5000,
            status: 'PENDING',
            rail: 'CARD',
            createdAt: '2026-11-01T00:00:00Z',
          ),
        ],
      ),
    );
    expect(find.text('Processing · GH₵ 50.00'), findsOneWidget);
    expect(find.text('Payment received'), findsNothing);
  });

  group('Print', () {
    final printButton = find.byWidgetPredicate(
      (w) => w is Semantics && w.properties.label == 'Print bill',
    );

    testWidgets('is announced as Print bill', (tester) async {
      final semantics = tester.ensureSemantics();
      await _pump(tester);
      expect(find.bySemanticsLabel('Print bill'), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('prints the loaded bill through the injected printer', (
      tester,
    ) async {
      final printed = <String>[];
      await _pump(tester, printer: (bill) async => printed.add(bill.code));
      expect(printButton, findsOneWidget);
      expect(find.byIcon(Icons.print_outlined), findsOneWidget);
      await tester.tap(find.byIcon(Icons.print_outlined));
      await tester.pump();
      expect(printed, ['INV-2041']);
    });

    testWidgets('staff can print too', (tester) async {
      await _pump(tester, role: 'STAFF');
      expect(printButton, findsOneWidget);
    });

    testWidgets('shows a spinner while the PDF builds', (tester) async {
      final done = Completer<void>();
      await _pump(tester, printer: (_) => done.future);
      await tester.tap(find.byIcon(Icons.print_outlined));
      await tester.pump();
      expect(find.byIcon(Icons.print_outlined), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      done.complete();
      await tester.pump();
      expect(find.byIcon(Icons.print_outlined), findsOneWidget);
    });

    testWidgets('a failed build shows a toast', (tester) async {
      await _pump(tester, printer: (_) async => throw Exception('no font'));
      await tester.tap(find.byIcon(Icons.print_outlined));
      await tester.pump();
      final container = ProviderScope.containerOf(
        tester.element(find.byType(InvoiceDetailScreen)),
      );
      expect(container.read(rlToastProvider)?.tone, RLToastTone.error);
      expect(find.byIcon(Icons.print_outlined), findsOneWidget);
      await tester.pump(const Duration(seconds: 5));
    });

    testWidgets('no print button until the bill loads', (tester) async {
      final pending = Completer<InvoiceModel>();
      await _pump(tester, bill: () => pending.future);
      expect(printButton, findsNothing);
    });
  });
}
