import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class PropertiesScreen extends StatelessWidget {
  const PropertiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: RefreshIndicator(
        color: RLTokens.crimson,
        onRefresh: () async {},
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _Header()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 0),
                child: const RLSearchBar(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, 0, 16),
                child: RLFilterChips(
                  options: const ['All', 'Residential', 'Commercial', 'Vacant'],
                  selected: 'All',
                ),
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => _PropertyRow(index: i),
                childCount: 6,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }
}

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
            style: TextStyle(fontFamily: RLTokens.fontSerif, 
              fontSize: RLTokens.textTitle,
              color: RLTokens.ink,
              letterSpacing: -0.4,
              height: 1.1,
            ),
          ),
          const Spacer(),
          RLIconBtn(icon: Icons.add, onTap: () {}),
        ],
      ),
    );
  }
}

class _PropertyRow extends StatelessWidget {
  const _PropertyRow({required this.index});
  final int index;

  static const _data = [
    ('Owusu Estates, Block A', 'East Legon', '8 units', 7, 8),
    ('Owusu Estates, Block B', 'East Legon', '6 units', 6, 6),
    ('Adenta Heights', 'Adenta', '4 units', 3, 4),
    ('Cantonment Court', 'Cantonments', '3 units', 3, 3),
    ('Tema Terrace', 'Tema', '2 units', 1, 2),
    ('Ridge Residences', 'Ridge', '1 unit', 1, 1),
  ];

  @override
  Widget build(BuildContext context) {
    final (name, location, units, occupied, total) = _data[index % _data.length];
    final pct = occupied / total;
    final tone = pct == 1.0
        ? RLTone.success
        : pct >= 0.7
            ? RLTone.info
            : RLTone.warning;

    return Container(
      margin: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        boxShadow: RLTokens.elev1,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(RLTokens.rSm),
            ),
            child: const Icon(Icons.apartment_rounded, color: RLTokens.inkSoft, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: RLTokens.textRowTitle,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$location · $units',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          RLPill('$occupied/$total occupied', tone: tone),
          const SizedBox(width: 6),
          const Icon(Icons.chevron_right, color: RLTokens.micro, size: 18),
        ],
      ),
    );
  }
}
