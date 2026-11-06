import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

InvoicePaymentModel pay(int amount, String status, {String rail = 'OFFLINE'}) =>
    InvoicePaymentModel(
      id: 'p$amount$status',
      amount: amount,
      status: status,
      rail: rail,
      createdAt: '2026-09-01T00:00:00Z',
    );

InvoiceModel bill({
  int total = 100000,
  String? due,
  List<InvoicePaymentModel> payments = const [],
  InvoiceLeaseModel? lease,
}) => InvoiceModel(
  id: 'b',
  code: 'INV-1',
  status: 'ISSUED',
  totalAmount: total,
  currency: 'GHS',
  dueDate: due,
  payments: payments,
  payerLease: lease,
  contextType: 'LEASE',
);

void main() {
  final now = DateTime(2026, 9, 10, 15, 30);

  group('payments', () {
    final b = bill(
      payments: [
        pay(50000, 'SUCCESSFUL'),
        pay(30000, 'PENDING'),
        pay(20000, 'PENDING', rail: 'MOMO'),
        pay(10000, 'FAILED'),
      ],
    );

    test('only successful payments count as paid', () {
      expect(billPaid(b), 50000);
      expect(billRemaining(b), 50000);
    });

    test('awaiting holds pending offline payments only', () {
      expect(awaitingConfirmation(b).map((p) => p.amount), [30000]);
    });

    test('remaining never goes negative', () {
      expect(
        billRemaining(bill(total: 1000, payments: [pay(5000, 'SUCCESSFUL')])),
        0,
      );
    });
  });

  group('due label and overdue', () {
    test('yesterday', () {
      final b = bill(due: DateTime(2026, 9, 9).toIso8601String());
      expect(billDueLabel(b, now), '1 day late');
      expect(isOverdue(b, now), isTrue);
    });

    test('several days late', () {
      expect(
        billDueLabel(bill(due: DateTime(2026, 9, 5).toIso8601String()), now),
        '5 days late',
      );
    });

    test('today', () {
      final b = bill(due: DateTime(2026, 9, 10).toIso8601String());
      expect(billDueLabel(b, now), 'Due today');
      expect(isOverdue(b, now), isFalse);
    });

    test('in the future', () {
      final b = bill(due: DateTime(2026, 9, 13).toIso8601String());
      expect(billDueLabel(b, now), 'Due in 3 days');
      expect(
        billDueLabel(bill(due: DateTime(2026, 9, 11).toIso8601String()), now),
        'Due in 1 day',
      );
      expect(isOverdue(b, now), isFalse);
    });

    test('fully paid', () {
      final b = bill(
        due: DateTime(2026, 9, 1).toIso8601String(),
        payments: [pay(100000, 'SUCCESSFUL')],
      );
      expect(billDueLabel(b, now), 'Paid');
      expect(isOverdue(b, now), isFalse);
    });

    test('no due date', () {
      final b = bill();
      expect(billDueLabel(b, now), 'Not paid yet');
      expect(isOverdue(b, now), isFalse);
    });
  });

  group('headline', () {
    test('owing', () {
      final b = bill(payments: [pay(50000, 'SUCCESSFUL')]);
      expect(
        billHeadline(b, 'Ama Mensah'),
        'Ama Mensah still owes GH₵ 500.00 of GH₵ 1,000.00.',
      );
    });

    test('paid', () {
      final b = bill(payments: [pay(100000, 'SUCCESSFUL')]);
      expect(
        billHeadline(b, 'Ama Mensah'),
        'Ama Mensah has paid this bill in full.',
      );
    });

    test('blank name', () {
      expect(billHeadline(bill(), ' '), startsWith('The tenant still owes'));
    });
  });

  group('payerName', () {
    test('full name or fallback', () {
      final lease = InvoiceLeaseModel(
        id: 'l',
        tenant: InvoiceTenantModel(
          id: 't',
          firstName: 'Ama',
          lastName: 'Mensah',
        ),
      );
      expect(payerName(bill(lease: lease)), 'Ama Mensah');
      expect(payerName(bill()), 'Tenant');
    });
  });
}
