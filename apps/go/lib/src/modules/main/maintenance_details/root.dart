import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_go/src/repository/providers/maintenance_badge_provider.dart';
import 'package:rentloop_go/src/repository/providers/maintenance_request_provider.dart';
import 'package:rentloop_go/src/shared/maintenance_utils.dart';
import 'package:rentloop_go/src/shared/screen_states.dart';
import 'package:timeline_tile/timeline_tile.dart';
import 'attachments.dart';

class MaintenanceDetailsScreen extends ConsumerStatefulWidget {
  const MaintenanceDetailsScreen({super.key, required this.requestId});

  final String requestId;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _MaintenanceDetailsScreen();
}

class _MaintenanceDetailsScreen
    extends ConsumerState<MaintenanceDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final leaseId = ref.watch(currentLeaseNotifierProvider)?.id;

    if (leaseId == null) {
      return const Scaffold(body: Center(child: Text('No active lease.')));
    }

    final requestAsync = ref.watch(
      maintenanceRequestProvider(leaseId, widget.requestId),
    );

    return requestAsync.when(
      loading: () => Scaffold(appBar: AppBar(), body: const _DetailsShimmer()),
      error: (_, __) => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop('/maintenance'),
          ),
        ),
        body: ScreenErrorState(
          title: 'Failed to load request',
          onRetry: () => ref.invalidate(
            maintenanceRequestProvider(leaseId, widget.requestId),
          ),
        ),
      ),
      data: (request) => _DetailsView(
        request: request,
        onRefresh: () async {
          ref.invalidate(maintenanceRequestProvider(leaseId, widget.requestId));
          ref.invalidate(mrStatsProvider);
        },
      ),
    );
  }
}

class _DetailsView extends StatelessWidget {
  const _DetailsView({required this.request, required this.onRefresh});

  final MaintenanceRequestModel request;
  final Future<void> Function() onRefresh;

  List<MaintenanceActivityLogModel> _sortedLogs() {
    final logs = [...(request.activityLogs ?? <MaintenanceActivityLogModel>[])];
    logs.sort((a, b) {
      final aDate = a.createdAt != null
          ? DateTime.tryParse(a.createdAt!)
          : null;
      final bDate = b.createdAt != null
          ? DateTime.tryParse(b.createdAt!)
          : null;
      if (aDate == null) return -1;
      if (bDate == null) return 1;
      return aDate.compareTo(bDate);
    });
    return logs;
  }

