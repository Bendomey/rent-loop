import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/property_stats_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_units_preview_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Screen ────────────────────────────────────────────────────────────────────

class PropertyDetailScreen extends ConsumerWidget {
  const PropertyDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyAsync = ref.watch(propertyDetailProvider(id));
    final statsAsync = ref.watch(propertyStatsProvider(id));
    final unitsAsync = ref.watch(propertyUnitsPreviewProvider(id));

    final showSkeleton = !propertyAsync.hasValue && propertyAsync.isLoading;
    final showError = propertyAsync.hasError && !propertyAsync.hasValue;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: propertyAsync.valueOrNull?.name ?? '',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: RLIconBtn(
              icon: Icons.settings_outlined,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) context.push('/properties/$id/settings');
              },
            ),
          ),
          Expanded(
            child: showSkeleton
                ? const _DetailSkeleton()
                : showError
                ? Padding(
                    padding: const EdgeInsets.all(RLTokens.gutter),
                    child: RLSectionError(
                      onRetry: () => ref.invalidate(propertyDetailProvider(id)),
                    ),
                  )
                : RefreshIndicator(
                    color: RLTokens.crimson,
                    onRefresh: () async {
                      await Future.wait([
                        ref.refresh(propertyDetailProvider(id).future),
                        ref.refresh(propertyStatsProvider(id).future),
                        ref.refresh(propertyUnitsPreviewProvider(id).future),
                      ]);
                    },
                    child: _DetailContent(
                      id: id,
                      property: propertyAsync.value!,
                      statsAsync: statsAsync,
                      unitsAsync: unitsAsync,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        children: [
          Container(
            height: 170,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
          Container(
            height: 132,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────

class _DetailContent extends ConsumerWidget {
  const _DetailContent({
    required this.id,
    required this.property,
    required this.statsAsync,
    required this.unitsAsync,
  });

  final String id;
  final PropertyModel property;
  final AsyncValue<PropertyStats> statsAsync;
  final AsyncValue<UnitsPage> unitsAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusLabel = propertyStatusLabel(property.status);
    final typeLabel = propertyTypeLabel(property.type);
    final modes = property.modes ?? const [];
    final isLease = modes.contains('LEASE');
    final isBooking = modes.contains('BOOKING');
    final location = [
      property.address,
      property.city,
    ].whereType<String>().where((v) => v.isNotEmpty).join(', ');

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: _HeroCarousel(
            images: property.images ?? const [],
            type: property.type,
            name: property.name,
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  RLPill(statusLabel, tone: statusTone(statusLabel)),
                  RLPill(typeLabel, tone: RLTone.neutral),
                  if (isLease) RLPill('Long stay', tone: RLTone.neutral),
                  if (isBooking) RLPill('Short stay', tone: RLTone.neutral),
                ],
              ),
              const SizedBox(height: 14),
              if (location.isNotEmpty) ...[
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 15,
                      color: RLTokens.mutedSoft,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        location,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 13.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
              if (!statsAsync.hasValue && statsAsync.isLoading)
                const _StatsCardSkeleton()
              else if (statsAsync.hasError && !statsAsync.hasValue)
                RLSectionError(
                  compact: true,
                  onRetry: () => ref.invalidate(propertyStatsProvider(id)),
                )
              else if (statsAsync.hasValue)
                _StatsCard(stats: statsAsync.value!),
              RLLabel('Manage'),
              _ManageGrid(property: property, stats: statsAsync.valueOrNull),
              ..._buildUnitsSection(context, ref),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildUnitsSection(BuildContext context, WidgetRef ref) {
    final showSeeAll =
        unitsAsync.hasValue &&
        shouldShowSeeAllUnits(unitsAsync.value!.meta.total);

    return [
      RLLabel(
        'Units',
        action: showSeeAll ? 'See all' : null,
        onAction: showSeeAll
            ? () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) context.push('/properties/$id/units');
              }
            : null,
      ),
      if (!unitsAsync.hasValue && unitsAsync.isLoading)
        const _UnitsCardSkeleton()
      else if (unitsAsync.hasError && !unitsAsync.hasValue)
        RLSectionError(
          compact: true,
          onRetry: () => ref.invalidate(propertyUnitsPreviewProvider(id)),
        )
      else if (unitsAsync.hasValue && unitsAsync.value!.rows.isEmpty)
        const _EmptyUnits()
      else if (unitsAsync.hasValue)
        _UnitsCard(units: unitsAsync.value!.rows),
    ];
  }
}

// ── Hero image carousel ──────────────────────────────────────────────────────

class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel({
    required this.images,
    required this.type,
    required this.name,
  });

  final List<String> images;
  final String type;
  final String name;

  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.images;
    final typeLabel = propertyTypeLabel(widget.type);

    return SizedBox(
      height: 170,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (images.isEmpty)
            _HeroPlaceholder(type: widget.type)
          else
            PageView.builder(
              controller: _controller,
              itemCount: images.length,
              onPageChanged: (i) => setState(() => _page = i),
              itemBuilder: (_, i) => Image.network(
                images[i],
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
                errorBuilder: (_, _, _) => _HeroPlaceholder(type: widget.type),
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : _HeroPlaceholder(type: widget.type),
              ),
            ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 90,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withAlpha(0),
                    Colors.black.withAlpha(130),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  typeLabel.toUpperCase(),
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    color: Colors.white.withAlpha(150),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.name,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 22,
                    color: Colors.white.withAlpha(230),
                    letterSpacing: -0.3,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 16,
              right: 20,
              child: Row(
                children: List.generate(
                  images.length,
                  (i) => Container(
                    margin: const EdgeInsets.only(left: 4),
                    width: i == _page ? 14 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(i == _page ? 230 : 110),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroPlaceholder extends StatelessWidget {
  const _HeroPlaceholder({required this.type});
  final String type;

  static Color _bg(String type) => switch (type) {
    'MULTI' => const Color(0xFF2A4099),
    _ => const Color(0xFF8A5F20),
  };

  static IconData _icon(String type) => switch (type) {
    'MULTI' => Icons.apartment_rounded,
    _ => Icons.house_rounded,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _bg(type),
      child: Center(
        child: Icon(_icon(type), size: 64, color: Colors.white.withAlpha(30)),
      ),
    );
  }
}

// ── Stats card ────────────────────────────────────────────────────────────────

class _StatsCard extends StatelessWidget {
  const _StatsCard({required this.stats});
  final PropertyStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          RLDonut(
            percent: stats.occupancyPercent,
            size: 88,
            thickness: 12,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${stats.occupancyPercent.toInt()}%',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 23,
                    color: RLTokens.ink,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'occupied',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 9.5,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    RLMetric(
                      value: '${stats.unitsOccupied}',
                      label: 'Occupied',
                    ),
                    RLMetric(
                      value: '${stats.unitsAvailable}',
                      label: 'Available',
                    ),
                    RLMetric(
                      value: '${stats.unitsMaintenance}',
                      label: 'In maint.',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(height: 1, color: RLTokens.hairlineSoft),
                const SizedBox(height: 12),
                Text(
                  'Monthly revenue',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 3),
                RLMoney(pesewasToCedis(stats.monthlyRevenuePesewas), size: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsCardSkeleton extends StatelessWidget {
  const _StatsCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Container(
        height: 132,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
        ),
      ),
    );
  }
}

// ── Manage grid ───────────────────────────────────────────────────────────────

class _ManageAction {
  const _ManageAction({
    required this.icon,
    required this.label,
    this.count,
    this.onTap,
  });
  final IconData icon;
  final String label;
  final String? count;
  final void Function(BuildContext context)? onTap;
}

class _ManageGrid extends StatelessWidget {
  const _ManageGrid({required this.property, required this.stats});
  final PropertyModel property;
  final PropertyStats? stats;

  String _count(int Function(PropertyStats) selector) {
    final s = stats;
    if (s == null) return '—';
    return '${selector(s)}';
  }

  @override
  Widget build(BuildContext context) {
    final isBooking = (property.modes ?? const []).contains('BOOKING');

    final actions = [
      _ManageAction(
        icon: Icons.grid_view_rounded,
        label: 'Units',
        count: _count((s) => s.unitsTotal),
        onTap: (context) => context.push('/properties/${property.id}/units'),
      ),
      _ManageAction(
        icon: Icons.people_outline_rounded,
        label: 'Tenants',
        count: _count((s) => s.unitsOccupied),
      ),
      _ManageAction(
        icon: Icons.description_outlined,
        label: 'Leases',
        count: _count((s) => s.activeLeases),
      ),
      _ManageAction(
        icon: Icons.assignment_outlined,
        label: 'Applications',
        count: _count((s) => s.pendingApplications),
      ),
      _ManageAction(
        icon: Icons.calendar_today_outlined,
        label: 'Bookings',
        count: isBooking ? _count((s) => s.activeBookings) : '—',
      ),
      const _ManageAction(icon: Icons.explore_outlined, label: 'Calendar'),
    ];

    Widget row(int start) => Row(
      children: List.generate(3, (j) {
        final idx = start + j;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: j == 0 ? 0 : 5,
              right: j == 2 ? 0 : 5,
            ),
            child: _ManageCell(action: actions[idx]),
          ),
        );
      }),
    );

    return Column(children: [row(0), const SizedBox(height: 10), row(3)]);
  }
}

class _ManageCell extends StatelessWidget {
  const _ManageCell({required this.action});
  final _ManageAction action;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (action.onTap != null && context.mounted) action.onTap!(context);
      },
      child: SizedBox(
        height: 96,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(action.icon, size: 21, color: RLTokens.crimson),
              const Spacer(),
              Text(
                action.label,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.ink,
                ),
              ),
              if (action.count != null)
                Text(
                  action.count!,
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 11,
                    color: RLTokens.muted,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Units preview ─────────────────────────────────────────────────────────────

class _UnitsCard extends StatelessWidget {
  const _UnitsCard({required this.units});
  final List<UnitModel> units;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: units.asMap().entries.map((e) {
          final u = e.value;
          final last = e.key == units.length - 1;
          final statusLabel = propertyStatusLabel(u.status);
          return RLRow(
            leading: _UnitAvatar(unit: u),
            title: u.name,
            subtitle: unitTypeLabel(u.type),
            trailing: RLPill(statusLabel, tone: statusTone(statusLabel)),
            showChevron: false,
            last: last,
            onTap: () async => Haptics.vibrate(HapticsType.selection),
          );
        }).toList(),
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

class _UnitsCardSkeleton extends StatelessWidget {
  const _UnitsCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Container(
        height: 220,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
        ),
      ),
    );
  }
}

class _EmptyUnits extends StatelessWidget {
  const _EmptyUnits();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Text(
        'No units yet.',
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13,
          color: RLTokens.muted,
        ),
      ),
    );
  }
}
