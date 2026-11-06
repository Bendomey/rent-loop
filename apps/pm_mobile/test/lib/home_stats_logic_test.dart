import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';

void main() {
  test('reads string sums from cube rows', () {
    final s = computeHomeStats(
      paymentRows: [
        {'Payments.totalAmount': '450000'},
      ],
      chargeRows: [
        {
          'Charges.outstandingAmount': '1200000',
          'Charges.arrearsAmount': '300000',
        },
      ],
      unitRows: [
        {'Units.availableCount': '3', 'Units.count': '12'},
      ],
    );
    expect(s.collectedThisMonth, 450000);
    expect(s.stillToCollect, 1200000);
    expect(s.late, 300000);
    expect(s.emptyUnits, 3);
    expect(s.totalUnits, 12);
  });

  test('empty rows and nulls read as zero', () {
    final s = computeHomeStats(
      paymentRows: [],
      chargeRows: [
        {'Charges.outstandingAmount': null},
      ],
      unitRows: [],
    );
    expect(s.collectedThisMonth, 0);
    expect(s.stillToCollect, 0);
    expect(s.late, 0);
    expect(s.totalUnits, 0);
  });

  test('negative balances and arrears clamp to zero per account', () {
    final s = computeHomeStats(
      paymentRows: [],
      chargeRows: [
        {'Charges.outstandingAmount': '-5000', 'Charges.arrearsAmount': '-1'},
      ],
      unitRows: [],
    );
    expect(s.stillToCollect, 0);
    expect(s.late, 0);
  });

  test('one account credit does not offset another account debt', () {
    final s = computeHomeStats(
      paymentRows: [],
      chargeRows: [
        {'Charges.outstandingAmount': '-500', 'Charges.arrearsAmount': '0'},
        {'Charges.outstandingAmount': '1000', 'Charges.arrearsAmount': '400'},
      ],
      unitRows: [],
    );
    expect(s.stillToCollect, 1000);
    expect(s.late, 400);
  });

  test('late never exceeds the account balance', () {
    final s = computeHomeStats(
      paymentRows: [],
      chargeRows: [
        {'Charges.outstandingAmount': '300', 'Charges.arrearsAmount': '900'},
        {'Charges.outstandingAmount': '-400', 'Charges.arrearsAmount': '200'},
      ],
      unitRows: [],
    );
    expect(s.stillToCollect, 300);
    expect(s.late, 300);
  });
}
