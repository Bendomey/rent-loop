import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'akosua@owusuestates.com');
  final _passCtrl = TextEditingController(text: 'rentloop2026');
  bool _showPass = false;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    setState(() => _loading = true);
    await ref.read(appStartupProvider.notifier).login();
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(28, 32, 28, 34),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Row(
                children: [
                  _LogoMark(size: 30),
                  const SizedBox(width: 10),
                  RichText(
                    text: TextSpan(
                      style: TextStyle(fontFamily: RLTokens.fontSans, 
                        fontSize: 20,
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
              const SizedBox(height: 46),

              // Title
              Text(
                'Sign in',
                style: TextStyle(fontFamily: RLTokens.fontSerif, 
                  fontSize: 32,
                  letterSpacing: -0.6,
                  color: RLTokens.ink,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Manage your portfolio from anywhere.',
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: 14.5,
                  color: RLTokens.muted,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 30),

              // Email field
              _FieldLabel('EMAIL'),
              const SizedBox(height: 7),
              _InputField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 14),

              // Password field
              _FieldLabel('PASSWORD'),
              const SizedBox(height: 7),
              _InputField(
                controller: _passCtrl,
                obscureText: !_showPass,
                mono: true,
                trailing: GestureDetector(
                  onTap: () => setState(() => _showPass = !_showPass),
                  child: Text(
                    _showPass ? 'Hide' : 'Show',
                    style: TextStyle(fontFamily: RLTokens.fontSans, 
                      fontSize: 12.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.crimson,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Align(
                alignment: Alignment.centerRight,
                child: GestureDetector(
                  onTap: () {},
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Text(
                      'Forgot password?',
                      style: TextStyle(fontFamily: RLTokens.fontSans, 
                        fontSize: 13,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Sign in button
              GestureDetector(
                onTap: _loading ? null : _signIn,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: _loading ? RLTokens.crimson.withAlpha(180) : RLTokens.crimson,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(
                            'Sign in',
                            style: TextStyle(fontFamily: RLTokens.fontSans, 
                              fontSize: 15.5,
                              fontWeight: RLTokens.semibold,
                              color: Colors.white,
                              letterSpacing: 0.1,
                            ),
                          ),
                  ),
                ),
              ),

              const SizedBox(height: 40),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'New here?',
                      style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, color: RLTokens.muted),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () {},
                      child: Text(
                        'Create a workspace',
                        style: TextStyle(fontFamily: RLTokens.fontSans, 
                          fontSize: 13,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(fontFamily: RLTokens.fontSans, 
        fontSize: 11,
        fontWeight: RLTokens.semibold,
        letterSpacing: 0.6,
        color: RLTokens.mutedSoft,
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    this.obscureText = false,
    this.mono = false,
    this.trailing,
    this.keyboardType,
  });

  final TextEditingController controller;
  final bool obscureText;
  final bool mono;
  final Widget? trailing;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              obscureText ? '••••••••••••' : controller.text,
              style: mono
                  ? TextStyle(fontFamily: RLTokens.fontMono, fontSize: 15, color: RLTokens.ink, letterSpacing: 1)
                  : TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, color: RLTokens.ink),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

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
        borderRadius: BorderRadius.circular(size * 0.3),
      ),
      child: CustomPaint(size: Size(size, size), painter: _HouseMarkPainter()),
    );
  }
}

class _HouseMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.07
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final s = size.width / 26;

    final roof = Path()
      ..moveTo(5 * s, 21 * s)
      ..lineTo(5 * s, 9 * s)
      ..lineTo(13 * s, 5 * s)
      ..lineTo(21 * s, 9 * s)
      ..lineTo(21 * s, 21 * s);
    canvas.drawPath(roof, p);

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
