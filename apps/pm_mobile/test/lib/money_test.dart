import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/money.dart';

void main() {
  group('pesewasToCedis', () {
    test('converts a whole-cedi amount', () {
      expect(pesewasToCedis(8600000), 86000);
    });

    test('converts an amount with a fractional cedi remainder', () {
      expect(pesewasToCedis(150), 1.5);
    });

    test('converts zero', () {
      expect(pesewasToCedis(0), 0);
    });
  });

  group('currencySymbol', () {
    test('maps the backend cedi code to the cedi sign', () {
      expect(currencySymbol('GHS'), 'GH₵');
    });

    test('is case-insensitive', () {
      expect(currencySymbol('ghs'), 'GH₵');
    });

    test('maps the dollar code to the dollar sign', () {
      expect(currencySymbol('USD'), '\$');
      expect(currencySymbol('usd'), '\$');
    });

    test('passes unknown codes through unchanged', () {
      expect(currencySymbol('EUR'), 'EUR');
    });

    test('renders the default code as the cedi sign', () {
      expect(currencySymbol(defaultCurrencyCode), 'GH₵');
    });
  });

  group('formatCedis', () {
    test('always shows two decimals, including on a whole amount', () {
      expect(formatCedis(6000), '6,000.00');
      expect(formatCedis(0), '0.00');
    });

    test('groups thousands', () {
      expect(formatCedis(1234567.5), '1,234,567.50');
      expect(formatCedis(999), '999.00');
      expect(formatCedis(1000), '1,000.00');
    });

    test('keeps the pesewa remainder instead of rounding it away', () {
      expect(formatCedis(pesewasToCedis(600050)), '6,000.50');
      expect(formatCedis(pesewasToCedis(1)), '0.01');
    });

    test('rounds a sub-pesewa fraction to two decimals', () {
      expect(formatCedis(1.006), '1.01');
      expect(formatCedis(1.004), '1.00');
      // 1.005 is not exactly representable in binary floating point (it is
      // 1.00499…), so it rounds down. Amounts reaching this function come from
      // pesewasToCedis — an int over 100 — so a sub-pesewa fraction is not a
      // case the app actually produces; this pins the behaviour rather than
      // endorsing it.
      expect(formatCedis(1.005), '1.00');
    });

    test('handles a negative amount', () {
      expect(formatCedis(-1234.5), '-1,234.50');
    });
  });

  group('formatPesewas', () {
    test('renders pesewas as a grouped, symbolled cedi amount', () {
      expect(formatPesewas(600000), 'GH₵ 6,000.00');
      expect(formatPesewas(50000), 'GH₵ 500.00');
    });

    test('keeps the pesewa remainder', () {
      expect(formatPesewas(600050), 'GH₵ 6,000.50');
    });

    test('renders null as an em dash, not a zero', () {
      expect(formatPesewas(null), '—');
    });

    test('honours a non-default currency code', () {
      expect(formatPesewas(600000, code: 'USD'), '\$ 6,000.00');
      expect(formatPesewas(600000, code: 'EUR'), 'EUR 6,000.00');
    });
  });
}
