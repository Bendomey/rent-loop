import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (mirrors root.dart) ─────────────────────────────────────────────

class _TenantData {
  const _TenantData({
    required this.id,
    required this.name,
    required this.unit,
    required this.phone,
    required this.status,
    required this.balance,
    required this.since,
    required this.rent,
  });
  final String id;
  final String name;
  final String unit;
  final String phone;
  final String status;
  final int balance;
  final String since;
  final int rent;
}

const _kTenants = [
  _TenantData(
    id: 't1',
    name: 'Kwame Mensah',
    unit: 'Unit 4B · Cantonments Court',
    phone: '+233 24 558 1190',
    status: 'Active',
    balance: 0,
    since: 'Mar 2024',
    rent: 4200,
  ),
  _TenantData(
    id: 't2',
    name: 'Ama Boateng',
    unit: 'Unit 5A · Cantonments Court',
    phone: '+233 20 771 4402',
    status: 'Active',
    balance: 4200,
    since: 'Jan 2025',
    rent: 4200,
  ),
  _TenantData(
    id: 't3',
    name: 'Yaw Asante',
    unit: 'Unit 3B · Cantonments Court',
    phone: '+233 55 309 8821',
    status: 'Active',
    balance: 0,
    since: 'Aug 2023',
    rent: 5500,
  ),
  _TenantData(
    id: 't4',
    name: 'Efua Sarpong',
    unit: 'Unit 7 · Spintex Heights',
    phone: '+233 27 644 1180',
    status: 'Active',
    balance: 1500,
    since: 'Nov 2024',
    rent: 3500,
  ),
  _TenantData(
    id: 't5',
    name: 'Kojo Antwi',
    unit: 'Shop 2 · Osu Retail Block',
    phone: '+233 24 902 3318',
    status: 'Expired',
    balance: 0,
    since: 'Feb 2022',
    rent: 6000,
  ),
];

// ── Record row model ──────────────────────────────────────────────────────────

class _RecordRow {
  const _RecordRow({
    required this.label,
    required this.sub,
    required this.iconBg,
    required this.iconFg,
    required this.icon,
  });
  final String label;
  final String sub;
  final Color iconBg;
  final Color iconFg;
  final IconData icon;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class TenantDetailScreen extends StatelessWidget {
  const TenantDetailScreen({super.key, required this.id});
  final String id;

  static const _recordRows = [
    _RecordRow(
      label: 'Leases',
      sub: '1 active · 1 past',
      iconBg: RLTokens.infoBg,
      iconFg: RLTokens.info,
      icon: Icons.description_outlined,
    ),
    _RecordRow(
      label: 'Payments',
      sub: 'On-time rate 96%',
      iconBg: RLTokens.successBg,
      iconFg: RLTokens.success,
      icon: Icons.credit_card_outlined,
    ),
    _RecordRow(
      label: 'Maintenance',
      sub: '2 requests',
      iconBg: RLTokens.warningBg,
      iconFg: RLTokens.warning,
      icon: Icons.build_outlined,
    ),
    _RecordRow(
      label: 'Activity log',
      sub: 'Full audit trail',
      iconBg: RLTokens.neutralBg,
      iconFg: RLTokens.neutral,
      icon: Icons.history_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final t = _kTenants.firstWhere(
      (x) => x.id == id,
      orElse: () => _kTenants.first,
    );

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Tenant',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async => Haptics.vibrate(HapticsType.selection),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.more_horiz, size: 22, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                0,
                RLTokens.gutter,
                32,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero
                  _Hero(t: t),

                  // Stat grid
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          label: 'Monthly rent',
                          value: '₵${_fmt(t.rent)}',
                          valueColor: RLTokens.ink,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _StatCard(
                          label: 'Balance',
                          value: t.balance > 0 ? '₵${_fmt(t.balance)}' : '₵0',
                          valueColor: t.balance > 0
                              ? RLTokens.crimson
                              : RLTokens.success,
                        ),
                      ),
                    ],
                  ),

                  // Details
                  RLLabel('Details'),
                  _DetailsCard(t: t),

                  // Record
                  RLLabel('Record'),
                  _RecordCard(rows: _recordRows),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  const _Hero({required this.t});
  final _TenantData t;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 18, 0, 6),
      child: Column(
        children: [
          Center(child: RLAvatar(t.name, size: 76, crimsonTone: true)),
          const SizedBox(height: 12),
          Center(
            child: Text(
              t.name,
              style: const TextStyle(
                fontFamily: RLTokens.fontSerif,
                fontSize: 24,
                color: RLTokens.ink,
              ),
            ),
          ),
          const SizedBox(height: 3),
          Center(
            child: Text(
              t.unit,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.muted,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              RLBtn(
                label: 'Call',
                kind: RLBtnKind.light,
                icon: Icons.phone_outlined,
                large: false,
                onPressed: () async => Haptics.vibrate(HapticsType.selection),
              ),
              const SizedBox(width: 8),
              RLBtn(
                label: 'Message',
                kind: RLBtnKind.light,
                icon: Icons.chat_bubble_outline_rounded,
                large: false,
                onPressed: () async => Haptics.vibrate(HapticsType.selection),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.valueColor,
  });
  final String label;
  final String value;
  final Color valueColor;

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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 24,
              color: valueColor,
              letterSpacing: -0.4,
              height: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
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

// ── Details card ──────────────────────────────────────────────────────────────

class _DetailsCard extends StatelessWidget {
  const _DetailsCard({required this.t});
  final _TenantData t;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          _FieldRow(
            k: 'Status',
            v: t.status,
            vColor: t.status == 'Active' ? RLTokens.success : RLTokens.muted,
          ),
          _FieldRow(k: 'Phone', v: t.phone),
          _FieldRow(k: 'Tenant since', v: t.since, last: true),
        ],
      ),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({
    required this.k,
    required this.v,
    this.vColor,
    this.last = false,
  });
  final String k;
  final String v;
  final Color? vColor;
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
          Text(
            v,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: vColor ?? RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Record card ───────────────────────────────────────────────────────────────

class _RecordCard extends StatelessWidget {
  const _RecordCard({required this.rows});
  final List<_RecordRow> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: List.generate(rows.length, (i) {
          final r = rows[i];
          final isLast = i == rows.length - 1;
          return GestureDetector(
            onTap: () async => Haptics.vibrate(HapticsType.selection),
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
              decoration: BoxDecoration(
                border: isLast
                    ? null
                    : const Border(
                        bottom: BorderSide(color: RLTokens.hairlineSoft),
                      ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: r.iconBg,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(r.icon, size: 18, color: r.iconFg),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r.label,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          r.sub,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 17,
                    color: RLTokens.micro,
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

String _fmt(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
