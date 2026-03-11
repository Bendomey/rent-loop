import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/notifiers/auth/send_otp_notifier/send_otp_notifier.dart';
import 'package:rentloop_go/src/repository/notifiers/auth/verify_otp_notifier/verify_otp_notifier.dart';
import 'package:rentloop_go/src/repository/notifiers/notification/register_fcm_token_notifier/register_fcm_token_notifier.dart';
import 'package:rentloop_go/src/shared/notification_permission_sheet.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:io';

class VerifyScreen extends ConsumerStatefulWidget {
  final String phone;

  const VerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _VerifyScreen();
}

class _VerifyScreen extends ConsumerState<VerifyScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _canResend = false;
  int _resendSeconds = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    setState(() {
      _canResend = false;
      _resendSeconds = 60;
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        setState(() => _canResend = true);
        timer.cancel();
      }
    });
  }

  String get _maskedPhone {
    final phone = widget.phone;
    if (phone.length > 6) {
      return '${phone.substring(0, 7)}****${phone.substring(phone.length - 2)}';
    }
    return phone;
  }

  String get _otpCode {
    return _controllers.map((c) => c.text).join();
  }

  Future<void> _handleVerify() async {
    if (_otpCode.length != 6) {
      await Haptics.vibrate(HapticsType.error);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter the complete 6-digit code'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    await Haptics.vibrate(HapticsType.medium);

    final success = await ref
        .read(verifyOtpNotifierProvider.notifier)
        .verifyOtp(phone: widget.phone, code: _otpCode);

    if (mounted && success) {
      await Haptics.vibrate(HapticsType.success);
      _registerFcmToken();
      context.go('/');
    }
  }

  Future<void> _registerFcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Check current permission status — skip the sheet if already granted/denied.
      final settings = await messaging.getNotificationSettings();
      if (settings.authorizationStatus == AuthorizationStatus.notDetermined) {
        if (!mounted) return;
        final allowed = await showNotificationPermissionSheet(context);
        if (!allowed) return;
      } else if (settings.authorizationStatus == AuthorizationStatus.denied) {
        return;
      }

      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token == null) return;
      final platform = Platform.isIOS ? 'ios' : 'android';
      await ref
          .read(registerFcmTokenNotifierProvider.notifier)
          .register(token: token, platform: platform);
    } catch (_) {
      // Fire-and-forget — never block navigation on FCM errors.
    }
  }

  Future<void> _handleResend() async {
    if (!_canResend) return;

    await Haptics.vibrate(HapticsType.selection);

    final success = await ref
        .read(sendOtpNotifierProvider.notifier)
        .sendOtp(widget.phone);

    if (!mounted) return;

    if (success) {
      _startResendTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification code sent to ${widget.phone}'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _onOtpDigitChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }

    // Auto-verify when all digits are entered
    if (_otpCode.length == 6) {
      _handleVerify();
    }
  }

  void _onKeyPressed(int index, RawKeyEvent event) {
    if (event is RawKeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final verifyState = ref.watch(verifyOtpNotifierProvider);
    final isLoading = verifyState.status.isLoading();

    ref.listen(verifyOtpNotifierProvider, (prev, next) {
      if (next.status.isFailed()) {
        Haptics.vibrate(HapticsType.error);
      }
    });

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) context.go('/auth/login');
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.08),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: screenHeight * 0.04),
              // Title
              Text(
                'Verify your number',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: Colors.black87,
                  fontSize: 28,
                ),
              ),
              SizedBox(height: screenHeight * 0.015),
              // Subtitle
              RichText(
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'Enter the 6-digit code sent to '),
                    TextSpan(
                      text: _maskedPhone,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: screenHeight * 0.05),
              // OTP Input Fields
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: (screenWidth - screenWidth * 0.16 - 50) / 6,
                    child: RawKeyboardListener(
                      focusNode: FocusNode(),
                      onKey: (event) => _onKeyPressed(index, event),
                      child: TextFormField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                        decoration: InputDecoration(
                          counterText: '',
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 16,
                          ),
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(1),
                        ],
                        onChanged: (value) => _onOtpDigitChanged(index, value),
                      ),
                    ),
                  );
                }),
              ),
              SizedBox(height: screenHeight * 0.04),
              // Resend Section
              Center(
                child: TextButton(
                  onPressed: _canResend ? _handleResend : null,
                  child: Text(
                    _canResend
                        ? 'Resend Code'
                        : 'Resend in $_resendSeconds seconds',
                    style: TextStyle(
                      color: _canResend
                          ? Theme.of(context).primaryColor
                          : Colors.grey.shade400,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              SizedBox(height: screenHeight * 0.03),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      'Didn\'t receive the code?',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Dial the USSD code below to retrieve it:',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        await Clipboard.setData(
                          const ClipboardData(text: '*713*882#'),
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('USSD code copied to clipboard'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).primaryColor.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '*713*882#',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    color: Theme.of(context).primaryColor,
                                    letterSpacing: 1.5,
                                  ),
                            ),
                            const SizedBox(width: 8),
                            Icon(
                              Icons.copy_rounded,
                              size: 16,
                              color: Theme.of(context).primaryColor,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Works on all networks in Ghana',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              if (verifyState.status.isFailed() &&
                  verifyState.errorMessage != null) ...[
                SizedBox(height: screenHeight * 0.02),
                Center(
                  child: Text(
                    verifyState.errorMessage!,
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
              SizedBox(height: screenHeight * 0.05),
              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: FilledButton(
                  onPressed: isLoading ? null : _handleVerify,
                  style: FilledButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                    ),
                  ),
                  child: isLoading
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text(
                          'Verify',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
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
