import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_assignees_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_request_status_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_requests_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/maintenance_filter_options_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Priority list (local — maintenance_utils only exports the mapping
// functions, not a display-label list, since status/category already need
// one for filter options but priority's 4 values are small enough to keep
// inline here, matching the original mock's convention) ──────────────────

const _kPriorities = ['Low', 'Medium', 'High', 'Emergency'];

/// Priority-only tone override — `statusTone()`'s neutral fallback for
/// unmapped strings is deliberate (see docs/implementation.md), so
/// "Emergency" is resolved here instead of editing the shared switch.
RLTone _priorityTone(String priority) =>
    priority == 'Emergency' ? RLTone.danger : statusTone(priority);

String _ageLabel(String? createdAt) {
  if (createdAt == null) return '';
  final date = DateTime.tryParse(createdAt);
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  return '${diff.inDays}d ago';
}

String? _multiSelectChipLabel({
  required List<String> selectedIds,
  required List<({String id, String name})> options,
  required String singularNoun,
  required String pluralNoun,
}) {
  if (selectedIds.isEmpty) return null;
  if (selectedIds.length == 1) {
    final match = options.where((o) => o.id == selectedIds.first);
    return match.isEmpty ? '1 $singularNoun' : match.first.name;
  }
  return '${selectedIds.length} $pluralNoun';
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
          if (context.mounted) context.push('/activity/maintenances/${m.id}');
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
              fontSize: 17,
              color: RLTokens.ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            m.unit?.name ?? '—',
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
            _FilterTriggerChip(
              label: 'Property',
              value: property,
              onTap: onTapProperty,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(label: 'Unit', value: unit, onTap: onTapUnit),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Priority',
              value: priority,
              onTap: onTapPriority,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Category',
              value: category,
              onTap: onTapCategory,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
              label: 'Assigned Worker',
              value: worker,
              onTap: onTapWorker,
            ),
            const SizedBox(width: 8),
            _FilterTriggerChip(
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

class _FilterTriggerChip extends StatelessWidget {
  const _FilterTriggerChip({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = value != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? RLTokens.crimsonTint : RLTokens.fill,
          borderRadius: BorderRadius.circular(RLTokens.rPill),
          border: Border.all(
            color: active ? RLTokens.crimson : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value ?? label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                fontWeight: active ? RLTokens.semibold : RLTokens.medium,
                color: active ? RLTokens.crimson : RLTokens.muted,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: active ? RLTokens.crimson : RLTokens.mutedSoft,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter sheet ──────────────────────────────────────────────────────────────

class _FilterPickResult {
  const _FilterPickResult.select(this.value, {this.id})
    : values = null,
      ids = null,
      isClear = false;
  const _FilterPickResult.selectMulti(this.values, {this.ids})
    : value = null,
      id = null,
      isClear = false;
  const _FilterPickResult.clear()
    : value = null,
      id = null,
      values = null,
      ids = null,
      isClear = true;

  final String? value;
  final String? id;
  final List<String>? values;
  final List<String>? ids;
  final bool isClear;
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({
    required this.title,
    required this.options,
    this.selected,
    this.selectedMulti = const [],
    this.idsByLabel,
    this.multiSelect = false,
  });

  final String title;
  final List<String> options;
  final String? selected;

  /// Pre-checked labels, multi-select mode only.
  final List<String> selectedMulti;

  /// Only set for person/property/unit filters — maps a displayed label to
  /// the id that must actually be sent to the API.
  final Map<String, String>? idsByLabel;
  final bool multiSelect;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late final Set<String> _checked = {...widget.selectedMulti};

  void _apply() {
    Navigator.pop(
      context,
      _FilterPickResult.selectMulti(
        _checked.toList(),
        ids: widget.idsByLabel == null
            ? null
            : _checked
                  .map((label) => widget.idsByLabel![label])
                  .whereType<String>()
                  .toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.space4,
                RLTokens.space4,
                RLTokens.space4,
                8,
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 22,
                      color: RLTokens.inkSoft,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Filter by ${widget.title}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textBarTitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () =>
                        Navigator.pop(context, const _FilterPickResult.clear()),
                    child: const Text(
                      'Clear',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: RLTokens.textSubtitle,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (widget.options.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: RLTokens.space4,
                  vertical: 24,
                ),
                child: Text(
                  'No options yet.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: RLTokens.textBody,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(
                    horizontal: RLTokens.space4,
                  ),
                  itemCount: widget.options.length,
                  separatorBuilder: (_, _) =>
                      Container(height: 1, color: RLTokens.hairlineSoft),
                  itemBuilder: (_, i) {
                    final option = widget.options[i];
                    final isSelected = widget.multiSelect
                        ? _checked.contains(option)
                        : option == widget.selected;
                    return GestureDetector(
                      onTap: () {
                        if (widget.multiSelect) {
                          setState(() {
                            if (_checked.contains(option)) {
                              _checked.remove(option);
                            } else {
                              _checked.add(option);
                            }
                          });
                        } else {
                          Navigator.pop(
                            context,
                            _FilterPickResult.select(
                              option,
                              id: widget.idsByLabel?[option],
                            ),
                          );
                        }
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                option,
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: RLTokens.textBody,
                                  color: RLTokens.ink,
                                ),
                              ),
                            ),
                            Icon(
                              widget.multiSelect
                                  ? (isSelected
                                        ? Icons.check_box_rounded
                                        : Icons.check_box_outline_blank_rounded)
                                  : (isSelected
                                        ? Icons.radio_button_checked_rounded
                                        : Icons.radio_button_unchecked_rounded),
                              size: 20,
                              color: isSelected
                                  ? RLTokens.crimson
                                  : RLTokens.hairline,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            if (widget.multiSelect)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  RLTokens.space4,
                  8,
                  RLTokens.space4,
                  0,
                ),
                child: RLBtn(label: 'Apply', full: true, onPressed: _apply),
              ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
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
                                  'No requests here',
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

// ── Cancel reason sheet ────────────────────────────────────────────────────────

class _CancelReasonSheet extends StatefulWidget {
  const _CancelReasonSheet({required this.title});
  final String title;

  @override
  State<_CancelReasonSheet> createState() => _CancelReasonSheetState();
}

class _CancelReasonSheetState extends State<_CancelReasonSheet> {
  final _controller = TextEditingController();
  bool _touched = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = _controller.text.trim().isEmpty;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          20,
          RLTokens.gutter,
          20,
        ),
        decoration: const BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(RLTokens.rXl),
            topRight: Radius.circular(RLTokens.rXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cancel request',
              style: TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: RLTokens.textCardHead,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              widget.title,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: RLTokens.textSubtitle,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              autofocus: true,
              maxLines: 3,
              onChanged: (_) => setState(() => _touched = true),
              decoration: InputDecoration(
                hintText: 'Reason for cancelling',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                ),
                errorText: _touched && isEmpty ? 'A reason is required' : null,
              ),
            ),
            const SizedBox(height: 16),
            RLBtn(
              label: 'Confirm cancellation',
              full: true,
              kind: RLBtnKind.danger,
              onPressed: isEmpty
                  ? null
                  : () => Navigator.pop(context, _controller.text),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Board ─────────────────────────────────────────────────────────────────────

class MaintenanceBoard extends ConsumerStatefulWidget {
  const MaintenanceBoard({super.key});

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
  List<String> _propertyFilterIds = const [];
  List<String> _unitFilterIds = const [];

  @override
  void initState() {
    super.initState();
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

  /// Recomputes the distinct set of property ids currently represented
  /// across all 5 columns and asks [MaintenanceAssigneesNotifier] to fetch
  /// people for any not-yet-seen property. Called from [build] via
  /// `ref.listen` on each column, so it fires whenever any column's data
  /// changes — cheap to call repeatedly since the notifier itself skips
  /// already-fetched properties.
  void _refreshAssigneeSources() {
    final propertyIds = <String>{};
    for (final status in kMaintenanceStatusOrder) {
      final state = ref.read(maintenanceRequestsNotifierProvider(status));
      for (final item in state.items) {
        final propertyId = item.unit?.propertyId;
        if (propertyId != null) propertyIds.add(propertyId);
      }
    }
    if (propertyIds.isNotEmpty) {
      ref
          .read(maintenanceAssigneesNotifierProvider.notifier)
          .ensurePropertiesLoaded(propertyIds);
    }
  }

  Future<void> _pickFilter({
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onChanged,
  }) async {
    final result = await showModalBottomSheet<_FilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          _FilterSheet(title: title, options: options, selected: selected),
    );
    if (result == null) return;
    setState(() => onChanged(result.isClear ? null : result.value));
  }

  Future<void> _pickPersonFilter({
    required String title,
    required List<MaintenanceAssigneeModel> people,
    required String? selectedLabel,
    required void Function(String? label, String? id) onChanged,
  }) async {
    final labels = people.map((p) => p.name ?? p.id).toList();
    final idsByLabel = {for (final p in people) (p.name ?? p.id): p.id};
    final result = await showModalBottomSheet<_FilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheet(
        title: title,
        options: labels,
        selected: selectedLabel,
        idsByLabel: idsByLabel,
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
    required List<({String id, String name})> options,
    required List<String> selectedIds,
    required void Function(List<String> ids) onChanged,
  }) async {
    final labels = options.map((o) => o.name).toList();
    final idsByLabel = {for (final o in options) o.name: o.id};
    final selectedLabels = options
        .where((o) => selectedIds.contains(o.id))
        .map((o) => o.name)
        .toList();
    final result = await showModalBottomSheet<_FilterPickResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheet(
        title: title,
        options: labels,
        selectedMulti: selectedLabels,
        idsByLabel: idsByLabel,
        multiSelect: true,
      ),
    );
    if (result == null) return;
    setState(() {
      if (result.isClear) {
        onChanged(const []);
      } else {
        onChanged(result.ids ?? const []);
      }
    });
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
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Resolved?'),
        content: Text('"${item.title}" will be moved to Resolved.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (confirmed == true) _applyMove(item, fromStatus, toStatus);
  }

  Future<void> _confirmCancel(
    MaintenanceRequestModel item,
    String fromStatus,
    String toStatus,
  ) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CancelReasonSheet(title: item.title),
    );
    if (!mounted) return;
    if (reason != null && reason.trim().isNotEmpty) {
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
    for (final status in kMaintenanceStatusOrder) {
      ref.listen(maintenanceRequestsNotifierProvider(status), (prev, next) {
        _refreshAssigneeSources();
      });
    }
    final people = ref.watch(maintenanceAssigneesNotifierProvider);
    final propertyOptions =
        (ref.watch(maintenanceFilterPropertiesProvider).valueOrNull ?? [])
            .map((p) => (id: p.id, name: p.name))
            .toList();
    final unitOptions =
        (ref.watch(maintenanceFilterUnitsProvider).valueOrNull ?? [])
            .map((u) => (id: u.id, name: u.name))
            .toList();

    return Column(
      children: [
        _FilterChipsRow(
          priority: _priorityFilter,
          category: _categoryFilter,
          worker: _workerFilter,
          manager: _managerFilter,
          property: _multiSelectChipLabel(
            selectedIds: _propertyFilterIds,
            options: propertyOptions,
            singularNoun: 'Property',
            pluralNoun: 'Properties',
          ),
          unit: _multiSelectChipLabel(
            selectedIds: _unitFilterIds,
            options: unitOptions,
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
            people: people,
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
            people: people,
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
            options: propertyOptions,
            selectedIds: _propertyFilterIds,
            onChanged: (ids) {
              _propertyFilterIds = ids;
              _query = _query.copyWith(propertyIds: ids);
            },
          ),
          onTapUnit: () => _pickMultiFilter(
            title: 'Unit',
            options: unitOptions,
            selectedIds: _unitFilterIds,
            onChanged: (ids) {
              _unitFilterIds = ids;
              _query = _query.copyWith(unitIds: ids);
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
