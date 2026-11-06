import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/account_view.dart';

import 'helpers.dart';

void main() {
  final now = DateTime.utc(2026, 10, 15);

  group('lateAmount', () {
    test('sums the unpaid part of charges past their due date', () {
      final charges = [
        charge(id: 'a', dueDate: '2026-10-01T00:00:00Z', settled: 40000),
        charge(id: 'b', dueDate: '2026-10-20T00:00:00Z'),
      ];
      expect(lateAmount(charges, now), 60000);
    });

    test('ignores voided and fully paid charges', () {
      final charges = [
        charge(id: 'a', dueDate: '2026-10-01T00:00:00Z', settled: 100000),
        charge(
          id: 'b',
          dueDate: '2026-10-01T00:00:00Z',
          voidedAt: '2026-10-02T00:00:00Z',
        ),
      ];
      expect(lateAmount(charges, now), 0);
    });

    test('counts an unbilled charge that is already due', () {
      final charges = [charge(dueDate: '2026-10-01T00:00:00Z', invoiced: 0)];
      expect(lateAmount(charges, now), 100000);
    });
  });

  group('nextBill', () {
    test('is null for a manual cadence', () {
      final d = detail([charge()], cadence: 'MANUAL');
      expect(nextBill(d, now), isNull);
    });

    test('is null when no rent is left to bill', () {
      final d = detail([charge(invoiced: 100000)]);
      expect(nextBill(d, now), isNull);
    });

    test('takes the earliest unbilled rent and sends it lead days early', () {
      final d = detail([
        charge(id: 'late', dueDate: '2026-11-08T00:00:00Z'),
        charge(id: 'first', dueDate: '2026-10-08T00:00:00Z', invoiced: 30000),
        charge(id: 'billed', dueDate: '2026-09-08T00:00:00Z', invoiced: 100000),
      ], leadDays: 5);
      final next = nextBill(d, now)!;
      expect(next.amount, 70000);
      expect(next.sendDate, DateTime.utc(2026, 10, 3));
    });

    test('adds every fee due on or before the rent, not later ones', () {
      final d = detail([
        charge(id: 'rent', dueDate: '2026-10-08T00:00:00Z'),
        charge(
          id: 'dep',
          category: 'DEPOSIT',
          amount: 50000,
          dueDate: '2026-10-08T00:00:00Z',
        ),
        charge(
          id: 'early',
          category: 'FEE',
          amount: 2000,
          dueDate: '2026-10-01T00:00:00Z',
          invoiced: 500,
        ),
        charge(
          id: 'later',
          category: 'FEE',
          amount: 9000,
          dueDate: '2026-10-09T00:00:00Z',
        ),
        charge(
          id: 'gone',
          category: 'FEE',
          amount: 7000,
          dueDate: '2026-10-01T00:00:00Z',
          voidedAt: '2026-10-02T00:00:00Z',
        ),
      ]);
      expect(nextBill(d, now)!.amount, 100000 + 50000 + 1500);
    });
  });

  group('rows', () {
    final charges = [
      charge(id: 'r2', dueDate: '2026-11-08T00:00:00Z'),
      charge(id: 'r1', dueDate: '2026-10-08T00:00:00Z'),
      charge(id: 'f1', category: 'DEPOSIT', amount: 5000),
      charge(
        id: 'x',
        category: 'FEE',
        voidedAt: '2026-10-02T00:00:00Z',
        voidedReason: 'Mistake',
      ),
      charge(id: 'rx', voidedAt: '2026-10-02T00:00:00Z'),
    ];

    test('rentRows are live rent charges ordered by due date', () {
      expect(rentRows(charges).map((c) => c.id), ['r1', 'r2']);
    });

    test('feeRows are live non-rent charges', () {
      expect(feeRows(charges).map((c) => c.id), ['f1']);
    });

    test('removedRows are the voided charges of any category', () {
      expect(removedRows(charges).map((c) => c.id), ['x', 'rx']);
    });

    test('wholeTermTotal excludes removed charges', () {
      expect(wholeTermTotal(charges), 100000 + 100000 + 5000);
    });
  });

  group('refunds', () {
    final charges = [
      charge(id: 'r1', dueDate: '2026-10-08T00:00:00Z', settled: 100000),
      charge(id: 'r1-back', amount: -40000, reverses: 'r1'),
      charge(id: 'f1', category: 'SECURITY_DEPOSIT', settled: 100000),
      charge(
        id: 'f1-back',
        category: 'SECURITY_DEPOSIT',
        amount: -100000,
        reverses: 'f1',
      ),
    ];

    test('rentRows and feeRows leave refunds out', () {
      expect(rentRows(charges).map((c) => c.id), ['r1']);
      expect(feeRows(charges).map((c) => c.id), ['f1']);
    });

    test('refundRows are the live negative charges', () {
      expect(refundRows(charges).map((c) => c.id), ['r1-back', 'f1-back']);
    });
  });

  group('firstBillDueSoon', () {
    test('is true when an unbilled charge falls inside the lead window', () {
      final d = detail([charge(dueDate: '2026-10-19T00:00:00Z')]);
      expect(firstBillDueSoon(d, now), isTrue);
    });

    test('is true when an unbilled charge is already overdue', () {
      final d = detail([charge(dueDate: '2026-09-01T00:00:00Z')]);
      expect(firstBillDueSoon(d, now), isTrue);
    });

    test('is false when the earliest charge is past the lead window', () {
      final d = detail([charge(dueDate: '2026-10-25T00:00:00Z')]);
      expect(firstBillDueSoon(d, now), isFalse);
    });

    test('is false once anything has been billed', () {
      final d = detail([
        charge(id: 'a', dueDate: '2026-10-01T00:00:00Z', invoiced: 100000),
        charge(id: 'b', dueDate: '2026-10-16T00:00:00Z'),
      ]);
      expect(firstBillDueSoon(d, now), isFalse);
    });

    test('is false for a manual plan, which sends nothing on its own', () {
      final d = detail([
        charge(dueDate: '2026-10-16T00:00:00Z'),
      ], cadence: 'MANUAL');
      expect(firstBillDueSoon(d, now), isFalse);
    });

    test('ignores voided and paid charges', () {
      final d = detail([
        charge(id: 'a', dueDate: '2026-10-16T00:00:00Z', settled: 100000),
        charge(
          id: 'b',
          dueDate: '2026-10-16T00:00:00Z',
          voidedAt: '2026-10-02T00:00:00Z',
        ),
      ]);
      expect(firstBillDueSoon(d, now), isFalse);
    });
  });
}
