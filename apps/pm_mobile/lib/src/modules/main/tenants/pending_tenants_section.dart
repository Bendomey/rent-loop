import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/application_checklist.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class PendingTenantsSection extends ConsumerWidget {
  const PendingTenantsSection({super.key, this.propertyId});

  final String? propertyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pending = ref.watch(pendingTenantsProvider(propertyId));

    return pending.when(
      loading: () => const Padding(
        padding: EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 0),
        child: PendingTenantsSkeleton(count: 2),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          16,
          RLTokens.gutter,
          0,
        ),
        child: RLSectionError(
          title: "Couldn't load pending tenants",
          compact: true,
          onRetry: () => ref.invalidate(pendingTenantsProvider(propertyId)),
        ),
      ),
      data: (page) {
        final items = page.rows;
        if (items.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(
            RLTokens.gutter,
            16,
            RLTokens.gutter,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionLabel('Pending tenants · ${page.meta.total}'),
              const SizedBox(height: 10),
              for (final a in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: PendingTenantCard(application: a),
                ),
            ],
          ),
        );
      },
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: RLTokens.fontMono,
        fontSize: 11,
        letterSpacing: 0.5,
        color: RLTokens.mutedSoft,
      ),
    );
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────

class PendingTenantCard extends StatelessWidget {
  const PendingTenantCard({super.key, required this.application});

  final TenantApplicationModel application;

  @override
  Widget build(BuildContext context) {
    final a = application;
    final statusLabel = applicationStatusLabel(a.status);
    final pending = isApplicationPending(a.status);
    // statusTone() leaves 'Completed' neutral because the leases list relies on it.
    final tone = statusLabel == 'Completed'
        ? RLTone.success
        : statusTone(statusLabel);
    final completeCount = pending
        ? computeApplicationChecklist(
            a,
          ).steps.where((s) => s.isSatisfied).length
        : 0;

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (!context.mounted) return;
        final propertyId = a.propertyId;
        context.push(
          propertyId == null
              ? '/activity/applications/${a.id}'
              : '/activity/applications/${a.id}?property_id=$propertyId',
          extra: a,
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _PendingTenantAvatar(application: a),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        a.fullName.isEmpty ? 'No name yet' : a.fullName,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 15.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        a.desiredUnit?.name ?? 'No unit selected',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                RLPill(statusLabel, tone: tone),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  pending ? 'Step $completeCount/5' : a.code,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    color: RLTokens.mutedSoft,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  formatApplicationAge(a.createdAt),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
            if (pending) ...[
              const SizedBox(height: 6),
              RLBar(
                percent: computeApplicationChecklist(a).progress * 100,
                height: 6,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PendingTenantAvatar extends StatelessWidget {
  const _PendingTenantAvatar({required this.application});

  final TenantApplicationModel application;

  @override
  Widget build(BuildContext context) {
    final url = application.profilePhotoUrl;
    final fallback = RLAvatar(
      application.fullName.isEmpty ? application.code : application.fullName,
      size: 42,
    );
    if (url == null || url.isEmpty) return fallback;

    return ClipOval(
      child: Image.network(
        url,
        width: 42,
        height: 42,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
      ),
    );
  }
}

String formatApplicationAge(DateTime? created) {
  if (created == null) return '—';
  final days = DateTime.now().difference(created).inDays;
  if (days <= 0) return 'Today';
  if (days == 1) return 'Yesterday';
  if (days < 7) return '${days}d ago';
  return '${created.day} ${_months[created.month - 1]}';
}

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

class PendingTenantsSkeleton extends StatelessWidget {
  const PendingTenantsSkeleton({super.key, this.count = 5});

  final int count;

  @override
  Widget build(BuildContext context) {
    Widget bar(double width, double height) => Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
      ),
    );

    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rLg),
                  border: Border.all(color: RLTokens.hairline),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              bar(140, 13),
                              const SizedBox(height: 6),
                              bar(100, 11),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        bar(62, 20),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [bar(54, 10), bar(70, 10)],
                    ),
                    const SizedBox(height: 8),
                    bar(double.infinity, 6),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
