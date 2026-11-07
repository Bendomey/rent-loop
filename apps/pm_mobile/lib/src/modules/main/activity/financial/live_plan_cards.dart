import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/financial/account_view.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/lib/financial/financial_text.dart';
import 'package:rentloop_manager/src/lib/financial/schedule.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/billing_policy_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _title = TextStyle(
  fontFamily: RLTokens.fontSerif,
  fontWeight: RLTokens.headingWeight,
  fontSize: 18,
  color: RLTokens.ink,
);

const _body = TextStyle(
  fontFamily: RLTokens.fontSans,
  fontSize: 13.5,
  color: RLTokens.inkSoft,
  height: 1.5,
);

String _planWords(BillingChoice choice, String noun) => switch (choice) {
  BillingChoice.monthly => 'every $noun',
  BillingChoice.quarterly => 'every three months',
  BillingChoice.wholeTerm => 'once, for the whole term',
  BillingChoice.manual => 'only when you send one',
};

class LivePlanCard extends StatelessWidget {
  const LivePlanCard({
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
  Widget build(BuildContext context) {
    final account = detail.account;
    final name = application.firstName ?? 'the tenant';
    final noun = periodNoun(frequencyForApplication(application));
    final choice = choiceForPolicy(
      account.rentBillingCadence,
      account.rentBillingInterval,
    );

    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How the bills go out', style: _title),
          const SizedBox(height: 8),
          Text(
            choice == BillingChoice.manual
                ? 'Nothing goes out on its own — you send $name a bill when '
                      'you want one.'
                : 'We email $name a bill ${_planWords(choice, noun)}, '
                      '${account.autoIssueDaysBefore} days before it’s due.',
            style: _body,
          ),
          if (canEdit) ...[
            const SizedBox(height: 12),
            RLBtn(
              label: 'Change',
              kind: RLBtnKind.light,
              icon: Icons.edit_rounded,
              full: true,
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                ProviderScope.containerOf(
                  context,
                ).read(billingPolicyNotifierProvider.notifier).reset();
                showRLSheet(
                  context,
                  (close) => _PlanSheet(
                    application: application,
                    detail: detail,
                    propertyId: propertyId,
                    current: choice,
                    noun: noun,
                    onClose: close,
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _PlanSheet extends ConsumerWidget {
  const _PlanSheet({
    required this.application,
    required this.detail,
    required this.propertyId,
    required this.current,
    required this.noun,
    required this.onClose,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final String propertyId;
  final BillingChoice current;
  final String noun;
  final VoidCallback onClose;

  String _sub(BillingChoice choice) {
    final currency = detail.account.currency;
    String money(int minor) => formatPesewas(minor, code: currency);
    final unclaimed = detail.charges.where(
      (c) => c.voidedAt == null && c.amount - c.invoicedAmount > 0,
    );
    final rents = unclaimed.where((c) => c.category == 'RENT').toList();
    final fees = unclaimed.where((c) => c.category != 'RENT');
    final feeTotal = fees.fold<int>(
      0,
      (sum, c) => sum + c.amount - c.invoicedAmount,
    );
    final rent = rents.isEmpty
        ? (application.rentFee ?? 0)
        : rents.first.amount;
    final count = rents.length;
    return switch (choice) {
      BillingChoice.monthly =>
        '$count bills · first ${money(rent + feeTotal)}, then ${money(rent)}',
      BillingChoice.quarterly =>
        '${(count / 3).ceil()} bills · first '
            '${money(rent * (count < 3 ? count : 3) + feeTotal)}, '
            'then ${money(rent * 3)}',
      BillingChoice.wholeTerm =>
        '1 bill · ${count + fees.length} payments · '
            '${money(rent * count + feeTotal)}',
      BillingChoice.manual => 'Nothing goes out automatically',
    };
  }

  Future<void> _pick(WidgetRef ref, BillingChoice choice) async {
    if (choice == current) return;
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(billingPolicyNotifierProvider.notifier);
    await notifier.submit(
      propertyId: propertyId,
      applicationId: application.id,
      accountId: detail.account.id,
      choice: choice,
      leadDays: detail.account.autoIssueDaysBefore,
    );
    if (ref.read(billingPolicyNotifierProvider).status.isSuccess()) {
      notifier.reset();
      onClose();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(billingPolicyNotifierProvider);
    final pending = state.status == ApiStatus.pending;
    return RLSheet(
      title: 'How the bills go out',
      desc:
          'The rent is still due on the same day each $noun. This only sets '
          'how often the bill goes out.',
      onClose: onClose,
      footer: RLBtn(
        label: 'Cancel',
        kind: RLBtnKind.light,
        full: true,
        onPressed: onClose,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final choice in BillingChoice.values)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _OptionTile(
                label: billingChoiceLabel(choice, noun),
                sub: _sub(choice),
                selected: choice == current,
                onTap: pending ? null : () => _pick(ref, choice),
              ),
            ),
          if (state.status.isFailed() && state.errorMessage != null)
            Text(
              state.errorMessage!,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.danger,
              ),
            ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.label,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String sub;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(
            color: selected ? RLTokens.crimson : RLTokens.hairline,
            width: selected ? 1.5 : 1,
          ),
          color: selected ? RLTokens.crimsonTint : RLTokens.surface,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LiveRentCard extends StatelessWidget {
  const LiveRentCard({
    super.key,
    required this.application,
    required this.detail,
    required this.propertyId,
    required this.locked,
    required this.canEdit,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel detail;
  final String propertyId;
  final bool locked;
  final bool canEdit;

  int get _rentMinor {
    final rents = rentRows(detail.charges);
    return application.rentFee ?? (rents.isEmpty ? 0 : rents.first.amount);
  }

  @override
  Widget build(BuildContext context) {
    final name = application.firstName ?? 'the tenant';
    final noun = periodNoun(frequencyForApplication(application));
    final rent = formatPesewas(_rentMinor, code: detail.account.currency);

    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Changing the rent', style: _title),
          const SizedBox(height: 8),
          Text(
            locked
                ? 'Rent is fixed now — some of it has already been billed. To '
                      'charge $name something different, add a fee instead.'
                : 'You can still change it — $rent a $noun — until $name’s '
                      'first payment comes in. After that it’s fixed, and '
                      'you’d add a fee instead.',
            style: _body,
          ),
          if (!locked && canEdit) ...[
            const SizedBox(height: 12),
            RLBtn(
              label: 'Change the rent',
              kind: RLBtnKind.light,
              icon: Icons.edit_rounded,
              full: true,
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                ProviderScope.containerOf(
                  context,
                ).read(updateApplicationNotifierProvider.notifier).reset();
                showRLSheet(
                  context,
                  (close) => _RentSheet(
                    applicationId: application.id,
                    propertyId: propertyId,
                    accountId: detail.account.id,
                    rentMinor: _rentMinor,
                    currency: detail.account.currency,
                    onClose: close,
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _RentSheet extends ConsumerStatefulWidget {
  const _RentSheet({
    required this.applicationId,
    required this.propertyId,
    required this.accountId,
    required this.rentMinor,
    required this.currency,
    required this.onClose,
  });

  final String applicationId;
  final String propertyId;
  final String accountId;
  final int rentMinor;
  final String currency;
  final VoidCallback onClose;

  @override
  ConsumerState<_RentSheet> createState() => _RentSheetState();
}

class _RentSheetState extends ConsumerState<_RentSheet> {
  late final _rent = TextEditingController(
    text: widget.rentMinor % 100 == 0
        ? '${widget.rentMinor ~/ 100}'
        : (widget.rentMinor / 100).toStringAsFixed(2),
  );

  @override
  void dispose() {
    _rent.dispose();
    super.dispose();
  }

  int get _minor => cedisToPesewas(
    double.tryParse(_rent.text.replaceAll(',', '').trim()) ?? 0,
  );

  Future<void> _save() async {
    await Haptics.vibrate(HapticsType.medium);
    final notifier = ref.read(updateApplicationNotifierProvider.notifier);
    await notifier.submit(
      propertyId: widget.propertyId,
      id: widget.applicationId,
      patch: {'rent_fee': _minor},
      accountId: widget.accountId,
    );
    if (!mounted) return;
    if (ref.read(updateApplicationNotifierProvider).status.isSuccess()) {
      notifier.reset();
      widget.onClose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(updateApplicationNotifierProvider);
    return RLSheet(
      title: 'Change the rent',
      desc:
          'Saving works the payment dates out again from the new figure. '
          'Fees you added by hand stay where they are.',
      onClose: widget.onClose,
      footer: rlSheetFooter(
        confirmLabel: 'Save the new rent',
        onCancel: widget.onClose,
        enabled: state.status != ApiStatus.pending && _minor > 0,
        onConfirm: _save,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLSheetField(
            label: 'Rent (${currencySymbol(widget.currency)})',
            controller: _rent,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
          ),
          if (state.status.isFailed() && state.errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              state.errorMessage!,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.danger,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
