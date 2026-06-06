import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data ─────────────────────────────────────────────────────────────────

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
  final int    balance;
  final String since;
  final int    rent;
}

const _kTenants = [
  _TenantData(id: 't1', name: 'Kwame Mensah', unit: 'Unit 4B · Cantonments Court', phone: '+233 24 558 1190', status: 'Active',  balance: 0,    since: 'Mar 2024', rent: 4200),
  _TenantData(id: 't2', name: 'Ama Boateng',  unit: 'Unit 5A · Cantonments Court', phone: '+233 20 771 4402', status: 'Active',  balance: 4200, since: 'Jan 2025', rent: 4200),
  _TenantData(id: 't3', name: 'Yaw Asante',   unit: 'Unit 3B · Cantonments Court', phone: '+233 55 309 8821', status: 'Active',  balance: 0,    since: 'Aug 2023', rent: 5500),
  _TenantData(id: 't4', name: 'Efua Sarpong', unit: 'Unit 7 · Spintex Heights',    phone: '+233 27 644 1180', status: 'Active',  balance: 1500, since: 'Nov 2024', rent: 3500),
  _TenantData(id: 't5', name: 'Kojo Antwi',   unit: 'Shop 2 · Osu Retail Block',   phone: '+233 24 902 3318', status: 'Expired', balance: 0,    since: 'Feb 2022', rent: 6000),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class TenantsScreen extends StatefulWidget {
  const TenantsScreen({super.key});

  @override
  State<TenantsScreen> createState() => _TenantsScreenState();
}

class _TenantsScreenState extends State<TenantsScreen> {
  String _filter = 'All';

  List<_TenantData> get _filtered => _filter == 'All'
      ? _kTenants
      : _kTenants.where((t) => t.status == _filter).toList();

  @override
  Widget build(BuildContext context) {
    final tenants = _filtered;

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Tenants',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async => Haptics.vibrate(HapticsType.selection),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(Icons.add_rounded, size: 22, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 40),
              children: [
                const SizedBox(height: 10),

                // Search bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.search_rounded, size: 18, color: RLTokens.mutedSoft),
                      SizedBox(width: 10),
                      Text(
                        'Search by name, phone, email',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Filter pills
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Active', 'Expired'].map((f) {
                      final active = f == _filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () async {
                            await Haptics.vibrate(HapticsType.selection);
                            setState(() => _filter = f);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: active ? RLTokens.ink : RLTokens.fill,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: active ? RLTokens.ink : RLTokens.hairline),
                            ),
                            child: Text(
                              f,
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                fontWeight: RLTokens.semibold,
                                color: active ? Colors.white : RLTokens.muted,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                // Count label
                RLLabel('${tenants.length} tenant${tenants.length == 1 ? '' : 's'}'),

                // Tenant list card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Column(
                    children: List.generate(tenants.length, (i) {
                      final t      = tenants[i];
                      final isLast = i == tenants.length - 1;
                      return RLRow(
                        leading: RLAvatar(t.name, size: 44),
                        title: t.name,
                        subtitle: t.unit,
                        last: isLast,
                        showChevron: false,
                        trailing: t.balance > 0
                            ? Text(
                                '₵${_fmt(t.balance)}',
                                style: const TextStyle(
                                  fontFamily: RLTokens.fontSans,
                                  fontSize: 12.5,
                                  fontWeight: RLTokens.bold,
                                  color: RLTokens.crimson,
                                ),
                              )
                            : RLPill(t.status, tone: statusTone(t.status)),
                        onTap: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          if (context.mounted) context.push('/more/tenants/${t.id}');
                        },
                      );
                    }),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

String _fmt(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
