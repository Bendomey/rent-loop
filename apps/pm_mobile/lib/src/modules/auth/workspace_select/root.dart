import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// Static design data — will be replaced by real API workspace list.
const _kWorkspaces = [
  _WsData(id: 'ws1', name: 'Owusu Estates',             initial: 'OE', role: 'Manager', props: 5, units: 64),
  _WsData(id: 'ws2', name: 'Cantonments Property Co.',  initial: 'CP', role: 'Staff',   props: 1, units: 24),
  _WsData(id: 'ws3', name: 'Labadi Hospitality Group',  initial: 'LH', role: 'Manager', props: 2, units: 18),
];

class _WsData {
  const _WsData({required this.id, required this.name, required this.initial, required this.role, required this.props, required this.units});
  final String id;
  final String name;
  final String initial;
  final String role;
  final int props;
  final int units;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class WorkspaceSelectScreen extends ConsumerWidget {
  const WorkspaceSelectScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 30, 24, 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Row(
                children: [
                  const _LogoMark(size: 28),
                  const SizedBox(width: 10),
                  RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 19,
                        fontWeight: RLTokens.bold,
                        letterSpacing: -0.4,
                        color: RLTokens.ink,
                      ),
                      children: const [
                        TextSpan(text: 'rent', style: TextStyle(color: RLTokens.crimson)),
                        TextSpan(text: 'loop'),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),

              // Heading
              Text(
                'Choose a workspace',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 30,
                  letterSpacing: -0.6,
                  color: RLTokens.ink,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You\'re a member of ${_kWorkspaces.length} organisations.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 14.5,
                  color: RLTokens.muted,
                ),
              ),
              const SizedBox(height: 26),

              // Workspace cards
              for (final ws in _kWorkspaces) ...[
                _WorkspaceCard(
                  ws: ws,
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.medium);
                    ref.read(appStartupProvider.notifier).selectWorkspace();
                  },
                ),
                const SizedBox(height: 12),
              ],

              // "Create a new workspace" dashed button
              GestureDetector(
                onTap: () async => Haptics.vibrate(HapticsType.selection),
                child: CustomPaint(
                  painter: _DashedRectPainter(
                    radius: 14,
                    color: RLTokens.hairline,
                    strokeWidth: 1.5,
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: Padding(
                      padding: const EdgeInsets.all(15),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add, size: 18, color: RLTokens.ink),
                          const SizedBox(width: 8),
                          Text(
                            'Create a new workspace',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 14.5,
                              fontWeight: RLTokens.semibold,
                              color: RLTokens.ink,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Workspace card ────────────────────────────────────────────────────────────

class _WorkspaceCard extends StatelessWidget {
  const _WorkspaceCard({required this.ws, required this.onTap});
  final _WsData ws;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isManager = ws.role == 'Manager';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          children: [
            _WsTile(initial: ws.initial, size: 50),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ws.name,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 18,
                      color: RLTokens.ink,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      RLPill(
                        ws.role,
                        tone: isManager ? RLTone.danger : RLTone.neutral,
                      ),
                      const SizedBox(width: 7),
                      Text(
                        '${ws.props} properties · ${ws.units} units',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, size: 18, color: RLTokens.micro),
          ],
        ),
      ),
    );
  }
}

// ── Workspace tile (initials badge) ──────────────────────────────────────────

class _WsTile extends StatelessWidget {
  const _WsTile({required this.initial, required this.size});
  final String initial;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: RLTokens.crimsonTint2),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: size * 0.36,
            color: RLTokens.crimson,
            letterSpacing: 0.3,
            height: 1,
          ),
        ),
      ),
    );
  }
}

// ── Dashed border painter ─────────────────────────────────────────────────────

class _DashedRectPainter extends CustomPainter {
  const _DashedRectPainter({required this.radius, required this.color, required this.strokeWidth});
  final double radius;
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rRect  = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius));
    final path   = Path()..addRRect(rRect);
    final metric = path.computeMetrics().first;

    const dashLen = 6.0;
    const gapLen  = 5.0;
    var distance  = 0.0;
    final dashed  = Path();

    while (distance < metric.length) {
      final end = (distance + dashLen).clamp(0.0, metric.length);
      dashed.addPath(metric.extractPath(distance, end), Offset.zero);
      distance += dashLen + gapLen;
    }
    canvas.drawPath(dashed, paint);
  }

  @override
  bool shouldRepaint(covariant _DashedRectPainter old) =>
      old.color != color || old.radius != radius;
}

// ── Logo mark ─────────────────────────────────────────────────────────────────

class _LogoMark extends StatelessWidget {
  const _LogoMark({required this.size});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimson,
        borderRadius: BorderRadius.circular(size * 0.308),
      ),
      child: CustomPaint(
        size: Size(size, size),
        painter: _HouseMarkPainter(),
      ),
    );
  }
}

class _HouseMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 26;
    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.069
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(
      Path()
        ..moveTo(5 * s, 21 * s)
        ..lineTo(5 * s, 9 * s)
        ..lineTo(13 * s, 5 * s)
        ..lineTo(21 * s, 9 * s)
        ..lineTo(21 * s, 21 * s),
      stroke,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(10 * s, 14 * s, 6 * s, 7 * s),
        Radius.circular(1.2 * s),
      ),
      Paint()..color = Colors.white,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
