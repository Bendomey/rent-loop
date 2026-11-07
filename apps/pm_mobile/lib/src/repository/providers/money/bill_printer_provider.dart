import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/lib/financial/bill_pdf.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

part 'bill_printer_provider.g.dart';

typedef BillPrinter = Future<void> Function(InvoiceModel bill);

/// Opens the system print sheet, which on iOS also offers save and share.
/// The PDF is built before the sheet opens so a build failure reaches the
/// caller instead of dying inside the platform's layout callback.
@riverpod
BillPrinter billPrinter(BillPrinterRef ref) => (bill) async {
  final bytes = await buildBillPdf(bill, now: DateTime.now());
  await Printing.layoutPdf(
    name: bill.code,
    format: PdfPageFormat.a4,
    onLayout: (_) async => bytes,
  );
};
