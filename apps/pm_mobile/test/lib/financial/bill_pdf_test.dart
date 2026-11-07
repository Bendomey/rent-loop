import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/bill_pdf.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

import 'bill_print_fixtures.dart';

final now = DateTime.utc(2026, 11, 7, 9);

/// Reads the words back out of an uncompressed pdf-package document by
/// mapping each font's glyph codes through its ToUnicode CMap. Every word is
/// its own text run, so the result is the page's words joined by spaces.
/// Geist has no cedi glyph, so in Geist runs the sign falls back to Inter as
/// a separate run; that split is joined back up here.
String pdfText(Uint8List bytes) {
  final raw = latin1.decode(bytes);
  final objects = <String, String>{
    for (final m in RegExp(
      r'(\d+) 0 obj(.*?)endobj',
      dotAll: true,
    ).allMatches(raw))
      m.group(1)!: m.group(2)!,
  };
  final cmaps = <String, Map<int, int>>{};
  for (final m in RegExp(r'/(F\d+) (\d+) 0 R').allMatches(raw)) {
    final font = objects[m.group(2)!] ?? '';
    final ref = RegExp(r'/ToUnicode (\d+) 0 R').firstMatch(font)?.group(1);
    if (ref == null) continue;
    cmaps[m.group(1)!] = {
      for (final e in RegExp(
        r'<([0-9A-F]{4})> <([0-9A-F]{4,})>',
      ).allMatches(objects[ref]!))
        int.parse(e.group(1)!, radix: 16): int.parse(e.group(2)!, radix: 16),
    };
  }
  final words = <String>[];
  var font = '';
  for (final m in RegExp(r'/(F\d+) [\d.]+ Tf|\[([^\]]*)\]TJ').allMatches(raw)) {
    if (m.group(1) != null) {
      font = m.group(1)!;
      continue;
    }
    final map = cmaps[font] ?? const {};
    final word = StringBuffer();
    for (final hex in RegExp(r'<([0-9a-f]*)>').allMatches(m.group(2)!)) {
      final h = hex.group(1)!;
      for (var i = 0; i + 4 <= h.length; i += 4) {
        word.writeCharCode(map[int.parse(h.substring(i, i + 4), radix: 16)]!);
      }
    }
    words.add(word.toString());
  }
  return words.join(' ').replaceAll('GH ₵', 'GH₵');
}

Future<({Uint8List bytes, String text, List<String> logs})> render(
  InvoiceModel bill,
) async {
  final logs = <String>[];
  final bytes = await runZoned(
    () => buildBillPdf(bill, now: now, compress: false),
    zoneSpecification: ZoneSpecification(
      print: (self, parent, zone, line) => logs.add(line),
    ),
  );
  return (bytes: bytes, text: pdfText(bytes), logs: logs);
}

void expectPdf(({Uint8List bytes, String text, List<String> logs}) r) {
  expect(r.bytes.length, greaterThan(1000));
  expect(latin1.decode(r.bytes.sublist(0, 5)), '%PDF-');
  expect(r.logs, isEmpty, reason: 'no missing-glyph fallback warnings');
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('unpaid with no due date matches the web print', () async {
    final r = await render(printBill());
    expectPdf(r);
    for (final s in [
      'rent loop',
      "Domey's Residence",
      "Main block · Domey's Residence",
      'Bill INV-2604-3DYMMV',
      'NOT PAID YET',
      'BILLED TO Benjamin Armah-Kessey Domey',
      "Tenant · Domey's Residence +233201080802",
      'WHAT IT IS FOR Expense Agreement 2603TMJH7H',
      'DATES Issued 27 April 2026 Due —',
      'ITEM EACH QTY AMOUNT',
      'security, waste management EXPENSE GH₵ 2,000.00 1 GH₵ 2,000.00',
      '1 item on this bill. That is everything.',
      'Subtotal GH₵ 2,000.00 Tax GH₵ 0.00 The whole bill GH₵ 2,000.00',
      'STILL OWED GH₵ 2,000.00',
      'HOW THEY MAY PAY Cash',
      'AFTER THE DUE DATE This amount already shows as owed against the '
          'agreement. What changes after the due date is that it counts as '
          'late. Nothing is added on top.',
      'Generated from Rentloop on 7 November 2026',
    ]) {
      expect(r.text, contains(s));
    }
    expect(r.text, isNot(contains('Paid so far')));
  });

  test('the cedi sign is drawn from an embedded font', () async {
    final r = await render(printBill());
    expect(r.text, contains('₵'));
    expect(r.logs.where((l) => l.contains('U+20b5')), isEmpty);
  });

  test('a glyph no embedded font has is reported', () async {
    final r = await render(printBill(lines: [lineItem('漢')]));
    expect(r.logs, contains(contains('U+6f22')));
  });

  test('part-paid shows paid so far', () async {
    final r = await render(
      printBill(
        due: '2026-11-20T00:00:00Z',
        payments: [paidOn(50000, '2026-11-01T00:00:00Z')],
      ),
    );
    expectPdf(r);
    expect(r.text, contains('PART PAID'));
    expect(r.text, contains('Paid so far − GH₵ 500.00'));
    expect(r.text, contains('STILL OWED GH₵ 1,500.00'));
    expect(r.text, contains('Due 20 November 2026'));
    expect(r.text, contains('What changes after 20 November 2026 is'));
  });

  test('paid shows nothing owed', () async {
    final r = await render(
      printBill(
        status: 'PAID',
        rails: ['MOMO', 'BANK_TRANSFER'],
        payments: [paidOn(200000, '2026-11-02T00:00:00Z')],
      ),
    );
    expectPdf(r);
    expect(r.text, contains('PAID'));
    expect(r.text, contains('NOTHING OWED GH₵ 0.00'));
    expect(r.text, contains('HOW THEY MAY PAY Momo Bank Transfer'));
    expect(r.text, contains('NOTHING MORE TO DO This bill is settled'));
  });

  test('late says since when', () async {
    final r = await render(printBill(due: '2026-10-31T00:00:00Z'));
    expectPdf(r);
    expect(r.text, contains('LATE'));
    expect(
      r.text,
      contains('IT IS LATE It has counted as late since 1 November 2026.'),
    );
  });

  test('several rent lines', () async {
    final r = await render(
      printBill(
        contextType: 'LEASE_RENT',
        total: 600000,
        rails: [],
        lines: [
          lineItem('Rent · September', category: 'RENT'),
          lineItem('Rent · October', category: 'RENT'),
          lineItem('Rent · November', category: 'RENT'),
        ],
      ),
    );
    expectPdf(r);
    expect(r.text, contains('Rent Agreement 2603TMJH7H · 3 months of rent'));
    expect(r.text, contains('Rent · October RENT GH₵ 2,000.00 1 GH₵ 2,000.00'));
    expect(
      r.text,
      contains('3 items on this bill, 3 of them rent. That is everything.'),
    );
    expect(r.text, contains('HOW THEY MAY PAY Not set'));
  });

  test('writes a sample when asked', () async {
    final out = Platform.environment['BILL_PDF_SAMPLE'];
    if (out == null) return;
    File(out).writeAsBytesSync(await buildBillPdf(printBill(), now: now));
  });
}
