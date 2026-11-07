import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import 'package:rentloop_manager/src/lib/financial/bill_sheet.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

const _crimson = PdfColor.fromInt(0xFFE11D48);
const _ink = PdfColor.fromInt(0xFF18181B);
const _muted = PdfColor.fromInt(0xFF71717A);
const _rule = PdfColor.fromInt(0xFF52525B);
const _border = PdfColor.fromInt(0xFFE4E4E7);
const _green = PdfColor.fromInt(0xFF059669);
const _amber = PdfColor.fromInt(0xFFD97706);

class BillPdfFonts {
  const BillPdfFonts({
    required this.body,
    required this.medium,
    required this.semibold,
    required this.bold,
    required this.mono,
  });

  final pw.Font body;
  final pw.Font medium;
  final pw.Font semibold;
  final pw.Font bold;
  final pw.Font mono;
}

Future<BillPdfFonts>? _fonts;

Future<pw.Font> _load(String asset) async =>
    pw.Font.ttf(await rootBundle.load(asset));

Future<BillPdfFonts> _loadFonts() async => BillPdfFonts(
  body: await _load('assets/fonts/Inter[opsz,wght].ttf'),
  medium: await _load('assets/fonts/Geist-Medium.ttf'),
  semibold: await _load('assets/fonts/Geist-SemiBold.ttf'),
  bold: await _load('assets/fonts/Geist-Bold.ttf'),
  mono: await _load('assets/fonts/JetBrainsMono[wght].ttf'),
);

/// The printed bill as A4 PDF bytes, laid out like the web portal's print.
/// [compress] is off only in tests, so the content streams stay readable.
Future<Uint8List> buildBillPdf(
  InvoiceModel bill, {
  required DateTime now,
  bool compress = true,
}) async {
  final fonts = await (_fonts ??= _loadFonts());
  final sheet = billSheetOf(bill, now);
  final doc = pw.Document(
    compress: compress,
    title: bill.code,
    author: 'Rentloop',
    theme: pw.ThemeData.withFont(
      base: fonts.body,
      bold: fonts.bold,
      fontFallback: [fonts.body],
    ),
  );
  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(32),
      build: (_) => pw.Align(
        alignment: pw.Alignment.topCenter,
        child: _BillPage(sheet, fonts),
      ),
    ),
  );
  return doc.save();
}

class _BillPage extends pw.StatelessWidget {
  _BillPage(this.sheet, this.f);

  final BillSheet sheet;
  final BillPdfFonts f;

  pw.TextStyle get _body =>
      pw.TextStyle(font: f.body, fontSize: 10, color: _ink, lineSpacing: 4);

  pw.TextStyle get _mutedText => _body.copyWith(color: _muted);

  pw.TextStyle get _strong => pw.TextStyle(
    font: f.medium,
    fontSize: 10.5,
    color: _ink,
    fontFallback: [f.body],
  );

  pw.Widget _label(String text) => pw.Text(
    text.toUpperCase(),
    style: pw.TextStyle(
      font: f.bold,
      fontSize: 7,
      color: _muted,
      letterSpacing: 1.3,
    ),
  );

