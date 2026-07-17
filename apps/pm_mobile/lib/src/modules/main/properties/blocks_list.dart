import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/blocks_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/blocks/delete_block_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_blocks_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kBlockStatusFilters = ['All', 'Active', 'Maintenance', 'Inactive'];

String? _blockStatusApiValue(String label) => switch (label) {
  'Active' => 'PropertyBlock.Status.Active',
  'Maintenance' => 'PropertyBlock.Status.Maintenance',
  'Inactive' => 'PropertyBlock.Status.Inactive',
  _ => null,
};

// ── Screen ────────────────────────────────────────────────────────────────────

class BlocksListScreen extends ConsumerStatefulWidget {
  const BlocksListScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<BlocksListScreen> createState() => _BlocksListScreenState();
}

class _BlocksListScreenState extends ConsumerState<BlocksListScreen> {
  String _statusFilter = 'All';
  BlocksQuery _query = const BlocksQuery();
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(blocksNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId, _query);
    });
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
      ref.read(blocksNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _query = _query.copyWith(search: value, clearSearch: value.isEmpty);
      });
      ref
          .read(blocksNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId, _query);
    });
  }

  Future<void> _onSelectStatus(String label) async {
    await Haptics.vibrate(HapticsType.selection);
    final apiValue = _blockStatusApiValue(label);
    setState(() {
      _statusFilter = label;
      _query = _query.copyWith(status: apiValue, clearStatus: apiValue == null);
    });
    ref
        .read(blocksNotifierProvider.notifier)
        .loadFirstPage(widget.propertyId, _query);
  }

  Future<void> _openActions(PropertyBlockModel block, bool isMulti) async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    final canDelete = isMulti && block.unitsCount == 0;
    final deleteDisabledReason = !isMulti
        ? 'Single-unit properties can\'t delete blocks.'
        : 'This block has units — move or delete them first.';
    final action = await showModalBottomSheet<_BlockAction>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
      builder: (_) => _BlockActionsSheet(
        canDelete: canDelete,
        deleteDisabledReason: deleteDisabledReason,
      ),
    );
    if (!mounted || action == null) return;
    if (action == _BlockAction.edit) {
      context.push('/properties/${widget.propertyId}/blocks/${block.id}/edit');
    } else {
      _confirmDelete(block);
    }
  }

  Future<void> _confirmDelete(PropertyBlockModel block) async {
    await Haptics.vibrate(HapticsType.warning);
    if (!mounted) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Delete ${block.name}?',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 21,
            color: RLTokens.ink,
          ),
        ),
        content: Text(
          'Are you sure you want to delete ${block.name}? This can\'t be undone.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              'Delete',
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

    if (confirmed != true || !mounted) return;

    await ref
        .read(deleteBlockNotifierProvider.notifier)
        .submit(propertyId: widget.propertyId, blockId: block.id);

    if (!mounted) return;
    final state = ref.read(deleteBlockNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(propertyBlocksProvider(widget.propertyId));
      ref.invalidate(propertyStatsProvider(widget.propertyId));
      await ref
          .read(blocksNotifierProvider.notifier)
          .loadFirstPage(widget.propertyId, _query);
    } else {
      await Haptics.vibrate(HapticsType.error);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              state.errorMessage ?? 'Something happened. Try again.',
            ),
            backgroundColor: RLTokens.danger,
          ),
        );
      }
    }
  }

  Future<void> _showInfo() async {
    await Haptics.vibrate(HapticsType.selection);
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'What are blocks?',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 21,
            color: RLTokens.ink,
          ),
        ),
        content: Text(
          'Blocks help you organise units within a property — think buildings, '
          'wings, or floors. Every unit belongs to a block, so if your property '
          'doesn\'t need multiple sections, one block (e.g. "Main") can hold '
          'all of its units.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Got it',
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
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(blocksNotifierProvider);
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
              heroTag: 'fab-add-block',
              onPressed: () async {
                await Haptics.vibrate(HapticsType.medium);
                if (context.mounted) {
                  context.push('/properties/${widget.propertyId}/blocks/add');
                }
              },
              backgroundColor: RLTokens.crimson,
              foregroundColor: Colors.white,
              elevation: 3,
              icon: const Icon(Icons.add, size: 20),
              label: Text(
                'Block',
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
            title: 'Blocks',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: RLIconBtn(icon: Icons.info_outline, onTap: _showInfo),
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () => ref
                  .read(blocksNotifierProvider.notifier)
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
                        hint: 'Search blocks',
                        controller: _searchController,
                        onChanged: _onSearchChanged,
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
                        options: _kBlockStatusFilters,
                        selected: _statusFilter,
                        onSelect: _onSelectStatus,
                      ),
                    ),
                  ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _BlocksListSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          onRetry: () => ref
                              .read(blocksNotifierProvider.notifier)
                              .loadFirstPage(widget.propertyId, _query),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyBlocksList(),
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
                          '${state.items.length} of ${state.total} ${state.total == 1 ? 'block' : 'blocks'}',
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
                          (_, i) => _BlockCard(
                            propertyId: widget.propertyId,
                            block: state.items[i],
                            onMore: () => _openActions(state.items[i], isMulti),
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
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────

class _BlockCard extends StatelessWidget {
  const _BlockCard({
    required this.propertyId,
    required this.block,
    required this.onMore,
  });
  final String propertyId;
  final PropertyBlockModel block;
  final VoidCallback onMore;

  @override
  Widget build(BuildContext context) {
    final statusLabel = propertyStatusLabel(block.status);

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) {
          context.push('/properties/$propertyId/blocks/${block.id}/edit');
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          boxShadow: RLTokens.elev1,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 110,
              width: double.infinity,
              child: _BlockThumb(
                imageUrl: (block.images != null && block.images!.isNotEmpty)
                    ? block.images!.first
                    : null,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          block.name,
                          style: TextStyle(
                            fontFamily: RLTokens.fontSerif,
                            fontSize: 17,
                            color: RLTokens.ink,
                            letterSpacing: -0.3,
                            height: 1.15,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      RLPill(statusLabel, tone: statusTone(statusLabel)),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: onMore,
                        child: const Padding(
                          padding: EdgeInsets.all(2),
                          child: Icon(
                            Icons.more_vert_rounded,
                            size: 19,
                            color: RLTokens.mutedSoft,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.grid_view_rounded,
                        size: 13,
                        color: RLTokens.mutedSoft,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${block.unitsCount} ${block.unitsCount == 1 ? 'unit' : 'units'}',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 12,
                        color: RLTokens.mutedSoft,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _formatDate(block.createdAt),
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ),
                  if (block.description != null &&
                      block.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      block.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) {
                        context.push(
                          '/properties/$propertyId/units'
                          '?block_id=${block.id}&block_name=${Uri.encodeComponent(block.name)}',
                        );
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: RLTokens.fill,
                        borderRadius: BorderRadius.circular(RLTokens.rMd),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'View Units',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.ink,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.chevron_right_rounded,
                            size: 15,
                            color: RLTokens.inkSoft,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlockThumb extends StatelessWidget {
  const _BlockThumb({this.imageUrl});
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null) {
      return Image.network(
        imageUrl!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, _, _) => _placeholder(),
        loadingBuilder: (_, child, progress) =>
            progress == null ? child : _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      color: RLTokens.fill,
      child: const Center(
        child: Icon(
          Icons.dashboard_outlined,
          size: 30,
          color: RLTokens.mutedSoft,
        ),
      ),
    );
  }
}

// ── Actions sheet ─────────────────────────────────────────────────────────────

enum _BlockAction { edit, delete }

class _BlockActionsSheet extends StatelessWidget {
  const _BlockActionsSheet({
    required this.canDelete,
    required this.deleteDisabledReason,
  });
  final bool canDelete;
  final String deleteDisabledReason;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            const SizedBox(height: 8),
            _ActionRow(
              icon: Icons.edit_outlined,
              label: 'Edit',
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  Navigator.of(context).pop(_BlockAction.edit);
                }
              },
            ),
            _ActionRow(
              icon: Icons.delete_outline_rounded,
              label: 'Delete',
              danger: true,
              subtitle: canDelete ? null : deleteDisabledReason,
              onTap: canDelete
                  ? () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) {
                        Navigator.of(context).pop(_BlockAction.delete);
                      }
                    }
                  : null,
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
    this.subtitle,
  });
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool danger;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    final color = disabled
        ? RLTokens.mutedSoft
        : (danger ? RLTokens.danger : RLTokens.ink);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      fontWeight: RLTokens.semibold,
                      color: color,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                        height: 1.35,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _BlocksListSkeleton extends StatelessWidget {
  const _BlocksListSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Column(
        children: List.generate(
          4,
          (_) => Container(
            margin: const EdgeInsets.fromLTRB(
              RLTokens.gutter,
              16,
              RLTokens.gutter,
              0,
            ),
            height: 220,
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

class _EmptyBlocksList extends StatelessWidget {
  const _EmptyBlocksList();

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
                Icons.dashboard_outlined,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            Text(
              'No blocks found',
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
              'Blocks help you organise units within this property — think buildings, wings, or floors.',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
                height: 1.45,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('MMM d, y').format(date.toLocal());
}
