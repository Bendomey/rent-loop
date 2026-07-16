import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Property data (shared with list screen via re-declaration) ─────────────

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
  final int units;
  final int occupied;
  final int available;
  final int maint;
  final int revenue;
  final String status;
}

const _kProps = [
  _PropData(
    id: 'p1',
    name: 'Cantonments Court',
    area: 'Cantonments, Accra',
    type: 'Apartments',
    mode: 'Lease',
    units: 24,
    occupied: 22,
    available: 1,
    maint: 1,
    revenue: 86000,
    status: 'Active',
  ),
  _PropData(
    id: 'p2',
    name: 'Spintex Heights',
    area: 'Spintex Road, Accra',
    type: 'Apartments',
    mode: 'Both',
    units: 18,
    occupied: 15,
    available: 2,
    maint: 1,
    revenue: 54000,
    status: 'Active',
  ),
  _PropData(
    id: 'p3',
    name: 'Labadi Beach Suites',
    area: 'Labadi, Accra',
    type: 'Serviced',
    mode: 'Booking',
    units: 12,
    occupied: 11,
    available: 1,
    maint: 0,
    revenue: 31500,
    status: 'Active',
  ),
  _PropData(
    id: 'p4',
    name: 'East Legon Villa',
    area: 'East Legon, Accra',
    type: 'House',
    mode: 'Lease',
    units: 1,
    occupied: 1,
    available: 0,
    maint: 0,
    revenue: 9000,
    status: 'Active',
  ),
  _PropData(
    id: 'p5',
    name: 'Osu Retail Block',
    area: 'Oxford St, Osu',
    type: 'Commercial',
    mode: 'Lease',
    units: 9,
    occupied: 7,
    available: 2,
    maint: 0,
    revenue: 4000,
    status: 'Draft',
  ),
];

// ── Unit data ─────────────────────────────────────────────────────────────────

class _UnitData {
  const _UnitData({
    required this.id,
    required this.name,
    required this.cat,
    required this.status,
    this.tenant,
    required this.rent,
  });
  final String id;
  final String name;
  final String cat;
  final String status;
  final String? tenant;
  final int rent;
}

