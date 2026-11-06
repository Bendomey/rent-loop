import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';

void main() {
  const expected = {
    'ChargesAlreadyBilled':
        'Rent has already been billed, so this can no longer be changed.',
    'UnitNotAvailable': 'That unit is no longer available. Pick another unit.',
    'PhoneOrEmailRequired': "Enter the tenant's phone number or email.",
    'TenantApplicationAlreadyCompleted': 'This tenant has already moved in.',
    'TenantApplicationAlreadyCancelled':
        'This tenant setup was already cancelled.',
    'ChargesAlreadyPrepared':
        'Billing has already been started for this tenant.',
    'ChargeAlreadyBilled':
        'This fee is already on a bill. Cancel the bill on the web first.',
    'ChargeAmountCannotBeZero': 'Enter an amount above zero.',
    'FinancialAccountClosed': "This tenant's account is closed.",
    'InvalidDueDate': 'Pick a valid due date.',
    'PaymentExceedsInvoiceBalance':
        'That is more than the bill has left on it.',
    'PaymentNotFound': 'That payment no longer exists.',
    'invoice is not in a valid state to accept payments':
        "This bill can't take payments right now.",
    'Payment is not in PENDING status': 'This payment was already handled.',
    'payment is not in pending status': 'This payment was already handled.',
    'can only verify offline payments': "This payment can't be confirmed here.",
    'Can Only Verify Offline Payments': "This payment can't be confirmed here.",
    'ClaimExceedsChargeBalance': 'Part of that is already on a bill.',
    'AmountExceedsOutstandingCharges': 'That is more than the tenant owes.',
    'NoChargesSelected': 'Pick what they paid for.',
    'ReversalExceedsSettledAmount': "You can't refund more than was paid.",
    'ApplicationMissingUnit': 'Choose a unit first.',
    'ApplicationMissingPersonalInfo': "Finish the tenant's details first.",
    'ApplicationMissingRentDetails': 'Set the rent first.',
    'ApplicationMissingMoveInDate': 'Set the move-in date first.',
    'ApplicationMissingStayDuration': "Set how long they're staying first.",
    'ApplicationMissingStayDurationFrequency':
        "Set how long they're staying first.",
    'UnitNoLongerAvailable':
        'That unit is no longer available. Pick another unit.',
  };

  expected.forEach((code, message) {
    test('translates $code', () {
      expect(translateApiErrorMessage(errorMessage: code), message);
    });
  });
}
