import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
            SliverToBoxAdapter(child: _RevenueCard()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 0),
                child: _MetricGrid(),
              ),
            ),
            SliverToBoxAdapter(child: _NeedsAttentionSection()),
            SliverToBoxAdapter(child: _CollectionTrendSection()),
            SliverToBoxAdapter(child: _QuickActionsSection()),
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
      padding: EdgeInsets.fromLTRB(
        RLTokens.gutter,
        RLTokens.statusTop,
        RLTokens.gutter,
        16,
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Good morning,',
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: RLTokens.textSubtitle,
                  color: RLTokens.muted,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Akosua',
                style: TextStyle(fontFamily: RLTokens.fontSerif, 
                  fontSize: RLTokens.textTitle,
                  color: RLTokens.ink,
                  letterSpacing: -0.4,
                  height: 1.1,
                ),
              ),
            ],
          ),
          const Spacer(),
          _NotifBell(),
          const SizedBox(width: 10),
          RLAvatar('Akosua Owusu', size: 36),
        ],
      ),
    );
  }
}

class _NotifBell extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: RLTokens.fill,
            borderRadius: BorderRadius.circular(RLTokens.rMd),
          ),
          child: const Icon(Icons.notifications_outlined, size: 20, color: RLTokens.inkSoft),
        ),
        Positioned(
          top: 6,
          right: 7,
          child: Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: RLTokens.crimson,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ],
    );
  }
}

class _RevenueCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 0),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'JUNE 2026',
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: 10.5,
                  fontWeight: RLTokens.semibold,
                  letterSpacing: 0.8,
                  color: Colors.white.withAlpha(128),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(20),
                  borderRadius: BorderRadius.circular(RLTokens.rPill),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF4ADE80),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '84% collected',
                      style: TextStyle(fontFamily: RLTokens.fontSans, 
                        fontSize: 11,
                        fontWeight: RLTokens.medium,
                        color: Colors.white.withAlpha(204),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'GHS 52,800',
            style: TextStyle(fontFamily: RLTokens.fontSerif, 
              fontSize: 38,
              color: Colors.white,
              letterSpacing: -0.8,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'of GHS 63,000 expected',
            style: TextStyle(fontFamily: RLTokens.fontSans, 
              fontSize: 13,
              color: Colors.white.withAlpha(128),
            ),
          ),
          const SizedBox(height: 18),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: 0.84,
              backgroundColor: Colors.white.withAlpha(30),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4ADE80)),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _CardStat(label: 'Pending', value: '3 units'),
              const SizedBox(width: 24),
              _CardStat(label: 'Overdue', value: '2 units', danger: true),
              const Spacer(),
              GestureDetector(
                onTap: () {},
                child: Text(
                  'See breakdown',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 12,
                    fontWeight: RLTokens.semibold,
                    color: Colors.white.withAlpha(160),
                    decoration: TextDecoration.underline,
                    decorationColor: Colors.white.withAlpha(80),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CardStat extends StatelessWidget {
  const _CardStat({required this.label, required this.value, this.danger = false});
  final String label;
  final String value;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontFamily: RLTokens.fontSans, 
            fontSize: 10.5,
            color: Colors.white.withAlpha(100),
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          value,
          style: TextStyle(fontFamily: RLTokens.fontSans, 
            fontSize: 13.5,
            fontWeight: RLTokens.semibold,
            color: danger ? const Color(0xFFFC8181) : Colors.white,
          ),
        ),
      ],
    );
  }
}

