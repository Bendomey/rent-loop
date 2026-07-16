import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (mirrors root.dart) ─────────────────────────────────────────────

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
  final int amount;
  final int paid;
  final String status;
}

const _kInvoices = [
  _InvData(
    id: 'INV-2041',
    payer: 'Ama Boateng',
    unit: 'Unit 5A · Cantonments',
    due: 'Jun 1',
    amount: 4200,
    paid: 0,
    status: 'Overdue',
  ),
  _InvData(
    id: 'INV-2042',
    payer: 'Efua Sarpong',
    unit: 'Unit 7 · Spintex',
    due: 'Jun 1',
    amount: 3500,
    paid: 2000,
    status: 'Partially Paid',
  ),
  _InvData(
    id: 'INV-2039',
    payer: 'Kwame Mensah',
    unit: 'Unit 4B · Cantonments',
    due: 'Jun 1',
    amount: 4200,
    paid: 4200,
    status: 'Paid',
  ),
  _InvData(
    id: 'INV-2043',
    payer: 'Yaw Asante',
    unit: 'Unit 3B · Cantonments',
    due: 'Jun 5',
    amount: 5500,
    paid: 0,
    status: 'Issued',
  ),
  _InvData(
    id: 'INV-2044',
    payer: 'Michael Tetteh',
    unit: 'Suite 1 · Labadi',
    due: 'Jun 3',
    amount: 3200,
    paid: 3200,
    status: 'Paid',
  ),
  _InvData(
    id: 'INV-2045',
    payer: 'Daniel Ofori',
    unit: 'Unit 12 · Spintex',
    due: 'Jun 10',
    amount: 3500,
    paid: 0,
    status: 'Draft',
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class InvoiceDetailScreen extends StatelessWidget {
  const InvoiceDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final inv = _kInvoices.firstWhere(
      (x) => x.id == id,
      orElse: () => _kInvoices.first,
    );
    final outstanding = inv.amount - inv.paid;
    final lines = [
      (desc: 'Monthly rent — June 2026', amount: inv.amount - 200),
      (desc: 'Service charge', amount: 200),
    ];

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: inv.id,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () async => Haptics.vibrate(HapticsType.selection),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(
                  Icons.description_outlined,
                  size: 22,
                  color: RLTokens.ink,
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero: status pill + big amount + outstanding/paid message
                  _Hero(inv: inv, outstanding: outstanding),

                  // Billed to
                  RLLabel('Billed to'),
                  _BilledToCard(inv: inv),

                  // Line items
                  RLLabel('Line items'),
                  _LineItemsCard(lines: lines, total: inv.amount),

                  // Payment history
                  RLLabel('Payment history'),
                  _PaymentHistoryCard(inv: inv),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          if (outstanding > 0) _ActionBar(),
        ],
      ),
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  const _Hero({required this.inv, required this.outstanding});
  final _InvData inv;
  final int outstanding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        children: [
          Center(
            child: RLPill(
              inv.status,
              tone: statusTone(inv.status),
              large: true,
            ),
          ),
          const SizedBox(height: 14),
          Center(child: RLMoney(inv.amount, size: 46)),
          const SizedBox(height: 8),
          if (outstanding > 0)
            Center(
              child: Text(
                'GH₵ ${_fmt(outstanding)} outstanding · due ${inv.due}',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.crimson,
                ),
              ),
            )
          else
            Center(
              child: Text(
                'Paid in full',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 13,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.success,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Billed to card ────────────────────────────────────────────────────────────

class _BilledToCard extends StatelessWidget {
  const _BilledToCard({required this.inv});
  final _InvData inv;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          RLAvatar(inv.payer, size: 42),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  inv.payer,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 15,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  inv.unit,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 12.5,
                    color: RLTokens.muted,
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

// ── Line items card ───────────────────────────────────────────────────────────

class _LineItemsCard extends StatelessWidget {
  const _LineItemsCard({required this.lines, required this.total});
  final List<({String desc, int amount})> lines;
  final int total;

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
          ...lines.map(
            (l) => Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: RLTokens.hairlineSoft),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l.desc,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      color: RLTokens.inkSoft,
                    ),
                  ),
                  Text(
                    '₵${_fmt(l.amount)}',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Total row
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 13, 0, 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
                Text(
                  '₵${_fmt(total)}',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
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

// ── Payment history card ──────────────────────────────────────────────────────

class _PaymentHistoryCard extends StatelessWidget {
  const _PaymentHistoryCard({required this.inv});
  final _InvData inv;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: inv.paid > 0
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: RLTokens.successBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.check_rounded,
                      size: 18,
                      color: RLTokens.success,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '₵${_fmt(inv.paid)} received',
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Mobile Money · MTN · Jun 2',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          : const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Center(
                child: Text(
                  'No payments recorded yet.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ),
            ),
    );
  }
}

// ── Bottom action bar ─────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: const Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: Row(
        children: [
          RLBtn(
            label: 'Send',
            kind: RLBtnKind.light,
            onPressed: () async => Haptics.vibrate(HapticsType.selection),
          ),
          const SizedBox(width: 10),
          RLBtn(
            label: 'Partial',
            kind: RLBtnKind.light,
            onPressed: () async => Haptics.vibrate(HapticsType.selection),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: 'Mark paid',
              kind: RLBtnKind.primary,
              icon: Icons.check_rounded,
              full: true,
              onPressed: () async => Haptics.vibrate(HapticsType.medium),
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
