import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/modules/main/workspace_sheet.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// Static design data — matches the handoff spec exactly.
// Will be replaced by live API calls when the data layer is wired up.
const _kWorkspaceName = 'Owusu Estates';
const _kManagerName = 'Akosua Owusu';
const _kRevenue = 184500;
const _kRevenueDelta = '+12%';
const _kCollected = 92.0; // %
const _kOutstanding = 14200;
const _kOccupancy = 88.0; // %
const _kActiveLeases = 51;
const _kOpenMaint = 7;
const _kPendingApps = 4;
const _kUnreadCount = 3;
const _kTrend = [78.0, 84.0, 81.0, 90.0, 86.0, 92.0];

// ── Screen ─────────────────────────────────────────────────────────────────────

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: RefreshIndicator(
        color: RLTokens.crimson,
        onRefresh: () async {
          await Haptics.vibrate(HapticsType.light);
        },
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _TopHeader()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _RevenueCard(),
                  const SizedBox(height: 10),
                  _StatGrid(),
                  const SizedBox(height: 22),
                  _NeedsAttentionSection(),
                  const SizedBox(height: 22),
                  _CollectionTrendSection(),
                  const SizedBox(height: 22),
                  _QuickActionsSection(),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Top header ─────────────────────────────────────────────────────────────────

class _TopHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RLTopHeader(
      eyebrow: GestureDetector(
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            await showWorkspaceSheet(context, activeId: 'ws1');
          }
        },
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _kWorkspaceName,
              style: TextStyle(
                fontFamily: RLTokens.fontMono,
                fontSize: 10.5,
                fontWeight: RLTokens.semibold,
                letterSpacing: 1,
                color: RLTokens.crimson,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 14,
              color: RLTokens.crimson,
            ),
          ],
        ),
      ),
      title: 'Good morning',
      trailing: [
        RLIconBtn(
          icon: Icons.notifications_outlined,
          badge: _kUnreadCount,
          onTap: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) context.push('/notifications');
          },
        ),
        RLAvatar(_kManagerName, size: 38, crimsonTone: true),
      ],
    );
  }
}

// ── Revenue hero card (dark) ───────────────────────────────────────────────────

