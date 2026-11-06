// Should hold all error messages we want to explicitly inform users about
// and leave the 500 errors as the default error message.
// When adding messages, always add context like so 'context.errorCode'.

String translateApiErrorMessage({
  String? errorMessage,
  String? defaultErrorMessage,
}) {
  switch (errorMessage) {
    case 'PasswordIncorrect':
    case 'UserNotFound':
      return 'Your credentials are incorrect. Please try again.';
    case 'UnitIsOccupied':
      return 'This unit is occupied and can\'t be deleted.';
    case 'PropertyHasActiveOccupancy':
      return 'This property still has active occupancy and can\'t be deleted yet.';
    case 'ChargesAlreadyBilled':
      return 'Rent has already been billed, so this can no longer be changed.';
    case 'UnitNotAvailable':
      return 'That unit is no longer available. Pick another unit.';
    case 'PhoneOrEmailRequired':
      return 'Enter the tenant\'s phone number or email.';
    case 'TenantApplicationAlreadyCompleted':
      return 'This tenant has already moved in.';
    case 'TenantApplicationAlreadyCancelled':
      return 'This tenant setup was already cancelled.';
    case 'ChargesAlreadyPrepared':
      return 'Billing has already been started for this tenant.';
    case 'ChargeAlreadyBilled':
      return 'This fee is already on a bill. Cancel the bill on the web first.';
    case 'ChargeAmountCannotBeZero':
      return 'Enter an amount above zero.';
    case 'FinancialAccountClosed':
      return 'This tenant\'s account is closed.';
    case 'InvalidDueDate':
      return 'Pick a valid due date.';
    case 'PaymentExceedsInvoiceBalance':
      return 'That is more than the bill has left on it.';
    case 'ClaimExceedsChargeBalance':
      return 'Part of that is already on a bill.';
    case 'AmountExceedsOutstandingCharges':
      return 'That is more than the tenant owes.';
    case 'NoChargesSelected':
      return 'Pick what they paid for.';
    case 'ReversalExceedsSettledAmount':
      return 'You can\'t refund more than was paid.';
    case 'ApplicationMissingUnit':
      return 'Choose a unit first.';
    case 'ApplicationMissingPersonalInfo':
      return 'Finish the tenant\'s details first.';
    case 'ApplicationMissingRentDetails':
      return 'Set the rent first.';
    case 'ApplicationMissingMoveInDate':
      return 'Set the move-in date first.';
    case 'ApplicationMissingStayDuration':
    case 'ApplicationMissingStayDurationFrequency':
      return 'Set how long they\'re staying first.';
    case 'UnitNoLongerAvailable':
      return 'That unit is no longer available. Pick another unit.';
    // No specific error codes confirmed for the login flow yet — add
    // cases here as they're discovered against the real API (e.g. wrong
    // password, deactivated account).
    default:
      return defaultErrorMessage ?? 'Something happened. Try again.';
  }
}
