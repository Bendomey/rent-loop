import 'dart:async';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/shared/notification_permission_sheet.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _WelcomeScreen();
}

class _WelcomeScreen extends ConsumerState<WelcomeScreen>
    with TickerProviderStateMixin {
  static const _phrases = [
    'Pay rent in seconds.',
    'Never miss a due date.',
    'Report maintenance instantly.',
    'Track every payment.',
    'Stay connected with your landlord.',
    'Your home, at your fingertips.',
    'Your rental, simplified.',
  ];

  int _phraseIndex = 0;
  String _displayedText = '';
  bool _isDeleting = false;
  Timer? _timer;
  bool _active = true;

  // Entrance animations
  late final AnimationController _textCtrl;
  late final AnimationController _buttonsCtrl;

  late final Animation<double> _textOpacity;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _buttonsOpacity;
  late final Animation<Offset> _buttonsSlide;

  @override
  void initState() {
    super.initState();

    _textCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _textOpacity = CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut);
    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOutCubic));

    _buttonsCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _buttonsOpacity = CurvedAnimation(
      parent: _buttonsCtrl,
      curve: Curves.easeOut,
    );
    _buttonsSlide =
        Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(
          CurvedAnimation(parent: _buttonsCtrl, curve: Curves.easeOutCubic),
        );

    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _textCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _scheduleNext();
    });
  }

  @override
  void dispose() {
    _active = false;
    _timer?.cancel();
    _textCtrl.dispose();
    _buttonsCtrl.dispose();
    super.dispose();
  }

  void _scheduleNext() {
    final phrase = _phrases[_phraseIndex];

    if (!_isDeleting) {
      if (_displayedText.length < phrase.length) {
        _timer = Timer(const Duration(milliseconds: 55), () {
          if (!_active || !mounted) return;
          setState(() {
            _displayedText = phrase.substring(0, _displayedText.length + 1);
          });
          if (_displayedText.length % 3 == 0) {
            Haptics.vibrate(HapticsType.selection);
          }
          _scheduleNext();
        });
      } else {
        // First phrase done — reveal buttons
        if (!_buttonsCtrl.isAnimating && _buttonsCtrl.value == 0) {
          _buttonsCtrl.forward();
        }
        _timer = Timer(const Duration(milliseconds: 1600), () {
          if (!_active || !mounted) return;
          setState(() => _isDeleting = true);
          _scheduleNext();
        });
      }
    } else {
      if (_displayedText.isNotEmpty) {
        _timer = Timer(const Duration(milliseconds: 16), () {
          if (!_active || !mounted) return;
          setState(() {
            _displayedText = _displayedText.substring(
              0,
              _displayedText.length - 1,
            );
          });
          _scheduleNext();
        });
      } else {
        _timer = Timer(const Duration(milliseconds: 350), () {
          if (!_active || !mounted) return;
          setState(() {
            _isDeleting = false;
            _phraseIndex = (_phraseIndex + 1) % _phrases.length;
          });
          _scheduleNext();
        });
      }
    }
  }

  Future<void> _finishOnboarding() async {
    _active = false;
    _timer?.cancel();
    await Haptics.vibrate(HapticsType.success);
    if (!mounted) return;

    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    if (settings.authorizationStatus == AuthorizationStatus.notDetermined) {
      if (!mounted) return;
      final allowed = await showNotificationPermissionSheet(context);
      if (allowed) await FirebaseMessaging.instance.requestPermission();
    }

    if (mounted) context.go('/auth/login');
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final hPad = screenWidth * 0.08;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.center,
            radius: 1.3,
            colors: [Colors.white, Color(0xFFFBF6F6)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: hPad),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),

                // Typewriter phrase + blinking cursor
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textOpacity,
                    child: SizedBox(
                      height: screenHeight * 0.18,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: _displayedText,
                                style: const TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                  height: 1.2,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              WidgetSpan(
                                alignment: PlaceholderAlignment.baseline,
                                baseline: TextBaseline.alphabetic,
                                child: _BlinkingCursor(color: primary),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const Spacer(),

                // Buttons — slide + fade in after first phrase completes
                SlideTransition(
                  position: _buttonsSlide,
                  child: FadeTransition(
                    opacity: _buttonsOpacity,
                    child: Column(
                      children: [
                        _PressableButton(
                          onPressed: _finishOnboarding,
                          child: Container(
                            width: double.infinity,
                            height: 56,
                            decoration: BoxDecoration(
                              color: primary,
                              borderRadius: BorderRadius.circular(80),
                              boxShadow: [
                                BoxShadow(
                                  color: primary.withValues(alpha: 0.35),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Text(
                                'Continue',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Center(
                          child: RichText(
                            text: TextSpan(
                              children: [
                                const TextSpan(
                                  text: 'rent',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                TextSpan(
                                  text: 'loop',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: primary,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.04),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Scales down slightly on press for a tactile feel
class _PressableButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onPressed;

  const _PressableButton({required this.child, required this.onPressed});

  @override
  State<_PressableButton> createState() => _PressableButtonState();
}

class _PressableButtonState extends State<_PressableButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 0.96,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) {
        _ctrl.reverse();
        widget.onPressed();
      },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}

class _BlinkingCursor extends StatefulWidget {
  final Color color;
  const _BlinkingCursor({required this.color});

  @override
  State<_BlinkingCursor> createState() => _BlinkingCursorState();
}

class _BlinkingCursorState extends State<_BlinkingCursor>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 530),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => Opacity(
        opacity: _ctrl.value > 0.5 ? 1.0 : 0.0,
        child: Container(
          width: 3,
          height: 38,
          margin: const EdgeInsets.only(left: 3, top: 3),
          decoration: BoxDecoration(
            color: widget.color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ),
    );
  }
}