  @override
  Widget build(BuildContext context) {
    final submittedDate = request.createdAt != null
        ? DateTime.tryParse(request.createdAt!)
        : null;
    final updatedDate = request.updatedAt != null
        ? DateTime.tryParse(request.updatedAt!)
        : null;
    final attachmentUrls = request.attachments ?? [];
    final expenses = request.expenses ?? <MaintenanceExpenseModel>[];
    final logs = _sortedLogs();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          request.code ?? 'Request Details',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: onRefresh,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 15),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text(
                  'General Information',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge!.copyWith(fontSize: 20),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    submittedDate != null
                        ? 'Submitted: ${submittedDate.format('MMM dd, yyyy')}'
                        : 'Submitted: —',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  leading: const Icon(Icons.calendar_today_rounded, size: 22),
                  trailing: MrStatusChip(status: request.status),
                ),
                if (updatedDate != null)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      const Icon(Icons.alarm, size: 22),
                      const SizedBox(width: 20),
                      Text(
                        'Last update: ${updatedDate.format('MMM dd, yyyy')}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                if (request.status == 'CANCELED' &&
                    request.cancellationReason?.isNotEmpty == true) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.cancel_outlined,
                          color: Colors.red.shade700,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Cancellation Reason',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red.shade800,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                request.cancellationReason!,
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 30),
                Text(
                  'Title',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge!.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 10),
                Text(
                  request.title ?? '—',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 20),
                if (request.description?.isNotEmpty == true) ...[
                  Text(
                    'Description',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge!.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    request.description!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 20),
                ],
                Row(
                  children: [
                    if (request.priority != null)
                      _InfoChip(
                        label: 'Priority',
                        value: mrPriorityLabel(request.priority!),
                      ),
                    if (request.category != null) ...[
                      const SizedBox(width: 12),
                      _InfoChip(
                        label: 'Category',
                        value: mrCategoryLabel(request.category!),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 30),
                if (attachmentUrls.isNotEmpty) ...[
                  Text(
                    'Photos & Videos',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge!.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 12),
                  ViewAttachmentsWidget(urls: attachmentUrls),
                  const SizedBox(height: 20),
                ],
                if (expenses.isNotEmpty) ...[
                  Text(
                    'Expenses',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge!.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 10),
                  ...expenses.map((e) => _ExpenseCard(expense: e)),
                  const SizedBox(height: 20),
                ],
                Text(
                  'Repair Progress',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge!.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 10),
                if (logs.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'No updates yet.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                    ),
                  )
                else
                  Card(
                    elevation: 0,
                    color: Colors.grey.shade100,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 10,
                        horizontal: 20,
                      ),
                      child: Column(
                        children: List.generate(logs.length, (index) {
                          final log = logs[index];
                          final isLast = index == logs.length - 1;
                          final date = log.createdAt != null
                              ? (DateTime.tryParse(
                                      log.createdAt!,
                                    )?.format('MMM dd, yyyy – hh:mm a') ??
                                    log.createdAt!)
                              : '—';
                          final fromStatus = log.metadata?['from'] as String?;
                          final toStatus = log.metadata?['to'] as String?;
                          final isStatusChange =
                              log.action?.toUpperCase() == 'STATUS_CHANGED' &&
                              fromStatus != null &&
                              toStatus != null;

                          return TimelineTile(
                            alignment: TimelineAlign.start,
                            lineXY: 0.1,
                            isFirst: index == 0,
                            isLast: isLast,
                            indicatorStyle: IndicatorStyle(
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            beforeLineStyle: LineStyle(
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            endChild: Container(
                              margin: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    mrActivityActionLabel(log.action),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  if (isStatusChange) ...[
                                    Row(
                                      children: [
                                        MrStatusChip(status: fromStatus),
                                        const Padding(
                                          padding: EdgeInsets.symmetric(
                                            horizontal: 6,
                                          ),
                                          child: Icon(
                                            Icons.arrow_forward,
                                            size: 14,
                                            color: Colors.grey,
                                          ),
                                        ),
                                        MrStatusChip(status: toStatus),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                  ],
                                  Text(
                                    date,
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 13,
                                    ),
                                  ),
                                  if (log.description?.isNotEmpty == true) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      log.description!,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                const SizedBox(height: 50),
              ],
            ),
          ),
        ),
      ),
      // TODO: bring this back when implement support on mobile.
      // floatingActionButton: FloatingActionButton(
      //   onPressed: () async {
      //     await Haptics.vibrate(HapticsType.selection);
      //   },
      //   shape: const CircleBorder(),
      //   child: const Icon(Icons.support_agent, color: Colors.white),
      // ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: Theme.of(context).textTheme.bodySmall,
        children: [
          TextSpan(
            text: '$label: ',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(text: value),
        ],
      ),
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  const _ExpenseCard({required this.expense});

  final MaintenanceExpenseModel expense;

  String _formattedAmount() {
    if (expense.amount == null) return '—';
    final amt = expense.amount!;
    final currency = (expense.currency ?? 'USD').toUpperCase();
    final formatted = amt == amt.truncateToDouble()
        ? amt.toInt().toString()
        : amt.toStringAsFixed(2);
    return '$currency $formatted';
  }

  @override
  Widget build(BuildContext context) {
    final date = expense.createdAt != null
        ? (DateTime.tryParse(expense.createdAt!)?.format('MMM dd, yyyy') ??
              expense.createdAt!)
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Icon(
              Icons.receipt_long_rounded,
              color: Colors.green.shade700,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        expense.description ?? 'Expense',
                        style: Theme.of(context).textTheme.labelLarge!.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formattedAmount(),
                      style: Theme.of(context).textTheme.labelLarge!.copyWith(
                        fontWeight: FontWeight.w900,
                        color: Colors.green.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (date != null) ...[
                      Text(
                        date,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    if (expense.billableToTenant == true)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Billed to you',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.orange.shade800,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailsShimmer extends StatelessWidget {
  const _DetailsShimmer();

  Widget _box(double width, double height, {double radius = 4}) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(radius),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [_box(160, 14), _box(80, 26, radius: 5)],
            ),
            const SizedBox(height: 20),
            _box(100, 20),
            const SizedBox(height: 14),
            _box(double.infinity, 13),
            const SizedBox(height: 8),
            _box(200, 13),
            const SizedBox(height: 24),
            _box(80, 20),
            const SizedBox(height: 12),
            _box(double.infinity, 13),
            const SizedBox(height: 8),
            _box(double.infinity, 13),
            const SizedBox(height: 8),
            _box(160, 13),
            const SizedBox(height: 24),
            Row(
              children: [_box(90, 20), const SizedBox(width: 16), _box(90, 20)],
            ),
            const SizedBox(height: 28),
            _box(120, 20),
            const SizedBox(height: 14),
            // Attachment grid skeleton
            Row(
              children: List.generate(
                3,
                (_) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _box(90, 110, radius: 8),
                ),
              ),
            ),
            const SizedBox(height: 28),
            _box(120, 20),
            const SizedBox(height: 14),
            _box(double.infinity, 80, radius: 8),
          ],
        ),
      ),
    );
  }
}
