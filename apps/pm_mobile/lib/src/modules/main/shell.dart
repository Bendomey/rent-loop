import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

class MainShell extends ConsumerWidget {
  const MainShell(this.shell, {super.key});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toast = ref.watch(rlToastProvider);
    return Scaffold(
      body: Stack(
        children: [
          shell,
          if (toast != null)
            Positioned(
              left: 14,
              right: 14,
              bottom: 10,
              child: RLToastWidget(
                toast: toast,
                onDismiss: () => ref.read(rlToastProvider.notifier).dismiss(),
              ),
            ),
        ],
      ),
      bottomNavigationBar: _TabBar(
        currentIndex: shell.currentIndex,
        onTap: (i) async {
          await Haptics.vibrate(HapticsType.selection);
          shell.goBranch(i, initialLocation: i == shell.currentIndex);
        },
      ),
    );
  }
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
// Design spec: bg white, 1px hairline top border, paddingTop 9px,
// paddingBottom = SafeArea home indicator. Icon 23px, gap 4px, label 10.5px.

class _TabBar extends StatelessWidget {
  const _TabBar({required this.currentIndex, required this.onTap});
  final int currentIndex;
  final ValueChanged<int> onTap;

  static const _tabs = [
    _TabSpec(label: 'Home', icon: 'home'),
    _TabSpec(label: 'Properties', icon: 'building'),
    _TabSpec(label: 'Activity', icon: 'activity'),
    _TabSpec(label: 'Money', icon: 'money'),
    _TabSpec(label: 'More', icon: 'more'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.only(top: 9),
          child: Row(
            children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  child: _TabItem(
                    spec: _tabs[i],
                    active: i == currentIndex,
                    onTap: () => onTap(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec({required this.label, required this.icon});
  final String label;
  final String icon;
}

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.spec,
    required this.active,
    required this.onTap,
  });
  final _TabSpec spec;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? RLTokens.crimson : RLTokens.mutedSoft;
    final sw = active ? 2.0 : 1.7;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 23,
            height: 23,
            child: CustomPaint(
              painter: _TabIconPainter(
                name: spec.icon,
                color: color,
                strokeWidth: sw,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            spec.label,
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 10.5,
              fontWeight: active ? RLTokens.bold : RLTokens.medium,
              color: color,
              letterSpacing: 0.1,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ── Tab icon painter — mirrors the SVG paths from the design exactly ──────────
// All paths are authored for a 24×24 viewBox and scaled to the widget size.

class _TabIconPainter extends CustomPainter {
  const _TabIconPainter({
    required this.name,
    required this.color,
    required this.strokeWidth,
  });
  final String name;
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    // Scale the 24×24 design viewBox to whatever size is requested.
    canvas.scale(size.width / 24, size.height / 24);

    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fill = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    switch (name) {
      case 'home':
        // Roof chevron: M3 11.5L12 4l9 7.5
        canvas.drawPath(
          Path()
            ..moveTo(3, 11.5)
            ..lineTo(12, 4)
            ..lineTo(21, 11.5),
          stroke,
        );
        // Walls: M5.5 10V20h13V10
        canvas.drawPath(
          Path()
            ..moveTo(5.5, 10)
            ..lineTo(5.5, 20)
            ..lineTo(18.5, 20)
            ..lineTo(18.5, 10),
          stroke,
        );

      case 'building':
        // Outer shell: rect x=4 y=3 w=16 h=18 rx=1.5
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(4, 3, 16, 18),
            const Radius.circular(1.5),
          ),
          stroke,
        );
        // Window dots (zero-length lines → round dot = strokeWidth circle):
        // M9 7h0  M15 7h0  M9 11h0  M15 11h0  M9 15h0  M15 15h0
        final dotR = (strokeWidth + 0.4) / 2;
        for (final o in [
          const Offset(9, 7),
          const Offset(15, 7),
          const Offset(9, 11),
          const Offset(15, 11),
          const Offset(9, 15),
          const Offset(15, 15),
        ]) {
          canvas.drawCircle(o, dotR, fill);
        }
        // Door: M10 21v-3h4v3
        canvas.drawPath(
          Path()
            ..moveTo(10, 21)
            ..lineTo(10, 18)
            ..lineTo(14, 18)
            ..lineTo(14, 21),
          stroke,
        );

      case 'activity':
        // Waveform: M3 12h3.5l2-6 3.5 13 2.5-9 1.5 4H21
        // Decoded: (3,12)→(6.5,12)→(8.5,6)→(12,19)→(14.5,10)→(16,14)→(21,14)
        canvas.drawPath(
          Path()
            ..moveTo(3, 12)
            ..lineTo(6.5, 12)
            ..lineTo(8.5, 6)
            ..lineTo(12, 19)
            ..lineTo(14.5, 10)
            ..lineTo(16, 14)
            ..lineTo(21, 14),
          stroke,
        );

      case 'money':
        // Card: rect x=3 y=6 w=18 h=12 rx=2
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(3, 6, 18, 12),
            const Radius.circular(2),
          ),
          stroke,
        );
        // Center circle: cx=12 cy=12 r=2.4
        canvas.drawCircle(const Offset(12, 12), 2.4, stroke);
        // Corner dots: M6.5 9v0  M17.5 15v0
        final dotR2 = (strokeWidth + 0.4) / 2;
        canvas.drawCircle(const Offset(6.5, 9), dotR2, fill);
        canvas.drawCircle(const Offset(17.5, 15), dotR2, fill);

      case 'more':
        // Three filled circles: cx 5, 12, 19 · cy 12 · r 1.2
        for (final x in [5.0, 12.0, 19.0]) {
          canvas.drawCircle(Offset(x, 12), 1.2, fill);
        }
    }
  }

  @override
  bool shouldRepaint(covariant _TabIconPainter old) =>
      old.color != color || old.strokeWidth != strokeWidth || old.name != name;
}
