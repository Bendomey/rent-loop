import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  String _tab = 'maintenance';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: Column(
        children: [
          _Header(selectedTab: _tab, onTabChanged: (v) => setState(() => _tab = v)),
          Expanded(
            child: RefreshIndicator(
              color: RLTokens.crimson,
              onRefresh: () async {},
              child: _tabContent,
            ),
          ),
        ],
      ),
    );
  }

  Widget get _tabContent => switch (_tab) {
        'maintenance' => _MaintenanceList(),
        'applications' => _ApplicationsList(),
        _ => _BookingsList(),
      };
}

class _Header extends StatelessWidget {
  const _Header({required this.selectedTab, required this.onTabChanged});
  final String selectedTab;
  final ValueChanged<String> onTabChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, RLTokens.statusTop, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Activity',
            style: TextStyle(fontFamily: RLTokens.fontSerif, 
              fontSize: RLTokens.textTitle,
              color: RLTokens.ink,
              letterSpacing: -0.4,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 14),
          RLSegmented(
            items: const [
              RLSegmentItem(key: 'maintenance', label: 'Maintenance'),
              RLSegmentItem(key: 'applications', label: 'Applications'),
              RLSegmentItem(key: 'bookings', label: 'Bookings'),
            ],
            value: selectedTab,
            onChanged: onTabChanged,
          ),
          const SizedBox(height: 1),
        ],
      ),
    );
  }
}

class _MaintenanceList extends StatelessWidget {
  static const _items = [
    ('Burst pipe — Unit 2C', 'Block C · Reported 2h ago', RLTone.danger),
    ('AC not cooling — Unit 4A', 'Block A · Reported yesterday', RLTone.warning),
    ('Door lock broken — Unit 1B', 'Block B · Reported 3d ago', RLTone.warning),
    ('Light fixture — Unit 3D', 'Block D · Reported 5d ago', RLTone.neutral),
    ('Window seal — Unit 5A', 'Block A · Reported 1w ago', RLTone.neutral),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 40),
      itemCount: _items.length,
      itemBuilder: (_, i) {
        final (title, sub, tone) = _items[i];
        return _ActivityRow(
          icon: Icons.build_outlined,
          title: title,
          sub: sub,
          tone: tone,
        );
      },
    );
  }
}

class _ApplicationsList extends StatelessWidget {
  static const _items = [
    ('Emmanuel Asante', 'Unit 3B · Applied 1d ago', RLTone.info),
    ('Abena Frimpong', 'Unit 5C · Applied 2d ago', RLTone.info),
    ('Kwame Boateng', 'Unit 1A · Applied 4d ago', RLTone.neutral),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 40),
      itemCount: _items.length,
      itemBuilder: (_, i) {
        final (title, sub, tone) = _items[i];
        return _ActivityRow(
          icon: Icons.person_add_outlined,
          title: title,
          sub: sub,
          tone: tone,
        );
      },
    );
  }
}

class _BookingsList extends StatelessWidget {
  static const _items = [
    ('Site visit — Unit 2A', 'Jun 8, 10:00 AM', RLTone.info),
    ('Site visit — Unit 4C', 'Jun 10, 2:00 PM', RLTone.success),
    ('Contract signing — Unit 1B', 'Jun 12, 9:00 AM', RLTone.success),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 40),
      itemCount: _items.length,
      itemBuilder: (_, i) {
        final (title, sub, tone) = _items[i];
        return _ActivityRow(
          icon: Icons.calendar_today_outlined,
          title: title,
          sub: sub,
          tone: tone,
        );
      },
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.icon,
    required this.title,
    required this.sub,
    required this.tone,
  });
  final IconData icon;
  final String title;
  final String sub;
  final RLTone tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        boxShadow: RLTokens.elev1,
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
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
                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, color: RLTokens.muted),
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
