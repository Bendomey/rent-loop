import 'package:rentloop_manager/src/lib/financial/schedule.dart';

String periodNoun(PaymentFrequency frequency) => switch (frequency) {
  PaymentFrequency.daily => 'day',
  PaymentFrequency.weekly => 'week',
  PaymentFrequency.monthly => 'month',
  PaymentFrequency.quarterly => 'quarter',
  PaymentFrequency.biannually => 'half-year',
  PaymentFrequency.annually => 'year',
};

const _shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/// `8 Sep 2026`, always read in UTC so a date never shifts with the phone's zone.
String formatDay(DateTime date) {
  final d = date.toUtc();
  return '${d.day} ${_shortMonths[d.month - 1]} ${d.year}';
}

String ordinal(int n) {
  final rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return '${n}th';
  const suffixes = ['th', 'st', 'nd', 'rd'];
  final rem10 = n % 10;
  return '$n${rem10 < 4 ? suffixes[rem10] : 'th'}';
}
