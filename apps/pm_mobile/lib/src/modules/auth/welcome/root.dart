import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 4-panel onboarding carousel. Panel stages swap immediately; the bottom text
// block fades + slides up on each advance. Based on Manager App design v1.
// ─────────────────────────────────────────────────────────────────────────────

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  int _index = 0;
  static const _count = 4;

  void _advance() async {
    if (_index < _count - 1) {
      await Haptics.vibrate(HapticsType.medium);
      setState(() => _index++);
    } else {
      await Haptics.vibrate(HapticsType.success);
      if (mounted) context.go('/auth/login');
    }
  }

  void _skip() => context.go('/auth/login');

  @override
  Widget build(BuildContext context) {
    final isLast = _index == _count - 1;
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _TopBar(index: _index, count: _count, isLast: isLast, onSkip: _skip),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: KeyedSubtree(
                  key: ValueKey('stage-$_index'),
                  child: switch (_index) {
                    0 => const _StageWelcome(),
                    1 => const _StageDashboard(),
                    2 => const _StageOps(),
                    3 => const _StageMoney(),
                    _ => const SizedBox.expand(),
                  },
                ),
              ),
            ),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 450),
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 0.06),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
                  child: child,
                ),
              ),
              child: _BottomSection(
                key: ValueKey('bottom-$_index'),
                slide: _kSlides[_index],
                isLast: isLast,
                onAdvance: _advance,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Slide copy ────────────────────────────────────────────────────────────────

typedef _Slide = ({String eyebrow, String title, String body});

const _kSlides = <_Slide>[
  (
    eyebrow: 'Property management, elevated',
    title: 'Your whole portfolio,\nin your pocket.',
    body: 'Manage every property, tenant and payment from one simple app.',
  ),
  (
    eyebrow: 'See everything',
    title: 'The whole picture,\nat a glance.',
    body:
        'Track revenue, occupancy and rent collection across every property — live.',
  ),
  (
    eyebrow: 'Stay ahead',
    title: 'Every request,\nhandled on time.',
    body:
        'Maintenance, applications and bookings in one queue you can clear from anywhere.',
  ),
  (
    eyebrow: 'Get paid',
    title: 'Money in,\nbeautifully tracked.',
    body: "Send invoices, record payments and see what's outstanding at a glance.",
  ),
];

// ── Top bar ───────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final int index;
  final int count;
  final bool isLast;
  final VoidCallback onSkip;

  const _TopBar({
    required this.index,
    required this.count,
    required this.isLast,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 4),
      child: Row(
        children: [
          ...List.generate(count, (k) {
            final active = k == index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              width: active ? 26 : 18,
              height: 4,
              margin: EdgeInsets.only(right: k < count - 1 ? 6 : 0),
              decoration: BoxDecoration(
                color: active ? RLTokens.crimson : RLTokens.hairline,
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
          const Spacer(),
          if (!isLast)
            GestureDetector(
              onTap: onSkip,
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: Text(
                  'Skip',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.muted,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Bottom text + CTA ─────────────────────────────────────────────────────────

class _BottomSection extends StatelessWidget {
  final _Slide slide;
  final bool isLast;
  final VoidCallback onAdvance;

  const _BottomSection({
    super.key,
    required this.slide,
    required this.isLast,
    required this.onAdvance,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 0, 28, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            slide.eyebrow.toUpperCase(),
            style: const TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              letterSpacing: 1.5,
              color: RLTokens.crimson,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            slide.title,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 34,
              height: 1.08,
              letterSpacing: -0.8,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            slide.body,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14.5,
              height: 1.55,
              color: RLTokens.muted,
            ),
          ),
          const SizedBox(height: 26),
          _ContinueButton(onTap: onAdvance, isLast: isLast),
        ],
      ),
    );
  }
}

// ── Continue / Get started button ─────────────────────────────────────────────

class _ContinueButton extends StatefulWidget {
  final VoidCallback onTap;
  final bool isLast;

  const _ContinueButton({required this.onTap, required this.isLast});

  @override
  State<_ContinueButton> createState() => _ContinueButtonState();
}

class _ContinueButtonState extends State<_ContinueButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 80),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.97)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.isLast ? RLTokens.crimson : RLTokens.ink;
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) {
        _ctrl.reverse();
        widget.onTap();
      },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 17),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.isLast ? 'Get started' : 'Continue',
                style: const TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 15.5,
                  fontWeight: RLTokens.bold,
                  color: Colors.white,
                  letterSpacing: 0.1,
                ),
              ),
              const SizedBox(width: 9),
              CustomPaint(size: const Size(19, 19), painter: _ArrowPainter()),
            ],
          ),
        ),
      ),
    );
  }
}

