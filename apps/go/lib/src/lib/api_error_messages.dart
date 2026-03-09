// Should hold all error messages we want to explicitly inform users about
// and leave the 500 errors as the default error message.
// When adding messages, always add context like so 'context.errorCode'.

String translateApiErrorMessage({
  String? errorMessage,
  String? defaultErrorMessage,
}) {
  switch (errorMessage) {
    // tenant auth — send OTP
    case 'TenantNotFound':
      return 'No account found for this phone number.';

    // tenant auth — verify OTP
    case 'CodeIncorrect':
      return 'The code you entered is incorrect. Please try again.';

    default:
      return defaultErrorMessage ?? 'Something happened. Try again.';
  }
}
