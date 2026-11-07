import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

// A port of the web portal's printed bill (apps/property-manager/.../invoice/
// state.ts, sheet.tsx and index.tsx). Keep the copy in step with those files.

enum BillStateKey { draft, open, part, late, paid, void_ }

enum BillTone { zinc, amber, crimson, green }

class BillState {
  const BillState({
    required this.key,
    required this.stamp,
    required this.tone,
    required this.headline,
    required this.detail,
  });

  final BillStateKey key;
  final String stamp;
  final BillTone tone;
  final String headline;
  final String detail;
}

const _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/// `27 April 2026`, read in UTC like the rest of the app's dates.
String billSheetDate(DateTime date) {
  final d = date.toUtc();
  return '${d.day} ${_months[d.month - 1]} ${d.year}';
}

DateTime _day(DateTime d) {
  final u = d.toUtc();
  return DateTime.utc(u.year, u.month, u.day);
}

String _daysAgo(int days) => days == 1 ? '1 day ago' : '$days days ago';

String _dayWord(DateTime date, DateTime now) {
  final days = _day(date).difference(_day(now)).inDays;
  if (days == 0) return 'today';
  if (days == 1) return 'tomorrow';
  if (days == -1) return 'yesterday';
  if (days > 1) return 'in $days days';
  return '${-days} days ago';
}

String payerTypeLabel(String payerType) => switch (payerType) {
  'TENANT' => 'Tenant',
  'TENANT_APPLICATION' => 'Tenant',
  'PROPERTY_OWNER' => 'Owner',
  _ => payerType,
};

String billKindLabel(String contextType) => switch (contextType) {
  'TENANT_APPLICATION' => 'Move-in',
  'LEASE_RENT' => 'Rent',
  'MAINTENANCE' => 'Repair',
  'MAINTENANCE_EXPENSE' => 'Repair cost',
  'SAAS_FEE' => 'Platform',
  'GENERAL_EXPENSE' => 'Expense',
  _ => contextType,
};

String paymentRailLabel(String rail) => switch (rail) {
  'CARD' => 'Credit Card',
  'BANK_TRANSFER' => 'Bank Transfer',
  'OFFLINE' => 'Cash',
  'MOMO' => 'Momo',
  _ => rail,
};

/// The full name the sheet prints, other names included; falls back to the
/// applicant on bills raised during tenant setup, which have no lease yet.
String? billPayerFullName(InvoiceModel b) {
  final t = b.payerLease?.tenant;
  if (t != null) {
    final name = [
      t.firstName,
      t.otherNames ?? '',
      t.lastName,
    ].where((p) => p.trim().isNotEmpty).join(' ');
    if (name.isNotEmpty) return name;
  }
  final a = b.applicant;
  if (a != null) {
    final name = [
      a.firstName,
      a.lastName,
    ].where((p) => p.trim().isNotEmpty).join(' ');
    if (name.isNotEmpty) return name;
  }
  return null;
}

DateTime? _parse(String? iso) => iso == null ? null : DateTime.tryParse(iso);

