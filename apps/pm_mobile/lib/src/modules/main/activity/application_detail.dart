// Tenant setup — hub screen.
//
// The hub carries the hero and the "Complete tenant setup" checklist, and each
// checklist row opens its own section page (see application_detail_pages.dart).
// Progress is derived from the fetched application rather than stored, so
// editing a section moves the bar.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_edit_sheets.dart';
import 'package:rentloop_manager/src/modules/main/activity/approve_sheet.dart';
import 'package:rentloop_manager/src/modules/main/activity/cancel_application_sheet.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/financial_page.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:shimmer/shimmer.dart';

class ApplicationDetailScreen extends ConsumerStatefulWidget {
  const ApplicationDetailScreen({
    super.key,
    required this.id,
    this.propertyId,
    this.application,
  });

  final String id;
  final String? propertyId;

  /// Shown while the fetch runs; the fetched application always replaces it.
  final TenantApplicationModel? application;

  @override
  ConsumerState<ApplicationDetailScreen> createState() =>
      _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState
    extends ConsumerState<ApplicationDetailScreen> {
  ApplicationDetailData? _local;

  String? get _propertyId =>
      widget.propertyId ?? widget.application?.propertyId;

  void _update(ApplicationDetailData next) => setState(() => _local = next);

  Future<void> _refresh(String propertyId) async {
    try {
      final provider = applicationDetailProvider(propertyId, widget.id);
      ref.invalidate(provider);
      ref.invalidate(myPropertyRolesProvider);
      await ref.read(provider.future);
    } catch (_) {
      // The error state renders from the provider itself.
    }
  }

  Future<void> _openSection(ApplicationDetailData d, String key) async {
    final propertyId = _propertyId;
    if (propertyId == null) return;
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;

    Widget page(ApplicationDetailData d) => switch (key) {
      'unit' => ApplicationUnitPage(data: d, propertyId: propertyId),
      'movein' => ApplicationMoveInPage(data: d, propertyId: propertyId),
      'financial' => ApplicationFinancialPage(data: d, propertyId: propertyId),
      'docs' => ApplicationDocsPage(
        data: d,
        onChanged: _update,
        readOnly: true,
        propertyId: propertyId,
      ),
      _ => ApplicationTenantPage(data: d, propertyId: propertyId),
    };

    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => page(d)));
  }

  Future<void> _cancel(String propertyId) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final cancelled = await showCancelApplicationSheet(
      context,
      propertyId: propertyId,
      id: widget.id,
    );
    if (cancelled && mounted) Navigator.of(context).pop();
  }

  Future<void> _approve(
    String propertyId,
    ApplicationDetailData d,
    TenantApplicationModel model,
  ) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final lease = await showApproveSheet(
      context,
      propertyId: propertyId,
      id: widget.id,
      tenantName: d.applicant.fullName,
      unitName: d.desiredUnit?.name,
      noDocument: model.leaseAgreementDocumentMode == null,
    );
    if (lease == null || !mounted) return;
    showRLToast(
      ref,
      tone: RLToastTone.success,
      title: '${d.applicant.fullName} has moved in',
    );
    await showWhatsNextSheet(
      context,
      tenantName: d.applicant.fullName,
      propertyId: propertyId,
      leaseId: lease.id,
      tenantId: lease.tenantId,
      leasePending: lease.status.endsWith('Pending'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyId = _propertyId;
    final async = propertyId == null
        ? null
        : ref.watch(applicationDetailProvider(propertyId, widget.id));
    if (propertyId != null) {
      ref.listen(applicationDetailProvider(propertyId, widget.id), (_, next) {
        if (next.hasValue && _local != null) setState(() => _local = null);
      });
    }

    final model = async?.valueOrNull ?? widget.application;
    final roles = ref.watch(myPropertyRolesProvider).valueOrNull;
    final editable = model != null && canEditApplication(model, roles);
    final d =
        _local ??
        (model == null
            ? null
            : ApplicationDetailData.fromApplicationModel(model));
    final settled = model?.financialAccount?.totalSettled ?? 0;

    final showError = d == null && (propertyId == null || async!.hasError);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: d == null ? 'Tenant setup' : '#${d.code}',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: showError
                ? Padding(
                    padding: const EdgeInsets.all(RLTokens.gutter),
                    child: RLSectionError(
                      title: "Couldn't load this tenant setup",
                      onRetry: propertyId == null
                          ? null
                          : () => ref.invalidate(
                              applicationDetailProvider(propertyId, widget.id),
                            ),
                    ),
                  )
                : d == null
                ? const _DetailSkeleton()
                : RefreshIndicator(
                    onRefresh: () => _refresh(propertyId!),
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        4,
                        RLTokens.gutter,
                        24,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (d.approved) ...[
                            const SizedBox(height: 8),
                            const _LeaseCreatedBanner(),
                          ],
                          const SizedBox(height: 8),
                          _HeroCard(data: d),
                          if (d.approved && d.desiredUnit != null) ...[
                            const SizedBox(height: 10),
                            _UnitCard(unit: d.desiredUnit!, data: d),
                          ],
                          const SizedBox(height: 8),
                          _ChecklistCard(
                            data: d,
                            onOpen: (key) => _openSection(d, key),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
          ),
          if (d != null && (editable || d.approved))
            _ActionBar(
              approved: d.approved,
              showApprove: editable,
              approveBlocker: editable
                  ? approveBlocker(model, computeApplicationChecklist(model))
                  : null,
              onApprove: () => _approve(propertyId!, d, model!),
              onCancel: settled > 0 ? null : () => _cancel(propertyId!),
              cancelBlocked: settled > 0,
              onWhatsNext: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  await showWhatsNextSheet(
                    context,
                    tenantName: d.applicant.fullName,
                    propertyId: propertyId,
                  );
                }
              },
            ),
        ],
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

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
      key: const ValueKey('application-detail-skeleton'),
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          12,
          RLTokens.gutter,
          0,
        ),
        child: Column(
          children: [block(110), const SizedBox(height: 14), block(300)],
        ),
      ),
    );
  }
}

