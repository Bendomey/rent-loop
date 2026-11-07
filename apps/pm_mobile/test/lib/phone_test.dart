import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/phone.dart';

void main() {
  test('normalizes Ghana local and international formats', () {
    expect(normalizePhone('024 123 4567'), '+233241234567');
    expect(normalizePhone('0241234567'), '+233241234567');
    expect(normalizePhone('233241234567'), '+233241234567');
    expect(normalizePhone('+233 24 123 4567'), '+233241234567');
    expect(normalizePhone('(024) 123-4567'), '+233241234567');
  });

  test('reads the nine digits typed beside a visible +233 as Ghanaian', () {
    expect(normalizePhone('244551190'), '+233244551190');
    expect(normalizePhone('200000011'), '+233200000011');
    expect(normalizePhone('24 455 1190'), '+233244551190');
    expect(normalizePhone('0244551190'), '+233244551190');
    expect(normalizePhone('233244551190'), '+233244551190');
    expect(normalizePhone('+233244551190'), '+233244551190');
  });

  test('nationalDigits strips +233 only', () {
    expect(nationalDigits('+233244551190'), '244551190');
    expect(nationalDigits('0244551190'), '244551190');
    expect(nationalDigits('+447700900123'), '+447700900123');
    expect(nationalDigits(''), '');
  });

  test('turns a leading 00 into a plus', () {
    expect(normalizePhone('0044 7700 900123'), '+447700900123');
  });

  test('rejects anything that is not a plausible number', () {
    expect(normalizePhone('12345'), isNull);
    expect(normalizePhone(''), isNull);
    expect(normalizePhone(null), isNull);
    expect(normalizePhone('abc'), isNull);
    expect(normalizePhone('24455119'), isNull);
    expect(normalizePhone('2445511901'), isNull);
  });

  test('whatsAppNumber normalises Ghana numbers', () {
    expect(whatsAppNumber('024 455 1190'), '233244551190');
    expect(whatsAppNumber('+233 24 455 1190'), '233244551190');
    expect(whatsAppNumber('00233244551190'), '233244551190');
    expect(whatsAppNumber('233244551190'), '233244551190');
    expect(whatsAppNumber(''), isNull);
    expect(whatsAppNumber(null), isNull);
  });

  test('callUri strips spaces', () {
    expect(callUri('+233 24 455 1190').toString(), 'tel:+233244551190');
    expect(callUri('024-455-1190').toString(), 'tel:0244551190');
    expect(callUri('  '), isNull);
  });
}