class _ArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Scale SVG path (viewBox 24×24) to actual widget size.
    final sx = size.width / 24;
    final sy = size.height / 24;
    // Horizontal shaft: M5 12h14
    canvas.drawLine(Offset(5 * sx, 12 * sy), Offset(19 * sx, 12 * sy), p);
    // Chevron: M13 6l6 6-6 6
    canvas.drawPath(
      Path()
        ..moveTo(13 * sx, 6 * sy)
        ..lineTo(19 * sx, 12 * sy)
        ..lineTo(13 * sx, 18 * sy),
      p,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ═════════════════════════════════════════════════════════════════════════════
// PANEL STAGES
// ═════════════════════════════════════════════════════════════════════════════

// ── Panel 1: Welcome — logo with concentric rings ─────────────────────────────

class _StageWelcome extends StatelessWidget {
  const _StageWelcome();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 192,
            height: 192,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 192,
                  height: 192,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: RLTokens.hairlineSoft),
                  ),
                ),
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                ),
                const _MgMark(size: 84),
              ],
            ),
          ),
          const SizedBox(height: 22),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'rent',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 27,
                    fontWeight: RLTokens.bold,
                    letterSpacing: -0.6,
                    color: RLTokens.crimson,
                  ),
                ),
                TextSpan(
                  text: 'loop',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 27,
                    fontWeight: RLTokens.bold,
                    letterSpacing: -0.6,
                    color: RLTokens.ink,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'MANAGER',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 10.5,
              letterSpacing: 2,
              color: RLTokens.mutedSoft,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Panel 2: Dashboard — floating metric cards ────────────────────────────────

class _StageDashboard extends StatelessWidget {
  const _StageDashboard();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (_, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;
        return Stack(
          children: [
            // Dark revenue card — top left
            Positioned(
              left: 20,
              top: h * 0.07,
              child: Transform.rotate(
                angle: -2 * math.pi / 180,
                child: _FloatCard(
                  width: math.min(244.0, w - 40),
                  dark: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'REVENUE · JUNE',
                            style: TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 9,
                              letterSpacing: 1,
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                          ),
                          _MiniPill(
                            label: '▲ 12%',
                            fg: RLTokens.success,
                            bg: RLTokens.successBg,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'GH₵ 1,845',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 31,
                          height: 1,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 14),
                      _Bar(
                        pct: 0.92,
                        color: Colors.white,
                        track: Colors.white.withValues(alpha: 0.15),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        '92% rent collected',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 10.5,
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Light donut card — right
            Positioned(
              right: 14,
              top: h * 0.44,
              child: Transform.rotate(
                angle: 6 * math.pi / 180,
                child: _FloatCard(
                  width: 150,
                  child: Row(
                    children: [
                      _Donut(pct: 0.88, size: 60, thickness: 9, label: '88%'),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '56',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 17,
                              color: RLTokens.ink,
                            ),
                          ),
                          const Text(
                            'occupied',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 10.5,
                              color: RLTokens.muted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Small occupancy chip — bottom left
            Positioned(
              left: 26,
              top: h * 0.60,
              child: Transform.rotate(
                angle: -7 * math.pi / 180,
                child: _FloatCard(
                  width: 132,
                  padding: const EdgeInsets.all(13),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'OCCUPANCY',
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 8.5,
                          letterSpacing: 0.8,
                          color: RLTokens.mutedSoft,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          const Text(
                            '88%',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 20,
                              color: RLTokens.ink,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '▲ 3%',
                            style: TextStyle(
                              fontFamily: RLTokens.fontMono,
                              fontSize: 10,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.success,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ── Panel 3: Operations — activity feed ───────────────────────────────────────

class _StageOps extends StatelessWidget {
  const _StageOps();

  static const _items = [
    _ActivityItem(
      dotColor: RLTokens.danger,
      title: 'New maintenance request',
      subtitle: 'Leaking kitchen tap · Unit 4B',
      time: '2m',
    ),
    _ActivityItem(
      dotColor: RLTokens.info,
      title: 'New application',
      subtitle: 'Adjoa Frimpong · Unit 1C',
      time: '1h',
    ),
    _ActivityItem(
      dotColor: RLTokens.success,
      title: 'Booking confirmed',
      subtitle: 'Suite 4 · Jun 8–11',
      time: '3h',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 22),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 320),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: RLTokens.hairline),
            boxShadow: const [
              BoxShadow(
                color: Color.fromRGBO(17, 17, 16, 0.18),
                blurRadius: 40,
                spreadRadius: -18,
                offset: Offset(0, 16),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: RLTokens.success,
                      boxShadow: [
                        BoxShadow(
                          color: RLTokens.successBg,
                          blurRadius: 0,
                          spreadRadius: 3,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'ACTIVITY · LIVE',
                    style: TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 9.5,
                      letterSpacing: 1.4,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Stack(
                children: [
                  // Vertical timeline line
                  const Positioned(
                    left: 5,
                    top: 14,
                    bottom: 14,
                    child: SizedBox(
                      width: 2,
                      child: ColoredBox(color: RLTokens.hairline),
                    ),
                  ),
                  Column(
                    children: _items
                        .map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 12,
                                  height: 12,
                                  margin: const EdgeInsets.only(top: 3),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: item.dotColor,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 3,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.title,
                                        style: const TextStyle(
                                          fontFamily: RLTokens.fontSans,
                                          fontSize: 13.5,
                                          fontWeight: RLTokens.semibold,
                                          color: RLTokens.ink,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.subtitle,
                                        style: const TextStyle(
                                          fontFamily: RLTokens.fontSans,
                                          fontSize: 11.5,
                                          color: RLTokens.muted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  item.time,
                                  style: const TextStyle(
                                    fontFamily: RLTokens.fontMono,
                                    fontSize: 10,
                                    color: RLTokens.micro,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityItem {
  final Color dotColor;
  final String title;
  final String subtitle;
  final String time;

  const _ActivityItem({
    required this.dotColor,
    required this.title,
    required this.subtitle,
    required this.time,
  });
}

// ── Panel 4: Money — collected figure + bar chart ─────────────────────────────

class _StageMoney extends StatelessWidget {
  const _StageMoney();

  static const _data = [78, 84, 81, 90, 86, 92];
  static const _months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];

  @override
  Widget build(BuildContext context) {
    const maxVal = 92.0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(30, 0, 30, 0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'COLLECTED · THIS MONTH',
            style: TextStyle(
              fontFamily: RLTokens.fontMono,
              fontSize: 9.5,
              letterSpacing: 1.4,
              color: RLTokens.mutedSoft,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'GH₵ 1,697.40',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 44,
              height: 1,
              letterSpacing: -0.8,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Text(
                '92% of rent collected',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.muted,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '▲ 6%',
                style: TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 11,
                  fontWeight: RLTokens.semibold,
                  color: RLTokens.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 34),
          SizedBox(
            height: 124,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(_data.length, (i) {
                final isLast = i == _data.length - 1;
                final pct = _data[i] / maxVal;
                return Expanded(
                  child: Padding(
                    padding:
                        EdgeInsets.only(right: i < _data.length - 1 ? 10 : 0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: FractionallySizedBox(
                              heightFactor: pct,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isLast
                                      ? RLTokens.crimson
                                      : RLTokens.fill,
                                  borderRadius: BorderRadius.circular(7),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 9),
                        Text(
                          _months[i],
                          style: TextStyle(
                            fontFamily: RLTokens.fontMono,
                            fontSize: 8.5,
                            color: isLast ? RLTokens.crimson : RLTokens.micro,
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
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED SUB-WIDGETS
// ═════════════════════════════════════════════════════════════════════════════

// Rentloop logo mark — crimson square + house icon, scalable.
class _MgMark extends StatelessWidget {
  final double size;

  const _MgMark({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimson,
        borderRadius: BorderRadius.circular(size * 8 / 26),
      ),
      child: CustomPaint(painter: _MgMarkPainter()),
    );
  }
}

class _MgMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Scale the original 26×26 SVG path to whatever size the widget is.
    canvas.scale(size.width / 26, size.height / 26);

    final p = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(
      Path()
        ..moveTo(5, 21)
        ..lineTo(5, 9)
        ..lineTo(13, 5)
        ..lineTo(21, 9)
        ..lineTo(21, 21),
      p,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(10, 14, 6, 7),
        const Radius.circular(1.2),
      ),
      Paint()..color = Colors.white,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// Elevated card — light (white) or dark (#1C1C1A).
class _FloatCard extends StatelessWidget {
  final Widget child;
  final double width;
  final bool dark;
  final EdgeInsets? padding;

  const _FloatCard({
    required this.child,
    required this.width,
    this.dark = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: dark ? const Color(0xFF1C1C1A) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: dark
              ? Colors.white.withValues(alpha: 0.08)
              : RLTokens.hairline,
        ),
        boxShadow: [
          BoxShadow(
            color: dark
                ? Colors.black.withValues(alpha: 0.45)
                : const Color.fromRGBO(17, 17, 16, 0.18),
            blurRadius: dark ? 50 : 40,
            spreadRadius: dark ? -20 : -18,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: child,
    );
  }
}

// Status pill for onboarding cards.
class _MiniPill extends StatelessWidget {
  final String label;
  final Color fg;
  final Color bg;

  const _MiniPill({required this.label, required this.fg, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 10.5,
          fontWeight: RLTokens.semibold,
          color: fg,
        ),
      ),
    );
  }
}

// Thin horizontal progress bar.
class _Bar extends StatelessWidget {
  final double pct;
  final Color color;
  final Color track;

  const _Bar({required this.pct, required this.color, required this.track});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (_, constraints) {
        return SizedBox(
          height: 4,
          child: Stack(
            children: [
              Container(
                width: constraints.maxWidth,
                decoration: BoxDecoration(
                  color: track,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              FractionallySizedBox(
                widthFactor: pct,
                child: Container(
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// Donut chart with a centred text label.
class _Donut extends StatelessWidget {
  final double pct;
  final double size;
  final double thickness;
  final String label;

  const _Donut({
    required this.pct,
    required this.size,
    required this.thickness,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DonutPainter(pct: pct, thickness: thickness),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 16,
              color: RLTokens.ink,
            ),
          ),
        ),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  final double pct;
  final double thickness;

  const _DonutPainter({required this.pct, required this.thickness});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - thickness) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = RLTokens.fill
        ..style = PaintingStyle.stroke
        ..strokeWidth = thickness,
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * pct,
      false,
      Paint()
        ..color = RLTokens.crimson
        ..style = PaintingStyle.stroke
        ..strokeWidth = thickness
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _DonutPainter old) =>
      old.pct != pct || old.thickness != thickness;
}
