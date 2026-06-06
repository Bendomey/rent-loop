import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (matches design spec) ──────────────────────────────────────────

class _PropData {
  const _PropData({
    required this.id,
    required this.name,
    required this.area,
    required this.type,
    required this.mode,
    required this.units,
    required this.occupied,
    required this.available,
    required this.maint,
    required this.revenue,
    required this.status,
  });
  final String id;
  final String name;
  final String area;
  final String type;
  final String mode;
  final int    units;
  final int    occupied;
  final int    available;
  final int    maint;
  final int    revenue;
  final String status;
}

const _kProps = [
  _PropData(id: 'p1', name: 'Cantonments Court',   area: 'Cantonments, Accra',  type: 'Apartments', mode: 'Lease',   units: 24, occupied: 22, available: 1, maint: 1, revenue: 86000, status: 'Active'),
  _PropData(id: 'p2', name: 'Spintex Heights',      area: 'Spintex Road, Accra', type: 'Apartments', mode: 'Both',    units: 18, occupied: 15, available: 2, maint: 1, revenue: 54000, status: 'Active'),
  _PropData(id: 'p3', name: 'Labadi Beach Suites',  area: 'Labadi, Accra',       type: 'Serviced',   mode: 'Booking', units: 12, occupied: 11, available: 1, maint: 0, revenue: 31500, status: 'Active'),
  _PropData(id: 'p4', name: 'East Legon Villa',     area: 'East Legon, Accra',   type: 'House',      mode: 'Lease',   units:  1, occupied:  1, available: 0, maint: 0, revenue:  9000, status: 'Active'),
  _PropData(id: 'p5', name: 'Osu Retail Block',     area: 'Oxford St, Osu',      type: 'Commercial', mode: 'Lease',   units:  9, occupied:  7, available: 2, maint: 0, revenue:  4000, status: 'Draft'),
];

const _kFilters = ['All', 'Lease', 'Booking', 'Both', 'Draft'];

final _totalUnits = _kProps.fold(0, (s, p) => s + p.units);

// ── Screen ────────────────────────────────────────────────────────────────────

class PropertiesScreen extends StatefulWidget {
  const PropertiesScreen({super.key});

  @override
  State<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends State<PropertiesScreen> {
  String _filter = 'All';

  List<_PropData> get _visible => _filter == 'All'
      ? _kProps
      : _kProps.where((p) {
          if (_filter == 'Draft') return p.status == 'Draft';
          return p.mode == _filter;
        }).toList();

  @override
  Widget build(BuildContext context) {
    final visible = _visible;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async => Haptics.vibrate(HapticsType.medium),
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
        onRefresh: () async => Haptics.vibrate(HapticsType.light),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _Header()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 0),
                child: RLSearchBar(hint: 'Search properties or units'),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 14, 0, 0),
                child: RLFilterChips(
                  options: _kFilters,
                  selected: _filter,
                  onSelect: (f) async {
                    await Haptics.vibrate(HapticsType.selection);
                    setState(() => _filter = f);
                  },
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 10),
                child: Text(
                  '${visible.length} ${visible.length == 1 ? 'property' : 'properties'} · $_totalUnits units',
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
                (_, i) => _PropCard(prop: visible[i]),
                childCount: visible.length,
              ),
            ),
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
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, RLTokens.statusTop, RLTokens.gutter, 16),
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
          RLIconBtn(icon: Icons.add, onTap: () async => Haptics.vibrate(HapticsType.medium)),
        ],
      ),
    );
  }
}

// ── Property card ─────────────────────────────────────────────────────────────

class _PropCard extends StatelessWidget {
  const _PropCard({required this.prop});
  final _PropData prop;

  @override
  Widget build(BuildContext context) {
    final p       = prop;
    final occPct  = (p.occupied / p.units * 100).roundToDouble();
    final isActive = p.status == 'Active';

    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push('/properties/${p.id}');
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 12),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          boxShadow: RLTokens.elev1,
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _PropThumb(type: p.type, width: 104),
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
                              p.name,
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
                          RLPill(p.status, tone: isActive ? RLTone.success : RLTone.neutral),
                        ],
                      ),
                      const SizedBox(height: 5),
                      // Location
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: RLTokens.mutedSoft),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              p.area,
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
                      // Occupancy bar
                      Row(
                        children: [
                          Expanded(
                            child: RLBar(
                              percent: occPct,
                              height: 6,
                              color: RLTokens.crimson,
                              trackColor: RLTokens.fill,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${p.occupied}/${p.units}',
                            style: TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 11,
                              color: RLTokens.muted,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 9),
                      // Mode pill + revenue
                      Row(
                        children: [
                          RLPill(p.mode, tone: RLTone.neutral),
                          const Spacer(),
                          RichText(
                            text: TextSpan(
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13,
                                fontWeight: RLTokens.semibold,
                                color: RLTokens.ink,
                              ),
                              children: [
                                TextSpan(text: 'GH₵ ${_fmtNum(p.revenue)}'),
                                TextSpan(
                                  text: '/mo',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: RLTokens.regular,
                                    color: RLTokens.mutedSoft,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Property thumbnail placeholder ────────────────────────────────────────────

class _PropThumb extends StatelessWidget {
  const _PropThumb({required this.type, required this.width});
  final String type;
  final double width;

  static Color _color(String type) => switch (type) {
    'Apartments' => const Color(0xFF2A4099),
    'Serviced'   => const Color(0xFF1A8570),
    'House'      => const Color(0xFF8A5F20),
    'Commercial' => const Color(0xFF48586F),
    _            => const Color(0xFF2C3340),
  };

  static IconData _icon(String type) => switch (type) {
    'Apartments' => Icons.apartment_rounded,
    'Serviced'   => Icons.hotel_rounded,
    'House'      => Icons.house_rounded,
    'Commercial' => Icons.store_rounded,
    _            => Icons.business_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final bg = _color(type);
    return Container(
      width: width,
      color: bg,
      child: Stack(
        children: [
          Center(
            child: Icon(_icon(type), size: 34, color: Colors.white.withAlpha(40)),
          ),
          Positioned(
            bottom: 9,
            left: 9,
            child: Text(
              type.toUpperCase(),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

String _fmtNum(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
