import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/modules/main/leases/checklist_item_sheet.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/delete_checklist_item_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/submit_checklist_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_checklists_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMM y, h:mm a').format(date.toLocal());
}

/// (category, label) — items are grouped client-side by splitting
/// `description` on `" - "` (mirrors the web modal exactly): the first
/// segment is the category, the rest is the item's own label. Items without
/// a `" - "` fall into "General". This is a UI convention the manager types
/// into a single free-text field — there's no separate category field on
/// the backend.
(String, String) _splitDescription(String description) {
  final parts = description.split(' - ');
  if (parts.length > 1) return (parts.first, parts.sublist(1).join(' - '));
  return ('General', description);
}

// ── Screen ────────────────────────────────────────────────────────────────────

class ChecklistDetailScreen extends ConsumerWidget {
  const ChecklistDetailScreen({
    super.key,
    required this.propertyId,
    required this.leaseId,
    required this.checklistId,
  });
  final String propertyId;
  final String leaseId;
  final String checklistId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checklistsAsync = ref.watch(
      leaseChecklistsProvider(propertyId, leaseId),
    );
    final showSkeleton = !checklistsAsync.hasValue && checklistsAsync.isLoading;
    final showError = checklistsAsync.hasError && !checklistsAsync.hasValue;

    LeaseChecklistModel? checklist;
    for (final c
        in checklistsAsync.valueOrNull ?? const <LeaseChecklistModel>[]) {
      if (c.id == checklistId) {
        checklist = c;
        break;
      }
    }

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: checklist != null
                ? leaseChecklistTypeLabel(checklist.type)
                : 'Inspection Report',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: showSkeleton
                ? const _DetailSkeleton()
                : showError || checklist == null
                ? Padding(
                    padding: const EdgeInsets.all(RLTokens.gutter),
                    child: RLSectionError(
                      onRetry: () => ref.invalidate(
                        leaseChecklistsProvider(propertyId, leaseId),
                      ),
                    ),
                  )
                : RefreshIndicator(
                    color: RLTokens.crimson,
                    onRefresh: () => ref.refresh(
                      leaseChecklistsProvider(propertyId, leaseId).future,
                    ),
                    child: _ChecklistBody(
                      propertyId: propertyId,
                      leaseId: leaseId,
                      checklist: checklist,
                    ),
                  ),
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
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        children: List.generate(
          4,
          (_) => Container(
            height: 64,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _ChecklistBody extends ConsumerWidget {
  const _ChecklistBody({
    required this.propertyId,
    required this.leaseId,
    required this.checklist,
  });
  final String propertyId;
  final String leaseId;
  final LeaseChecklistModel checklist;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = checklist.items ?? const [];
    final acknowledgments = checklist.acknowledgments ?? const [];
    final editable = isChecklistEditable(checklist.status);
    final hasPending = items.any((i) => i.status == 'PENDING');
    final statusLabel = leaseChecklistStatusLabel(checklist.status);

    final grouped = <String, List<LeaseChecklistItemModel>>{};
    for (final item in items) {
      final (category, _) = _splitDescription(item.description);
      grouped.putIfAbsent(category, () => []).add(item);
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        // Header card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        RLPill(
                          statusLabel,
                          tone: leaseChecklistStatusTone(checklist.status),
                        ),
                        if (checklist.round > 1) ...[
                          const SizedBox(width: 6),
                          RLPill(
                            'Round ${checklist.round}',
                            tone: RLTone.neutral,
                          ),
                        ],
                      ],
                    ),
                    if (checklist.status != 'DRAFT' &&
                        checklist.submittedAt != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Submitted ${_formatDate(checklist.submittedAt)}',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              border: Border.all(color: RLTokens.hairline),
            ),
            child: Center(
              child: Column(
                children: [
                  const Icon(
                    Icons.checklist_rounded,
                    size: 26,
                    color: RLTokens.mutedSoft,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No items yet.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...grouped.entries.map(
            (e) => _CategorySection(
              category: e.key,
              items: e.value,
              editable: editable,
              propertyId: propertyId,
              leaseId: leaseId,
              checklistId: checklist.id,
            ),
          ),

        if (editable) ...[
          const SizedBox(height: 4),
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (!context.mounted) return;
              final saved = await showChecklistItemSheet(
                context: context,
                propertyId: propertyId,
                leaseId: leaseId,
                checklistId: checklist.id,
              );
              if (saved == true) {
                ref.invalidate(leaseChecklistsProvider(propertyId, leaseId));
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(color: RLTokens.hairline),
                borderRadius: BorderRadius.circular(RLTokens.rMd),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_rounded, size: 16, color: RLTokens.ink),
                  const SizedBox(width: 6),
                  Text(
                    'Add Item',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        if (acknowledgments.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'ACKNOWLEDGMENT HISTORY',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              fontWeight: RLTokens.semibold,
              letterSpacing: 0.6,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              border: Border.all(color: RLTokens.hairline),
            ),
            child: Column(
              children: acknowledgments.asMap().entries.map((e) {
                final last = e.key == acknowledgments.length - 1;
                return _AcknowledgmentRow(acknowledgment: e.value, last: last);
              }).toList(),
            ),
          ),
        ],

        if (editable && items.isNotEmpty) ...[
          const SizedBox(height: 24),
          if (hasPending)
            Text(
              'All items must have a condition set before you can submit.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            )
          else
            _SubmitButton(
              propertyId: propertyId,
              leaseId: leaseId,
              checklistId: checklist.id,
            ),
        ],
      ],
    );
  }
}

// ── Category / item rows ─────────────────────────────────────────────────────

class _CategorySection extends StatelessWidget {
  const _CategorySection({
    required this.category,
    required this.items,
    required this.editable,
    required this.propertyId,
    required this.leaseId,
    required this.checklistId,
  });
  final String category;
  final List<LeaseChecklistItemModel> items;
  final bool editable;
  final String propertyId;
  final String leaseId;
  final String checklistId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            category,
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              fontWeight: RLTokens.semibold,
              letterSpacing: 0.6,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              border: Border.all(color: RLTokens.hairline),
            ),
            child: Column(
              children: items.asMap().entries.map((e) {
                final last = e.key == items.length - 1;
                return _ItemRow(
                  item: e.value,
                  last: last,
                  editable: editable,
                  propertyId: propertyId,
                  leaseId: leaseId,
                  checklistId: checklistId,
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ItemRow extends ConsumerWidget {
  const _ItemRow({
    required this.item,
    required this.last,
    required this.editable,
    required this.propertyId,
    required this.leaseId,
    required this.checklistId,
  });
  final LeaseChecklistItemModel item;
  final bool last;
  final bool editable;
  final String propertyId;
  final String leaseId;
  final String checklistId;

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.warning);
    if (!context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RLTokens.rXl),
        ),
        title: Text(
          'Remove item?',
          style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20),
        ),
        content: Text(
          'This item will be permanently removed from the report.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                color: RLTokens.muted,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Remove',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.danger,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    await ref
        .read(deleteChecklistItemNotifierProvider.notifier)
        .submit(
          propertyId: propertyId,
          leaseId: leaseId,
          checklistId: checklistId,
          itemId: item.id,
        );
    if (!context.mounted) return;
    if (ref.read(deleteChecklistItemNotifierProvider).status.isSuccess()) {
      ref.invalidate(leaseChecklistsProvider(propertyId, leaseId));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (_, label) = _splitDescription(item.description);
    final statusLabel = checklistItemStatusLabel(item.status);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.medium,
                    color: RLTokens.ink,
                  ),
                ),
                if (item.notes != null && item.notes!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    item.notes!,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.35,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                RLPill(statusLabel, tone: checklistItemStatusTone(item.status)),
              ],
            ),
          ),
          if (editable) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (!context.mounted) return;
                final saved = await showChecklistItemSheet(
                  context: context,
                  propertyId: propertyId,
                  leaseId: leaseId,
                  checklistId: checklistId,
                  item: item,
                );
                if (saved == true) {
                  ref.invalidate(leaseChecklistsProvider(propertyId, leaseId));
                }
              },
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.edit_outlined,
                  size: 17,
                  color: RLTokens.muted,
                ),
              ),
            ),
            GestureDetector(
              onTap: () => _delete(context, ref),
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.delete_outline_rounded,
                  size: 17,
                  color: RLTokens.danger,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Acknowledgment history ───────────────────────────────────────────────────

class _AcknowledgmentRow extends StatelessWidget {
  const _AcknowledgmentRow({required this.acknowledgment, required this.last});
  final LeaseChecklistAcknowledgmentModel acknowledgment;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final isAcknowledged = acknowledgment.action == 'ACKNOWLEDGED';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isAcknowledged ? Icons.check_circle_rounded : Icons.cancel_rounded,
            size: 18,
            color: isAcknowledged ? RLTokens.success : RLTokens.danger,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      isAcknowledged ? 'Acknowledged' : 'Disputed',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(width: 6),
                    RLPill(
                      'Round ${acknowledgment.round}',
                      tone: RLTone.neutral,
                    ),
                  ],
                ),
                if (acknowledgment.comment != null &&
                    acknowledgment.comment!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    acknowledgment.comment!,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  _formatDate(acknowledgment.createdAt),
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11,
                    color: RLTokens.mutedSoft,
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

// ── Submit ────────────────────────────────────────────────────────────────────

class _SubmitButton extends ConsumerWidget {
  const _SubmitButton({
    required this.propertyId,
    required this.leaseId,
    required this.checklistId,
  });
  final String propertyId;
  final String leaseId;
  final String checklistId;

  Future<void> _confirmAndSubmit(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RLTokens.rXl),
        ),
        title: Text(
          'Submit for tenant review?',
          style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20),
        ),
        content: Text(
          'The tenant will be notified and asked to acknowledge or dispute '
          'this report. You can still edit items later if they dispute it.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 13.5,
            color: RLTokens.muted,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                color: RLTokens.muted,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Submit',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.crimson,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    await ref
        .read(submitChecklistNotifierProvider.notifier)
        .submit(
          propertyId: propertyId,
          leaseId: leaseId,
          checklistId: checklistId,
        );
    if (!context.mounted) return;
    final state = ref.read(submitChecklistNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(leaseChecklistsProvider(propertyId, leaseId));
    } else if (state.status.isFailed() && context.mounted) {
      await Haptics.vibrate(HapticsType.error);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.errorMessage ?? 'Failed to submit report.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(submitChecklistNotifierProvider);
    final isPending = state.status.isLoading();

    return RLBtn(
      label: isPending ? 'Submitting…' : 'Submit for Tenant Review',
      full: true,
      onPressed: isPending ? null : () => _confirmAndSubmit(context, ref),
    );
  }
}
