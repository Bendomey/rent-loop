import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/units_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Screen ────────────────────────────────────────────────────────────────────

class UnitsListScreen extends ConsumerStatefulWidget {
  const UnitsListScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<UnitsListScreen> createState() => _UnitsListScreenState();
}

class _UnitsListScreenState extends ConsumerState<UnitsListScreen> {
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(unitsNotifierProvider.notifier).loadFirstPage(widget.propertyId);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(unitsNotifierProvider.notifier).loadNextPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(unitsNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
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
                  .loadFirstPage(widget.propertyId),
              child: CustomScrollView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
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
                              .loadFirstPage(widget.propertyId),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyUnitsList(),
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
                          (_, i) => _UnitRow(unit: state.items[i]),
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
                  const SliverToBoxAdapter(child: SizedBox(height: 32)),
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
  const _UnitRow({required this.unit});
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
        showChevron: false,
        last: true,
        onTap: () async => Haptics.vibrate(HapticsType.selection),
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
  const _EmptyUnitsList();

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
              'No units yet',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 15,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