BillState deriveBillState(InvoiceModel b, DateTime now, {String? payerName}) {
  final who = (payerName ?? '').isNotEmpty
      ? payerName!
      : payerTypeLabel(b.payerType);
  String money(int pesewas) => formatPesewas(pesewas, code: b.currency);
  final paid = billPaid(b);
  final owed = b.totalAmount - paid;
  final due = _parse(b.dueDate);
  final dueDate = due == null ? null : billSheetDate(due);
  final lateBy = due == null ? 0 : _day(now).difference(_day(due)).inDays;
  final overdue = lateBy > 0;

  if (b.status == 'VOID') {
    final reason = b.voidedReason ?? '';
    return BillState(
      key: BillStateKey.void_,
      stamp: 'Cancelled',
      tone: BillTone.zinc,
      headline: 'This bill was cancelled.',
      detail: reason.isNotEmpty
          ? reason
          : 'It no longer counts toward anything that is owed.',
    );
  }

  if (b.status == 'DRAFT') {
    return const BillState(
      key: BillStateKey.draft,
      stamp: 'Draft',
      tone: BillTone.zinc,
      headline: 'This bill is still a draft.',
      detail: 'It has not been sent. Nothing is owed on it until you issue it.',
    );
  }

  if (owed <= 0 || b.status == 'PAID') {
    final last = _lastSuccessfulAt(b);
    return BillState(
      key: BillStateKey.paid,
      stamp: 'Paid',
      tone: BillTone.green,
      headline:
          '$who has paid this bill in full — all ${money(b.totalAmount)}.',
      detail: last != null
          ? 'The last of it came in on ${billSheetDate(last)}. Nothing is owed on this bill.'
          : 'Nothing is owed on this bill.',
    );
  }

  if (paid > 0) {
    return BillState(
      key: overdue ? BillStateKey.late : BillStateKey.part,
      stamp: overdue ? 'Part paid, late' : 'Part paid',
      tone: overdue ? BillTone.crimson : BillTone.amber,
      headline: '$who still owes ${money(owed)} of ${money(b.totalAmount)}.',
      detail: overdue && dueDate != null
          ? '${money(paid)} has been paid so far, and the rest was due $dueDate — ${_daysAgo(lateBy)}.'
          : dueDate != null
          ? '${money(paid)} paid so far. The rest is due $dueDate, ${_dayWord(due!, now)}.'
          : '${money(paid)} paid so far.',
    );
  }

  if (overdue && dueDate != null) {
    return BillState(
      key: BillStateKey.late,
      stamp: 'Late',
      tone: BillTone.crimson,
      headline:
          '$who still owes ${money(owed)} — it was due $dueDate, ${_daysAgo(lateBy)}.',
      detail: 'Nothing has been paid against this bill yet.',
    );
  }

  final issued = _parse(b.issuedAt);
  return BillState(
    key: BillStateKey.open,
    stamp: 'Not paid yet',
    tone: BillTone.zinc,
    headline: dueDate != null
        ? '$who owes ${money(owed)}, due $dueDate — ${_dayWord(due!, now)}.'
        : '$who owes ${money(owed)}.',
    detail: issued != null
        ? 'Issued ${billSheetDate(issued)}. Nothing has been paid against it yet.'
        : 'Nothing has been paid against it yet.',
  );
}

DateTime? _lastSuccessfulAt(InvoiceModel b) {
  final times = [
    for (final p in b.payments)
      if (p.status == 'SUCCESSFUL')
        (
          sort: _parse(p.successfulAt ?? p.createdAt),
          at: _parse(p.successfulAt),
        ),
  ]..sort((x, y) => (x.sort ?? DateTime(0)).compareTo(y.sort ?? DateTime(0)));
  return times.isEmpty ? null : times.last.at;
}

class BillSheetLine {
  const BillSheetLine({
    required this.label,
    required this.category,
    required this.each,
    required this.quantity,
    required this.amount,
  });

  final String label;
  final String category;
  final String each;
  final String quantity;
  final String amount;
}

/// Every string the printed bill shows, worked out once so the PDF layout
/// only has to place them.
class BillSheet {
  const BillSheet({
    required this.state,
    required this.propertyName,
    required this.unitLabel,
    required this.code,
    required this.payerName,
    required this.payerMeta,
    required this.payerPhone,
    required this.kind,
    required this.agreementLine,
    required this.issued,
    required this.due,
    required this.dueIsAlert,
    required this.lines,
    required this.itemsNote,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.paidSoFar,
    required this.owedLabel,
    required this.owed,
    required this.owedIsAlert,
    required this.rails,
    required this.termsLabel,
    required this.terms,
    required this.generated,
  });

  final BillState state;
  final String propertyName;
  final String? unitLabel;
  final String code;
  final String payerName;
  final String payerMeta;
  final String? payerPhone;
  final String kind;
  final String? agreementLine;
  final String issued;
  final String due;
  final bool dueIsAlert;
  final List<BillSheetLine> lines;
  final String itemsNote;
  final String subtotal;
  final String tax;
  final String total;

  /// `− GH₵ 1,000.00`, or null when nothing has been paid.
  final String? paidSoFar;
  final String owedLabel;
  final String owed;
  final bool owedIsAlert;

