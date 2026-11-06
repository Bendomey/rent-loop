import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

enum PaymentFrequency {
  daily,
  weekly,
  monthly,
  quarterly,
  biannually,
  annually,
}

/// Stay frequencies arrive as HOURS/DAYS/MONTHS while payment frequencies are
/// MONTHLY etc.; the backend reads an unknown stay unit as months. HOURS has no
/// equivalent here, so it returns null and callers fall through.
PaymentFrequency? paymentFrequencyFromApi(String? value) {
  final wanted = value?.toUpperCase();
  if (wanted == 'MONTHS') return PaymentFrequency.monthly;
  if (wanted == 'DAYS') return PaymentFrequency.daily;
  for (final f in PaymentFrequency.values) {
    if (f.name.toUpperCase() == wanted) return f;
  }
  return null;
}

/// The web feeds this one value to both the stay and payment frequency.
PaymentFrequency frequencyForApplication(TenantApplicationModel app) =>
    paymentFrequencyFromApi(app.stayDurationFrequency) ??
    paymentFrequencyFromApi(app.desiredUnit?.paymentFrequency) ??
    PaymentFrequency.monthly;

class SchedulePeriod {
  final String name;
  final int amount;
  final DateTime periodStart;
  final DateTime dueDate;

  const SchedulePeriod({
    required this.name,
    required this.amount,
    required this.periodStart,
    required this.dueDate,
  });
}

/// Mirrors lib.RentInvoiceGracePeriod in the backend: grace after the period
/// starts, unrelated to auto_issue_days_before.
const Map<PaymentFrequency, int> _graceDays = {
  PaymentFrequency.daily: 0,
  PaymentFrequency.weekly: 3,
  PaymentFrequency.monthly: 7,
  PaymentFrequency.quarterly: 14,
  PaymentFrequency.biannually: 14,
  PaymentFrequency.annually: 30,
};

const Map<PaymentFrequency, ({int months, int days})> _step = {
  PaymentFrequency.daily: (months: 0, days: 1),
  PaymentFrequency.weekly: (months: 0, days: 7),
  PaymentFrequency.monthly: (months: 1, days: 0),
  PaymentFrequency.quarterly: (months: 3, days: 0),
  PaymentFrequency.biannually: (months: 6, days: 0),
  PaymentFrequency.annually: (months: 12, days: 0),
};

const List<String> _monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const int _maxPeriods = 120;

int graceDays(PaymentFrequency frequency) => _graceDays[frequency]!;

/// Month overflow is normalised, not clamped (31 Jan + 1 month is 3 March), to
/// match Go's time.AddDate and so the preview matches the charges created.
DateTime _advance(DateTime from, PaymentFrequency frequency, int n) {
  final step = _step[frequency]!;
  final u = from.toUtc();
  return DateTime.utc(
    u.year,
    u.month + step.months * n,
    u.day + step.days * n,
    u.hour,
    u.minute,
    u.second,
    u.millisecond,
  );
}

String periodLabel(DateTime date, PaymentFrequency frequency) {
  final d = date.toUtc();
  if (frequency == PaymentFrequency.annually) return 'Rent – ${d.year}';
  return 'Rent – ${_monthNames[d.month - 1]} ${d.year}';
}

DateTime termEndDate(
  DateTime moveIn,
  int stayDuration,
  PaymentFrequency stayFrequency,
) => _advance(moveIn, stayFrequency, stayDuration);

/// The term is [stayDuration] in [stayFrequency] units; rent falls due every
/// [paymentFrequency] within it. A twelve-month stay billed quarterly is four
/// charges, not twelve.
List<SchedulePeriod> buildSchedule({
  required int rent,
  required DateTime moveIn,
  required int stayDuration,
  required PaymentFrequency stayFrequency,
  required PaymentFrequency paymentFrequency,
}) {
  if (stayDuration <= 0) return const [];

  final start = moveIn.toUtc();
  final end = termEndDate(start, stayDuration, stayFrequency);
  final grace = _graceDays[paymentFrequency]!;

  final periods = <SchedulePeriod>[];
  for (var n = 0; n < _maxPeriods; n++) {
    final periodStart = _advance(start, paymentFrequency, n);
    if (!periodStart.isBefore(end)) break;
    periods.add(
      SchedulePeriod(
        name: periodLabel(periodStart, paymentFrequency),
        amount: rent,
        periodStart: periodStart,
        dueDate: periodStart.add(Duration(days: grace)),
      ),
    );
  }
  return periods;
}
