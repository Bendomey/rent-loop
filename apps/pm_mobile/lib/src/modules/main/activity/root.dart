import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:rentloop_manager/src/modules/main/activity/applications_list.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_board.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/tenant_applications_notifier.dart';

// ── Screen ────────────────────────────────────────────────────────────────────

class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});

  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen> {
  String _tab = 'maint';

  @override
  Widget build(BuildContext context) {
    final applicationsCount = ref.watch(
      tenantApplicationsNotifierProvider.select((s) => s.total),
    );

    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab-activity',
        onPressed: () async {
          await Haptics.vibrate(HapticsType.medium);
          if (!context.mounted) return;
          if (_tab == 'maint') {
            context.push('/activity/maintenances/add');
          } else if (_tab == 'apps') {
            context.push('/activity/applications/add');
          } else if (_tab == 'bookings') {
            context.push('/activity/bookings/add');
          }
        },
        backgroundColor: RLTokens.crimson,
        foregroundColor: Colors.white,
        elevation: 6,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add, size: 20),
        label: Text(
          _tab == 'apps'
              ? 'Application'
              : _tab == 'bookings'
              ? 'Booking'
              : 'Request',
          style: const TextStyle(
            fontFamily: RLTokens.fontSans,
            fontWeight: RLTokens.semibold,
            fontSize: RLTokens.textAction,
          ),
        ),
      ),
      body: Column(
        children: [
          _Header(
            selectedTab: _tab,
            applicationsCount: applicationsCount,
            onTabChanged: (v) async {
              await Haptics.vibrate(HapticsType.selection);
              setState(() => _tab = v);
            },
          ),
          Expanded(
            child: IndexedStack(
              index: ['maint', 'apps', 'bookings'].indexOf(_tab),
              children: const [
                MaintenanceBoard(),
                ApplicationsList(),
                _BookingsList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.selectedTab,
    required this.onTabChanged,
    required this.applicationsCount,
  });
  final String selectedTab;
  final ValueChanged<String> onTabChanged;

  /// Real total from the applications notifier. Maintenance and Bookings are
  /// still hardcoded — out of scope for this change.
  final int applicationsCount;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Title row
        Container(
          color: RLTokens.surface,
          padding: EdgeInsets.fromLTRB(
            RLTokens.gutter,
            MediaQuery.of(context).padding.top + 10,
            RLTokens.gutter,
            14,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  'Activity',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: RLTokens.textTitle,
                    color: RLTokens.ink,
                    letterSpacing: -0.4,
                    height: 1,
                  ),
                ),
              ),
              RLIconBtn(
                icon: Icons.tune_rounded,
                onTap: () async => Haptics.vibrate(HapticsType.selection),
                bg: RLTokens.fill,
                iconColor: RLTokens.inkSoft,
              ),
            ],
          ),
        ),
        // Segmented strip
        Container(
          padding: const EdgeInsets.fromLTRB(
            RLTokens.gutter,
            4,
            RLTokens.gutter,
            12,
          ),
          decoration: const BoxDecoration(
            color: RLTokens.surface,
            border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
          ),
          child: RLSegmented(
            value: selectedTab,
            onChanged: onTabChanged,
            items: [
              const RLSegmentItem(key: 'maint', label: 'Maintenance', count: 9),
              RLSegmentItem(
                key: 'apps',
                label: 'Applications',
                count: applicationsCount,
              ),
              const RLSegmentItem(key: 'bookings', label: 'Bookings', count: 4),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Shared formatting ─────────────────────────────────────────────────────────

String _fmtN(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');

// ── Bookings data ─────────────────────────────────────────────────────────────

class _BookingData {
  const _BookingData({
    required this.id,
    required this.guest,
    required this.unit,
    required this.status,
    required this.inDate,
    required this.outDate,
    required this.nights,
    required this.amount,
  });
  final String id;
  final String guest;
  final String unit;
  final String status;
  final String inDate;
  final String outDate;
  final int nights;
  final int amount;
}

const _kBookings = [
  _BookingData(
    id: 'b1',
    guest: 'Michael Tetteh',
    unit: 'Suite 1 · Labadi Beach',
    status: 'Checked In',
    inDate: 'Jun 3',
    outDate: 'Jun 7',
    nights: 4,
    amount: 3200,
  ),
  _BookingData(
    id: 'b2',
    guest: 'Sarah Addai',
    unit: 'Suite 4 · Labadi Beach',
    status: 'Confirmed',
    inDate: 'Jun 8',
    outDate: 'Jun 11',
    nights: 3,
    amount: 2400,
  ),
  _BookingData(
    id: 'b3',
    guest: 'Corporate · MTN',
    unit: 'Suite 2 · Labadi Beach',
    status: 'Pending',
    inDate: 'Jun 12',
    outDate: 'Jun 19',
    nights: 7,
    amount: 5600,
  ),
  _BookingData(
    id: 'b4',
    guest: 'Linda Quaye',
    unit: 'Suite 6 · Labadi Beach',
    status: 'Confirmed',
    inDate: 'Jun 14',
    outDate: 'Jun 16',
    nights: 2,
    amount: 1600,
  ),
];

// ── Bookings list ─────────────────────────────────────────────────────────────

class _BookingsList extends StatelessWidget {
  const _BookingsList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        6,
        RLTokens.gutter,
        120,
      ),
      children: [
        const _WeekStrip(),
        RLLabel('Upcoming · Labadi Beach Suites'),
        for (final b in _kBookings)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _BookingCard(b: b),
          ),
      ],
    );
  }
}

