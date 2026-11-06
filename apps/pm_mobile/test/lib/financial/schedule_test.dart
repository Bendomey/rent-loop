import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/schedule.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

String day(DateTime d) => d.toIso8601String().substring(0, 10);

List<SchedulePeriod> build({
  int rent = 100000,
  String moveIn = '2026-09-01T00:00:00Z',
  int stayDuration = 12,
  PaymentFrequency stay = PaymentFrequency.monthly,
  PaymentFrequency pay = PaymentFrequency.monthly,
}) => buildSchedule(
  rent: rent,
  moveIn: DateTime.parse(moveIn),
  stayDuration: stayDuration,
  stayFrequency: stay,
  paymentFrequency: pay,
);

UnitModel _unit(String frequency) => UnitModel(
  id: 'u',
  name: 'U',
  type: 'APARTMENT',
  status: 'AVAILABLE',
  rentFee: 0,
  rentFeeCurrency: 'GHS',
  paymentFrequency: frequency,
);

void main() {
  group('graceDays', () {
    test('matches the backend for every frequency', () {
      expect(graceDays(PaymentFrequency.monthly), 7);
      expect(graceDays(PaymentFrequency.quarterly), 14);
      expect(graceDays(PaymentFrequency.biannually), 14);
      expect(graceDays(PaymentFrequency.annually), 30);
      expect(graceDays(PaymentFrequency.weekly), 3);
      expect(graceDays(PaymentFrequency.daily), 0);
    });
  });

  group('buildSchedule', () {
    test('produces one period per month of the term', () {
      expect(build(), hasLength(12));
    });

    test('due date is period start plus the grace period', () {
      final s = build();
      expect(s[0].periodStart.toIso8601String(), '2026-09-01T00:00:00.000Z');
      expect(s[0].dueDate.toIso8601String(), '2026-09-08T00:00:00.000Z');
      expect(s[1].dueDate.toIso8601String(), '2026-10-08T00:00:00.000Z');
    });

    test('every period carries one period of rent, never a multiple', () {
      for (final p in build()) {
        expect(p.amount, 100000);
      }
    });

    test('labels read as the month the rent covers', () {
      final s = build();
      expect(s[0].name, 'Rent – September 2026');
      expect(s[11].name, 'Rent – August 2027');
    });

    test('quarterly terms step three months and use a 14 day grace', () {
      final s = build(
        pay: PaymentFrequency.quarterly,
        stay: PaymentFrequency.quarterly,
        stayDuration: 4,
      );
      expect(s, hasLength(4));
      expect(s[1].periodStart.toIso8601String(), '2026-12-01T00:00:00.000Z');
      expect(s[0].dueDate.toIso8601String(), '2026-09-15T00:00:00.000Z');
    });

    test('a zero or negative term produces nothing', () {
      expect(build(stayDuration: 0), isEmpty);
      expect(build(stayDuration: -1), isEmpty);
    });

    test('a monthly term billed quarterly produces one charge per quarter', () {
      final s = build(pay: PaymentFrequency.quarterly);
      expect(s, hasLength(4));
      expect(day(s[0].periodStart), '2026-09-01');
      expect(day(s[3].periodStart), '2027-06-01');
      expect(day(s[0].dueDate), '2026-09-15');
    });

    test('a one-year term billed monthly produces twelve charges', () {
      final s = build(stayDuration: 1, stay: PaymentFrequency.annually);
      expect(s, hasLength(12));
    });

    test('a month-end move-in overflows exactly as the backend does', () {
      final s = build(moveIn: '2026-01-31T00:00:00Z', stayDuration: 3);
      expect(day(s[0].periodStart), '2026-01-31');
      expect(day(s[1].periodStart), '2026-03-03');
    });

    test('an annual term labels by year rather than month', () {
      final s = build(
        stayDuration: 2,
        stay: PaymentFrequency.annually,
        pay: PaymentFrequency.annually,
      );
      expect(s[0].name, 'Rent – 2026');
      expect(day(s[0].dueDate), '2026-10-01');
    });
  });

  test('paymentFrequencyFromApi reads the API value or returns null', () {
    expect(paymentFrequencyFromApi('MONTHLY'), PaymentFrequency.monthly);
    expect(paymentFrequencyFromApi('annually'), PaymentFrequency.annually);
    expect(paymentFrequencyFromApi('HOURS'), isNull);
    expect(paymentFrequencyFromApi(null), isNull);
  });

  group('frequencyForApplication', () {
    TenantApplicationModel app(String? stay, String? unit) =>
        TenantApplicationModel(
          id: 'x',
          code: 'c',
          stayDurationFrequency: stay,
          desiredUnit: unit == null ? null : _unit(unit),
        );

    test('maps backend stay units onto payment frequencies', () {
      expect(paymentFrequencyFromApi('MONTHS'), PaymentFrequency.monthly);
      expect(paymentFrequencyFromApi('DAYS'), PaymentFrequency.daily);
      expect(paymentFrequencyFromApi('HOURS'), isNull);
    });

    test('a MONTHS application is monthly', () {
      expect(
        frequencyForApplication(app('MONTHS', 'WEEKLY')),
        PaymentFrequency.monthly,
      );
    });

    test('falls back to the unit payment frequency', () {
      expect(
        frequencyForApplication(app(null, 'WEEKLY')),
        PaymentFrequency.weekly,
      );
      expect(
        frequencyForApplication(app('HOURS', 'WEEKLY')),
        PaymentFrequency.weekly,
      );
    });

    test('defaults to monthly', () {
      expect(
        frequencyForApplication(app(null, null)),
        PaymentFrequency.monthly,
      );
    });

    test('a MONTHS/6 application builds six periods', () {
      final f = frequencyForApplication(app('MONTHS', null));
      expect(build(stayDuration: 6, stay: f, pay: f), hasLength(6));
    });
  });
}
