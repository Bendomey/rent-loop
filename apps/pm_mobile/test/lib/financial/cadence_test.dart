import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';

void main() {
  test('cadenceForChoice maps each choice to the stored policy', () {
    expect(cadenceForChoice(BillingChoice.monthly), (
      cadence: 'EVERY_PERIOD',
      interval: null,
    ));
    expect(cadenceForChoice(BillingChoice.quarterly), (
      cadence: 'EVERY_N_PERIODS',
      interval: 3,
    ));
    expect(cadenceForChoice(BillingChoice.wholeTerm), (
      cadence: 'MANUAL',
      interval: null,
    ));
    expect(cadenceForChoice(BillingChoice.manual), (
      cadence: 'MANUAL',
      interval: null,
    ));
  });

  test('choiceForPolicy reads the stored policy back', () {
    expect(choiceForPolicy('UPFRONT', 0), BillingChoice.wholeTerm);
    expect(choiceForPolicy('MANUAL', 0), BillingChoice.manual);
    expect(choiceForPolicy('EVERY_PERIOD', 0), BillingChoice.monthly);
    expect(choiceForPolicy('EVERY_N_PERIODS', 1), BillingChoice.monthly);
    expect(choiceForPolicy('EVERY_N_PERIODS', 3), BillingChoice.quarterly);
    expect(choiceForPolicy(null, null), BillingChoice.manual);
  });

  test('whole term reloads as manual', () {
    final policy = cadenceForChoice(BillingChoice.wholeTerm);
    expect(
      choiceForPolicy(policy.cadence, policy.interval),
      BillingChoice.manual,
    );
  });

  test('billingChoiceLabel uses the period noun', () {
    expect(
      billingChoiceLabel(BillingChoice.wholeTerm, 'month'),
      'Whole term up front',
    );
    expect(
      billingChoiceLabel(BillingChoice.quarterly, 'month'),
      'Every 3 months',
    );
    expect(billingChoiceLabel(BillingChoice.monthly, 'month'), 'Every month');
    expect(billingChoiceLabel(BillingChoice.monthly, 'week'), 'Every week');
    expect(
      billingChoiceLabel(BillingChoice.quarterly, 'week'),
      'Every 3 weeks',
    );
    expect(
      billingChoiceLabel(BillingChoice.manual, 'month'),
      "I'll bill manually",
    );
  });
}
