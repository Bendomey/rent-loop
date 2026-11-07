import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/financial/account_view.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/remove_fee_sheet.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/void_charge_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _bold = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 14.5,
  fontWeight: FontWeight.w600,
  color: RLTokens.ink,
);

const _small = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 12.5,
  color: RLTokens.muted,
);

class LiveChargesCard extends StatefulWidget {
  const LiveChargesCard({
    super.key,
    required this.application,
    required this.detail,
    required this.propertyId,
    required this.canEdit,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final String propertyId;
  final bool canEdit;

  @override
  State<LiveChargesCard> createState() => _LiveChargesCardState();
}

class _LiveChargesCardState extends State<LiveChargesCard> {
  bool _openRent = false;
  bool _showRemoved = false;

  String _money(int minor) =>
      formatPesewas(minor, code: widget.detail.account.currency);

  String _day(String iso) => formatDay(DateTime.parse(iso));

  Future<void> _remove(ChargeModel charge) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    ProviderScope.containerOf(
      context,
    ).read(voidChargeNotifierProvider.notifier).reset();
    showRLSheet(
      context,
      (close) => RemoveFeeSheet(
        charge: charge,
        propertyId: widget.propertyId,
        applicationId: widget.application.id,
        accountId: widget.detail.account.id,
        onClose: close,
      ),
    );
  }

  Future<void> _toggle(bool Function() flip) async {
    await Haptics.vibrate(HapticsType.selection);
    if (mounted) setState(() => flip());
  }

  @override
  Widget build(BuildContext context) {
    final charges = widget.detail.charges;
    final rent = rentRows(charges);
    final fees = feeRows(charges);
    final removed = removedRows(charges);
    final refunds = refundRows(charges);
    final rentTotal = rent.fold<int>(0, (sum, c) => sum + c.amount);

    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What they’re paying',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontWeight: RLTokens.headingWeight,
              fontSize: 20,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Everything owed over the term. We bill it for you as each date '
            'comes up.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          if (rent.isNotEmpty) _rentSummary(rent, rentTotal),
          for (final charge in fees) _feeRow(charge),
          for (final charge in refunds) _refundRow(charge),
          const Divider(height: 24, color: RLTokens.hairline),
          Row(
            children: [
              const Expanded(child: Text('Over the whole term', style: _bold)),
              Text(_money(wholeTermTotal(charges)), style: _bold),
            ],
          ),
          if (removed.isNotEmpty) _removedList(removed),
        ],
      ),
    );
  }

  Widget _rentSummary(List<ChargeModel> rent, int total) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () => _toggle(() => _openRent = !_openRent),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_today_rounded,
                  size: 18,
                  color: RLTokens.inkSoft,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${rent.length} payments · ${_money(total)}',
                        style: _bold,
                      ),
                      Text(
                        'Due ${_day(rent.first.dueDate)} to '
                        '${_day(rent.last.dueDate)}',
                        style: _small,
                      ),
                    ],
                  ),
                ),
                Icon(
                  _openRent
                      ? Icons.expand_less_rounded
                      : Icons.expand_more_rounded,
                  color: RLTokens.muted,
                ),
              ],
            ),
          ),
        ),
        if (_openRent)
          for (final charge in rent)
            Padding(
              padding: const EdgeInsets.fromLTRB(30, 4, 0, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          charge.name,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13.5,
                            color: RLTokens.ink,
                          ),
                        ),
                        Text('due ${_day(charge.dueDate)}', style: _small),
                      ],
                    ),
                  ),
                  Text(_money(charge.amount), style: _bold),
                ],
              ),
            ),
      ],
    );
  }

  Widget _feeRow(ChargeModel charge) {
    final paid = charge.settledAmount >= charge.amount;
    final removable = widget.canEdit && charge.invoicedAmount == 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          const Icon(
            Icons.receipt_long_rounded,
            size: 18,
            color: RLTokens.inkSoft,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(charge.name, style: _bold),
                Text(
                  'One time · ${paid ? 'paid' : 'due ${_day(charge.dueDate)}'}',
                  style: _small,
                ),
              ],
            ),
          ),
          Text(_money(charge.amount), style: _bold),
          if (removable)
            IconButton(
              key: ValueKey('remove-${charge.id}'),
              tooltip: 'Remove ${charge.name}',
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              color: RLTokens.muted,
              onPressed: () => _remove(charge),
            ),
        ],
      ),
    );
  }

  Widget _refundRow(ChargeModel charge) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        const Icon(Icons.undo_rounded, size: 18, color: RLTokens.inkSoft),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(charge.name, style: _bold),
              Text('Refunded · ${_day(charge.dueDate)}', style: _small),
            ],
          ),
        ),
        Text('−${_money(-charge.amount)}', style: _bold),
      ],
    ),
  );

  Widget _removedList(List<ChargeModel> removed) {
    final count = removed.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _toggle(() => _showRemoved = !_showRemoved),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              _showRemoved
                  ? 'Hide removed fees'
                  : 'Show $count removed fee${count == 1 ? '' : 's'}',
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: RLTokens.muted,
              ),
            ),
          ),
        ),
        if (_showRemoved) ...[
          for (final charge in removed)
            Opacity(
              opacity: 0.6,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            charge.name,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 13.5,
                              color: RLTokens.ink,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          Text(charge.voidedReason ?? 'Removed', style: _small),
                        ],
                      ),
                    ),
                    Text(
                      _money(charge.amount),
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13.5,
                        color: RLTokens.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 4),
          const Text(
            'Removed fees stay on the record but are left out of every total. '
            'Fees can’t be edited — remove one and add another.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
        ],
      ],
    );
  }
}
