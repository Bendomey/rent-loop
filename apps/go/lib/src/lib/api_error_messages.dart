// Should hold all error messages we want to explictly inform users about
// and leave the 500 errors as the default error message.

String translateApiErrorMessage({
  String? errorMessage,
  String? defaultErrorMessage,
}) {
  // when adding messages, always added context like so 'context.apiErrorMessage'.
  switch (errorMessage) {
    case 'verify.InvalidPhoneNumber':
    case 'InvalidPhoneNumber':
    case 'verify.CodeIncorrectOrHasExpired':
    case 'CodeIncorrectOrHasExpired':
      return 'Code is incorrect or has expired';
    case 'verify.AccountSuspended':
    case 'AccountSuspended':
      return 'Sorry, Account has been suspended.';
    case 'createClient.UserAlreadyExists':
    case 'UserAlreadyExists':
      return 'User already exists';
    default:
      return defaultErrorMessage ?? 'Something happened. Try again.';
  }
}
