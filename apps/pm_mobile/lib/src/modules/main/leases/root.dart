import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/leases/leases_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kLeaseStatusFilters = [
  'All',
  'Pending',
  'Active',
  'Completed',
  'Cancelled',
  'Terminated',
];

String? _leaseStatusApiValue(String label) =>
    label == 'All' ? null : 'Lease.Status.$label';

// ── Screen ────────────────────────────────────────────────────────────────────

class LeasesScreen extends ConsumerStatefulWidget {
  const LeasesScreen({super.key, this.propertyId, this.propertyName});

  /// Pre-applied property filter — set when arriving from a property's
  /// detail page (Manage-grid "Leases" tile), via GoRouter query params.
  /// This is the same global leases list either way; the filter is just
  /// pre-seeded rather than the screen being a different one — mirrors
  /// `tenants/root.dart`.
  final String? propertyId;
  final String? propertyName;

  @override
  ConsumerState<LeasesScreen> createState() => _LeasesScreenState();
}

class _LeasesScreenState extends ConsumerState<LeasesScreen> {
  String _statusFilter = 'All';
  late LeasesQuery _query;
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _query = LeasesQuery(propertyId: widget.propertyId);
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(leasesNotifierProvider.notifier).loadFirstPage(_query);
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
      ref.read(leasesNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _query = _query.copyWith(search: value, clearSearch: value.isEmpty);
      });
      ref.read(leasesNotifierProvider.notifier).loadFirstPage(_query);
    });
  }

  Future<void> _onSelectStatus(String label) async {
    await Haptics.vibrate(HapticsType.selection);
    final apiValue = _leaseStatusApiValue(label);
    setState(() {
      _statusFilter = label;
      _query = _query.copyWith(status: apiValue, clearStatus: apiValue == null);
    });
    ref.read(leasesNotifierProvider.notifier).loadFirstPage(_query);
  }

  Future<void> _clearPropertyFilter() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _query = _query.copyWith(clearPropertyId: true));
    ref.read(leasesNotifierProvider.notifier).loadFirstPage(_query);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(leasesNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Leases',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () => ref
                  .read(leasesNotifierProvider.notifier)
                  .loadFirstPage(_query),
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
                        hint: 'Search by lease code',
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                      ),
                    ),
                  ),
                  if (_query.propertyId != null && widget.propertyName != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          RLTokens.gutter,
                          12,
                          RLTokens.gutter,
                          0,
                        ),
                        child: GestureDetector(
                          onTap: _clearPropertyFilter,
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
                                  'Property: ${widget.propertyName}',
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
                        options: _kLeaseStatusFilters,
                        selected: _statusFilter,
                        onSelect: _onSelectStatus,
                      ),
                    ),
                  ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _LeasesListSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          onRetry: () => ref
                              .read(leasesNotifierProvider.notifier)
                              .loadFirstPage(_query),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyLeasesList(),
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
                          '${state.items.length} of ${state.total} ${state.total == 1 ? 'lease' : 'leases'}',
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
                      sliver: SliverToBoxAdapter(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: RLTokens.surface,
                            borderRadius: BorderRadius.circular(RLTokens.rLg),
                            border: Border.all(color: RLTokens.hairline),
                          ),
                          child: Column(
                            children: state.items.asMap().entries.map((e) {
                              final last = e.key == state.items.length - 1;
                              return _LeaseRow(
                                lease: e.value,
                                last: last,
                                onTap: () async {
                                  await Haptics.vibrate(HapticsType.selection);
                                  if (context.mounted) {
                                    context.push('/more/leases/${e.value.id}');
                                  }
                                },
                              );
                            }).toList(),
                          ),
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

class _LeaseRow extends StatelessWidget {
  const _LeaseRow({
    required this.lease,
    required this.last,
    required this.onTap,
  });
  final LeaseModel lease;
  final bool last;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tenant = lease.tenant;
    final unit = lease.unit;
    final subtitle = unit != null
        ? [
            unit.name,
            unit.property?.name,
          ].whereType<String>().where((v) => v.isNotEmpty).join(' · ')
        : lease.code;
    final statusLabel = propertyStatusLabel(lease.status);

    return RLRow(
      leading: _LeaseIcon(),
      title: tenant?.fullName ?? lease.code,
      subtitle: subtitle,
      last: last,
      showChevron: false,
      trailing: RLPill(statusLabel, tone: statusTone(statusLabel)),
      onTap: onTap,
    );
  }
}

class _LeaseIcon extends StatelessWidget {
  const _LeaseIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: RLTokens.fill,
        borderRadius: BorderRadius.circular(RLTokens.rSm),
      ),
      child: const Icon(
        Icons.description_outlined,
        size: 20,
        color: RLTokens.muted,
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _LeasesListSkeleton extends StatelessWidget {
  const _LeasesListSkeleton();

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

class _EmptyLeasesList extends StatelessWidget {
  const _EmptyLeasesList();

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
                Icons.description_outlined,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            Text(
              'No leases found',
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
          ],
        ),
      ),
    );
  }
}
