import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Data ──────────────────────────────────────────────────────────────────────

class _Invoice {
  const _Invoice({
    required this.id,
    required this.status,
    required this.property,
    required this.amount,
  });
  final String id;
  final String status;
  final String property;
  final int amount;
}

const _kInvoices = [
  _Invoice(id: 'BILL-2606-014', status: 'Paid',    property: 'Emirate Hotel',        amount: 240),
  _Invoice(id: 'BILL-2606-013', status: 'Issued',  property: 'Cantonments Court',    amount: 480),
  _Invoice(id: 'BILL-2605-009', status: 'Paid',    property: 'Spintex Heights',      amount: 360),
  _Invoice(id: 'BILL-2605-008', status: 'Overdue', property: 'Labadi Beach Suites',  amount: 240),
  _Invoice(id: 'BILL-2604-006', status: 'Paid',    property: 'East Legon Villa',     amount: 120),
];

const _kFilters = ['All', 'Paid', 'Issued', 'Overdue'];

// ── Screen ────────────────────────────────────────────────────────────────────

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  String _filter = 'All';

  List<_Invoice> get _filtered => _filter == 'All'
      ? _kInvoices
      : _kInvoices.where((i) => i.status == _filter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Billing',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
            trailing: GestureDetector(
              onTap: () => Haptics.vibrate(HapticsType.selection),
              child: const Padding(
                padding: EdgeInsets.all(9),
                child: Icon(Icons.tune_rounded,
                    size: 20, color: RLTokens.ink),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Heading ────────────────────────────────────────────────
                  const Text(
                    'Manage billing',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 25,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Billing invoices are automatically generated every month.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Plan card (dark) ───────────────────────────────────────
                  RLCard(
                    dark: true,
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'CURRENT PLAN',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 10,
                                    letterSpacing: 1,
                                    color: Color.fromRGBO(255, 255, 255, 0.55),
                                  ),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'Growth',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSerif,
                                    fontSize: 22,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            const RLPill('Active',
                                tone: RLTone.success, large: true),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          height: 1,
                          color: const Color.fromRGBO(255, 255, 255, 0.1),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Text(
                              'Next invoice · Jul 1',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: Color.fromRGBO(255, 255, 255, 0.6),
                              ),
                            ),
                            Text(
                              'GH₵ 480.00',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 15,
                                fontWeight: RLTokens.semibold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Filter chips ───────────────────────────────────────────
                  RLFilterChips(
                    options: _kFilters,
                    selected: _filter,
                    onSelect: (f) {
                      Haptics.vibrate(HapticsType.selection);
                      setState(() => _filter = f);
                    },
                  ),

                  // ── Invoices ───────────────────────────────────────────────
                  RLLabel('${_filtered.length} invoice${_filtered.length == 1 ? '' : 's'}'),

                  if (_filtered.isEmpty)
                    _EmptyState()
                  else
                    Column(
                      children: _filtered
                          .map((inv) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _InvoiceCard(invoice: inv),
                              ))
                          .toList(),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Invoice card ──────────────────────────────────────────────────────────────

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice});
  final _Invoice invoice;

  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Icon tile
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(
              Icons.receipt_long_outlined,
              size: 19,
              color: RLTokens.inkSoft,
            ),
          ),
          const SizedBox(width: 12),

          // ID + status + property
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      invoice.id,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontMono,
                        fontSize: 11.5,
                        color: RLTokens.muted,
                      ),
                    ),
                    const SizedBox(width: 8),
                    RLPill(invoice.status,
                        tone: statusTone(invoice.status)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  invoice.property,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    color: RLTokens.ink,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Amount
          Text(
            '${invoice.amount}',
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 19,
              color: RLTokens.ink,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RLCard(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: RLTokens.fill,
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(Icons.receipt_long_outlined,
                size: 26, color: RLTokens.mutedSoft),
          ),
          const SizedBox(height: 12),
          const Text(
            'No billing invoices found',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 16,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 5),
          const Text(
            'Billing invoices will be automatically generated every month.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
