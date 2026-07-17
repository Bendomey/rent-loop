import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/unit_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kUnitTabs = [
  'Details',
  'Leases',
  'Maintenance Requests',
  'Tenant Reviews',
];

// ── Screen ────────────────────────────────────────────────────────────────────

class UnitDetailScreen extends ConsumerWidget {
  const UnitDetailScreen({
    super.key,
    required this.propertyId,
    required this.unitId,
  });
  final String propertyId;
  final String unitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unitAsync = ref.watch(unitDetailProvider(propertyId, unitId));
    final showSkeleton = !unitAsync.hasValue && unitAsync.isLoading;
    final showError = unitAsync.hasError && !unitAsync.hasValue;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: unitAsync.valueOrNull?.name ?? '',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: RLIconBtn(
              icon: Icons.settings_outlined,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) {
                  context.push(
                    '/properties/$propertyId/units/$unitId/settings',
                  );
                }
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
                      onRetry: () => ref.invalidate(
                        unitDetailProvider(propertyId, unitId),
                      ),
                    ),
                  )
                : RefreshIndicator(
                    color: RLTokens.crimson,
                    onRefresh: () => ref.refresh(
                      unitDetailProvider(propertyId, unitId).future,
                    ),
                    child: _UnitDetailContent(unit: unitAsync.value!),
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
            height: 96,
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

class _UnitDetailContent extends StatefulWidget {
  const _UnitDetailContent({required this.unit});
  final UnitModel unit;

  @override
  State<_UnitDetailContent> createState() => _UnitDetailContentState();
}

class _UnitDetailContentState extends State<_UnitDetailContent> {
  String _tab = _kUnitTabs.first;

  Future<void> _onSelectTab(String tab) async {
    await Haptics.vibrate(HapticsType.selection);
    setState(() => _tab = tab);
  }

  @override
  Widget build(BuildContext context) {
    final unit = widget.unit;
    final statusLabel = propertyStatusLabel(unit.status);
    final typeLabel = unitTypeLabel(unit.type);

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: _UnitHero(
            images: unit.images ?? const [],
            type: unit.type,
            name: unit.name,
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
                ],
              ),
              const SizedBox(height: 14),
              _RentFeeCard(unit: unit),
              const SizedBox(height: RLTokens.space6),
              RLFilterChips(
                options: _kUnitTabs,
                selected: _tab,
                onSelect: _onSelectTab,
              ),
              const SizedBox(height: 16),
              ..._buildTabContent(unit),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildTabContent(UnitModel unit) {
    if (_tab != 'Details') {
      return [_ComingSoonTab(title: _tab)];
    }

    return [
      RLLabel('Description'),
      _DescriptionCard(unit: unit),
      RLLabel('Property & Block'),
      _InfoCard(
        rows: [
          _FieldRow(k: 'Property', v: unit.property?.name ?? '—'),
          _FieldRow(k: 'Block', v: unit.propertyBlock?.name ?? '—', last: true),
        ],
      ),
      RLLabel('Specifications'),
      _InfoCard(
        rows: [
          _FieldRow(
            k: 'Area',
            v: unit.area != null ? '${unit.area} sq m' : '—',
          ),
          _FieldRow(
            k: 'Payment Frequency',
            v: paymentFrequencyLabel(unit.paymentFrequency ?? '—'),
          ),
          _FieldRow(k: 'Unit Type', v: unitTypeLabel(unit.type)),
          _FieldRow(k: 'Currency', v: unit.rentFeeCurrency, last: true),
        ],
      ),
      RLLabel('Timeline'),
      _InfoCard(
        rows: [
          _FieldRow(k: 'Created', v: _formatDate(unit.createdAt)),
          _FieldRow(
            k: 'Last Updated',
            v: _formatDate(unit.updatedAt),
            last: true,
          ),
        ],
      ),
    ];
  }
}

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMMM y').format(date.toLocal());
}

// ── Hero image ────────────────────────────────────────────────────────────────

class _UnitHero extends StatefulWidget {
  const _UnitHero({
    required this.images,
    required this.type,
    required this.name,
  });

  final List<String> images;
  final String type;
  final String name;

  @override
  State<_UnitHero> createState() => _UnitHeroState();
}

class _UnitHeroState extends State<_UnitHero> {
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
    final typeLabel = unitTypeLabel(widget.type);

    return SizedBox(
      height: 170,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (images.isEmpty)
            _UnitHeroPlaceholder(type: widget.type)
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
                errorBuilder: (_, _, _) =>
                    _UnitHeroPlaceholder(type: widget.type),
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : _UnitHeroPlaceholder(type: widget.type),
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

class _UnitHeroPlaceholder extends StatelessWidget {
  const _UnitHeroPlaceholder({required this.type});
  final String type;

  static Color _bg(String type) => switch (type) {
    'APARTMENT' => const Color(0xFF2A4099),
    'HOUSE' => const Color(0xFF8A5F20),
    'STUDIO' => const Color(0xFF3A6B5E),
    'OFFICE' => const Color(0xFF4A4A4A),
    'RETAIL' => const Color(0xFF6B3F8A),
    _ => const Color(0xFF8A5F20),
  };

  static IconData _icon(String type) => switch (type) {
    'APARTMENT' => Icons.apartment_rounded,
    'HOUSE' => Icons.house_rounded,
    'STUDIO' => Icons.grid_view_rounded,
    'OFFICE' => Icons.business_center_rounded,
    'RETAIL' => Icons.storefront_rounded,
    _ => Icons.apartment_rounded,
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

// ── Rent fee card ─────────────────────────────────────────────────────────────

class _RentFeeCard extends StatelessWidget {
  const _RentFeeCard({required this.unit});
  final UnitModel unit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Rent Fee',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 4),
          RLMoney(pesewasToCedis(unit.rentFee), size: 28),
          const SizedBox(height: 4),
          Text(
            paymentFrequencyLabel(unit.paymentFrequency ?? '—'),
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 11.5,
              color: RLTokens.muted,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Info card / field row (mirrors tenants/detail.dart's _DetailsCard) ────────

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.rows});
  final List<_FieldRow> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(children: rows),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({required this.k, required this.v, this.last = false});
  final String k;
  final String v;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            k,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              color: RLTokens.muted,
            ),
          ),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13.5,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DescriptionCard extends StatelessWidget {
  const _DescriptionCard({required this.unit});
  final UnitModel unit;

  @override
  Widget build(BuildContext context) {
    final hasDescription =
        unit.description != null && unit.description!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Text(
        hasDescription ? unit.description! : 'No description provided.',
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 13.5,
          height: 1.5,
          color: hasDescription ? RLTokens.ink : RLTokens.muted,
        ),
      ),
    );
  }
}

// ── Inline "coming soon" tab content ───────────────────────────────────────────
// Lighter-weight than shared/coming_soon.dart's RLComingSoon (which is a full
// Scaffold with its own back header, meant to be pushed as its own route —
// wrong when embedded inline inside this screen's tab content area).

class _ComingSoonTab extends StatelessWidget {
  const _ComingSoonTab({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.construction_rounded,
            size: 34,
            color: RLTokens.hairline,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 17,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'This feature is under construction.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.mutedSoft,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
