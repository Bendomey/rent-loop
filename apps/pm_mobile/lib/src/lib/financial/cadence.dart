enum BillingChoice { monthly, quarterly, wholeTerm, manual }

/// Whole term is stored as MANUAL, not UPFRONT: it is a collection action, not
/// a schedule, so nothing may be issued automatically. It therefore reloads as
/// [BillingChoice.manual], exactly as on the web.
///
/// Monthly is EVERY_PERIOD rather than EVERY_N_PERIODS with interval 1 because
/// the backend bills every remaining charge when EVERY_N_PERIODS has no interval.
({String cadence, int? interval}) cadenceForChoice(BillingChoice choice) {
  switch (choice) {
    case BillingChoice.monthly:
      return (cadence: 'EVERY_PERIOD', interval: null);
    case BillingChoice.quarterly:
      return (cadence: 'EVERY_N_PERIODS', interval: 3);
    case BillingChoice.wholeTerm:
    case BillingChoice.manual:
      return (cadence: 'MANUAL', interval: null);
  }
}

BillingChoice choiceForPolicy(String? cadence, int? interval) {
  switch (cadence) {
    case 'UPFRONT':
      return BillingChoice.wholeTerm;
    case 'EVERY_PERIOD':
      return BillingChoice.monthly;
    case 'EVERY_N_PERIODS':
      return interval == 1 ? BillingChoice.monthly : BillingChoice.quarterly;
    default:
      return BillingChoice.manual;
  }
}

String billingChoiceLabel(BillingChoice choice, String periodNoun) {
  switch (choice) {
    case BillingChoice.wholeTerm:
      return 'Whole term up front';
    case BillingChoice.quarterly:
      return 'Every 3 ${periodNoun}s';
    case BillingChoice.monthly:
      return 'Every $periodNoun';
    case BillingChoice.manual:
      return "I'll bill manually";
  }
}
