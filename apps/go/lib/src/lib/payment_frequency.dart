class _FrequencyLabel {
  final String singular;
  final String plural;
  final String frequency;

  const _FrequencyLabel({
    required this.singular,
    required this.plural,
    required this.frequency,
  });
}

const _frequencyLabels = <String, _FrequencyLabel>{
  'DAILY': _FrequencyLabel(singular: 'day', plural: 'days', frequency: 'Daily'),
  'WEEKLY': _FrequencyLabel(singular: 'week', plural: 'weeks', frequency: 'Weekly'),
  'MONTHLY': _FrequencyLabel(singular: 'month', plural: 'months', frequency: 'Monthly'),
  'QUARTERLY': _FrequencyLabel(singular: 'quarter', plural: 'quarters', frequency: 'Quarterly'),
  'BIANNUALLY': _FrequencyLabel(singular: '6-month period', plural: '6-month periods', frequency: 'Biannually'),
  'ANNUALLY': _FrequencyLabel(singular: 'year', plural: 'years', frequency: 'Annually'),
};

/// Returns the human-readable frequency label, e.g. "Monthly", "Weekly"
String getPaymentFrequencyLabel(String frequency) {
  return _frequencyLabels[frequency.toUpperCase()]?.frequency ?? frequency;
}

/// Returns the period unit label, e.g. "month" (count=1) or "months" (count≠1)
String getPaymentFrequencyPeriodLabel(String frequency, {int count = 1}) {
  final entry = _frequencyLabels[frequency.toUpperCase()];
  if (entry == null) return count == 1 ? 'period' : 'periods';
  return count == 1 ? entry.singular : entry.plural;
}
