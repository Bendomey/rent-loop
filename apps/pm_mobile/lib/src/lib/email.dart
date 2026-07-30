/// Normalises an address before it goes to the API: trimmed and lowercased.
///
/// The local part of an address is technically case-sensitive per RFC 5321,
/// but no mail provider in practice treats it that way and the backend stores
/// addresses lowercase — so a login typed as `Ama@Example.com`, or
/// autocapitalised to `Ama@example.com` by an iOS keyboard, would otherwise
/// fail to match an account that exists.
String normalizeEmail(String email) => email.trim().toLowerCase();
