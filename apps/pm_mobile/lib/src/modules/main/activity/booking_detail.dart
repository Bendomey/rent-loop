import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data (mirrors root.dart) ─────────────────────────────────────────────

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

// ── Screen ────────────────────────────────────────────────────────────────────

class BookingDetailScreen extends StatelessWidget {
  const BookingDetailScreen({super.key, required this.id});
  final String id;

  static const _steps = ['Pending', 'Confirmed', 'Checked In', 'Completed'];

  @override
  Widget build(BuildContext context) {
    final b = _kBookings.firstWhere(
      (x) => x.id == id,
      orElse: () => _kBookings.first,
    );
    final cur = _steps.indexOf(b.status).clamp(0, _steps.length - 1);
    final cta = switch (b.status) {
      'Pending' => 'Confirm booking',
      'Confirmed' => 'Check guest in',
      _ => 'Check out',
    };

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Booking',
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
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),

                  // Guest card
                  _GuestCard(b: b),
                  const SizedBox(height: 10),

                  // Stepper card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: RLTokens.surface,
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                      border: Border.all(color: RLTokens.hairline),
                    ),
                    child: RLStepper(steps: _steps, current: cur),
                  ),

                  // Stay
                  RLLabel('Stay'),
                  _StayCard(b: b),

                  // Payment
                  RLLabel('Payment'),
                  _PaymentCard(b: b),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          _ActionBar(cta: cta),
        ],
      ),
    );
  }
}

// ── Guest card ────────────────────────────────────────────────────────────────

class _GuestCard extends StatelessWidget {
  const _GuestCard({required this.b});
  final _BookingData b;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          RLAvatar(b.guest, size: 48),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  b.guest,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 20,
                    color: RLTokens.ink,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
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
          RLPill(b.status, tone: statusTone(b.status), large: true),
        ],
      ),
    );
  }
}

// ── Stay card ─────────────────────────────────────────────────────────────────

class _StayCard extends StatelessWidget {
  const _StayCard({required this.b});
  final _BookingData b;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          // Check-in
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'CHECK-IN',
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    color: RLTokens.mutedSoft,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  b.inDate,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 20,
                    color: RLTokens.ink,
                  ),
                ),
              ],
            ),
          ),
          // Arrow + nights
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.arrow_forward_rounded,
                size: 18,
                color: RLTokens.crimson,
              ),
              const SizedBox(height: 2),
              Text(
                '${b.nights}n',
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 10,
                  color: RLTokens.muted,
                ),
              ),
            ],
          ),
          // Check-out
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'CHECK-OUT',
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10,
                    color: RLTokens.mutedSoft,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  b.outDate,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 20,
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

// ── Payment card ──────────────────────────────────────────────────────────────

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.b});
  final _BookingData b;

  @override
  Widget build(BuildContext context) {
    final ratePerNight = (b.amount / b.nights).round();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: [
          _FieldRow(k: 'Rate', v: 'GH₵ ${_fmt(ratePerNight)} / night'),
          _FieldRow(k: 'Nights', v: '${b.nights}'),
          // Total row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 13),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                RLMoney(b.amount, size: 22),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({required this.k, required this.v});
  final String k;
  final String v;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
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
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bottom action bar ─────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.cta});
  final String cta;

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
            label: 'Message',
            kind: RLBtnKind.light,
            icon: Icons.chat_bubble_outline_rounded,
            onPressed: () async => Haptics.vibrate(HapticsType.selection),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: RLBtn(
              label: cta,
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
