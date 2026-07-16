import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/properties_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kStatusFilters = ['All', 'Active', 'Maintenance', 'Inactive'];

String? _statusApiValue(String label) => switch (label) {
  'Active' => 'Property.Status.Active',
  'Maintenance' => 'Property.Status.Maintenance',
  'Inactive' => 'Property.Status.Inactive',
  _ => null,
};

// ── Screen ────────────────────────────────────────────────────────────────────

class PropertiesScreen extends ConsumerStatefulWidget {
  const PropertiesScreen({super.key});

  @override
  ConsumerState<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends ConsumerState<PropertiesScreen> {
  String _statusFilter = 'All';
  PropertiesQuery _query = const PropertiesQuery();
  late final TextEditingController _searchController;
  late final ScrollController _scrollController;
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _scrollController = ScrollController()..addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(propertiesNotifierProvider.notifier).loadFirstPage(_query);
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
      ref.read(propertiesNotifierProvider.notifier).loadNextPage();
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      setState(() {
        _query = _query.copyWith(search: value, clearSearch: value.isEmpty);
      });
      ref.read(propertiesNotifierProvider.notifier).loadFirstPage(_query);
    });
  }

  Future<void> _onSelectStatus(String label) async {
    await Haptics.vibrate(HapticsType.selection);
    final apiValue = _statusApiValue(label);
    setState(() {
      _statusFilter = label;
      _query = _query.copyWith(status: apiValue, clearStatus: apiValue == null);
    });
    ref.read(propertiesNotifierProvider.notifier).loadFirstPage(_query);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertiesNotifierProvider);
    final showSkeleton = state.isLoading && state.items.isEmpty;
    final showError = state.error != null && state.items.isEmpty;
    final showEmpty =
        !state.isLoading && state.error == null && state.items.isEmpty;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab-properties',
        onPressed: () async {
          await Haptics.vibrate(HapticsType.medium);
          if (context.mounted) context.push('/properties/add');
        },
        backgroundColor: RLTokens.crimson,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add, size: 20),
        label: Text(
          'Property',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontWeight: RLTokens.semibold,
            fontSize: 14,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: RLTokens.crimson,
        onRefresh: () =>
            ref.read(propertiesNotifierProvider.notifier).loadFirstPage(_query),
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _Header()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  RLTokens.gutter,
                  12,
                  RLTokens.gutter,
                  0,
                ),
                child: RLSearchBar(
                  hint: 'Search properties',
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 14, 0, 0),
                child: RLFilterChips(
                  options: _kStatusFilters,
                  selected: _statusFilter,
                  onSelect: _onSelectStatus,
                ),
              ),
            ),
            if (showSkeleton)
              const SliverToBoxAdapter(child: _PropertiesSkeleton())
            else if (showError)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Padding(
                  padding: const EdgeInsets.all(RLTokens.gutter),
                  child: RLSectionError(
                    onRetry: () => ref
                        .read(propertiesNotifierProvider.notifier)
                        .loadFirstPage(_query),
                  ),
                ),
              )
            else if (showEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: _EmptyProperties(),
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
                    '${state.items.length} of ${state.total} ${state.total == 1 ? 'property' : 'properties'}',
                    style: TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _PropCard(prop: state.items[i]),
                  childCount: state.items.length,
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
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        RLTokens.statusTop,
        RLTokens.gutter,
        16,
      ),
      child: Row(
        children: [
          Text(
            'Properties',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: RLTokens.textTitle,
              color: RLTokens.ink,
              letterSpacing: -0.4,
              height: 1.1,
            ),
          ),
          const Spacer(),
          RLIconBtn(
            icon: Icons.add,
            onTap: () async {
              await Haptics.vibrate(HapticsType.medium);
              if (context.mounted) context.push('/properties/add');
            },
          ),
        ],
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyProperties extends StatelessWidget {
  const _EmptyProperties();

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
                Icons.apartment_outlined,
                size: 22,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 11),
            Text(
              'No properties found',
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _PropertiesSkeleton extends StatelessWidget {
  const _PropertiesSkeleton();

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
            height: 116,
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

// ── Property card ─────────────────────────────────────────────────────────────

class _PropCard extends StatelessWidget {
  const _PropCard({required this.prop});
  final PropertyModel prop;

  @override
  Widget build(BuildContext context) {
    final statusLabel = propertyStatusLabel(prop.status);
    final typeLabel = propertyTypeLabel(prop.type);
    final location = [
      prop.address,
    ].where((v) => v != null && v.isNotEmpty).join(', ');

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push('/properties/${prop.id}');
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          0,
          RLTokens.gutter,
          12,
        ),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          boxShadow: RLTokens.elev1,
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 104,
              height: 116,
              child: _PropThumb(
                type: prop.type,
                imageUrl: (prop.images != null && prop.images!.isNotEmpty)
                    ? prop.images!.first
                    : null,
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name + status
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            prop.name,
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
                      ],
                    ),
                    const SizedBox(height: 5),
                    // Location
                    if (location.isNotEmpty)
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 13,
                            color: RLTokens.mutedSoft,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location,
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12,
                                color: RLTokens.muted,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 10),
                    // Occupancy placeholder — no backing field on this
                    // endpoint yet; kept visually so a later pass can wire
                    // real occupancy data into this exact slot.
                    Row(
                      children: [
                        Expanded(
                          child: RLBar(
                            percent: 0,
                            height: 6,
                            color: RLTokens.crimson,
                            trackColor: RLTokens.fill,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '—/—',
                          style: TextStyle(
                            fontFamily: RLTokens.fontMono,
                            fontSize: 11,
                            color: RLTokens.mutedSoft,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 9),
                    RLPill(typeLabel, tone: RLTone.neutral),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Property thumbnail (real photo, falls back to a type-colored tile) ────────

class _PropThumb extends StatelessWidget {
  const _PropThumb({required this.type, this.imageUrl});
  final String type;
  final String? imageUrl;

  static Color _color(String type) => switch (type) {
    'MULTI' => const Color(0xFF2A4099),
    _ => const Color(0xFF8A5F20),
  };

  static IconData _icon(String type) => switch (type) {
    'MULTI' => Icons.apartment_rounded,
    _ => Icons.house_rounded,
  };

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null) {
      return Image.network(
        imageUrl!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        // No real photo yet, or the URL is broken — fall back to the
        // decorative tile rather than a blank/broken-image icon.
        errorBuilder: (_, _, _) => _PlaceholderTile(type: type),
        loadingBuilder: (_, child, progress) =>
            progress == null ? child : _PlaceholderTile(type: type),
      );
    }
    return _PlaceholderTile(type: type);
  }
}

class _PlaceholderTile extends StatelessWidget {
  const _PlaceholderTile({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    final bg = _PropThumb._color(type);
    return Container(
      color: bg,
      child: Stack(
        children: [
          Center(
            child: Icon(
              _PropThumb._icon(type),
              size: 34,
              color: Colors.white.withAlpha(40),
            ),
          ),
          Positioned(
            bottom: 9,
            left: 9,
            child: Text(
              propertyTypeLabel(type).toUpperCase(),
              style: TextStyle(
                fontFamily: RLTokens.fontMono,
                fontSize: 8.5,
                letterSpacing: 0.6,
                color: Colors.white.withAlpha(170),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
