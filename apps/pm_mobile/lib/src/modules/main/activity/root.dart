import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data ─────────────────────────────────────────────────────────────────

class _MaintData {
  const _MaintData({
    required this.id,
    required this.title,
    required this.unit,
    required this.cat,
    required this.priority,
    required this.status,
    required this.tenant,
    required this.age,
    this.assigned,
  });
  final String  id;
  final String  title;
  final String  unit;
  final String  cat;
  final String  priority;
  final String  status;
  final String  tenant;
  final String  age;
  final String? assigned;
}

const _kMaint = [
  _MaintData(id: 'm1', title: 'Leaking kitchen tap',  unit: 'Unit 4B · Cantonments Court', cat: 'Plumbing',   priority: 'High',   status: 'New',         tenant: 'Kwame Mensah', age: '2h ago',  assigned: null),
  _MaintData(id: 'm2', title: 'AC not cooling',        unit: 'Unit 5A · Cantonments Court', cat: 'HVAC',       priority: 'Medium', status: 'In Progress', tenant: 'Ama Boateng',  age: '1d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm3', title: 'Broken window latch',   unit: 'Unit 7 · Spintex Heights',    cat: 'General',    priority: 'Low',    status: 'In Progress', tenant: 'Efua Sarpong', age: '2d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm4', title: 'Hallway lights out',    unit: 'Block A · Spintex Heights',   cat: 'Electrical', priority: 'High',   status: 'In Review',   tenant: 'Front desk',   age: '3d ago',  assigned: 'Mensah Electric'),
  _MaintData(id: 'm5', title: 'Repaint guest bath',    unit: 'Suite 3 · Labadi Beach',      cat: 'General',    priority: 'Low',    status: 'Resolved',    tenant: 'Housekeeping', age: '5d ago',  assigned: 'Ben (Tech)'),
  _MaintData(id: 'm6', title: 'Gate motor jammed',     unit: 'Cantonments Court',           cat: 'General',    priority: 'High',   status: 'New',         tenant: 'Security',     age: '4h ago',  assigned: null),
  _MaintData(id: 'm7', title: 'Water heater fault',    unit: 'Unit 3B · Cantonments Court', cat: 'Plumbing',   priority: 'Medium', status: 'New',         tenant: 'Yaw Asante',   age: '6h ago',  assigned: null),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  String _tab = 'maint';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async => Haptics.vibrate(HapticsType.medium),
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
            onTabChanged: (v) async {
              await Haptics.vibrate(HapticsType.selection);
              setState(() => _tab = v);
            },
          ),
          Expanded(
            child: IndexedStack(
              index: ['maint', 'apps', 'bookings'].indexOf(_tab),
              children: const [
                _MaintList(),
                _AppsListStub(),
                _BookingsListStub(),
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
  const _Header({required this.selectedTab, required this.onTabChanged});
  final String selectedTab;
  final ValueChanged<String> onTabChanged;

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
          padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 4, RLTokens.gutter, 12),
          decoration: const BoxDecoration(
            color: RLTokens.surface,
            border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
          ),
          child: RLSegmented(
            value: selectedTab,
            onChanged: onTabChanged,
            items: const [
              RLSegmentItem(key: 'maint',    label: 'Maintenance', count: 7),
              RLSegmentItem(key: 'apps',     label: 'Applications', count: 4),
              RLSegmentItem(key: 'bookings', label: 'Bookings', count: 4),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Maintenance list ──────────────────────────────────────────────────────────

class _MaintList extends StatelessWidget {
  const _MaintList();

  static const _order = ['New', 'In Progress', 'In Review', 'Resolved'];

  @override
  Widget build(BuildContext context) {
    final groups = <Widget>[];
    for (final status in _order) {
      final items = _kMaint.where((m) => m.status == status).toList();
      if (items.isEmpty) continue;

      final tone = statusTone(status);
      groups.add(
        Padding(
          padding: const EdgeInsets.fromLTRB(2, 18, 2, 10),
          child: Row(
            children: [
              RLDot(tone: tone),
              const SizedBox(width: 8),
              Text(
                status,
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.bold,
                  color: RLTokens.ink,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '${items.length}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 11,
                  color: RLTokens.mutedSoft,
                ),
              ),
            ],
          ),
        ),
      );
      for (final m in items) {
        groups.add(Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _MaintCard(m: m),
        ));
      }
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 120),
      children: groups,
    );
  }
}

class _MaintCard extends StatelessWidget {
  const _MaintCard({required this.m});
  final _MaintData m;

  @override
  Widget build(BuildContext context) {
    final priTone = statusTone(m.priority);
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push('/activity/maintenance/${m.id}');
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
            // Priority label + age
            Row(
              children: [
                RLDot(tone: priTone, size: 8),
                const SizedBox(width: 6),
                Text(
                  m.priority,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 11,
                    fontWeight: RLTokens.semibold,
                    color: priTone.fg,
                  ),
                ),
                const Spacer(),
                Text(
                  m.age,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    color: RLTokens.micro,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Title
            Text(
              m.title,
              style: const TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: 17,
                color: RLTokens.ink,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 4),
            // Unit
            Text(
              m.unit,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 12.5,
                color: RLTokens.muted,
              ),
            ),
            const SizedBox(height: 11),
            Container(height: 1, color: RLTokens.hairlineSoft),
            const SizedBox(height: 11),
            // Category pill + assigned
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                RLPill(m.cat, tone: RLTone.neutral),
                Text(
                  m.assigned ?? 'Unassigned',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12,
                    fontWeight: RLTokens.medium,
                    color: m.assigned != null ? RLTokens.inkSoft : RLTokens.crimson,
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

// ── Applications stub ─────────────────────────────────────────────────────────

class _AppsListStub extends StatelessWidget {
  const _AppsListStub();

  static const _items = [
    ('Emmanuel Asante', 'Unit 3B · Applied 1d ago', RLTone.info),
    ('Abena Frimpong',  'Unit 5C · Applied 2d ago', RLTone.info),
    ('Kwame Boateng',   'Unit 1A · Applied 4d ago', RLTone.neutral),
    ('Selorm Kudjo',    'Unit 9 · Applied 4d ago',  RLTone.neutral),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 120),
      itemCount: _items.length,
      itemBuilder: (_, i) {
        final (title, sub, tone) = _items[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Row(
            children: [
              RLIconTile(icon: Icons.person_add_outlined, tone: tone),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textRowTitle, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                    const SizedBox(height: 2),
                    Text(sub, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: RLTokens.micro, size: 18),
            ],
          ),
        );
      },
    );
  }
}

// ── Bookings stub ─────────────────────────────────────────────────────────────

class _BookingsListStub extends StatelessWidget {
  const _BookingsListStub();

  static const _items = [
    ('Michael Tetteh',  'Suite 1 · Labadi Beach', 'Checked In'),
    ('Sarah Addai',     'Suite 4 · Labadi Beach', 'Confirmed'),
    ('Corporate · MTN', 'Suite 2 · Labadi Beach', 'Pending'),
    ('Linda Quaye',     'Suite 6 · Labadi Beach', 'Confirmed'),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 120),
      itemCount: _items.length,
      itemBuilder: (_, i) {
        final (guest, unit, status) = _items[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Row(
            children: [
              RLIconTile(icon: Icons.calendar_today_outlined, tone: statusTone(status)),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(guest, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: RLTokens.textRowTitle, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                    const SizedBox(height: 2),
                    Text(unit, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted)),
                  ],
                ),
              ),
              RLPill(status, tone: statusTone(status)),
            ],
          ),
        );
      },
    );
  }
}
