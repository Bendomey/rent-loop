import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/tenants/tenants_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kTenantStatusFilters = ['All', 'Active', 'Expired'];

String? _tenantStatusApiValue(String label) => switch (label) {
  'Active' => 'ACTIVE',
  'Expired' => 'EXPIRED',
  _ => null,
};

// ── Screen ────────────────────────────────────────────────────────────────────

class TenantsScreen extends ConsumerStatefulWidget {
  const TenantsScreen({super.key, this.propertyId, this.propertyName});

  /// Pre-applied property filter — set when arriving from a property's
  /// detail page (Manage-grid "Tenants" tile), via GoRouter query params.
  /// This is the same global tenants list either way; the filter is just
  /// pre-seeded rather than the screen being a different one.
  final String? propertyId;
  final String? propertyName;

  @override
  ConsumerState<TenantsScreen> createState() => _TenantsScreenState();
}

class _TenantsScreenState extends ConsumerState<TenantsScreen> {
  String _statusFilter = 'All';
  late TenantsQuery _query;
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _query = TenantsQuery(propertyId: widget.propertyId);
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tenantsNotifierProvider.notifier).loadFirstPage(_query);
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
      ref.read(tenantsNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _query = _query.copyWith(search: value, clearSearch: value.isEmpty);
      });
      ref.read(tenantsNotifierProvider.notifier).loadFirstPage(_query);
    });
  }

  Future<void> _onSelectStatus(String label) async {
    await Haptics.vibrate(HapticsType.selection);
    final apiValue = _tenantStatusApiValue(label);
    setState(() {
      _statusFilter = label;
      _query = _query.copyWith(status: apiValue, clearStatus: apiValue == null);
    });
    ref.read(tenantsNotifierProvider.notifier).loadFirstPage(_query);
  }

  Future<void> _clearPropertyFilter() async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _query = _query.copyWith(clearPropertyId: true));
    ref.read(tenantsNotifierProvider.notifier).loadFirstPage(_query);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tenantsNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Tenants',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () => ref
                  .read(tenantsNotifierProvider.notifier)
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
                        hint: 'Search by name or phone',
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
                        options: _kTenantStatusFilters,
                        selected: _statusFilter,
                        onSelect: _onSelectStatus,
                      ),
                    ),
                  ),
                  if (showSkeleton)
                    const SliverToBoxAdapter(child: _TenantsListSkeleton())
                  else if (showError)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Padding(
                        padding: const EdgeInsets.all(RLTokens.gutter),
                        child: RLSectionError(
                          onRetry: () => ref
                              .read(tenantsNotifierProvider.notifier)
                              .loadFirstPage(_query),
                        ),
                      ),
                    )
                  else if (showEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: _EmptyTenantsList(),
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
                          '${state.items.length} of ${state.total} ${state.total == 1 ? 'tenant' : 'tenants'}',
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
                              return _TenantRow(
                                tenant: e.value,
                                last: last,
                                onTap: () async {
                                  await Haptics.vibrate(HapticsType.selection);
                                  if (context.mounted) {
                                    context.push('/more/tenants/${e.value.id}');
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

class _TenantRow extends StatelessWidget {
  const _TenantRow({
    required this.tenant,
    required this.last,
    required this.onTap,
  });
  final TenantModel tenant;
  final bool last;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final lease = tenant.recentLease;
    final unit = lease?.unit;
    final subtitle = unit != null
        ? [
            unit.name,
            unit.property?.name,
          ].whereType<String>().where((v) => v.isNotEmpty).join(' · ')
        : tenant.phone;
    final statusLabel = lease != null
        ? propertyStatusLabel(lease.status)
        : 'No lease';

    return RLRow(
      leading: _TenantAvatar(tenant: tenant),
      title: tenant.fullName,
      subtitle: subtitle,
      last: last,
      showChevron: false,
      trailing: RLPill(
        statusLabel,
        tone: lease != null ? statusTone(statusLabel) : RLTone.neutral,
      ),
      onTap: onTap,
    );
  }
}

class _TenantAvatar extends StatelessWidget {
  const _TenantAvatar({required this.tenant});
  final TenantModel tenant;

  @override
  Widget build(BuildContext context) {
    final photo = tenant.profilePhotoUrl;
    if (photo == null || photo.isEmpty) {
      return RLAvatar(tenant.fullName, size: 44);
    }
    return ClipOval(
      child: Image.network(
        photo,
        width: 44,
        height: 44,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => RLAvatar(tenant.fullName, size: 44),
        loadingBuilder: (_, child, progress) =>
            progress == null ? child : RLAvatar(tenant.fullName, size: 44),
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _TenantsListSkeleton extends StatelessWidget {
  const _TenantsListSkeleton();

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

class _EmptyTenantsList extends StatelessWidget {
  const _EmptyTenantsList();

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
                Icons.people_outline_rounded,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            Text(
              'No tenants found',
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