const _kUnits = [
  _UnitData(
    id: 'u1',
    name: 'Unit 4B',
    cat: '2-Bedroom',
    status: 'Occupied',
    tenant: 'Kwame Mensah',
    rent: 4200,
  ),
  _UnitData(
    id: 'u2',
    name: 'Unit 5A',
    cat: '2-Bedroom',
    status: 'Occupied',
    tenant: 'Ama Boateng',
    rent: 4200,
  ),
  _UnitData(
    id: 'u3',
    name: 'Unit 1C',
    cat: '1-Bedroom',
    status: 'Available',
    tenant: null,
    rent: 3000,
  ),
  _UnitData(
    id: 'u4',
    name: 'Unit 3B',
    cat: '3-Bedroom',
    status: 'Maintenance',
    tenant: 'Yaw Asante',
    rent: 5500,
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class PropertyDetailScreen extends StatelessWidget {
  const PropertyDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final p = _kProps.firstWhere(
      (x) => x.id == id,
      orElse: () => _kProps.first,
    );
    final occPct = (p.occupied / p.units * 100).roundToDouble();
    final isActive = p.status == 'Active';

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: p.name,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: RLIconBtn(
              icon: Icons.settings_outlined,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted)
                  context.push('/properties/${p.id}/settings');
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () async => Haptics.vibrate(HapticsType.light),
              child: CustomScrollView(
                slivers: [
                  // Hero image
                  SliverToBoxAdapter(
                    child: _HeroImage(type: p.type, name: p.name, propId: p.id),
                  ),

                  // Info body
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        // Status + mode pills
                        Row(
                          children: [
                            RLPill(
                              p.status,
                              tone: isActive ? RLTone.success : RLTone.neutral,
                            ),
                            const SizedBox(width: 8),
                            if (p.mode == 'Both') ...[
                              RLPill('Long stay', tone: RLTone.neutral),
                              const SizedBox(width: 6),
                              RLPill('Short stay', tone: RLTone.neutral),
                            ] else
                              RLPill(
                                p.mode == 'Lease' ? 'Long stay' : 'Short stay',
                                tone: RLTone.neutral,
                              ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              size: 15,
                              color: RLTokens.mutedSoft,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              p.area,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 13.5,
                                color: RLTokens.muted,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Occupancy + revenue card
                        _OccupancyCard(p: p, occPct: occPct),

                        // Manage grid
                        RLLabel('Manage'),
                        _ManageGrid(p: p),

                        // Units preview
                        RLLabel(
                          'Units',
                          action: 'See all',
                          onAction: () async =>
                              Haptics.vibrate(HapticsType.selection),
                        ),
                        _UnitsCard(),
                        const SizedBox(height: 32),
                      ]),
                    ),
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

// ── Hero image placeholder ────────────────────────────────────────────────────

class _HeroImage extends StatelessWidget {
  const _HeroImage({
    required this.type,
    required this.name,
    required this.propId,
  });
  final String type;
  final String name;
  final String propId;

  static Color _bg(String type) => switch (type) {
    'Apartments' => const Color(0xFF2A4099),
    'Serviced' => const Color(0xFF1A8570),
    'House' => const Color(0xFF8A5F20),
    'Commercial' => const Color(0xFF48586F),
    _ => const Color(0xFF2C3340),
  };

  static IconData _icon(String type) => switch (type) {
    'Apartments' => Icons.apartment_rounded,
    'Serviced' => Icons.hotel_rounded,
    'House' => Icons.house_rounded,
    'Commercial' => Icons.store_rounded,
    _ => Icons.business_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final bg = _bg(type);
    return Container(
      height: 170,
      width: double.infinity,
      color: bg,
      child: Stack(
        children: [
          Center(
            child: Icon(
              _icon(type),
              size: 64,
              color: Colors.white.withAlpha(30),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  type.toUpperCase(),
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    letterSpacing: 1.2,
                    color: Colors.white.withAlpha(150),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
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
        ],
      ),
    );
  }
}

// ── Occupancy + revenue card ──────────────────────────────────────────────────

class _OccupancyCard extends StatelessWidget {
  const _OccupancyCard({required this.p, required this.occPct});
  final _PropData p;
  final double occPct;

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
          // Donut
          RLDonut(
            percent: occPct,
            size: 88,
            thickness: 12,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${occPct.toInt()}%',
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
          // Stats + revenue
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    RLMetric(value: '${p.occupied}', label: 'Occupied'),
                    RLMetric(value: '${p.available}', label: 'Available'),
                    RLMetric(value: '${p.maint}', label: 'In maint.'),
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
                RLMoney(p.revenue, size: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Manage grid ───────────────────────────────────────────────────────────────

class _ManageAction {
  const _ManageAction({required this.icon, required this.label, this.count});
  final IconData icon;
  final String label;
  final int? count;
}

class _ManageGrid extends StatelessWidget {
  const _ManageGrid({required this.p});
  final _PropData p;

  @override
  Widget build(BuildContext context) {
    final actions = [
      _ManageAction(
        icon: Icons.grid_view_rounded,
        label: 'Units',
        count: p.units,
      ),
      _ManageAction(
        icon: Icons.people_outline_rounded,
        label: 'Tenants',
        count: p.occupied,
      ),
      _ManageAction(
        icon: Icons.description_outlined,
        label: 'Leases',
        count: p.occupied,
      ),
      _ManageAction(
        icon: Icons.assignment_outlined,
        label: 'Applications',
        count: 2,
      ),
      _ManageAction(
        icon: Icons.calendar_today_outlined,
        label: 'Bookings',
        count: p.mode != 'Lease' ? 4 : 0,
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
      onTap: () async => Haptics.vibrate(HapticsType.selection),
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
                  '${action.count}',
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
        children: _kUnits.asMap().entries.map((e) {
          final u = e.value;
          final last = e.key == _kUnits.length - 1;
          final sub = u.tenant != null ? '${u.cat} · ${u.tenant}' : u.cat;
          final tone = switch (u.status) {
            'Occupied' => RLTone.info,
            'Available' => RLTone.success,
            'Maintenance' => RLTone.warning,
            _ => RLTone.neutral,
          };
          final label = u.name.replaceFirst('Unit ', '');
          return RLRow(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  label,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 13,
                    color: RLTokens.ink,
                    height: 1,
                  ),
                ),
              ),
            ),
            title: u.name,
            subtitle: sub,
            trailing: RLPill(u.status, tone: tone),
            showChevron: false,
            last: last,
            onTap: () async => Haptics.vibrate(HapticsType.selection),
          );
        }).toList(),
      ),
    );
  }
}
