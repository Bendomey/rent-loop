import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';

void main() {
  group('parseHomeCharges', () {
    test('reads string sums from per-account rows', () {
      final c = parseHomeCharges([
        {
          'Charges.financialAccountId': 'fa1',
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '1200000',
          'Charges.arrearsAmount': '300000',
        },
      ], clientId: 'c1');
      expect(c.stillToCollect, 1200000);
      expect(c.late, 300000);
      expect(c.lateProperties, 1);
      expect(c.clientId, 'c1');
    });

    test('empty rows and nulls read as zero', () {
      final c = parseHomeCharges([
        {'Charges.outstandingAmount': null, 'Charges.arrearsAmount': null},
      ]);
      expect(c.stillToCollect, 0);
      expect(c.late, 0);
      expect(c.lateProperties, 0);
      expect(parseHomeCharges([]).stillToCollect, 0);
    });

    test("one tenant's credit doesn't offset another's debt", () {
      final c = parseHomeCharges([
        {
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '50000',
          'Charges.arrearsAmount': '50000',
        },
        {
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '-80000',
          'Charges.arrearsAmount': '0',
        },
      ]);
      expect(c.stillToCollect, 50000);
      expect(c.late, 50000);
    });

    test('late never exceeds what the account owes', () {
      final c = parseHomeCharges([
        {
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '20000',
          'Charges.arrearsAmount': '90000',
        },
      ]);
      expect(c.late, 20000);
    });

    test('counts distinct properties with late rent only', () {
      final c = parseHomeCharges([
        for (final (p, late) in [
          ('p1', '100'),
          ('p1', '200'),
          ('p2', '0'),
          ('p3', '50'),
        ])
          {
            'Charges.propertyId': p,
            'Charges.outstandingAmount': '1000',
            'Charges.arrearsAmount': late,
          },
      ]);
      expect(c.lateProperties, 2);
    });

    test('an account whose late is wiped out by credit is not late', () {
      final c = parseHomeCharges([
        {
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '-500',
          'Charges.arrearsAmount': '300',
        },
      ]);
      expect(c.late, 0);
      expect(c.lateProperties, 0);
    });
  });

  group('parseHomePayments', () {
    final now = DateTime(2026, 11, 7);

    test('fills six months oldest first, summing across properties', () {
      final p = parseHomePayments(
        [
          {
            'Payments.successfulAt.month': '2026-11-01T00:00:00.000',
            'Payments.propertyId': 'p1',
            'Payments.totalAmount': '150000',
          },
          {
            'Payments.successfulAt.month': '2026-11-01T00:00:00.000',
            'Payments.propertyId': 'p2',
            'Payments.totalAmount': '70000',
          },
          {
            'Payments.successfulAt.month': '2026-10-01T00:00:00.000',
            'Payments.propertyId': 'p1',
            'Payments.totalAmount': '196000',
          },
          {
            'Payments.successfulAt.month': '2026-06-01T00:00:00.000',
            'Payments.propertyId': null,
            'Payments.totalAmount': '1000',
          },
        ],
        now: now,
        clientId: 'c1',
      );
      expect(p.months.map((m) => m.month.month), [6, 7, 8, 9, 10, 11]);
      expect(p.months.map((m) => m.amount), [1000, 0, 0, 0, 196000, 220000]);
      expect(p.thisMonth, 220000);
      expect(p.lastMonth, 196000);
      expect(p.thisMonthByProperty, {'p1': 150000, 'p2': 70000});
      expect(p.clientId, 'c1');
    });

    test('a month crossing the year boundary lands in the right bar', () {
      final p = parseHomePayments([
        {
          'Payments.successfulAt.month': '2025-12-01T00:00:00.000',
          'Payments.totalAmount': '500',
        },
      ], now: DateTime(2026, 2, 10));
      expect(p.months.first.month, DateTime(2025, 9));
      expect(p.months[3].amount, 500);
      expect(p.thisMonth, 0);
    });

    test('rows outside the window or without a month are ignored', () {
      final p = parseHomePayments([
        {
          'Payments.successfulAt.month': '2025-01-01T00:00:00.000',
          'Payments.totalAmount': '999',
        },
        {'Payments.totalAmount': '999'},
      ], now: now);
      expect(p.months.every((m) => m.amount == 0), isTrue);
    });

    test('no rows still gives six zero months', () {
      final p = parseHomePayments(const [], now: now);
      expect(p.months, hasLength(homeTrendMonths));
      expect(p.thisMonth, 0);
      expect(p.lastMonth, 0);
    });
  });

  test('homeTrendDateRange spans six whole months', () {
    expect(homeTrendDateRange(DateTime(2026, 11, 7)), [
      '2026-06-01',
      '2026-11-30',
    ]);
    expect(homeTrendDateRange(DateTime(2026, 2, 28)), [
      '2025-09-01',
      '2026-02-28',
    ]);
  });

  test('parseHomeLeases reads active and expiring counts', () {
    final l = parseHomeLeases([
      {'Leases.activeCount': '4', 'Leases.expiringCount': '2'},
    ], clientId: 'c1');
    expect(l.active, 4);
    expect(l.expiring, 2);
    expect(parseHomeLeases([]).expiring, 0);
  });

  test('parseHomeRepairs sums open statuses and picks out emergencies', () {
    final r = parseHomeRepairs([
      {
        'MaintenanceRequests.priority': 'EMERGENCY',
        'MaintenanceRequests.newCount': '1',
        'MaintenanceRequests.inProgressCount': '0',
        'MaintenanceRequests.inReviewCount': null,
      },
      {
        'MaintenanceRequests.priority': 'HIGH',
        'MaintenanceRequests.newCount': '1',
        'MaintenanceRequests.inProgressCount': '1',
        'MaintenanceRequests.inReviewCount': '0',
      },
    ]);
    expect(r.open, 3);
    expect(r.urgent, 1);
    expect(parseHomeRepairs([]).open, 0);
  });

  test('parseHomeUnits and occupiedPercent', () {
    final u = parseHomeUnits([
      {
        'Units.count': '3',
        'Units.occupiedCount': '2',
        'Units.availableCount': '1',
      },
    ]);
    expect(u.total, 3);
    expect(u.occupied, 2);
    expect(u.empty, 1);
    expect(u.occupiedPercent, 67);
    expect(parseHomeUnits([]).occupiedPercent, 0);
  });

  test('parseHomePendingTenants', () {
    expect(
      parseHomePendingTenants([
        {'TenantApplications.inProgressCount': '5'},
      ]).count,
      5,
    );
    expect(parseHomePendingTenants([]).count, 0);
  });

  group('rankHomeProperties', () {
    test('highest first, zero-collection properties kept', () {
      final rows = rankHomeProperties(
        amounts: {'b': 500, 'c': 900},
        names: {'a': 'Ama Court', 'b': 'Bay View', 'c': 'Cedar'},
      );
      expect(rows.map((r) => r.name), ['Cedar', 'Bay View', 'Ama Court']);
      expect(rows.last.amount, 0);
    });

    test('ties keep the API order', () {
      final rows = rankHomeProperties(
        amounts: {},
        names: {'z': 'Zed', 'a': 'Abe', 'm': 'Mo'},
      );
      expect(rows.map((r) => r.id), ['z', 'a', 'm']);
    });

    test('money from a property missing from the names still shows', () {
      final rows = rankHomeProperties(amounts: {'x': 10}, names: {});
      expect(rows.single.name, 'Other property');
      expect(rows.single.amount, 10);
    });
  });

  test('percentChange is null when last month is 0', () {
    expect(percentChange(500, 0), isNull);
    expect(percentChange(112, 100), 12);
    expect(percentChange(92, 100), -8);
    expect(percentChange(0, 100), -100);
  });

  test('greetingFor follows the clock', () {
    expect(greetingFor(DateTime(2026, 1, 1, 8)), 'Good morning');
    expect(greetingFor(DateTime(2026, 1, 1, 13)), 'Good afternoon');
    expect(greetingFor(DateTime(2026, 1, 1, 19)), 'Good evening');
  });

  test('shortMonthName', () {
    expect(shortMonthName(DateTime(2026, 10)), 'Oct');
  });
}
