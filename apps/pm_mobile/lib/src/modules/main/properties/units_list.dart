import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/units_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kUnitStatusFilters = [
  'All',
  'Available',
  'Occupied',
  'Maintenance',
  'Draft',
];

String? _unitStatusApiValue(String label) => switch (label) {
  'Available' => 'Unit.Status.Available',
  'Occupied' => 'Unit.Status.Occupied',
  'Maintenance' => 'Unit.Status.Maintenance',
  'Draft' => 'Unit.Status.Draft',
  _ => null,
};

// ── Screen ────────────────────────────────────────────────────────────────────

class UnitsListScreen extends ConsumerStatefulWidget {
  const UnitsListScreen({
    super.key,
    required this.propertyId,
    this.blockId,
    this.blockName,
  });
  final String propertyId;

  /// Pre-applied block filter — set when arriving from a block card's
  /// "View Units" button (BlocksListScreen), via GoRouter query params.
  final String? blockId;
  final String? blockName;

  @override
  ConsumerState<UnitsListScreen> createState() => _UnitsListScreenState();
}

class _UnitsListScreenState extends ConsumerState<UnitsListScreen> {
  String _statusFilter = 'All';
  late UnitsQuery _query;
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _query = UnitsQuery(blockId: widget.blockId);
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(unitsNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId, _query);
    });
  }

  Future<void> _clearBlockFilter() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _query = _query.copyWith(clearBlockId: true));
    ref
        .read(unitsNotifierProvider.notifier)
        .loadFirstPage(widget.propertyId, _query);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(unitsNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _query = _query.copyWith(search: value, clearSearch: value.isEmpty);
      });
      ref
          .read(unitsNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId, _query);
    });
  }

  Future<void> _onSelectStatus(String label) async {
    await Haptics.vibrate(HapticsType.selection);
    final apiValue = _unitStatusApiValue(label);
    setState(() {
      _statusFilter = label;
      _query = _query.copyWith(status: apiValue, clearStatus: apiValue == null);
    });
    ref
        .read(unitsNotifierProvider.notifier)
        .loadFirstPage(widget.propertyId, _query);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(unitsNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;
    final isMulti =
        ref
            .watch(propertyDetailProvider(widget.propertyId))
            .valueOrNull
            ?.type ==
        'MULTI';

    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: isMulti
          ? FloatingActionButton.extended(
              heroTag: 'fab-add-unit',
              onPressed: () async {
                await Haptics.vibrate(HapticsType.medium);
                if (context.mounted) {
                  context.push('/properties/${widget.propertyId}/units/add');
                }
              },
              backgroundColor: RLTokens.crimson,
              foregroundColor: Colors.white,
              elevation: 3,
              icon: const Icon(Icons.add, size: 20),
              label: Text(
                'Unit',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontWeight: RLTokens.semibold,
                  fontSize: 14,
                ),
              ),
            )
          : null,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Units',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () => ref
                  .read(unitsNotifierProvider.notifier)
                  .loadFirstPage(widget.propertyId, _query),
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        12,
                        RLTokens.gutter,
                        0,
                      ),
                      child: RLSearchBar(
                        hint: 'Search units',
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                      ),
                    ),
                  ),
                  if (_query.blockId != null && widget.blockName != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          RLTokens.gutter,
                          12,
                          RLTokens.gutter,
                          0,
                        ),
                        child: GestureDetector(
                          onTap: _clearBlockFilter,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: RLTokens.crimsonTint,
                              borderRadius: BorderRadius.circular(
                                RLTokens.rPill,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Block: ${widget.blockName}',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 12.5,
                                    fontWeight: RLTokens.semibold,
                                    color: RLTokens.crimson,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.close_rounded,
                                  size: 14,
                                  color: RLTokens.crimson,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        RLTokens.gutter,
                        14,
                        0,
                        0,
                      ),
                      child: RLFilterChips(
                        options: _kUnitStatusFilters,
                        selected: _statusFilter,
                        onSelect: _onSelectStatus,
                      ),
                    ),
                  ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _UnitsListSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          onRetry: () => ref
                              .read(unitsNotifierProvider.notifier)
                              .loadFirstPage(widget.propertyId, _query),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyUnitsList(
                        propertyId: widget.propertyId,
                        isMulti: isMulti,
                      ),
                    )
                  else ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          RLTokens.gutter,
                          16,
                          RLTokens.gutter,
                          10,
                        ),
                        child: Text(
                          '${state.items.length} of ${state.total} ${state.total == 1 ? 'unit' : 'units'}',
                          style: TextStyle(
                            fontFamily: RLTokens.fontMono,
                            fontSize: 11,
                            letterSpacing: 0.5,
                            color: RLTokens.mutedSoft,
                          ),
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: RLTokens.gutter,
                      ),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _UnitRow(
                            propertyId: widget.propertyId,
                            unit: state.items[i],
                          ),
                          childCount: state.items.length,
                        ),
                      ),
                    ),
                    if (state.isLoadingMore)
                      const SliverToBoxAdapter(
                        child: Padding(
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
                        ),
                      ),
                  ],
                  SliverToBoxAdapter(
                    child: SizedBox(height: isMulti ? 100 : 32),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Row ───────────────────────────────────────────────────────────────────────

class _UnitRow extends StatelessWidget {
  const _UnitRow({required this.propertyId, required this.unit});
  final String propertyId;
  final UnitModel unit;

  @override
  Widget build(BuildContext context) {
    final statusLabel = propertyStatusLabel(unit.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: RLRow(
        leading: _UnitAvatar(unit: unit),
        title: unit.name,
        subtitle: unitTypeLabel(unit.type),
        trailing: RLPill(statusLabel, tone: statusTone(statusLabel)),
        last: true,
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            context.push('/properties/$propertyId/units/${unit.id}');
          }
        },
      ),
    );
  }
}

/// Unit thumbnail — the unit's first photo when it has one, else an
/// initials avatar (never the full unit name, which doesn't fit).
class _UnitAvatar extends StatelessWidget {
  const _UnitAvatar({required this.unit});
  final UnitModel unit;

  @override
  Widget build(BuildContext context) {
    final images = unit.images;
    if (images == null || images.isEmpty) {
      return RLAvatar(unit.name, size: 40);
    }
    return ClipOval(
      child: Image.network(
        images.first,
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => RLAvatar(unit.name, size: 40),
        loadingBuilder: (_, child, progress) =>
            progress == null ? child : RLAvatar(unit.name, size: 40),
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _UnitsListSkeleton extends StatelessWidget {
  const _UnitsListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(
        children: List.generate(
          6,
          (_) => Container(
            margin: const EdgeInsets.fromLTRB(
              RLTokens.gutter,
              16,
              RLTokens.gutter,
              0,
            ),
            height: 64,
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

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyUnitsList extends StatelessWidget {
  const _EmptyUnitsList({required this.propertyId, required this.isMulti});
  final String propertyId;
  final bool isMulti;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(RLTokens.gutter),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.grid_view_rounded,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            Text(
              'No units found',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 15,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 3),
            Text(
              'Try a different search or filter.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.45,
              ),
              textAlign: TextAlign.center,
            ),
            if (isMulti) ...[
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) {
                    context.push('/properties/$propertyId/units/add');
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: RLTokens.crimson,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add, size: 15, color: Colors.white),
                      const SizedBox(width: 6),
                      Text(
                        'Add Unit',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13,
                          fontWeight: RLTokens.semibold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
