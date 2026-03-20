import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class NavigationLoader extends ConsumerStatefulWidget {
  const NavigationLoader({super.key});

  @override
  ConsumerState<NavigationLoader> createState() => _NavigationLoader();
}

class _NavigationLoader extends ConsumerState<NavigationLoader> {
  bool _retrying = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) ref.read(appStartupNotifierProvider.notifier).init();
    });
  }

  Future<void> _retry() async {
    setState(() => _retrying = true);
    await ref.read(appStartupNotifierProvider.notifier).init();
    if (mounted) setState(() => _retrying = false);
  }

  @override
  Widget build(BuildContext context) {
    final startup = ref.watch(appStartupNotifierProvider);

    final showError = startup.status == AppStartupStatus.error && !_retrying;

    final body = showError
        ? _ErrorState(
            key: const ValueKey('error'),
            message: startup.errorMessage ?? 'An error occurred',
            onRetry: _retry,
          )
        : const _LoadingState(key: ValueKey('loading'));

    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: body,
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState({super.key});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Stack(
      children: [
        Center(
          child: RichText(
            text: TextSpan(
              children: [
                const TextSpan(
                  text: 'rent',
                  style: TextStyle(
                    // fontFamily: 'Inter',
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -1,
                  ),
                ),
                TextSpan(
                  text: 'loop',
                  style: TextStyle(
                    // fontFamily: 'Inter',
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: primary,
                    letterSpacing: -1,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          bottom: MediaQuery.of(context).size.height * 0.12,
          left: 0,
          right: 0,
          child: Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 3, color: primary),
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final hPad = screenWidth * 0.08;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Spacer(),
          // Wordmark
          RichText(
            text: TextSpan(
              children: [
                const TextSpan(
                  text: 'rent',
                  style: TextStyle(
                    fontSize: 45,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -1,
                  ),
                ),
                TextSpan(
                  text: 'loop',
                  style: TextStyle(
                    fontSize: 45,
                    fontWeight: FontWeight.bold,
                    color: primary,
                    letterSpacing: -1,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: screenHeight * 0.03),
          // Heading
          const Text(
            'Something went wrong.',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Colors.black,
              letterSpacing: -0.5,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          // Message
          Text(
            message,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              color: Colors.grey.shade500,
              height: 1.5,
            ),
          ),
          const Spacer(),
          // Retry button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(80),
                ),
              ),
              child: const Text(
                'Try again',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          SizedBox(height: screenHeight * 0.06),
        ],
      ),
    );
  }
}
