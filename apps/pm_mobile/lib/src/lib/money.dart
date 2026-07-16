/// Converts an integer pesewas amount (as stored throughout the backend —
/// see apps/go's MoneyLib.pesawasToCedis for the mirrored convention on the
/// tenant app) to the cedis value display widgets like RLMoney expect.
num pesewasToCedis(int pesewas) => pesewas / 100;
