import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data ─────────────────────────────────────────────────────────────────

class _InvData {
  const _InvData({
    required this.id,
    required this.payer,
    required this.unit,
    required this.due,
    required this.amount,
    required this.paid,
    required this.status,
  });
  final String id;
  final String payer;
  final String unit;
  final String due;
  final int    amount;
  final int    paid;
  final String status;
}

class _ExpData {
  const _ExpData({required this.id, required this.title, required this.cat, required this.amount, required this.date});
  final String id;
  final String title;
  final String cat;
  final int    amount;
  final String date;
}

const _kInvoices = [
  _InvData(id: 'INV-2041', payer: 'Ama Boateng',    unit: 'Unit 5A · Cantonments', due: 'Jun 1',  amount: 4200, paid: 0,    status: 'Overdue'),
  _InvData(id: 'INV-2042', payer: 'Efua Sarpong',   unit: 'Unit 7 · Spintex',      due: 'Jun 1',  amount: 3500, paid: 2000, status: 'Partially Paid'),
  _InvData(id: 'INV-2039', payer: 'Kwame Mensah',   unit: 'Unit 4B · Cantonments', due: 'Jun 1',  amount: 4200, paid: 4200, status: 'Paid'),
  _InvData(id: 'INV-2043', payer: 'Yaw Asante',     unit: 'Unit 3B · Cantonments', due: 'Jun 5',  amount: 5500, paid: 0,    status: 'Issued'),
  _InvData(id: 'INV-2044', payer: 'Michael Tetteh', unit: 'Suite 1 · Labadi',      due: 'Jun 3',  amount: 3200, paid: 3200, status: 'Paid'),
  _InvData(id: 'INV-2045', payer: 'Daniel Ofori',   unit: 'Unit 12 · Spintex',     due: 'Jun 10', amount: 3500, paid: 0,    status: 'Draft'),
];

const _kExpenses = [
  _ExpData(id: 'e1', title: 'Plumber — Unit 4B', cat: 'Maintenance', amount: 450,  date: 'Jun 4'),
  _ExpData(id: 'e2', title: 'Generator diesel',  cat: 'Operating',   amount: 1200, date: 'Jun 2'),
  _ExpData(id: 'e3', title: 'Cleaning supplies', cat: 'Material',    amount: 320,  date: 'Jun 1'),
];

const _revenueMonth = 184500;
const _collected    = 92;
const _outstanding  = 14200;

// ── Screen ────────────────────────────────────────────────────────────────────

class MoneyScreen extends StatefulWidget {
  const MoneyScreen({super.key});

  @override
  State<MoneyScreen> createState() => _MoneyScreenState();
}

class _MoneyScreenState extends State<MoneyScreen> {
  String _seg    = 'invoices';
  String _filter = 'All';

  List<_InvData> get _filteredInvoices => _filter == 'All'
      ? _kInvoices
      : _kInvoices.where((inv) {
          return switch (_filter) {
            'Outstanding' => inv.status == 'Overdue' || inv.status == 'Partially Paid' || inv.status == 'Issued',
            'Paid'        => inv.status == 'Paid',
            'Draft'       => inv.status == 'Draft',
            _             => true,
          };
        }).toList();

