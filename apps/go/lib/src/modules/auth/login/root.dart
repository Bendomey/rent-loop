import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/constants.dart';
import 'package:rentloop_go/src/repository/notifiers/auth/send_otp_notifier/send_otp_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _LoginScreen();
}

class _LoginScreen extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _focusNode = FocusNode();
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    if (!_formKey.currentState!.validate()) return;

    final digits = _phoneController.text.substring(
      _phoneController.text.length - 9,
    );
    final phone = '+233$digits';
    final success = await ref
        .read(sendOtpNotifierProvider.notifier)
        .sendOtp(phone);

    if (mounted && success) {
      context.go('/auth/login/verify/$phone');
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final sendOtpState = ref.watch(sendOtpNotifierProvider);
    final isLoading = sendOtpState.status.isLoading();

    ref.listen(sendOtpNotifierProvider, (prev, next) {
      // No vibration on error as requested
    });

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.black87),
          onPressed: () async {
            if (context.mounted) context.go('/auth');
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.08),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: screenHeight * 0.03),

                // Title
                const Text(
                  'Enter your\nphone number',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -0.5,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 10),

                // Subtitle
                Text(
                  "We'll send a verification code to confirm it's you.",
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey.shade500,
                    height: 1.5,
                  ),
                ),

                SizedBox(height: screenHeight * 0.05),

                // Phone input
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _focusNode.hasFocus
                          ? primary
                          : Colors.grey.shade200,
                      width: _focusNode.hasFocus ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      // Country code
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 18,
                        ),
                        child: Row(
                          children: [
                            const Text('🇬🇭', style: TextStyle(fontSize: 20)),
                            const SizedBox(width: 8),
                            const Text(
                              '+233',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              width: 1,
                              height: 18,
                              color: Colors.grey.shade300,
                            ),
                          ],
                        ),
                      ),
                      // Number field
                      Expanded(
                        child: TextFormField(
                          controller: _phoneController,
                          focusNode: _focusNode,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 1.2,
                          ),
                          decoration: InputDecoration(
                            hintText: '00 000 0000',
                            hintStyle: TextStyle(
                              color: Colors.grey.shade400,
                              fontWeight: FontWeight.w400,
                              letterSpacing: 1.2,
                            ),
                            border: InputBorder.none,
                            errorStyle: const TextStyle(height: 0, fontSize: 0),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 18,
                            ),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(10),
                          ],
                          validator: (value) {
                            final result = Validatorless.multiple([
                              Validatorless.required(
                                'Phone number is required',
                              ),
                              Validatorless.min(
                                9,
                                'Enter a valid phone number',
                              ),
                              Validatorless.max(
                                10,
                                'Enter a valid phone number',
                              ),
                            ])(value);

                            if (result != _errorText) {
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                if (mounted)
                                  setState(() => _errorText = result);
                              });
                            }
                            return result;
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Validation error
                if (_errorText != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _errorText!,
                    style: TextStyle(
                      color: Colors.red.shade600,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],

                // API error
                if (sendOtpState.status.isFailed() &&
                    sendOtpState.errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    sendOtpState.errorMessage!,
                    style: TextStyle(
                      color: Colors.red.shade600,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],

                SizedBox(height: screenHeight * 0.04),

                // Continue button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: FilledButton(
                    onPressed: isLoading ? null : _handleContinue,
                    style: FilledButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade200,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(80),
                      ),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Continue',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),

                SizedBox(height: screenHeight * 0.025),

                // Terms
                Center(
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade400,
                        height: 1.5,
                      ),
                      children: [
                        const TextSpan(text: 'By continuing you agree to our '),
                        WidgetSpan(
                          child: GestureDetector(
                            onTap: () => launchUrl(
                              Uri.parse('$WEBSITE/terms'),
                              mode: LaunchMode.externalApplication,
                            ),
                            child: Text(
                              'Terms & Conditions',
                              style: TextStyle(
                                fontSize: 13,
                                color: primary,
                                fontWeight: FontWeight.w600,
                                height: 1.5,
                              ),
                            ),
                          ),
                        ),
                        const TextSpan(text: '.'),
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