  /// Empty when the bill names no rails; the sheet then prints "Not set".
  final List<String> rails;
  final String termsLabel;
  final String terms;
  final String generated;
}

BillSheet billSheetOf(InvoiceModel b, DateTime now) {
  String money(int pesewas) => formatPesewas(pesewas, code: b.currency);
  final fullName = billPayerFullName(b);
  final state = deriveBillState(b, now, payerName: fullName?.split(' ').first);
  final paid = billPaid(b);
  final owed = b.totalAmount - paid;
  final unit = b.payerLease?.unit;
  final blockName = unit?.propertyBlock?.name ?? '';
  final unitLabel = unit == null
      ? null
      : [
          if (blockName.isNotEmpty) '$blockName block',
          if (unit.name.isNotEmpty) unit.name,
        ].join(' · ');
  final rentCount = b.lineItems.where((i) => i.category == 'RENT').length;
  final leaseCode = b.payerLease?.code ?? '';
  final due = _parse(b.dueDate);
  final issued = _parse(b.issuedAt);
  final itemCount = b.lineItems.length;
  final phone = b.payerLease?.tenant?.phone ?? '';

  final terms = switch (state.key) {
    BillStateKey.paid =>
      'This bill is settled and closed. It stays here as the record of what was paid — nothing further is added to it.',
    BillStateKey.draft =>
      'It has not been sent. Issue it and the amount becomes owed against the agreement.',
    BillStateKey.void_ => state.detail,
    BillStateKey.late =>
      'It has counted as late since ${billSheetDate(_day(due!).add(const Duration(days: 1)))}. Nothing has been added on top — no late fee sits on this bill.',
    _ =>
      'This amount already shows as owed against the agreement. What changes after ${due != null ? billSheetDate(due) : 'the due date'} is that it counts as late. Nothing is added on top.',
  };

  return BillSheet(
    state: state,
    propertyName: (b.property?.name ?? '').isNotEmpty
        ? b.property!.name
        : 'Property',
    unitLabel: (unitLabel ?? '').isEmpty ? null : unitLabel,
    code: b.code,
    payerName: fullName ?? '—',
    payerMeta: [
      payerTypeLabel(b.payerType),
      unit?.name ?? '',
    ].where((p) => p.isNotEmpty).join(' · '),
    payerPhone: phone.isEmpty ? null : phone,
    kind: billKindLabel(b.contextType),
    agreementLine: leaseCode.isEmpty
        ? null
        : 'Agreement $leaseCode'
              '${rentCount > 0 ? ' · ${rentCount == 1 ? '1 month of rent' : '$rentCount months of rent'}' : ''}',
    issued: issued != null ? billSheetDate(issued) : 'Not issued',
    due: due != null ? billSheetDate(due) : '—',
    dueIsAlert:
        state.key == BillStateKey.late || state.key == BillStateKey.part,
    lines: [
      for (final i in b.lineItems)
        BillSheetLine(
          label: i.label,
          category: i.category,
          each: money(i.unitAmount),
          quantity: '${i.quantity}',
          amount: money(i.totalAmount),
        ),
    ],
    itemsNote:
        '$itemCount ${itemCount == 1 ? 'item' : 'items'} on this bill'
        '${rentCount > 1 ? ', $rentCount of them rent' : ''}. That is everything.',
    subtotal: money(b.subTotal ?? b.totalAmount - b.taxes),
    tax: money(b.taxes),
    total: money(b.totalAmount),
    paidSoFar: paid > 0 ? '− ${money(paid)}' : null,
    owedLabel: owed > 0 ? 'Still owed' : 'Nothing owed',
    owed: money(owed),
    owedIsAlert: owed > 0,
    rails: [for (final r in b.allowedPaymentRails) paymentRailLabel(r)],
    termsLabel: switch (state.key) {
      BillStateKey.paid => 'Nothing more to do',
      BillStateKey.late => 'It is late',
      _ => 'After the due date',
    },
    terms: terms,
    generated: 'Generated from Rentloop on ${billSheetDate(now)}',
  );
}
