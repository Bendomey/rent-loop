final _e164 = RegExp(r'^\+[1-9]\d{7,14}$');
final _ghanaLocal = RegExp(r'^0(\d{9})$');
final _ghanaNational = RegExp(r'^[1-9]\d{8}$');
final _ghanaInternational = RegExp(r'^233\d{9}$');

/// Ghana is the default country: a bare national (`244551190`), local or
/// `233…` number is read as Ghanaian. Returns null unless the result is valid E.164.
String? normalizePhone(String? input) {
  if (input == null) return null;
  var value = input.replaceAll(RegExp(r'[\s\-()]'), '');
  if (value.startsWith('00')) value = '+${value.substring(2)}';

  final local = _ghanaLocal.firstMatch(value);
  if (local != null) {
    value = '+233${local.group(1)}';
  } else if (_ghanaNational.hasMatch(value)) {
    value = '+233$value';
  } else if (_ghanaInternational.hasMatch(value)) {
    value = '+$value';
  }
  return _e164.hasMatch(value) ? value : null;
}

/// The digits to show beside a fixed +233 prefix; other numbers are unchanged.
String nationalDigits(String phone) {
  final normalized = normalizePhone(phone);
  return normalized != null && normalized.startsWith('+233')
      ? normalized.substring(4)
      : phone;
}

String? whatsAppNumber(String? phone) {
  final digits = phone?.replaceAll(RegExp(r'\D'), '') ?? '';
  if (digits.isEmpty) return null;
  if (digits.startsWith('00')) return digits.substring(2);
  return digits.startsWith('0') ? '233${digits.substring(1)}' : digits;
}

Uri? callUri(String? phone) {
  if (whatsAppNumber(phone) == null) return null;
  return Uri.parse('tel:${phone!.replaceAll(RegExp(r'[^\d+]'), '')}');
}