class _RevenueCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label row
          Row(
            children: [
              Text(
                'Revenue · June',
                style: TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 10.5,
                  letterSpacing: 1,
                  color: Colors.white.withAlpha(140),
                ),
              ),
              const Spacer(),
              _GreenPill('▲ $_kRevenueDelta'),
            ],
          ),
          const SizedBox(height: 12),
          // Amount
          RLMoney(_kRevenue, size: 40, color: Colors.white),
          const SizedBox(height: 18),
          // Collected row
          Row(
            children: [
              Text(
                'Rent collected',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: Colors.white.withAlpha(153),
                ),
              ),
              const Spacer(),
              Text(
                '${_kCollected.toInt()}%',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  fontWeight: RLTokens.semibold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          RLBar(
            percent: _kCollected,
            color: Colors.white,
            trackColor: Colors.white.withAlpha(38),
          ),
          const SizedBox(height: 14),
          // Divider
          Container(height: 1, color: Colors.white.withAlpha(26)),
          const SizedBox(height: 14),
          // Outstanding row
          Row(
            children: [
              Text(
                'Outstanding',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  color: Colors.white.withAlpha(166),
                ),
              ),
              const Spacer(),
              Text(
                'GH₵ ${_kOutstanding.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',')}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14,
                  fontWeight: RLTokens.semibold,
                  color: Color(0xFFFF6F8E),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GreenPill extends StatelessWidget {
  const _GreenPill(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(27, 158, 92, 0.13),
        borderRadius: BorderRadius.circular(RLTokens.rPill),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 11,
          fontWeight: RLTokens.semibold,
          color: Color(0xFF157A47),
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}

// ── 2×2 stat grid ─────────────────────────────────────────────────────────────

class _StatGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                child: RLMetric(
                  value: '${_kOccupancy.toInt()}%',
                  label: 'Occupancy',
                  delta: '▲ 3%',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _StatCard(
                child: const RLMetric(
                  value: '$_kActiveLeases',
                  label: 'Active leases',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                child: const RLMetric(
                  value: '$_kOpenMaint',
                  label: 'Open requests',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _StatCard(
                child: const RLMetric(
                  value: '$_kPendingApps',
                  label: 'Pending apps',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async => Haptics.vibrate(HapticsType.selection),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: child,
      ),
    );
  }
}

// ── Needs attention ────────────────────────────────────────────────────────────

class _NeedsAttentionSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RLLabel(
          'Needs your attention',
          action: 'Activity',
          onAction: () async => Haptics.vibrate(HapticsType.selection),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Column(
            children: [
              RLRow(
                leading: _TileIcon(
                  bg: RLTokens.crimsonTint,
                  iconColor: RLTokens.crimson,
                  icon: Icons.build_rounded,
                ),
                title: 'Leaking kitchen tap',
                subtitle: 'Unit 4B · High priority',
                trailing: const RLPill('New'),
                onTap: () async => Haptics.vibrate(HapticsType.selection),
              ),
              RLRow(
                leading: const _TileIcon(
                  bg: Color.fromRGBO(233, 123, 42, 0.16),
                  iconColor: Color(0xFFBD5E16),
                  icon: Icons.receipt_long_rounded,
                ),
                title: 'Invoice overdue',
                subtitle: 'INV-2041 · Ama Boateng',
                trailing: const Text(
                  '₵4,200',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontWeight: RLTokens.bold,
                    fontSize: 13.5,
                    color: RLTokens.ink,
                  ),
                ),
                onTap: () async => Haptics.vibrate(HapticsType.selection),
              ),
              RLRow(
                leading: const _TileIcon(
                  bg: Color.fromRGBO(46, 108, 246, 0.12),
                  iconColor: Color(0xFF2456C4),
                  icon: Icons.description_rounded,
                ),
                title: 'New application',
                subtitle: 'Adjoa Frimpong · Unit 1C',
                trailing: const RLPill('Review'),
                onTap: () async => Haptics.vibrate(HapticsType.selection),
                last: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TileIcon extends StatelessWidget {
  const _TileIcon({
    required this.bg,
    required this.iconColor,
    required this.icon,
  });
  final Color bg;
  final Color iconColor;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(11),
      ),
      child: Icon(icon, size: 18, color: iconColor),
    );
  }
}

// ── Rent collection trend ──────────────────────────────────────────────────────

class _CollectionTrendSection extends StatelessWidget {
  static const _months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RLLabel('Rent collection · last 6 months'),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Row(
            children: [
              // Donut with inline center label
              RLDonut(
                percent: _kCollected,
                size: 84,
                thickness: 12,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${_kCollected.toInt()}%',
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 22,
                        color: RLTokens.ink,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'June',
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
                  children: [
                    RLMiniBars(data: _kTrend, height: 44),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children:
                          _months
                              .map(
                                (m) => Text(
                                  m,
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 9.5,
                                    color: RLTokens.micro,
                                  ),
                                ),
                              )
                              .toList(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Quick actions ──────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  static const _actions = [
    _QuickAction(
      icon: Icons.description_outlined,
      label: 'New application',
      route: '/activity/applications/add',
    ),
    _QuickAction(
      icon: Icons.calendar_today_outlined,
      label: 'New booking',
      route: '/activity/bookings/add',
    ),
    _QuickAction(
      icon: Icons.credit_card_outlined,
      label: 'Record payment',
      route: '/money/record-payment',
    ),
    _QuickAction(
      icon: Icons.campaign_outlined,
      label: 'Announcement',
      route: '/more/announcements/add',
    ),
    _QuickAction(
      icon: Icons.apartment_outlined,
      label: 'Add property',
      route: '/properties/add',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RLLabel('Quick actions'),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children:
                _actions
                    .asMap()
                    .entries
                    .map(
                      (e) => Padding(
                        padding: EdgeInsets.only(
                          right: e.key < _actions.length - 1 ? 10 : 0,
                        ),
                        child: _QuickChip(action: e.value),
                      ),
                    )
                    .toList(),
          ),
        ),
      ],
    );
  }
}

class _QuickAction {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.route,
  });
  final IconData icon;
  final String label;
  final String route;
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.action});
  final _QuickAction action;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push(action.route);
      },
      child: SizedBox(
        width: 66,
        child: Column(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: RLTokens.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Icon(action.icon, size: 22, color: RLTokens.crimson),
            ),
            const SizedBox(height: 8),
            Text(
              action.label,
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11,
                fontWeight: RLTokens.medium,
                color: RLTokens.inkSoft,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}
