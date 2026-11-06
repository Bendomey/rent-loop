import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/financial/bill.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_roles.dart';
import 'package:rentloop_manager/src/modules/main/activity/document_picker.dart';
import 'package:rentloop_manager/src/modules/main/money/record_bill_payment_sheet.dart';
import 'package:rentloop_manager/src/modules/main/money/verify_payment_sheet.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/record_bill_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/verify_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _bodyStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 14,
  color: RLTokens.ink,
);

const _mutedStyle = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 12.5,
  color: RLTokens.muted,
  height: 1.45,
);

class InvoiceDetailScreen extends ConsumerWidget {
  const InvoiceDetailScreen({super.key, required this.id, this.propertyId});

  final String id;
  final String? propertyId;

  Future<void> _refresh(WidgetRef ref) async {
    final pid = propertyId;
    ref.invalidate(myPropertyRolesProvider);
    if (pid == null) return;
    ref.invalidate(billDetailProvider(pid, id));
    try {
      await ref.read(billDetailProvider(pid, id).future);
    } catch (_) {}
  }

  Future<void> _record(
    BuildContext context,
    WidgetRef ref,
    InvoiceModel bill,
  ) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    ref.read(recordBillPaymentNotifierProvider.notifier).reset();
    showRLSheet(
      context,
      (close) => RecordBillPaymentSheet(
        bill: bill,
        propertyId: propertyId!,
        onClose: close,
      ),
    );
  }

  Future<void> _verify(
    BuildContext context,
    WidgetRef ref,
    InvoiceModel bill,
    InvoicePaymentModel payment, {
    required bool declined,
  }) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    ref.read(verifyPaymentNotifierProvider.notifier).reset();
    showRLSheet(
      context,
      (close) => VerifyPaymentSheet(
        bill: bill,
        payment: payment,
        propertyId: propertyId!,
        startDeclined: declined,
        onClose: close,
      ),
    );
  }

  Future<void> _open(WidgetRef ref, Uri url) async {
    await Haptics.vibrate(HapticsType.selection);
    var opened = false;
    try {
      opened = await ref.read(urlOpenerProvider)(url);
    } catch (_) {}
    if (!opened) {
      showRLToast(ref, tone: RLToastTone.error, title: "Couldn't open that.");
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pid = propertyId;
    final detail = pid == null ? null : ref.watch(billDetailProvider(pid, id));
    final bill = detail?.valueOrNull;
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final canManage = bill != null && canManageProperty(roles, pid);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: bill?.code ?? 'Bill',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () => _refresh(ref),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                children: [
                  if (bill != null)
                    ..._content(context, ref, bill, canManage)
                  else if (detail == null || detail.hasError)
                    detail == null
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 40),
                            child: Text(
                              "We couldn't open this bill.",
                              textAlign: TextAlign.center,
                              style: _mutedStyle,
                            ),
                          )
                        : RLSectionError(
                            title: "Couldn't load this bill",
                            onRetry: () => _refresh(ref),
                          )
                  else
                    const _DetailSkeleton(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _content(
    BuildContext context,
    WidgetRef ref,
    InvoiceModel bill,
    bool canManage,
  ) {
    final now = DateTime.now();
    final remaining = billRemaining(bill);
    final tenant = bill.payerLease?.tenant;
    final unit = bill.payerLease?.unit;
    final where = [
      unit?.propertyBlock?.name,
      unit?.name,
    ].whereType<String>().where((v) => v.isNotEmpty).join(' · ');
    final phone = tenant?.phone?.replaceAll(RegExp(r'[^\d+]'), '') ?? '';
    final email = tenant?.email ?? '';
    final successful = [
      for (final p in bill.payments)
        if (p.status == 'SUCCESSFUL') p,
    ];
    final others = [
      for (final p in bill.payments)
        if (p.status == 'PENDING' || p.status == 'FAILED') p,
    ];

    return [
      Text(
        billHeadline(bill, payerName(bill)),
        style: const TextStyle(
          fontFamily: RLTokens.fontSerif,
          fontSize: 22,
          color: RLTokens.ink,
          letterSpacing: -0.3,
          height: 1.25,
        ),
      ),
      const SizedBox(height: 10),
      Row(
        children: [
          RLPill(
            billDueLabel(bill, now),
            tone: isOverdue(bill, now) ? RLTone.danger : RLTone.neutral,
          ),
          const SizedBox(width: 10),
          Text(
            bill.code,
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 11,
              color: RLTokens.mutedSoft,
            ),
          ),
        ],
      ),
      RLLabel("What's on this bill"),
      RLCard(
        child: Column(
          children: [
            for (final item in bill.lineItems)
              _line(
                item.label,
                formatPesewas(item.totalAmount, code: bill.currency),
              ),
            _line(
              'Total',
              formatPesewas(bill.totalAmount, code: bill.currency),
              bold: true,
            ),
          ],
        ),
      ),
      RLLabel('What has been paid'),
      RLCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final p in successful)
              _line(
                [
                  formatDay(
                    DateTime.tryParse(p.successfulAt ?? p.createdAt) ?? now,
                  ),
                  paymentProviderLabel(p.provider),
                  if (p.reference != null && p.reference!.isNotEmpty)
                    p.reference!,
                ].join(' · '),
                formatPesewas(p.amount, code: bill.currency),
              ),
            if (successful.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  '${successful.length} '
                  '${successful.length == 1 ? 'payment' : 'payments'}, '
                  '${formatPesewas(billPaid(bill), code: bill.currency)} in '
                  'all — ${formatPesewas(remaining, code: bill.currency)} to '
                  'go.',
                  style: _mutedStyle,
                ),
              )
            else if (others.isEmpty)
              const Text('Nothing has been paid yet.', style: _mutedStyle),
            for (final p in others)
              _otherPayment(context, ref, bill, p, canManage),
          ],
        ),
      ),
      RLLabel('Who is paying'),
      RLCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              payerName(bill),
              style: _bodyStyle.copyWith(fontWeight: FontWeight.w600),
            ),
            if (where.isNotEmpty) Text(where, style: _mutedStyle),
            if (phone.isNotEmpty) Text(tenant!.phone!, style: _mutedStyle),
            if (email.isNotEmpty) Text(email, style: _mutedStyle),
            if (phone.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: RLBtn(
                      label: 'Call',
                      kind: RLBtnKind.light,
                      full: true,
                      onPressed: () => _open(ref, Uri.parse('tel:$phone')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RLBtn(
                      label: 'WhatsApp',
                      kind: RLBtnKind.light,
                      full: true,
                      onPressed: () => _open(
                        ref,
                        Uri.parse('https://wa.me/${_waDigits(phone)}'),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      if (canManage && remaining > 0) ...[
        const SizedBox(height: 20),
        if (awaitingConfirmation(bill).isNotEmpty)
          const Text(
            'Check the payment the tenant told you about first.',
            style: _mutedStyle,
          )
        else
          RLBtn(
            label: 'They paid — record it',
            full: true,
            onPressed: () => _record(context, ref, bill),
          ),
      ],
    ];
  }

  String _waDigits(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('00')) return digits.substring(2);
    return phone.startsWith('0') ? '233${digits.substring(1)}' : digits;
  }

  Widget _line(String label, String amount, {bool bold = false}) {
    final style = _bodyStyle.copyWith(
      fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(child: Text(label, style: style)),
          const SizedBox(width: 12),
          Text(amount, style: style),
        ],
      ),
    );
  }

  Widget _otherPayment(
    BuildContext context,
    WidgetRef ref,
    InvoiceModel bill,
    InvoicePaymentModel p,
    bool canManage,
  ) {
    final amount = formatPesewas(p.amount, code: bill.currency);
    if (p.status == 'FAILED') {
      return Padding(
        padding: const EdgeInsets.only(top: 10),
        child: Text('Not received · $amount', style: _mutedStyle),
      );
    }
    if (p.rail != 'OFFLINE') {
      return Padding(
        padding: const EdgeInsets.only(top: 10),
        child: Text('Processing · $amount', style: _mutedStyle),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Waiting for you to confirm · $amount',
            style: _bodyStyle.copyWith(
              fontWeight: FontWeight.w600,
              color: RLTokens.warning,
            ),
          ),
          if (canManage) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RLBtn(
                    label: 'Payment received',
                    full: true,
                    onPressed: () =>
                        _verify(context, ref, bill, p, declined: false),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RLBtn(
                    label: 'Not received',
                    kind: RLBtnKind.light,
                    full: true,
                    onPressed: () =>
                        _verify(context, ref, bill, p, declined: true),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block(double h) => Container(
      height: h,
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
    );
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(children: [block(60), block(120), block(120), block(120)]),
    );
  }
}
