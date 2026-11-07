import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_status_actions.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_assignees_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_request_status_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_requests_notifier.dart';
import 'package:rentloop_manager/src/modules/main/activity/activity_filters.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/options_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/shared/paged_picker_sheet.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Priority list (local — maintenance_utils only exports the mapping
// functions, not a display-label list, since status/category already need
// one for filter options but priority's 4 values are small enough to keep
// inline here, matching the original mock's convention) ──────────────────

final _kPriorities = kMaintenancePriorityLabels;

/// Priority-only tone override — `statusTone()`'s neutral fallback for
/// unmapped strings is deliberate (see docs/implementation.md), so
/// "Emergency" is resolved here instead of editing the shared switch.
RLTone _priorityTone(String priority) =>
    priority == kUrgentPriorityLabel ? RLTone.danger : statusTone(priority);

String _ageLabel(String? createdAt) {
  if (createdAt == null) return '';
  final date = DateTime.tryParse(createdAt);
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  return '${diff.inDays}d ago';
}

// ── Card ──────────────────────────────────────────────────────────────────────

class _MaintCard extends StatelessWidget {
  const _MaintCard({
    required this.m,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final MaintenanceRequestModel m;
  final void Function(Offset globalPosition) onDragUpdate;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final card = _CardBody(m: m);
    return LongPressDraggable<MaintenanceRequestModel>(
      data: m,
      onDragStarted: () => Haptics.vibrate(HapticsType.selection),
      onDragUpdate: (details) => onDragUpdate(details.globalPosition),
      onDragEnd: (_) => onDragEnd(),
      onDraggableCanceled: (_, _) => onDragEnd(),
      feedback: Material(
        color: Colors.transparent,
        child: SizedBox(
          width: MediaQuery.of(context).size.width - RLTokens.gutter * 2,
          child: Transform.scale(
            scale: 1.03,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(RLTokens.rLg),
                boxShadow: RLTokens.elevFab,
              ),
              child: card,
            ),
          ),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: card),
      child: GestureDetector(
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            context.push('/activity/maintenances/${m.id}', extra: m.propertyId);
          }
        },
        child: card,
      ),
    );
  }
}

class _CardBody extends StatelessWidget {
  const _CardBody({required this.m});
  final MaintenanceRequestModel m;

