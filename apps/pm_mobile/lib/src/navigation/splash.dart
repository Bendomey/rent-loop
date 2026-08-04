import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/architecture/app_startup/app_startup_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(appStartupNotifierProvider.notifier).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: RLTokens.crimson,
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Center(child: _HouseIcon()),
            ),
            const SizedBox(height: 16),
            Text(
              'rentloop',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 22,
                fontWeight: RLTokens.bold,
                letterSpacing: -0.4,
                color: RLTokens.ink,
              ),
            ),
            const SizedBox(height: 40),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(RLTokens.crimson),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HouseIcon extends StatelessWidget {
  const _HouseIcon();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(size: const Size(26, 26), painter: _HousePainter());
  }
}

class _HousePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Roof outline: M5 21V9l8-4 8 4v12
    final roof = Path()
      ..moveTo(5, 21)
      ..lineTo(5, 9)
      ..lineTo(13, 5)
      ..lineTo(21, 9)
      ..lineTo(21, 21);
    canvas.drawPath(roof, p);

    // Door: rect x=10 y=14 w=6 h=7
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
