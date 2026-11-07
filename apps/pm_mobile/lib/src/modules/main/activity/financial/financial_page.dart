import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/lib/financial/financial_mode.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/add_fee_sheet.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/live_view.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/record_payment_sheet.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/refund_sheet.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/setup_flow.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/add_fee_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/record_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/refund_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/start_billing_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:shimmer/shimmer.dart';

class ApplicationFinancialPage extends ConsumerWidget {
  const ApplicationFinancialPage({
    super.key,
    required this.data,
    required this.propertyId,
  });

  final ApplicationDetailData data;
  final String propertyId;

  Future<void> _refresh(WidgetRef ref, String? accountId) async {
    ref.invalidate(applicationDetailProvider(propertyId, data.id));
    if (accountId != null) {
      ref.invalidate(financialAccountProvider(propertyId, accountId));
    }
    try {
      await ref.read(applicationDetailProvider(propertyId, data.id).future);
    } catch (_) {
      // The error state renders from the provider itself.
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(applicationDetailProvider(propertyId, data.id));
    final application = detail.valueOrNull;
    final accountId = application?.financialAccount?.id;
    final account = accountId == null
        ? null
        : ref.watch(financialAccountProvider(propertyId, accountId));
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final billing = ref.watch(startBillingNotifierProvider);

    final failed = application == null
        ? detail.hasError
        : account != null && account.hasError && !account.hasValue;
    final loading =
        !failed &&
        (application == null || (account != null && !account.hasValue));

    Widget body;
    if (failed) {
      body = RLSectionError(
        title: "Couldn't load this page",
        onRetry: () => _refresh(ref, accountId),
      );
    } else if (loading) {
      body = const _FinancialSkeleton();
    } else {
      body = _Body(
        application: application!,
        account: account?.valueOrNull,
        canEdit: canEditApplication(application, roles),
        propertyId: propertyId,
        data: data,
        billing: billing,
      );
    }

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Rent & payments',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _refresh(ref, accountId),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  RLTokens.gutter,
                  4,
                  RLTokens.gutter,
                  32,
                ),
                child: body,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.application,
    required this.account,
    required this.canEdit,
    required this.propertyId,
    required this.data,
    required this.billing,
  });

  final TenantApplicationModel application;
  final FinancialAccountDetailModel? account;
  final bool canEdit;
  final String propertyId;
  final ApplicationDetailData data;
  final StartBillingState billing;

  @override
  Widget build(BuildContext context) {
    final mode = resolveFinancialMode(application, account);
    final name = application.firstName ?? 'the tenant';

    final view = switch (mode) {
      FinancialMode.blocked => _MoveInGate(
        name: name,
        onOpen: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (!context.mounted) return;
          await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  ApplicationMoveInPage(data: data, propertyId: propertyId),
            ),
          );
        },
      ),
      FinancialMode.setup =>
        canEdit
            ? FinancialSetupFlow(
                application: application,
                propertyId: propertyId,
                leadDays: account?.account.autoIssueDaysBefore ?? 5,
              )
            : const _Muted("Billing hasn't been set up yet."),
      _ when account != null => FinancialLiveView(
        application: application,
        detail: account!,
        propertyId: propertyId,
        mode: mode,
        canEdit: canEdit,
        onRecordPayment: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (!context.mounted) return;
          ProviderScope.containerOf(
            context,
          ).read(recordPaymentNotifierProvider.notifier).reset();
          showRLSheet(
            context,
            (close) => RecordPaymentSheet(
              application: application,
              detail: account!,
              propertyId: propertyId,
              onClose: close,
            ),
          );
        },
        onAddFee: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (!context.mounted) return;
          ProviderScope.containerOf(
            context,
          ).read(addFeeNotifierProvider.notifier).reset();
          showRLSheet(
            context,
            (close) => AddFeeSheet(
              application: application,
              propertyId: propertyId,
              accountId: account!.account.id,
              onClose: close,
            ),
          );
        },
        onRefund: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (!context.mounted) return;
          ProviderScope.containerOf(
            context,
          ).read(refundNotifierProvider.notifier).reset();
          showRLSheet(
            context,
            (close) => RefundSheet(
              application: application,
              detail: account!,
              propertyId: propertyId,
              onClose: close,
            ),
          );
        },
      ),
      _ => const _Muted("Billing hasn't been set up yet."),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Subtitle(
          mode: mode,
          name: name,
          manual: account?.account.rentBillingCadence == 'MANUAL',
        ),
        if (billing.status.isFailed() && billing.errorMessage != null)
          _Banner(billing.errorMessage!, RLBannerTone.danger),
        if (billing.status.isSuccess() && billing.failedFees.isNotEmpty)
          _Banner(
            'Rent is set up, but these fees could not be added: '
            '${billing.failedFees.join(', ')}',
            RLBannerTone.warning,
          ),
        if (billing.status.isSuccess() && billing.policyFailed)
          const _Banner(
            "Couldn't save the billing plan — change it below.",
            RLBannerTone.warning,
          ),
        view,
      ],
    );
  }
}

class _Subtitle extends StatelessWidget {
  const _Subtitle({
    required this.mode,
    required this.name,
    required this.manual,
  });
  final FinancialMode mode;
  final String name;
  final bool manual;

  @override
  Widget build(BuildContext context) {
    final text = switch (mode) {
      FinancialMode.blocked => 'We can’t work out the rent dates yet.',
      FinancialMode.setup =>
        'Decide what $name pays and how often they’re billed. Nothing is sent to them yet.',
      _ when manual => 'Record payments here as they come in.',
      _ => '$name’s bills go out on their own from here.',
    };
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 4, 2, 14),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13.5,
          color: RLTokens.muted,
          height: 1.5,
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner(this.text, this.tone);
  final String text;
  final RLBannerTone tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: RLInlineBanner(
        tone: tone,
        icon: Icons.warning_rounded,
        title: text,
      ),
    );
  }
}

class _Muted extends StatelessWidget {
  const _Muted(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(2),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 14,
          color: RLTokens.muted,
        ),
      ),
    );
  }
}

class _MoveInGate extends StatelessWidget {
  const _MoveInGate({required this.name, required this.onOpen});
  final String name;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.calendar_today_rounded,
            size: 22,
            color: RLTokens.warning,
          ),
          const SizedBox(height: 12),
          const Text(
            'Set the move-in date first',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontWeight: RLTokens.headingWeight,
              fontSize: 20,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'We can’t work out the rent dates until we know when $name moves '
            'in and how long they are staying. Agree that with $name, then '
            'come back — it takes a minute.',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          RLBtn(
            label: 'Set the move-in date',
            kind: RLBtnKind.primary,
            icon: Icons.arrow_forward_rounded,
            full: true,
            onPressed: onOpen,
          ),
        ],
      ),
    );
  }
}

class _FinancialSkeleton extends StatelessWidget {
  const _FinancialSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block(double height) => Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
    );

    return Shimmer.fromColors(
      key: const ValueKey('financial-skeleton'),
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Column(
        children: [block(120), const SizedBox(height: 14), block(260)],
      ),
    );
  }
}
