/// Converts an integer pesewas amount (as stored throughout the backend —
/// see apps/go's MoneyLib.pesawasToCedis for the mirrored convention on the
/// tenant app) to the cedis value display widgets like RLMoney expect.
num pesewasToCedis(int pesewas) => pesewas / 100;

/// Inverse of [pesewasToCedis] — converts a user-entered cedis amount (form
/// inputs) to the integer pesewas value the backend stores/expects.
int cedisToPesewas(num cedis) => (cedis * 100).round();

/// The ISO 4217 code the backend stores for every amount today. Send this on
/// write paths — [currencySymbol] is for display only.
const String defaultCurrencyCode = 'GHS';

/// Maps an ISO 4217 code to the sign shown in the UI, mirroring apps/go's
/// MoneyLib.currencySymbol on the tenant app. Unknown codes fall through
/// unchanged so a new backend currency still renders something sensible.
String currencySymbol(String code) {
  switch (code.toUpperCase()) {
    case 'GHS':
      return 'GH₵';
    case 'USD':
      return '\$';
    default:
      return code;
  }
}

/// `6,000.00` from a major-unit amount — thousands separators and always two
/// decimals, because a money figure that drops them (`6,000`, or worse a bare
/// `6000.5`) reads as an approximation. This is the one place the app decides
/// how a converted amount looks; [pesewasToCedis] only does the arithmetic.
String formatCedis(num cedis) {
  final parts = cedis.toStringAsFixed(2).split('.');
  final whole = parts[0].replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
  return '$whole.${parts[1]}';
}

/// `GH₵ 6,000.00` from an integer pesewas amount — the full display form,
/// symbol included. Null renders as an em dash rather than a zero, so an
/// absent fee is never mistaken for a free one.
String formatPesewas(int? pesewas, {String code = defaultCurrencyCode}) {
  if (pesewas == null) return '—';
  return '${currencySymbol(code)} ${formatCedis(pesewasToCedis(pesewas))}';
}
