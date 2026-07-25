/// Converts an integer pesewas amount (as stored throughout the backend —
/// see apps/go's MoneyLib.pesawasToCedis for the mirrored convention on the
/// tenant app) to the cedis value display widgets like RLMoney expect.
num pesewasToCedis(int pesewas) => pesewas / 100;

/// Inverse of [pesewasToCedis] — converts a user-entered cedis amount (form
/// inputs) to the integer pesewas value the backend stores/expects.
int cedisToPesewas(num cedis) => (cedis * 100).round();
