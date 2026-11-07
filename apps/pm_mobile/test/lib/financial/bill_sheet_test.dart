import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/bill_sheet.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

import 'bill_print_fixtures.dart';

final now = DateTime.utc(2026, 11, 7, 9);

void main() {
  group('deriveBillState', () {
    test('void uses the reason, or a fallback', () {
      final s = deriveBillState(
        printBill(status: 'VOID', voidedReason: 'Raised twice'),
        now,
      );
      expect(s.key, BillStateKey.void_);
      expect(s.stamp, 'Cancelled');
      expect(s.tone, BillTone.zinc);
      expect(s.headline, 'This bill was cancelled.');
      expect(s.detail, 'Raised twice');
      expect(
        deriveBillState(printBill(status: 'VOID'), now).detail,
        'It no longer counts toward anything that is owed.',
      );
    });

    test('draft', () {
      final s = deriveBillState(printBill(status: 'DRAFT'), now);
      expect(s.key, BillStateKey.draft);
      expect(s.stamp, 'Draft');
      expect(s.tone, BillTone.zinc);
      expect(
        s.detail,
        'It has not been sent. Nothing is owed on it until you issue it.',
      );
    });

    test('paid names the last payment day', () {
      final s = deriveBillState(
        printBill(
          status: 'PAID',
          payments: [
            paidOn(50000, '2026-10-30T12:00:00Z'),
            paidOn(150000, '2026-11-02T12:00:00Z'),
            paidOn(9000, '2026-11-05T12:00:00Z', status: 'FAILED'),
          ],
        ),
        now,
        payerName: 'Benjamin',
      );
      expect(s.key, BillStateKey.paid);
      expect(s.stamp, 'Paid');
      expect(s.tone, BillTone.green);
      expect(
        s.headline,
        'Benjamin has paid this bill in full — all GH₵ 2,000.00.',
      );
      expect(
        s.detail,
        'The last of it came in on 2 November 2026. Nothing is owed on this bill.',
      );
    });

    test('paid status with no payments still reads as paid', () {
      final s = deriveBillState(printBill(status: 'PAID'), now);
      expect(s.key, BillStateKey.paid);
      expect(s.detail, 'Nothing is owed on this bill.');
      expect(s.headline, startsWith('Tenant has paid'));
    });

    test('part paid, not yet due', () {
      final s = deriveBillState(
        printBill(
          due: '2026-11-10T00:00:00Z',
          payments: [paidOn(50000, '2026-11-01T00:00:00Z')],
        ),
        now,
        payerName: 'Benjamin',
      );
      expect(s.key, BillStateKey.part);
      expect(s.stamp, 'Part paid');
      expect(s.tone, BillTone.amber);
      expect(s.headline, 'Benjamin still owes GH₵ 1,500.00 of GH₵ 2,000.00.');
      expect(
        s.detail,
        'GH₵ 500.00 paid so far. The rest is due 10 November 2026, in 3 days.',
      );
    });

    test('part paid with no due date', () {
      final s = deriveBillState(
        printBill(payments: [paidOn(50000, '2026-11-01T00:00:00Z')]),
        now,
      );
      expect(s.key, BillStateKey.part);
      expect(s.detail, 'GH₵ 500.00 paid so far.');
    });

    test('part paid and late', () {
      final s = deriveBillState(
        printBill(
          due: '2026-11-01T00:00:00Z',
          payments: [paidOn(50000, '2026-10-20T00:00:00Z')],
        ),
        now,
      );
      expect(s.key, BillStateKey.late);
      expect(s.stamp, 'Part paid, late');
      expect(s.tone, BillTone.crimson);
      expect(
        s.detail,
        'GH₵ 500.00 has been paid so far, and the rest was due 1 November 2026 — 6 days ago.',
      );
    });

    test('late with nothing paid', () {
      final s = deriveBillState(
        printBill(due: '2026-11-06T00:00:00Z'),
        now,
        payerName: 'Benjamin',
      );
      expect(s.key, BillStateKey.late);
      expect(s.stamp, 'Late');
      expect(
        s.headline,
        'Benjamin still owes GH₵ 2,000.00 — it was due 6 November 2026, 1 day ago.',
      );
      expect(s.detail, 'Nothing has been paid against this bill yet.');
    });

    test('open with a due date, using each day word', () {
      String headline(String due) =>
          deriveBillState(printBill(due: due), now, payerName: 'Ama').headline;
      expect(
        headline('2026-11-07T00:00:00Z'),
        'Ama owes GH₵ 2,000.00, due 7 November 2026 — today.',
      );
      expect(headline('2026-11-08T00:00:00Z'), endsWith('— tomorrow.'));
      expect(headline('2026-11-12T00:00:00Z'), endsWith('— in 5 days.'));
    });

    test('open with no due date or issue date', () {
      final s = deriveBillState(printBill(issued: null), now);
      expect(s.key, BillStateKey.open);
      expect(s.stamp, 'Not paid yet');
      expect(s.tone, BillTone.zinc);
      expect(s.headline, 'Tenant owes GH₵ 2,000.00.');
      expect(s.detail, 'Nothing has been paid against it yet.');
      expect(
        deriveBillState(printBill(), now).detail,
        'Issued 27 April 2026. Nothing has been paid against it yet.',
      );
    });

    test('pending payments do not count as paid', () {
      final s = deriveBillState(
        printBill(
          payments: [paidOn(50000, '2026-11-01T00:00:00Z', status: 'PENDING')],
        ),
        now,
      );
      expect(s.key, BillStateKey.open);
    });
  });

  group('billSheetOf', () {
    test('matches the web print of an unpaid expense', () {
      final s = billSheetOf(printBill(), now);
      expect(s.propertyName, "Domey's Residence");
      expect(s.unitLabel, "Main block · Domey's Residence");
      expect(s.code, 'INV-2604-3DYMMV');
      expect(s.payerName, 'Benjamin Armah-Kessey Domey');
      expect(s.payerMeta, "Tenant · Domey's Residence");
      expect(s.payerPhone, '+233201080802');
      expect(s.kind, 'Expense');
      expect(s.agreementLine, 'Agreement 2603TMJH7H');
      expect(s.issued, '27 April 2026');
      expect(s.due, '—');
      expect(s.dueIsAlert, isFalse);
      expect(s.lines.single.each, 'GH₵ 2,000.00');
      expect(s.lines.single.category, 'EXPENSE');
      expect(s.itemsNote, '1 item on this bill. That is everything.');
      expect(s.subtotal, 'GH₵ 2,000.00');
      expect(s.tax, 'GH₵ 0.00');
      expect(s.total, 'GH₵ 2,000.00');
      expect(s.paidSoFar, isNull);
      expect(s.owedLabel, 'Still owed');
      expect(s.owed, 'GH₵ 2,000.00');
      expect(s.rails, ['Cash']);
      expect(s.termsLabel, 'After the due date');
      expect(
        s.terms,
        'This amount already shows as owed against the agreement. What '
        'changes after the due date is that it counts as late. Nothing is '
        'added on top.',
      );
      expect(s.generated, 'Generated from Rentloop on 7 November 2026');
    });

    test('pending terms name the due date', () {
      final s = billSheetOf(printBill(due: '2026-11-30T00:00:00Z'), now);
      expect(s.due, '30 November 2026');
      expect(s.terms, contains('What changes after 30 November 2026 is'));
    });

    test('late terms start the day after the due date', () {
      final s = billSheetOf(printBill(due: '2026-10-31T00:00:00Z'), now);
      expect(s.termsLabel, 'It is late');
      expect(s.dueIsAlert, isTrue);
      expect(
        s.terms,
        'It has counted as late since 1 November 2026. Nothing has been added '
        'on top — no late fee sits on this bill.',
      );
    });

    test('paid terms and nothing owed', () {
      final s = billSheetOf(
        printBill(
          status: 'PAID',
          payments: [paidOn(200000, '2026-11-02T00:00:00Z')],
        ),
        now,
      );
      expect(s.termsLabel, 'Nothing more to do');
      expect(s.terms, startsWith('This bill is settled and closed.'));
      expect(s.paidSoFar, '− GH₵ 2,000.00');
      expect(s.owedLabel, 'Nothing owed');
      expect(s.owed, 'GH₵ 0.00');
      expect(s.owedIsAlert, isFalse);
    });

    test('draft and void terms', () {
      expect(
        billSheetOf(printBill(status: 'DRAFT'), now).terms,
        'It has not been sent. Issue it and the amount becomes owed against '
        'the agreement.',
      );
      expect(
        billSheetOf(printBill(status: 'VOID', voidedReason: 'Dup'), now).terms,
        'Dup',
      );
    });

    test('part paid shows paid so far and an alert due date', () {
      final s = billSheetOf(
        printBill(
          due: '2026-11-20T00:00:00Z',
          payments: [paidOn(50000, '2026-11-01T00:00:00Z')],
        ),
        now,
      );
      expect(s.paidSoFar, '− GH₵ 500.00');
      expect(s.owed, 'GH₵ 1,500.00');
      expect(s.dueIsAlert, isTrue);
      expect(s.termsLabel, 'After the due date');
    });

    test('rent lines count in the agreement line and the note', () {
      final s = billSheetOf(
        printBill(
          contextType: 'LEASE_RENT',
          total: 600000,
          lines: [
            lineItem('Rent · September', category: 'RENT'),
            lineItem('Rent · October', category: 'RENT'),
            lineItem('Rent · November', category: 'RENT'),
          ],
        ),
        now,
      );
      expect(s.kind, 'Rent');
      expect(s.agreementLine, 'Agreement 2603TMJH7H · 3 months of rent');
      expect(
        s.itemsNote,
        '3 items on this bill, 3 of them rent. That is everything.',
      );
      final one = billSheetOf(
        printBill(lines: [lineItem('Rent', category: 'RENT')]),
        now,
      );
      expect(one.agreementLine, 'Agreement 2603TMJH7H · 1 month of rent');
      expect(one.itemsNote, '1 item on this bill. That is everything.');
    });

    test('tax and an explicit subtotal', () {
      final s = billSheetOf(printBill(total: 230000, taxes: 30000), now);
      expect(s.subtotal, 'GH₵ 2,000.00');
      expect(s.tax, 'GH₵ 300.00');
      expect(s.total, 'GH₵ 2,300.00');
    });

    test('rail labels follow the web, unknown rails pass through', () {
      final s = billSheetOf(
        printBill(rails: ['CARD', 'BANK_TRANSFER', 'OFFLINE', 'MOMO', 'X']),
        now,
      );
      expect(s.rails, ['Credit Card', 'Bank Transfer', 'Cash', 'Momo', 'X']);
      expect(billSheetOf(printBill(rails: []), now).rails, isEmpty);
    });

    test('a setup bill names the applicant and drops lease lines', () {
      final s = billSheetOf(
        printBill(
          withLease: false,
          applicant: InvoiceApplicantModel(firstName: 'Ama', lastName: 'Owusu'),
        ),
        now,
      );
      expect(s.payerName, 'Ama Owusu');
      expect(s.state.headline, 'Ama owes GH₵ 2,000.00.');
      expect(s.unitLabel, isNull);
      expect(s.agreementLine, isNull);
      expect(s.payerPhone, isNull);
      expect(s.payerMeta, 'Tenant');
    });

    test('no payer at all prints a dash and the payer type', () {
      final s = billSheetOf(printBill(withLease: false), now);
      expect(s.payerName, '—');
      expect(s.state.headline, 'Tenant owes GH₵ 2,000.00.');
    });
  });

  test('labels', () {
    expect(payerTypeLabel('TENANT_APPLICATION'), 'Tenant');
    expect(payerTypeLabel('PROPERTY_OWNER'), 'Owner');
    expect(billKindLabel('TENANT_APPLICATION'), 'Move-in');
    expect(billKindLabel('MAINTENANCE'), 'Repair');
    expect(billKindLabel('MAINTENANCE_EXPENSE'), 'Repair cost');
    expect(billKindLabel('SAAS_FEE'), 'Platform');
    expect(billKindLabel('LEASE'), 'LEASE');
  });
}