  @override
  Widget build(BuildContext context) {
    final totalExp = _kExpenses.fold(0, (s, e) => s + e.amount);
    final collected = (_revenueMonth * _collected / 100).round();
    final fabLabel  = _seg == 'expenses' ? 'Expense' : 'Invoice';

    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async => Haptics.vibrate(HapticsType.medium),
        backgroundColor: RLTokens.crimson,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        elevation: 3,
        label: Text(
          fabLabel,
          style: const TextStyle(fontFamily: RLTokens.fontSans, fontWeight: RLTokens.semibold, fontSize: 15),
        ),
        icon: const Icon(Icons.add_rounded, size: 20),
      ),
      body: Column(
        children: [
          RLTopHeader(
            title: 'Money',
            trailing: [
              RLIconBtn(icon: Icons.tune_rounded, onTap: () async => Haptics.vibrate(HapticsType.selection)),
            ],
          ),
          Expanded(
            child: IndexedStack(
              index: _seg == 'invoices' ? 0 : 1,
              children: [
                _InvoicesTab(
                  collected: collected,
                  outstanding: _outstanding,
                  totalExp: totalExp,
                  seg: _seg,
                  onSegChanged: (v) async {
                    await Haptics.vibrate(HapticsType.selection);
                    setState(() { _seg = v; });
                  },
                  filter: _filter,
                  onFilterChanged: (v) async {
                    await Haptics.vibrate(HapticsType.selection);
                    setState(() { _filter = v; });
                  },
                  invoices: _filteredInvoices,
                ),
                _ExpensesTab(
                  collected: collected,
                  outstanding: _outstanding,
                  totalExp: totalExp,
                  seg: _seg,
                  onSegChanged: (v) async {
                    await Haptics.vibrate(HapticsType.selection);
                    setState(() { _seg = v; });
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared summary card + segmented ──────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.collected, required this.outstanding, required this.totalExp});
  final int collected;
  final int outstanding;
  final int totalExp;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: RLTokens.ink,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'COLLECTED · JUNE',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              letterSpacing: 1,
              color: Color(0x8CFFFFFF),
            ),
          ),
          const SizedBox(height: 10),
          RLMoney(collected, size: 38, color: Colors.white),
          const SizedBox(height: 18),
          Container(
            height: 1,
            color: Colors.white.withAlpha(25),
            margin: const EdgeInsets.only(bottom: 16),
          ),
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Outstanding',
                    style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: Color(0x8CFFFFFF)),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'GH₵ ${_fmt(outstanding)}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFFF6F8E),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 24),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Expenses',
                    style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11.5, color: Color(0x8CFFFFFF)),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'GH₵ ${_fmt(totalExp)}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
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

// ── Invoices tab ──────────────────────────────────────────────────────────────

class _InvoicesTab extends StatelessWidget {
  const _InvoicesTab({
    required this.collected,
    required this.outstanding,
    required this.totalExp,
    required this.seg,
    required this.onSegChanged,
    required this.filter,
    required this.onFilterChanged,
    required this.invoices,
  });

  final int                 collected;
  final int                 outstanding;
  final int                 totalExp;
  final String              seg;
  final ValueChanged<String> onSegChanged;
  final String              filter;
  final ValueChanged<String> onFilterChanged;
  final List<_InvData>     invoices;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 6, RLTokens.gutter, 120),
      children: [
        const SizedBox(height: 14),
        _SummaryCard(collected: collected, outstanding: outstanding, totalExp: totalExp),
        const SizedBox(height: 16),
        RLSegmented(
          value: seg,
          onChanged: onSegChanged,
          items: [
            RLSegmentItem(key: 'invoices', label: 'Invoices', count: _kInvoices.length),
            RLSegmentItem(key: 'expenses', label: 'Expenses', count: _kExpenses.length),
          ],
        ),
        const SizedBox(height: 14),
        // Filter pills
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: ['All', 'Outstanding', 'Paid', 'Draft'].map((f) {
              final active = f == filter;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => onFilterChanged(f),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: active ? RLTokens.ink : RLTokens.surface,
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
        const SizedBox(height: 14),
        ...invoices.map((inv) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _InvoiceCard(inv: inv),
        )),
      ],
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.inv});
  final _InvData inv;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (context.mounted) context.push('/money/invoice/${inv.id}');
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        inv.id,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 11,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                      const SizedBox(width: 8),
                      RLPill(inv.status, tone: statusTone(inv.status)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    inv.payer,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    '${inv.unit} · due ${inv.due}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _fmt(inv.amount),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 20,
                    color: RLTokens.ink,
                    letterSpacing: -0.4,
                  ),
                ),
                if (inv.paid > 0 && inv.paid < inv.amount) ...[
                  const SizedBox(height: 2),
                  Text(
                    '₵${_fmt(inv.paid)} paid',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 11,
                      color: RLTokens.warning,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Expenses tab ──────────────────────────────────────────────────────────────

class _ExpensesTab extends StatelessWidget {
  const _ExpensesTab({
    required this.collected,
    required this.outstanding,
    required this.totalExp,
    required this.seg,
    required this.onSegChanged,
  });

  final int                 collected;
  final int                 outstanding;
  final int                 totalExp;
  final String              seg;
  final ValueChanged<String> onSegChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 6, RLTokens.gutter, 120),
      children: [
        const SizedBox(height: 14),
        _SummaryCard(collected: collected, outstanding: outstanding, totalExp: totalExp),
        const SizedBox(height: 16),
        RLSegmented(
          value: seg,
          onChanged: onSegChanged,
          items: [
            RLSegmentItem(key: 'invoices', label: 'Invoices', count: _kInvoices.length),
            RLSegmentItem(key: 'expenses', label: 'Expenses', count: _kExpenses.length),
          ],
        ),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Column(
            children: List.generate(_kExpenses.length, (i) {
              final e      = _kExpenses[i];
              final isLast = i == _kExpenses.length - 1;
              return GestureDetector(
                onTap: () async => Haptics.vibrate(HapticsType.selection),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  decoration: BoxDecoration(
                    border: isLast
                        ? null
                        : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: RLTokens.warningBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.receipt_long_outlined, size: 18, color: RLTokens.warning),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              e.title,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 14,
                                fontWeight: RLTokens.semibold,
                                color: RLTokens.ink,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${e.cat} · ${e.date}',
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12,
                                color: RLTokens.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '₵${_fmt(e.amount)}',
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 15,
                          fontWeight: RLTokens.bold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

String _fmt(int n) =>
    n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
