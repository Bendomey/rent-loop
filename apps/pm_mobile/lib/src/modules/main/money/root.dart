import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class MoneyScreen extends StatelessWidget {
  const MoneyScreen({super.key});

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
            SliverToBoxAdapter(child: _SummaryCards()),
            SliverToBoxAdapter(child: _RecentTransactions()),
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
            'Money',
            style: TextStyle(fontFamily: RLTokens.fontSerif, 
              fontSize: RLTokens.textTitle,
              color: RLTokens.ink,
              letterSpacing: -0.4,
              height: 1.1,
            ),
          ),
          const Spacer(),
          RLIconBtn(icon: Icons.file_download_outlined, onTap: () {}),
        ],
      ),
    );
  }
}

class _SummaryCards extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 0),
      child: Column(
        children: [
          // Main balance card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: RLTokens.ink,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'JUNE 2026 INCOME',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 10.5,
                    fontWeight: RLTokens.semibold,
                    letterSpacing: 0.8,
                    color: Colors.white.withAlpha(128),
                  ),
                ),
                const SizedBox(height: 8),
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
                  '+GHS 4,200 vs last month',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 13,
                    color: const Color(0xFF4ADE80),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _SmallStatCard(
                  label: 'Outstanding',
                  value: 'GHS 10,200',
                  tone: RLTone.warning,
                  icon: Icons.pending_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SmallStatCard(
                  label: 'Overdue',
                  value: 'GHS 4,400',
                  tone: RLTone.danger,
                  icon: Icons.warning_amber_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SmallStatCard extends StatelessWidget {
  const _SmallStatCard({
    required this.label,
    required this.value,
    required this.tone,
    required this.icon,
  });
  final String label;
  final String value;
  final RLTone tone;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        boxShadow: RLTokens.elev1,
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: tone.bg,
              borderRadius: BorderRadius.circular(RLTokens.rSm),
            ),
            child: Icon(icon, color: tone.fg, size: 17),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 11,
                    color: RLTokens.muted,
                  ),
                ),
                Text(
                  value,
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 14,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
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

class _RecentTransactions extends StatelessWidget {
  static const _txns = [
    ('Kofi Mensah', 'Unit 4B · Jun 5', 'GHS 2,800', RLTone.success),
    ('Ama Darko', 'Unit 2A · Jun 4', 'GHS 3,200', RLTone.success),
    ('Kweku Otieno', 'Unit 1C · Jun 3', 'GHS 2,400', RLTone.success),
    ('Efua Asare', 'Unit 3D · Jun 2', 'GHS 1,800', RLTone.success),
    ('Nana Ansah', 'Unit 5B · Jun 1', 'GHS 2,600', RLTone.success),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 22, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Recent payments',
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: RLTokens.textBarTitle,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.ink,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () {},
                child: Text(
                  'All payments',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.crimson,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              boxShadow: RLTokens.elev1,
            ),
            child: Column(
              children: [
                for (var i = 0; i < _txns.length; i++) ...[
                  if (i > 0)
                    Divider(height: 1, thickness: 1, color: RLTokens.hairlineSoft, indent: 50),
                  _TxnRow(
                    name: _txns[i].$1,
                    sub: _txns[i].$2,
                    amount: _txns[i].$3,
                    tone: _txns[i].$4,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TxnRow extends StatelessWidget {
  const _TxnRow({
    required this.name,
    required this.sub,
    required this.amount,
    required this.tone,
  });
  final String name;
  final String sub;
  final String amount;
  final RLTone tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        children: [
          RLAvatar(name, size: 36),
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
                  sub,
                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: TextStyle(fontFamily: RLTokens.fontSans, 
              fontSize: 14,
              fontWeight: RLTokens.semibold,
              color: tone.fg,
            ),
          ),
        ],
      ),
    );
  }
}
