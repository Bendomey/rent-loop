import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

int billPaid(InvoiceModel b) => b.payments
    .where((p) => p.status == 'SUCCESSFUL')
    .fold(0, (sum, p) => sum + p.amount);

int billRemaining(InvoiceModel b) {
  final left = b.totalAmount - billPaid(b);
  return left < 0 ? 0 : left;
}

List<InvoicePaymentModel> awaitingConfirmation(InvoiceModel b) => [
  for (final p in b.payments)
    if (p.status == 'PENDING' && p.rail == 'OFFLINE') p,
];

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

int? _daysLate(InvoiceModel b, DateTime now) {
  final due = b.dueDate == null ? null : DateTime.tryParse(b.dueDate!);
  if (due == null) return null;
  return _day(now).difference(_day(due.toLocal())).inDays;
}

bool isOverdue(InvoiceModel b, DateTime now) {
  final late = _daysLate(b, now);
  return late != null && late > 0 && billRemaining(b) > 0;
}

String billDueLabel(InvoiceModel b, DateTime now) {
  if (billRemaining(b) <= 0) return 'Paid';
  final late = _daysLate(b, now);
  if (late == null) return 'Not paid yet';
  if (late > 0) return '$late ${late == 1 ? 'day' : 'days'} late';
  if (late == 0) return 'Due today';
  return 'Due in ${-late} ${late == -1 ? 'day' : 'days'}';
}

String billHeadline(InvoiceModel b, String name) {
  final who = name.trim().isEmpty ? 'The tenant' : name.trim();
  final remaining = billRemaining(b);
  if (remaining <= 0) return '$who has paid this bill in full.';
  final left = formatPesewas(remaining, code: b.currency);
  final total = formatPesewas(b.totalAmount, code: b.currency);
  return '$who still owes $left of $total.';
}

String payerName(InvoiceModel b) {
  final t = b.payerLease?.tenant;
  final a = b.applicant;
  final tenant = t == null ? '' : '${t.firstName} ${t.lastName}'.trim();
  final applicant = a == null ? '' : '${a.firstName} ${a.lastName}'.trim();
  final name = tenant.isNotEmpty ? tenant : applicant;
  return name.isEmpty ? 'Tenant' : name;
}
