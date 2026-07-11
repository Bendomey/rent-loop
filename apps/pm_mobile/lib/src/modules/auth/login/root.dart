import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/repository/notifiers/auth/login_notifier.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:rentloop_manager/src/constants.dart';

final _applyUrl        = applyUrl(campaign: 'login', content: 'apply_cta');
final _forgotPasswordUrl = forgotPasswordUrl(campaign: 'login', content: 'forgot_password');

Future<void> _launch(Uri url) async {
  if (await canLaunchUrl(url)) {
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _showPass   = false;
  String? _validationError;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    final email    = _emailCtrl.text.trim();
    final password = _passCtrl.text;

    if (email.isEmpty || password.isEmpty) {
      await Haptics.vibrate(HapticsType.error);
      setState(() => _validationError = 'Please enter your email and password.');
      return;
    }

    await Haptics.vibrate(HapticsType.medium);
    setState(() => _validationError = null);

    // Loading/error state is tracked by loginNotifierProvider, not local
    // state — this avoids touching AppStartupState mid-request, which
    // would otherwise bounce the router to /splash while the request is
    // still in flight.
    await ref.read(loginNotifierProvider.notifier).submit(
      email: email,
      password: password,
    );

    if (!mounted) return;
    final status = ref.read(loginNotifierProvider).status;
    await Haptics.vibrate(
      status.isSuccess() ? HapticsType.success : HapticsType.error,
    );
  }

  @override
  Widget build(BuildContext context) {
    final loginState = ref.watch(loginNotifierProvider);
    final loading = loginState.status.isLoading();
    final error = _validationError ??
        (loginState.status.isFailed() ? loginState.errorMessage : null);

    return Scaffold(
      // Pure white — matches MG.bg in the design spec, overrides the
      // theme's paper scaffold background.
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ── Scrollable content ─────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(28, 32, 28, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Logo
                    Row(
                      children: [
                        const _LogoMark(size: 30),
                        const SizedBox(width: 10),
                        RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
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

                    // Heading
                    Text(
                      'Sign in',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSerif,
                        fontSize: 32,
                        letterSpacing: -0.6,
                        color: RLTokens.ink,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Manage your portfolio from anywhere.',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        color: RLTokens.muted,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 30),

                    // Error banner
                    if (error != null) ...[
                      RLInlineBanner(
                        tone: RLBannerTone.danger,
                        title: 'Sign-in failed',
                        body: error,
                        onDismiss: () {
                          setState(() => _validationError = null);
                          ref.read(loginNotifierProvider.notifier).reset();
                        },
                      ),
                      const SizedBox(height: 18),
                    ],

                    // Email
                    _FieldLabel('EMAIL'),
                    const SizedBox(height: 7),
                    _LoginField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email],
                    ),
                    const SizedBox(height: 14),

                    // Password
                    _FieldLabel('PASSWORD'),
                    const SizedBox(height: 7),
                    _LoginField(
                      controller: _passCtrl,
                      obscureText: !_showPass,
                      mono: true,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onSubmitted: (_) => _signIn(),
                      trailing: GestureDetector(
                        onTap: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          setState(() => _showPass = !_showPass);
                        },
                        child: Text(
                          _showPass ? 'Hide' : 'Show',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.crimson,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Forgot password
                    Align(
                      alignment: Alignment.centerRight,
                      child: GestureDetector(
                        onTap: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          await _launch(_forgotPasswordUrl);
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Text(
                            'Forgot password?',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
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
                      onTap: loading ? null : _signIn,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: loading
                              ? RLTokens.crimson.withAlpha(180)
                              : RLTokens.crimson,
                          borderRadius: BorderRadius.circular(RLTokens.rMd),
                        ),
                        child: Center(
                          child: loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  'Sign in',
                                  style: TextStyle(
                                    fontFamily: RLTokens.fontSans,
                                    fontSize: 15.5,
                                    fontWeight: RLTokens.semibold,
                                    color: Colors.white,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Footer — pinned to the bottom ──────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 34),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'New here?',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.muted,
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      await _launch(_applyUrl);
                    },
                    child: Text(
                      'Apply as landlord/real estate',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
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
    );
  }
}

// ── Private widgets ───────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontFamily: RLTokens.fontSans,
        fontSize: 11,
        fontWeight: RLTokens.semibold,
        letterSpacing: 0.6,
        color: RLTokens.mutedSoft,
      ),
    );
  }
}

// Custom login field — uses a styled Container so we own the border completely.
// The inner TextField has ALL decoration states set to none so the theme's
// OutlineInputBorder (set globally in inputDecorationTheme) can't bleed in.
class _LoginField extends StatelessWidget {
  const _LoginField({
    required this.controller,
    this.obscureText = false,
    this.mono = false,
    this.trailing,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final bool obscureText;
  final bool mono;
  final Widget? trailing;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscureText,
              keyboardType: keyboardType,
              textInputAction: textInputAction,
              autofillHints: autofillHints,
              onSubmitted: onSubmitted,
              style: mono
                  ? TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 15,
                      color: RLTokens.ink,
                      letterSpacing: 1,
                    )
                  : TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15,
                      color: RLTokens.ink,
                    ),
              // Fully neutralise every Material border state so the theme's
              // OutlineInputBorder doesn't add a second border ring.
              decoration: const InputDecoration(
                isDense: true,
                filled: false,
                contentPadding: EdgeInsets.symmetric(horizontal: 15, vertical: 15),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
              ),
            ),
          ),
          if (trailing != null)
            Padding(
              padding: const EdgeInsets.only(right: 15),
              child: trailing,
            ),
        ],
      ),
    );
  }
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