  @override
  pw.Widget build(pw.Context context) {
    return pw.Container(
      decoration: pw.BoxDecoration(border: pw.Border.all(color: _border)),
      child: pw.Column(
        mainAxisSize: pw.MainAxisSize.min,
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          pw.Container(height: 3, color: _crimson),
          pw.Padding(
            padding: const pw.EdgeInsets.fromLTRB(36, 30, 36, 30),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                _header(),
                _parties(),
                pw.SizedBox(height: 18),
                _items(),
                pw.SizedBox(height: 8),
                pw.Text(
                  sheet.itemsNote,
                  style: _mutedText.copyWith(fontSize: 8),
                ),
                pw.SizedBox(height: 14),
                _totals(),
                pw.SizedBox(height: 22),
                _footer(),
                pw.SizedBox(height: 24),
                pw.Text(
                  sheet.generated,
                  style: _mutedText.copyWith(fontSize: 8),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _header() {
    final heading = pw.TextStyle(font: f.semibold, fontSize: 19, color: _ink);
    final tone = switch (sheet.state.tone) {
      BillTone.green => (fg: _green, border: PdfColor.fromInt(0xFF9FE3CD)),
      BillTone.crimson => (fg: _crimson, border: PdfColor.fromInt(0xFFFBB2BF)),
      BillTone.amber => (fg: _amber, border: PdfColor.fromInt(0xFFFDD89F)),
      BillTone.zinc => (fg: _muted, border: _border),
    };
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 18),
      decoration: const pw.BoxDecoration(
        border: pw.Border(bottom: pw.BorderSide(color: _rule, width: 1.6)),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.RichText(
                  text: pw.TextSpan(
                    style: heading,
                    children: [
                      const pw.TextSpan(text: 'rent'),
                      pw.TextSpan(
                        text: 'loop',
                        style: heading.copyWith(color: _crimson),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 10),
                pw.Text(sheet.propertyName, style: _mutedText),
                if (sheet.unitLabel != null)
                  pw.Text(sheet.unitLabel!, style: _mutedText),
              ],
            ),
          ),
          pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Text('Bill', style: heading),
              pw.SizedBox(height: 4),
              pw.Text(
                sheet.code,
                style: pw.TextStyle(font: f.mono, fontSize: 9.5, color: _muted),
              ),
              pw.SizedBox(height: 10),
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 4,
                ),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: tone.border, width: 1.4),
                  borderRadius: pw.BorderRadius.circular(3),
                ),
                child: pw.Text(
                  sheet.state.stamp.toUpperCase(),
                  style: pw.TextStyle(
                    font: f.bold,
                    fontSize: 7.5,
                    color: tone.fg,
                    letterSpacing: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  pw.Widget _parties() {
    pw.Widget dateRow(String label, String value, {bool alert = false}) =>
        pw.Padding(
          padding: const pw.EdgeInsets.only(bottom: 4),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(label, style: _mutedText),
              pw.Text(
                value,
                style: _strong.copyWith(
                  fontSize: 10,
                  color: alert ? _crimson : _ink,
                ),
              ),
            ],
          ),
        );

    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 18),
      decoration: const pw.BoxDecoration(
        border: pw.Border(bottom: pw.BorderSide(color: _border)),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _label('Billed to'),
                pw.SizedBox(height: 6),
                pw.Text(sheet.payerName, style: _strong),
                pw.SizedBox(height: 3),
                if (sheet.payerMeta.isNotEmpty)
                  pw.Text(sheet.payerMeta, style: _mutedText),
                if (sheet.payerPhone != null)
                  pw.Text(sheet.payerPhone!, style: _mutedText),
              ],
            ),
          ),
          pw.SizedBox(width: 18),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _label('What it is for'),
                pw.SizedBox(height: 6),
                pw.Text(sheet.kind, style: _strong),
                if (sheet.agreementLine != null) ...[
                  pw.SizedBox(height: 3),
                  pw.Text(sheet.agreementLine!, style: _mutedText),
                ],
              ],
            ),
          ),
          pw.SizedBox(width: 18),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _label('Dates'),
                pw.SizedBox(height: 6),
                dateRow('Issued', sheet.issued),
                dateRow('Due', sheet.due, alert: sheet.dueIsAlert),
              ],
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _items() {
    pw.Widget head(String text, {bool right = true}) => pw.Container(
      alignment: right ? pw.Alignment.centerRight : pw.Alignment.centerLeft,
      padding: const pw.EdgeInsets.symmetric(vertical: 6),
      child: _label(text),
    );
    pw.Widget cell(pw.Widget child, {bool right = true}) => pw.Container(
      alignment: right ? pw.Alignment.topRight : pw.Alignment.topLeft,
      padding: const pw.EdgeInsets.symmetric(vertical: 8),
      child: child,
    );

    return pw.Table(
      columnWidths: const {
        0: pw.FlexColumnWidth(4),
        1: pw.FlexColumnWidth(2.2),
        2: pw.FlexColumnWidth(1),
        3: pw.FlexColumnWidth(2.2),
      },
      border: const pw.TableBorder(
        horizontalInside: pw.BorderSide(color: _border),
        bottom: pw.BorderSide(color: _border),
      ),
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(
            border: pw.Border(bottom: pw.BorderSide(color: _rule)),
          ),
          children: [
            head('Item', right: false),
            head('Each'),
            head('Qty'),
            head('Amount'),
          ],
        ),
        for (final line in sheet.lines)
          pw.TableRow(
            children: [
              cell(
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(line.label, style: _strong.copyWith(fontSize: 10)),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      line.category,
                      style: _mutedText.copyWith(fontSize: 7.5),
                    ),
                  ],
                ),
                right: false,
              ),
              cell(pw.Text(line.each, style: _mutedText)),
              cell(pw.Text(line.quantity, style: _mutedText)),
              cell(pw.Text(line.amount, style: _strong.copyWith(fontSize: 10))),
            ],
          ),
      ],
    );
  }

  pw.Widget _totals() {
    pw.Widget row(
      String label,
      String value, {
      pw.TextStyle? style,
      pw.TextStyle? valueStyle,
      pw.BoxBorder? border,
    }) => pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      decoration: pw.BoxDecoration(border: border),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: style ?? _mutedText),
          pw.Text(value, style: valueStyle ?? style ?? _mutedText),
        ],
      ),
    );
    final boldStyle = pw.TextStyle(
      font: f.bold,
      fontSize: 10,
      color: _ink,
      fontFallback: [f.body],
    );
    final alert = sheet.owedIsAlert;

    return pw.Row(
      children: [
        pw.Spacer(),
        pw.SizedBox(
          width: 225,
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              row('Subtotal', sheet.subtotal),
              row('Tax', sheet.tax),
              row(
                'The whole bill',
                sheet.total,
                style: boldStyle,
                border: const pw.Border(top: pw.BorderSide(color: _rule)),
              ),
              if (sheet.paidSoFar != null)
                row(
                  'Paid so far',
                  sheet.paidSoFar!,
                  valueStyle: _body.copyWith(color: _green),
                  border: const pw.Border(top: pw.BorderSide(color: _border)),
                ),
              pw.SizedBox(height: 8),
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: pw.BoxDecoration(
                  color: alert
                      ? const PdfColor.fromInt(0xFFFEECEF)
                      : const PdfColor.fromInt(0xFFE7F8F2),
                  border: pw.Border.all(
                    color: alert
                        ? const PdfColor.fromInt(0xFFFCC5CF)
                        : const PdfColor.fromInt(0xFFB7EAD9),
                  ),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      sheet.owedLabel.toUpperCase(),
                      style: pw.TextStyle(
                        font: f.bold,
                        fontSize: 7.5,
                        color: alert ? _crimson : _green,
                        letterSpacing: 1.3,
                      ),
                    ),
                    pw.Text(sheet.owed, style: _strong.copyWith(fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  pw.Widget _footer() {
    return pw.Container(
      padding: const pw.EdgeInsets.only(top: 18),
      decoration: const pw.BoxDecoration(
        border: pw.Border(top: pw.BorderSide(color: _border)),
      ),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _label('How they may pay'),
                pw.SizedBox(height: 8),
                if (sheet.rails.isEmpty)
                  pw.Text('Not set', style: _mutedText)
                else
                  pw.Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      for (final rail in sheet.rails)
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: pw.BoxDecoration(
                            border: pw.Border.all(color: _border),
                            borderRadius: pw.BorderRadius.circular(3),
                          ),
                          child: pw.Text(rail, style: _body),
                        ),
                    ],
                  ),
              ],
            ),
          ),
          pw.SizedBox(width: 24),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _label(sheet.termsLabel),
                pw.SizedBox(height: 8),
                pw.Text(sheet.terms, style: _mutedText),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