// ── Week strip calendar ───────────────────────────────────────────────────────

class _WeekStrip extends StatelessWidget {
  const _WeekStrip();

  static const _days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  static const _dates = [2, 3, 4, 5, 6, 7, 8];
  static const _busyIdx = {0, 1, 2}; // days with bookings
  static const _todayIdx = 1; // Tuesday

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          // Month header + chevrons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'June 2026',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 17,
                  color: RLTokens.ink,
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () async => Haptics.vibrate(HapticsType.selection),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(
                        Icons.chevron_left,
                        size: 20,
                        color: RLTokens.inkSoft,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () async => Haptics.vibrate(HapticsType.selection),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(
                        Icons.chevron_right,
                        size: 20,
                        color: RLTokens.inkSoft,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Day columns
          Row(
            children: List.generate(7, (i) {
              final busy = _busyIdx.contains(i);
              final today = i == _todayIdx;
              final circleBg = today
                  ? RLTokens.crimson
                  : busy
                  ? RLTokens.crimsonTint
                  : RLTokens.fill;
              final textColor = today
                  ? Colors.white
                  : busy
                  ? RLTokens.crimson
                  : RLTokens.muted;
              return Expanded(
                child: Column(
                  children: [
                    Text(
                      _days[i],
                      style: const TextStyle(
                        fontFamily: RLTokens.fontMono,
                        fontSize: 10,
                        color: RLTokens.mutedSoft,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: circleBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          '${_dates[i]}',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13,
                            fontWeight: RLTokens.semibold,
                            color: textColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: busy ? RLTokens.crimson : Colors.transparent,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ── Booking card ──────────────────────────────────────────────────────────────

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.b});
  final _BookingData b;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push('/activity/bookings/${b.id}');
      },
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
            // Guest name + unit + status pill
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        b.guest,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 15,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        b.unit,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                RLPill(b.status, tone: statusTone(b.status)),
              ],
            ),
            const SizedBox(height: 12),
            Container(height: 1, color: RLTokens.hairlineSoft),
            const SizedBox(height: 12),
            // Date range + amount
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '📅 ${b.inDate} → ${b.outDate} · ${b.nights}n',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.inkSoft,
                  ),
                ),
                Text(
                  'GH₵ ${_fmtN(b.amount)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