class _MetricGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: const [
        _MetricTile(label: 'Total Units', value: '24', sub: '22 occupied', tone: RLTone.success),
        _MetricTile(label: 'Vacant Units', value: '2', sub: '8.3% vacancy', tone: RLTone.info),
        _MetricTile(label: 'Maintenance', value: '5', sub: '2 urgent', tone: RLTone.warning),
        _MetricTile(label: 'Applications', value: '7', sub: 'Awaiting review', tone: RLTone.neutral),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.sub,
    required this.tone,
  });
  final String label;
  final String value;
  final String sub;
  final RLTone tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        boxShadow: RLTokens.elev1,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontFamily: RLTokens.fontSans, 
              fontSize: 10.5,
              fontWeight: RLTokens.medium,
              color: RLTokens.muted,
              letterSpacing: 0.2,
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(fontFamily: RLTokens.fontSerif, 
                  fontSize: 28,
                  color: RLTokens.ink,
                  letterSpacing: -0.4,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: tone.fg,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    sub,
                    style: TextStyle(fontFamily: RLTokens.fontSans, 
                      fontSize: 11,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NeedsAttentionSection extends StatelessWidget {
  static const _items = [
    _AttentionItem(
      title: 'Kofi Mensah — Unit 4B',
      sub: 'Rent overdue · 12 days',
      tone: RLTone.danger,
      icon: Icons.warning_amber_rounded,
    ),
    _AttentionItem(
      title: 'Burst pipe — Block C',
      sub: 'Maintenance · Urgent',
      tone: RLTone.warning,
      icon: Icons.build_outlined,
    ),
    _AttentionItem(
      title: 'Lease ending — Unit 2A',
      sub: 'Expires in 14 days',
      tone: RLTone.info,
      icon: Icons.description_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 22, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(title: 'Needs attention', actionLabel: 'See all', onAction: () {}),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              boxShadow: RLTokens.elev1,
            ),
            child: Column(
              children: [
                for (var i = 0; i < _items.length; i++) ...[
                  if (i > 0)
                    Divider(height: 1, thickness: 1, color: RLTokens.hairlineSoft, indent: 50),
                  _items[i],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AttentionItem extends StatelessWidget {
  const _AttentionItem({
    required this.title,
    required this.sub,
    required this.tone,
    required this.icon,
  });
  final String title;
  final String sub;
  final RLTone tone;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: tone.bg,
              borderRadius: BorderRadius.circular(RLTokens.rSm),
            ),
            child: Icon(icon, color: tone.fg, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: RLTokens.textRowTitle,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 12,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: RLTokens.micro, size: 18),
        ],
      ),
    );
  }
}

class _CollectionTrendSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 22, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(title: 'Collection trend', actionLabel: 'View report', onAction: () {}),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              boxShadow: RLTokens.elev1,
            ),
            child: Row(
              children: [
                RLDonut(
                  percent: 84,
                  size: 72,
                  thickness: 8,
                  color: RLTokens.success,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '6-month collection rate',
                        style: TextStyle(fontFamily: RLTokens.fontSans, 
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                      const SizedBox(height: 10),
                      RLMiniBars(
                        data: const [0.78, 0.85, 0.91, 0.88, 0.76, 0.84],
                        color: RLTokens.success,
                        height: 44,
                      ),
                    ],
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

class _QuickActionsSection extends StatelessWidget {
  static const _actions = [
    _QuickAction(label: 'Add unit', icon: Icons.add_home_outlined),
    _QuickAction(label: 'New tenant', icon: Icons.person_add_outlined),
    _QuickAction(label: 'Log payment', icon: Icons.payments_outlined),
    _QuickAction(label: 'Report issue', icon: Icons.report_gmailerrorred_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 22, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick actions',
            style: TextStyle(fontFamily: RLTokens.fontSans, 
              fontSize: RLTokens.textBarTitle,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final a in _actions) ...[
                Expanded(child: _QuickActionTile(action: a)),
                if (a != _actions.last) const SizedBox(width: 8),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickAction {
  const _QuickAction({required this.label, required this.icon});
  final String label;
  final IconData icon;
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({required this.action});
  final _QuickAction action;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rMd),
          boxShadow: RLTokens.elev1,
        ),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: RLTokens.crimsonTint,
                borderRadius: BorderRadius.circular(RLTokens.rSm),
              ),
              child: Icon(action.icon, color: RLTokens.crimson, size: 18),
            ),
            const SizedBox(height: 7),
            Text(
              action.label,
              style: TextStyle(fontFamily: RLTokens.fontSans, 
                fontSize: 11,
                fontWeight: RLTokens.medium,
                color: RLTokens.inkSoft,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.onAction,
  });
  final String title;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(fontFamily: RLTokens.fontSans, 
            fontSize: RLTokens.textBarTitle,
            fontWeight: RLTokens.semibold,
            color: RLTokens.ink,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: onAction,
          child: Text(
            actionLabel,
            style: TextStyle(fontFamily: RLTokens.fontSans, 
              fontSize: 13,
              fontWeight: RLTokens.semibold,
              color: RLTokens.crimson,
            ),
          ),
        ),
      ],
    );
  }
}