  @override
  Widget build(BuildContext context) {
    final priorityLabel = mrPriorityLabelFromApi(m.priority);
    final categoryLabel = mrCategoryLabelFromApi(m.category);
    final priTone = _priorityTone(priorityLabel);
    final workerName = m.assignedWorker?.name;
    final managerName = m.assignedManager?.name;
    return Container(
      padding: const EdgeInsets.all(14),
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
              RLDot(tone: priTone, size: 8),
              const SizedBox(width: 6),
              Text(
                priorityLabel,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 11,
                  fontWeight: RLTokens.semibold,
                  color: priTone.fg,
                ),
              ),
              const Spacer(),
              Text(
                _ageLabel(m.createdAt),
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 10.5,
                  color: RLTokens.micro,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '#${m.code}',
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            m.title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontWeight: RLTokens.headingWeight,
              fontSize: 17,
              color: RLTokens.ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            m.assetSummary,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 11),
          Container(height: 1, color: RLTokens.hairlineSoft),
          const SizedBox(height: 11),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RLPill(categoryLabel, tone: RLTone.neutral),
              if (workerName != null || managerName != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (workerName != null)
                      _AssigneeAvatar(
                        name: workerName,
                        bg: RLTokens.fill,
                        fg: RLTokens.crimson,
                      ),
                    if (workerName != null && managerName != null)
                      const SizedBox(width: 4),
                    if (managerName != null)
                      _AssigneeAvatar(
                        name: managerName,
                        bg: RLTokens.infoBg,
                        fg: RLTokens.info,
                      ),
                  ],
                )
              else
                const Text(
                  'Unassigned',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    fontWeight: RLTokens.medium,
                    color: RLTokens.crimson,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AssigneeAvatar extends StatelessWidget {
  const _AssigneeAvatar({
    required this.name,
    required this.bg,
    required this.fg,
  });

  final String name;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0].toUpperCase())
        .join();
    return Tooltip(
      message: name,
      child: Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bg,
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Center(
          child: Text(
            initials,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 9,
              fontWeight: RLTokens.semibold,
              color: fg,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Filter chips ─────────────────────────────────────────────────────────────

class _FilterChipsRow extends StatelessWidget {
  const _FilterChipsRow({
    required this.priority,
    required this.category,
    required this.worker,
    required this.manager,
    required this.property,
    required this.unit,
    required this.onTapPriority,
    required this.onTapCategory,
    required this.onTapWorker,
    required this.onTapManager,
    required this.onTapProperty,
    required this.onTapUnit,
  });

  final String? priority;
  final String? category;
  final String? worker;
  final String? manager;
  final String? property;
  final String? unit;
  final VoidCallback onTapPriority;
  final VoidCallback onTapCategory;
  final VoidCallback onTapWorker;
  final VoidCallback onTapManager;
  final VoidCallback onTapProperty;
  final VoidCallback onTapUnit;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: RLTokens.surface,
        border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: RLTokens.gutter,
          vertical: 8,
        ),
        child: Row(
          children: [
            RLFilterTriggerChip(
              label: 'Property',
              value: property,
              onTap: onTapProperty,
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(label: 'Unit', value: unit, onTap: onTapUnit),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Priority',
              value: priority,
              onTap: onTapPriority,
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Category',
              value: category,
              onTap: onTapCategory,
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Assigned Worker',
              value: worker,
              onTap: onTapWorker,
            ),
            const SizedBox(width: 8),
            RLFilterTriggerChip(
              label: 'Assigned Manager',
              value: manager,
              onTap: onTapManager,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Status column page ────────────────────────────────────────────────────────

class _StatusColumnPage extends ConsumerStatefulWidget {
  const _StatusColumnPage({
    required this.status,
    required this.query,
    required this.onAccept,
    required this.onCardDragUpdate,
    required this.onCardDragEnd,
  });

  final String status;
  final MaintenanceRequestsQuery query;
  final ValueChanged<MaintenanceRequestModel> onAccept;
  final void Function(Offset globalPosition) onCardDragUpdate;
  final VoidCallback onCardDragEnd;

  @override
  ConsumerState<_StatusColumnPage> createState() => _StatusColumnPageState();
}

class _StatusColumnPageState extends ConsumerState<_StatusColumnPage> {
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(maintenanceRequestsNotifierProvider(widget.status).notifier)
          .loadFirstPage(widget.query);
    });
  }

  @override
  void didUpdateWidget(covariant _StatusColumnPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.query != widget.query) {
      final query = widget.query;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ref
            .read(maintenanceRequestsNotifierProvider(widget.status).notifier)
            .loadFirstPage(query);
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref
          .read(maintenanceRequestsNotifierProvider(widget.status).notifier)
          .loadNextPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(maintenanceRequestsNotifierProvider(widget.status));
    final tone = statusTone(widget.status);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: DragTarget<MaintenanceRequestModel>(
        onAcceptWithDetails: (details) => widget.onAccept(details.data),
        builder: (context, candidates, rejects) {
          return Column(
            children: [
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: tone.bg,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.status,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.bold,
                        color: tone.fg,
                      ),
                    ),
                    Text(
                      '${state.total}',
                      style: TextStyle(
                        fontFamily: RLTokens.fontMono,
                        fontSize: 13,
                        fontWeight: RLTokens.bold,
                        color: tone.fg,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  color: RLTokens.crimson,
                  onRefresh: () => ref
                      .read(
                        maintenanceRequestsNotifierProvider(
                          widget.status,
                        ).notifier,
                      )
                      .loadFirstPage(widget.query),
                  child: showSkeleton
                      ? const _ColumnSkeleton()
                      : showError
                      ? SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: Padding(
                            padding: const EdgeInsets.all(RLTokens.gutter),
                            child: RLSectionError(
                              onRetry: () => ref
                                  .read(
                                    maintenanceRequestsNotifierProvider(
                                      widget.status,
                                    ).notifier,
                                  )
                                  .loadFirstPage(widget.query),
                            ),
                          ),
                        )
                      : showEmpty
                      ? ListView(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: 60),
                              child: Center(
                                child: Text(
                                  'No repairs here',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 13,
                                    color: RLTokens.mutedSoft,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(2, 12, 2, 40),
                          itemCount:
                              state.items.length +
                              (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (_, i) {
                            if (i >= state.items.length) {
                              return const Padding(
                                padding: EdgeInsets.symmetric(vertical: 16),
                                child: Center(
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: RLTokens.crimson,
                                    ),
                                  ),
                                ),
                              );
                            }
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _MaintCard(
                                m: state.items[i],
                                onDragUpdate: widget.onCardDragUpdate,
                                onDragEnd: widget.onCardDragEnd,
                              ),
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ColumnSkeleton extends StatelessWidget {
  const _ColumnSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(2, 12, 2, 40),
        children: List.generate(
          4,
          (_) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            height: 140,
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

// ── Page dots ─────────────────────────────────────────────────────────────────

class _PageDots extends StatelessWidget {
  const _PageDots({
    required this.count,
    required this.current,
    required this.onTap,
  });

  final int count;
  final int current;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(count, (i) {
          final active = i == current;
          return GestureDetector(
            key: ValueKey('page-dot-$i'),
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? RLTokens.crimson : RLTokens.hairline,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _PersonFilterSheet extends ConsumerWidget {
  const _PersonFilterSheet({
    required this.title,
    required this.selectedLabel,
    required this.loading,
  });

  final String title;
  final String? selectedLabel;
  final Future<void> loading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(maintenanceAssigneesNotifierProvider);
    return FutureBuilder<void>(
      future: loading,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _PeopleSheetSkeleton();
        }
        return RLFilterSheet(
          title: title,
          options: people.map((p) => p.name ?? p.id).toList(),
          selected: selectedLabel,
          idsByLabel: {for (final p in people) (p.name ?? p.id): p.id},
        );
      },
    );
  }
}

class _PeopleSheetSkeleton extends StatelessWidget {
  const _PeopleSheetSkeleton();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(RLTokens.space4),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Shimmer.fromColors(
          baseColor: RLTokens.fill,
          highlightColor: RLTokens.paper,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(
              5,
              (_) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Board ─────────────────────────────────────────────────────────────────────

class MaintenanceBoard extends ConsumerStatefulWidget {
  const MaintenanceBoard({
    super.key,
    this.initialPropertyIds = const [],
    this.initialPropertyName,
  });

  final List<String> initialPropertyIds;
  final String? initialPropertyName;

  @override
  ConsumerState<MaintenanceBoard> createState() => _MaintenanceBoardState();
}

class _MaintenanceBoardState extends ConsumerState<MaintenanceBoard> {
  late final PageController _pageController;
  int _currentPage = 0;
  DateTime? _lastEdgePageTurn;

  MaintenanceRequestsQuery _query = const MaintenanceRequestsQuery();
  String? _priorityFilter;
  String? _categoryFilter;
  String? _workerFilter;
  String? _managerFilter;
  List<FilterOption> _propertyFilters = const [];
  List<FilterOption> _unitFilters = const [];

  @override
  void initState() {
    super.initState();
    _propertyFilters = [
      for (final id in widget.initialPropertyIds)
        (id: id, name: widget.initialPropertyName ?? ''),
    ];
    _query = MaintenanceRequestsQuery(propertyIds: widget.initialPropertyIds);
    _pageController = PageController(viewportFraction: 0.92);
    _pageController.addListener(() {
      final page = _pageController.page;
      if (page == null) return;
      final rounded = page.round();
      if (rounded != _currentPage && mounted) {
        setState(() => _currentPage = rounded);
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadAssignees() {
    final propertyIds = <String>{};
    for (final status in kMaintenanceStatusOrder) {
      for (final item
          in ref.read(maintenanceRequestsNotifierProvider(status)).items) {
        propertyIds.add(item.propertyId);
      }
    }
    return ref
        .read(maintenanceAssigneesNotifierProvider.notifier)
        .ensurePropertiesLoaded(propertyIds);
  }

  Future<void> _pickFilter({
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onChanged,
  }) async {
    final result = await showModalBottomSheet<RLFilterPickResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          RLFilterSheet(title: title, options: options, selected: selected),
    );
    if (result == null) return;
    setState(() => onChanged(result.isClear ? null : result.value));
  }

  Future<void> _pickPersonFilter({
    required String title,
    required String? selectedLabel,
    required void Function(String? label, String? id) onChanged,
  }) async {
    final loading = _loadAssignees();
    final result = await showModalBottomSheet<RLFilterPickResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PersonFilterSheet(
        title: title,
        selectedLabel: selectedLabel,
        loading: loading,
      ),
    );
    if (result == null) return;
    setState(() {
      if (result.isClear) {
        onChanged(null, null);
      } else {
        onChanged(result.value, result.id);
      }
    });
  }

  Future<void> _pickMultiFilter({
    required String title,
    required ProviderListenable<OptionsState<FilterOption>> state,
    required void Function(String) onSearch,
    required VoidCallback onLoadMore,
    required VoidCallback onRetry,
    required List<FilterOption> selected,
    required void Function(List<FilterOption> picked) onChanged,
  }) async {
    final result = await showPagedPickerSheet<FilterOption>(
      context: context,
      title: title,
      state: state,
      onSearch: onSearch,
      onLoadMore: onLoadMore,
      onRetry: onRetry,
      label: (o) => o.name,
      id: (o) => o.id,
      multi: true,
      initial: selected,
    );
    if (result == null) return;
    setState(() => onChanged(result));
  }

  void _handleCardDragUpdate(Offset globalPosition) {
    if (!_pageController.hasClients || _pageController.page == null) return;
    final now = DateTime.now();
    if (_lastEdgePageTurn != null &&
        now.difference(_lastEdgePageTurn!) <
            const Duration(milliseconds: 700)) {
      return;
    }
    final width = MediaQuery.of(context).size.width;
    const edgeZone = 48.0;
    final current = _pageController.page!.round();
    if (globalPosition.dx < edgeZone && current > 0) {
      _lastEdgePageTurn = now;
      _pageController.animateToPage(
        current - 1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else if (globalPosition.dx > width - edgeZone &&
        current < kMaintenanceStatusOrder.length - 1) {
      _lastEdgePageTurn = now;
      _pageController.animateToPage(
        current + 1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleCardDragEnd() {
    _lastEdgePageTurn = null;
  }

  void _handleDrop(MaintenanceRequestModel item, String toStatus) {
    final fromStatus = mrStatusLabel(item.status);
    if (fromStatus == toStatus) return;
    if (toStatus == 'Resolved') {
      _confirmResolve(item, fromStatus, toStatus);
    } else if (toStatus == 'Cancelled') {
      _confirmCancel(item, fromStatus, toStatus);
    } else {
      _applyMove(item, fromStatus, toStatus);
    }
  }

  Future<void> _applyMove(
    MaintenanceRequestModel item,
    String fromStatus,
    String toStatus, {
    String? cancellationReason,
  }) async {
    final success = await ref
        .read(maintenanceRequestStatusNotifierProvider.notifier)
        .updateStatus(
          request: item,
          toStatusLabel: toStatus,
          cancellationReason: cancellationReason,
        );
    if (!mounted) return;
    if (success) {
      Haptics.vibrate(HapticsType.light);
      await ref
          .read(maintenanceRequestsNotifierProvider(fromStatus).notifier)
          .loadFirstPage(_query);
      if (!mounted) return;
      await ref
          .read(maintenanceRequestsNotifierProvider(toStatus).notifier)
          .loadFirstPage(_query);
      if (!mounted) return;
      _pageController.animateToPage(
        kMaintenanceStatusOrder.indexOf(toStatus),
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else {
      final message = ref
          .read(maintenanceRequestStatusNotifierProvider)
          .errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message ?? 'Could not update status.'),
          backgroundColor: RLTokens.danger,
        ),
      );
    }
  }

  Future<void> _confirmResolve(
    MaintenanceRequestModel item,
    String fromStatus,
    String toStatus,
  ) async {
    final confirmed = await confirmMaintenanceResolve(context, item.title);
    if (!mounted) return;
    if (confirmed) _applyMove(item, fromStatus, toStatus);
  }

  Future<void> _confirmCancel(
    MaintenanceRequestModel item,
    String fromStatus,
    String toStatus,
  ) async {
    final reason = await promptMaintenanceCancelReason(context, item.title);
    if (!mounted) return;
    if (reason != null) {
      _applyMove(item, fromStatus, toStatus, cancellationReason: reason);
    }
  }

  void _goToPage(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Keeps the auto-dispose notifier alive while the sheet is opening.
    ref.watch(maintenanceAssigneesNotifierProvider);
    ref.listen(maintenanceRequestStatusNotifierProvider, (_, _) {});
    final propertyOptions = propertyOptionsNotifierProvider();
    final unitOptions = unitOptionsNotifierProvider(const UnitOptionsQuery());

    return Column(
      children: [
        _FilterChipsRow(
          priority: _priorityFilter,
          category: _categoryFilter,
          worker: _workerFilter,
          manager: _managerFilter,
          property: filterChipLabel(
            selected: _propertyFilters,
            singularNoun: 'Property',
            pluralNoun: 'Properties',
          ),
          unit: filterChipLabel(
            selected: _unitFilters,
            singularNoun: 'Unit',
            pluralNoun: 'Units',
          ),
          onTapPriority: () => _pickFilter(
            title: 'Priority',
            options: _kPriorities,
            selected: _priorityFilter,
            onChanged: (v) {
              _priorityFilter = v;
              _query = _query.copyWith(
                priorityLabel: v,
                clearPriorityLabel: v == null,
              );
            },
          ),
          onTapCategory: () => _pickFilter(
            title: 'Category',
            options: kMaintenanceCategoryLabels,
            selected: _categoryFilter,
            onChanged: (v) {
              _categoryFilter = v;
              _query = _query.copyWith(
                categoryLabel: v,
                clearCategoryLabel: v == null,
              );
            },
          ),
          onTapWorker: () => _pickPersonFilter(
            title: 'Assigned Worker',
            selectedLabel: _workerFilter,
            onChanged: (label, id) {
              _workerFilter = label;
              _query = _query.copyWith(
                assignedWorkerId: id,
                clearAssignedWorkerId: id == null,
              );
            },
          ),
          onTapManager: () => _pickPersonFilter(
            title: 'Assigned Manager',
            selectedLabel: _managerFilter,
            onChanged: (label, id) {
              _managerFilter = label;
              _query = _query.copyWith(
                assignedManagerId: id,
                clearAssignedManagerId: id == null,
              );
            },
          ),
          onTapProperty: () => _pickMultiFilter(
            title: 'Property',
            state: asFilterOptions(
              propertyOptions,
              id: (p) => p.id,
              name: (p) => p.name,
            ),
            onSearch: (v) => ref.read(propertyOptions.notifier).setSearch(v),
            onLoadMore: () => ref.read(propertyOptions.notifier).loadNextPage(),
            onRetry: () => ref.read(propertyOptions.notifier).refresh(),
            selected: _propertyFilters,
            onChanged: (picked) {
              _propertyFilters = picked;
              _query = _query.copyWith(
                propertyIds: [for (final o in picked) o.id],
              );
            },
          ),
          onTapUnit: () => _pickMultiFilter(
            title: 'Unit',
            state: asFilterOptions(
              unitOptions,
              id: (u) => u.id,
              name: (u) => u.name,
            ),
            onSearch: (v) => ref.read(unitOptions.notifier).setSearch(v),
            onLoadMore: () => ref.read(unitOptions.notifier).loadNextPage(),
            onRetry: () => ref.read(unitOptions.notifier).refresh(),
            selected: _unitFilters,
            onChanged: (picked) {
              _unitFilters = picked;
              _query = _query.copyWith(unitIds: [for (final o in picked) o.id]);
            },
          ),
        ),
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            itemCount: kMaintenanceStatusOrder.length,
            itemBuilder: (_, i) {
              final status = kMaintenanceStatusOrder[i];
              return _StatusColumnPage(
                status: status,
                query: _query,
                onAccept: (item) => _handleDrop(item, status),
                onCardDragUpdate: _handleCardDragUpdate,
                onCardDragEnd: _handleCardDragEnd,
              );
            },
          ),
        ),
        _PageDots(
          count: kMaintenanceStatusOrder.length,
          current: _currentPage,
          onTap: _goToPage,
        ),
      ],
    );
  }
}
