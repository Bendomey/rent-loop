import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/checklist_model.dart';
import 'package:rentloop_go/src/repository/notifiers/checklist/acknowledge_checklist_notifier/acknowledge_checklist_notifier.dart';
import 'package:rentloop_go/src/repository/providers/checklists_provider.dart';

class UnitConditionReportDetailScreen extends ConsumerStatefulWidget {
  final String checklistId;

  const UnitConditionReportDetailScreen({super.key, required this.checklistId});

  @override
  ConsumerState<UnitConditionReportDetailScreen> createState() =>
      _UnitConditionReportDetailScreenState();
}

class _UnitConditionReportDetailScreenState
    extends ConsumerState<UnitConditionReportDetailScreen> {
  final _disputeCommentController = TextEditingController();

  @override
  void dispose() {
    _disputeCommentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final checklistAsync = ref.watch(
      singleChecklistProvider(widget.checklistId),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: checklistAsync.when(
        loading: () => const _ReportShimmer(),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Failed to load report.'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () =>
                    ref.invalidate(singleChecklistProvider(widget.checklistId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (checklist) => _ChecklistDetail(
          checklist: checklist,
          checklistId: widget.checklistId,
        ),
      ),
    );
  }
}

class _ChecklistDetail extends ConsumerStatefulWidget {
  final LeaseChecklistModel checklist;
  final String checklistId;

  const _ChecklistDetail({required this.checklist, required this.checklistId});

  @override
  ConsumerState<_ChecklistDetail> createState() => _ChecklistDetailState();
}

class _ChecklistDetailState extends ConsumerState<_ChecklistDetail> {
  final _disputeCommentController = TextEditingController();

  @override
  void dispose() {
    _disputeCommentController.dispose();
    super.dispose();
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'CHECK_IN':
        return 'Move-in Report';
      case 'CHECK_OUT':
        return 'Move-out Report';
      case 'ROUTINE':
        return 'Routine Report';
      default:
        return 'Condition Report';
    }
  }

  (Color, Color) _statusColors(String status) {
    switch (status) {
      case 'SUBMITTED':
        return (Colors.blue.shade50, Colors.blue.shade700);
      case 'ACKNOWLEDGED':
        return (Colors.green.shade50, Colors.green.shade700);
      case 'DISPUTED':
        return (Colors.orange.shade50, Colors.orange.shade700);
      default:
        return (Colors.grey.shade100, Colors.grey.shade700);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'SUBMITTED':
        return 'Pending Review';
      case 'ACKNOWLEDGED':
        return 'Approved';
      case 'DISPUTED':
        return 'Disputed';
      default:
        return status;
    }
  }

  (Color, Color) _itemStatusColors(String status) {
    switch (status) {
      case 'FUNCTIONAL':
        return (Colors.green.shade50, Colors.green.shade700);
      case 'DAMAGED':
      case 'MISSING':
        return (Colors.red.shade50, Colors.red.shade700);
      case 'NEEDS_REPAIR':
        return (Colors.orange.shade50, Colors.orange.shade700);
      case 'NOT_PRESENT':
        return (Colors.grey.shade100, Colors.grey.shade600);
      default:
        return (Colors.grey.shade100, Colors.grey.shade600);
    }
  }

  String _itemStatusLabel(String status) {
    switch (status) {
      case 'FUNCTIONAL':
        return 'Functional';
      case 'DAMAGED':
        return 'Damaged';
      case 'MISSING':
        return 'Missing';
      case 'NEEDS_REPAIR':
        return 'Needs Repair';
      case 'NOT_PRESENT':
        return 'Not Present';
      default:
        return status;
    }
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  Map<String, List<LeaseChecklistItemModel>> _groupItemsByCategory(
    List<LeaseChecklistItemModel> items,
  ) {
    final grouped = <String, List<LeaseChecklistItemModel>>{};
    for (final item in items) {
      final parts = item.description.split(' - ');
      final category = parts.length > 1 ? parts.first : 'Other';
      grouped.putIfAbsent(category, () => []).add(item);
    }
    return grouped;
  }

  Future<void> _openApproveSheet() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Approve Report',
              style: Theme.of(
                ctx,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'By approving, you confirm that the report accurately reflects the condition of the unit.',
              style: Theme.of(
                ctx,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: Consumer(
                builder: (context, ref, _) {
                  final state = ref.watch(acknowledgeChecklistNotifierProvider);
                  return FilledButton(
                    onPressed: state.status.isLoading()
                        ? null
                        : () async {
                            Navigator.of(ctx).pop();
                            await _acknowledge();
                          },
                    child: state.status.isLoading()
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Confirm Approval'),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _acknowledge() async {
    final activeLease = ref.read(currentLeaseNotifierProvider);
    if (activeLease == null) return;

    await Haptics.vibrate(HapticsType.selection);
    final success = await ref
        .read(acknowledgeChecklistNotifierProvider.notifier)
        .acknowledge(
          leaseId: activeLease.id,
          checklistId: widget.checklist.id,
          action: 'ACKNOWLEDGED',
        );

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Report approved successfully.')),
      );
      context.pop();
    }
  }

  Future<void> _openDisputeSheet() async {
    _disputeCommentController.clear();
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dispute Report',
              style: Theme.of(
                ctx,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Let your landlord know what you disagree with.',
              style: Theme.of(
                ctx,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _disputeCommentController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Describe the issue (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: Consumer(
                builder: (context, ref, _) {
                  final state = ref.watch(acknowledgeChecklistNotifierProvider);
                  return FilledButton(
                    onPressed: state.status.isLoading()
                        ? null
                        : () async {
                            Navigator.of(ctx).pop();
                            await _dispute();
                          },
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.orange.shade600,
                    ),
                    child: state.status.isLoading()
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Submit Dispute'),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _dispute() async {
    final activeLease = ref.read(currentLeaseNotifierProvider);
    if (activeLease == null) return;

    await Haptics.vibrate(HapticsType.selection);
    final success = await ref
        .read(acknowledgeChecklistNotifierProvider.notifier)
        .acknowledge(
          leaseId: activeLease.id,
          checklistId: widget.checklist.id,
          action: 'DISPUTED',
          comment: _disputeCommentController.text.trim().isEmpty
              ? null
              : _disputeCommentController.text.trim(),
        );

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Dispute submitted successfully.')),
      );
      context.pop();
    } else {
      final errorMsg = ref
          .read(acknowledgeChecklistNotifierProvider)
          .errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg ?? 'Something happened. Try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final checklist = widget.checklist;
    final items = checklist.items ?? [];
    final acknowledgments = checklist.acknowledgments ?? [];
    final grouped = _groupItemsByCategory(items);
    final (statusBg, statusText) = _statusColors(checklist.status);
    final notifierState = ref.watch(acknowledgeChecklistNotifierProvider);

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(singleChecklistProvider(widget.checklistId));
          },
          child: ListView(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: checklist.status == 'SUBMITTED' ? 100 : 24,
            ),
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _typeLabel(checklist.type),
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: statusText,
                                ),
                          ),
                          if (checklist.submittedAt != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Submitted ${_formatDate(checklist.submittedAt)}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: statusText.withValues(alpha: 0.7),
                                  ),
                            ),
                          ],
                          if (checklist.round > 1) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Round ${checklist.round}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: statusText.withValues(alpha: 0.7),
                                  ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: statusText.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel(checklist.status),
                        style: TextStyle(
                          color: statusText,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Items grouped by category
              if (grouped.isNotEmpty) ...[
                const SizedBox(height: 16),
                ...grouped.entries.map((entry) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 4, bottom: 8),
                        child: Text(
                          entry.key,
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                color: Colors.grey.shade600,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: entry.value.length,
                          separatorBuilder: (_, __) =>
                              Divider(height: 0, color: Colors.grey.shade100),
                          itemBuilder: (_, i) {
                            final item = entry.value[i];
                            final itemName = item.description.contains(' - ')
                                ? item.description
                                      .split(' - ')
                                      .skip(1)
                                      .join(' - ')
                                : item.description;
                            final (itemBg, itemText) = _itemStatusColors(
                              item.status,
                            );
                            return Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          itemName,
                                          style: Theme.of(
                                            context,
                                          ).textTheme.bodyMedium,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: itemBg,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                        ),
                                        child: Text(
                                          _itemStatusLabel(item.status),
                                          style: TextStyle(
                                            color: itemText,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (item.notes != null &&
                                      item.notes!.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      item.notes!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Colors.grey.shade600,
                                          ),
                                    ),
                                  ],
                                  if (item.photos != null &&
                                      item.photos!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    SizedBox(
                                      height: 72,
                                      child: ListView.separated(
                                        scrollDirection: Axis.horizontal,
                                        itemCount: item.photos!.length,
                                        separatorBuilder: (_, __) =>
                                            const SizedBox(width: 8),
                                        itemBuilder: (_, pi) {
                                          final url = item.photos![pi];
                                          return GestureDetector(
                                            onTap: () =>
                                                _showPhoto(context, url),
                                            child: ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              child: Image.network(
                                                url,
                                                width: 72,
                                                height: 72,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) =>
                                                    Container(
                                                      width: 72,
                                                      height: 72,
                                                      color:
                                                          Colors.grey.shade200,
                                                      child: const Icon(
                                                        Icons.broken_image,
                                                        color: Colors.grey,
                                                      ),
                                                    ),
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  );
                }),
              ],

              // Acknowledgment history
              if (acknowledgments.isNotEmpty) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(
                    'Response History',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade100),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: acknowledgments.length,
                    separatorBuilder: (_, __) =>
                        Divider(height: 0, color: Colors.grey.shade100),
                    itemBuilder: (_, i) {
                      final ack = acknowledgments[i];
                      final isApproved = ack.action == 'ACKNOWLEDGED';
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              isApproved ? Icons.check_circle : Icons.cancel,
                              color: isApproved ? Colors.green : Colors.orange,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${isApproved ? 'Approved' : 'Disputed'} — Round ${ack.round}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                  if (ack.comment != null &&
                                      ack.comment!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      ack.comment!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Colors.grey.shade600,
                                          ),
                                    ),
                                  ],
                                  if (ack.createdAt != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      _formatDate(ack.createdAt),
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Colors.grey.shade400,
                                          ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),

        // Bottom action bar — only shown when SUBMITTED
        if (checklist.status == 'SUBMITTED')
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: notifierState.status.isLoading()
                          ? null
                          : _openDisputeSheet,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange.shade700,
                        side: BorderSide(color: Colors.orange.shade300),
                      ),
                      child: const Text('Dispute'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: notifierState.status.isLoading()
                          ? null
                          : _openApproveSheet,
                      child: notifierState.status.isLoading()
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Approve'),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  void _showPhoto(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(
                url,
                fit: BoxFit.contain,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportShimmer extends StatelessWidget {
  const _ReportShimmer();

  Widget _box(double width, double height, {double radius = 4}) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(radius),
    ),
  );

  Widget _itemRow() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: Row(
      children: [
        Expanded(child: _box(double.infinity, 13)),
        const SizedBox(width: 12),
        _box(72, 22, radius: 12),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card skeleton
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _box(140, 18),
                      const SizedBox(height: 8),
                      _box(100, 13),
                    ],
                  ),
                  _box(90, 28, radius: 20),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Category label
            _box(80, 13),
            const SizedBox(height: 10),
            // Items section
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _itemRow(),
                  Divider(height: 0, color: Colors.grey.shade100),
                  _itemRow(),
                  Divider(height: 0, color: Colors.grey.shade100),
                  _itemRow(),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _box(100, 13),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _itemRow(),
                  Divider(height: 0, color: Colors.grey.shade100),
                  _itemRow(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
