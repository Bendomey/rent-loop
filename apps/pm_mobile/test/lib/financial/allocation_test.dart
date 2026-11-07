import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/allocation.dart';

import 'helpers.dart';

void main() {
  final sixRent = [
    for (var i = 6; i >= 1; i--)
      charge(id: 'r$i', dueDate: '2026-10-0${i}T00:00:00Z'),
  ];

  group('allocateAmount', () {
    test('fills the oldest first and ends on a partial line', () {
      final lines = allocateAmount(payableCharges(sixRent), 550000);
      expect(lines.map((l) => l.chargeId), [
        'r1',
        'r2',
        'r3',
        'r4',
        'r5',
        'r6',
      ]);
      expect(lines.map((l) => l.amount), [
        100000,
        100000,
        100000,
        100000,
        100000,
        50000,
      ]);
      expect(lines.map((l) => l.partial), [
        false,
        false,
        false,
        false,
        false,
        true,
      ]);
    });

    test('allocates only the uninvoiced part of a charge', () {
      final lines = allocateAmount([charge(id: 'a', invoiced: 30000)], 999999);
      expect(lines.single.amount, 70000);
      expect(lines.single.partial, isFalse);
    });

    test('orders by due date whatever order it is given', () {
      final lines = allocateAmount(sixRent, 100000);
      expect(lines.single.chargeId, 'r1');
    });

    test('allocates nothing for a zero or negative amount', () {
      expect(allocateAmount(sixRent, 0), isEmpty);
      expect(allocateAmount(sixRent, -5), isEmpty);
    });

    test('skips voided and fully invoiced charges passed in directly', () {
      final lines = allocateAmount([
        charge(id: 'voided', voidedAt: '2026-10-02T00:00:00Z'),
        charge(id: 'billed', invoiced: 100000),
      ], 50000);
      expect(lines, isEmpty);
    });

    test('stops when the charges run out', () {
      final lines = allocateAmount([charge(id: 'a')], 500000);
      expect(lines, hasLength(1));
      expect(lines.single.amount, 100000);
    });
  });

  test('payableCharges drops voided, settled and fully billed charges', () {
    final kept = payableCharges([
      charge(id: 'ok', dueDate: '2026-10-08T00:00:00Z'),
      charge(id: 'voided', voidedAt: '2026-10-02T00:00:00Z'),
      charge(id: 'settled', settled: 100000),
      charge(id: 'billed', invoiced: 100000),
      charge(id: 'older', dueDate: '2026-09-08T00:00:00Z', invoiced: 10),
    ]);
    expect(kept.map((c) => c.id), ['older', 'ok']);
  });

  test('refundableCharges keeps paid, positive, live charges', () {
    final kept = refundableCharges([
      charge(id: 'paid', settled: 100000, dueDate: '2026-10-08T00:00:00Z'),
      charge(id: 'older', settled: 5, dueDate: '2026-09-08T00:00:00Z'),
      charge(id: 'unpaid'),
      charge(id: 'refund', amount: -5000, settled: 5000),
      charge(id: 'voided', settled: 5, voidedAt: '2026-10-02T00:00:00Z'),
    ]);
    expect(kept.map((c) => c.id), ['older', 'paid']);
  });

  test('refundableCharges nets out a prior refund', () {
    final all = [
      charge(id: 'dep', settled: 300000),
      charge(id: 'r1', amount: -100000, reverses: 'dep'),
      charge(
        id: 'r2',
        amount: -50000,
        reverses: 'dep',
        voidedAt: '2026-10-02T00:00:00Z',
      ),
    ];
    expect(refundableAmount(all[0], all), 200000);
    expect(refundableCharges(all).map((c) => c.id), ['dep']);
  });

  test('a fully refunded charge is not listed', () {
    final kept = refundableCharges([
      charge(id: 'dep', settled: 300000),
      charge(id: 'r1', amount: -300000, reverses: 'dep'),
    ]);
    expect(kept, isEmpty);
  });
}
