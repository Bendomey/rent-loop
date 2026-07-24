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
    // No specific error codes confirmed for the login flow yet — add
    // cases here as they're discovered against the real API (e.g. wrong
    // password, deactivated account).
    default:
      return defaultErrorMessage ?? 'Something happened. Try again.';
  }
}