// ── Lease created banner (approved state) ────────────────────────────────────

class _LeaseCreatedBanner extends StatelessWidget {
  const _LeaseCreatedBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.successBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromRGBO(27, 158, 92, 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_rounded, size: 20, color: RLTokens.success),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Lease is created',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.success,
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'This tenant setup is approved and can no longer be edited '
                  'here. Head to the tenants page to make changes.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.success,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero ─────────────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.data});
  final ApplicationDetailData data;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '#${data.code}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 12,
                  color: RLTokens.muted,
                ),
              ),
              const Spacer(),
              RLPill(
                data.approved ? 'Moved in' : data.displayStatus,
                tone: data.approved ? RLTone.success : statusTone(data.status),
                large: true,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Tenant setup #${data.code}',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 21,
              color: RLTokens.ink,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Submitted ${data.submittedOn} · by ${data.submittedBy}',
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Unit card (approved state) ───────────────────────────────────────────────

class _UnitCard extends StatelessWidget {
  const _UnitCard({required this.unit, required this.data});
  final ApplicationUnit unit;
  final ApplicationDetailData data;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(RLTokens.rSm),
            ),
            child: const Icon(
              Icons.apartment_rounded,
              size: 22,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unit.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${unitTypeLabel(unit.type)} · '
                  '${formatPesewas(data.financial.rentFee)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          RLPill('Occupied', tone: statusTone('Occupied')),
        ],
      ),
    );
  }
}

// ── Checklist ────────────────────────────────────────────────────────────────

class _ChecklistCard extends StatelessWidget {
  const _ChecklistCard({required this.data, required this.onOpen});
  final ApplicationDetailData data;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final sections = data.checklist.steps;
    return RLCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Complete tenant setup',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 19,
              color: RLTokens.ink,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Fill in the tenant\'s details — tap a step to open it.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 16, 0, 4),
            child: Row(
              children: [
                Text(
                  '${data.progress.round()}%',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 26,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: RLBar(percent: data.progress)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < sections.length; i++)
            _ChecklistRow(
              step: sections[i],
              first: i == 0,
              onTap: () => onOpen(sections[i].section.key),
            ),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({
    required this.step,
    required this.first,
    required this.onTap,
  });

  final ChecklistStep step;
  final bool first;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final done = step.isSatisfied;
    final hasItems = step.hasItems;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          border: first
              ? null
              : const Border(top: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: done ? RLTokens.crimson : RLTokens.surface,
                borderRadius: BorderRadius.circular(7),
                border: done
                    ? null
                    : Border.all(color: RLTokens.hairline, width: 1.5),
              ),
              child: done
                  ? const Icon(
                      Icons.check_rounded,
                      size: 15,
                      color: Colors.white,
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                step.section.label,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15,
                  fontWeight: RLTokens.medium,
                  color: RLTokens.ink,
                ),
              ),
            ),
            if (hasItems) ...[
              _CountBadge(
                text: '${step.doneItems}/${step.totalItems}',
                done: done,
              ),
              const SizedBox(width: 8),
            ],
            const Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: RLTokens.micro,
            ),
          ],
        ),
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.text, required this.done});
  final String text;
  final bool done;

  @override
  Widget build(BuildContext context) {
    final tone = done ? RLTone.success : RLTone.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: tone.bg,
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: RLTokens.fontMono,
          fontSize: 11,
          fontWeight: RLTokens.bold,
          color: tone.fg,
        ),
      ),
    );
  }
}

// ── Sticky action bar ────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.approved,
    required this.showApprove,
    required this.approveBlocker,
    required this.onApprove,
    required this.onCancel,
    required this.cancelBlocked,
    required this.onWhatsNext,
  });

  final bool approved;
  final bool showApprove;
  final String? approveBlocker;
  final VoidCallback onApprove;
  final VoidCallback? onCancel;
  final bool cancelBlocked;
  final VoidCallback onWhatsNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        RLTokens.gutter,
        12,
        RLTokens.gutter,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: approved
          ? RLBtn(
              label: "What's next?",
              kind: RLBtnKind.primary,
              icon: Icons.bolt_rounded,
              full: true,
              onPressed: onWhatsNext,
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (showApprove) ...[
                  RLBtn(
                    label: 'Approve & move in',
                    kind: RLBtnKind.primary,
                    full: true,
                    onPressed: approveBlocker == null ? onApprove : null,
                  ),
                  if (approveBlocker != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        approveBlocker!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ),
                  const SizedBox(height: 10),
                ],
                RLBtn(
                  label: 'Cancel tenant setup',
                  kind: RLBtnKind.danger,
                  full: true,
                  onPressed: onCancel,
                ),
                if (cancelBlocked)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'Payments were recorded — refund them first',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        color: RLTokens.muted,
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
