import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class NavigationLoader extends ConsumerStatefulWidget {
  const NavigationLoader({super.key});

  @override
  ConsumerState<NavigationLoader> createState() => _NavigationLoader();
}

class _NavigationLoader extends ConsumerState<NavigationLoader> {
  @override
  void initState() {
    super.initState();
    // Kick off initialization after a brief branding delay.
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        ref.read(appStartupNotifierProvider.notifier).init();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final startup = ref.watch(appStartupNotifierProvider);

    // GoRouter redirect guard handles all navigation once status changes.
    // This widget only needs to render the appropriate loading/error UI.
    return Scaffold(
      body: startup.status == AppStartupStatus.error
          ? _ErrorState(
              message: startup.errorMessage ?? 'An error occurred',
              onRetry: () =>
                  ref.read(appStartupNotifierProvider.notifier).init(),
            )
          : const _LoadingState(),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: screenHeight * 0.1),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.home_work_rounded,
                  size: screenHeight * 0.045,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 8),
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: MediaQuery.textScalerOf(context)
                          .clamp(minScaleFactor: 0.5, maxScaleFactor: 1.0)
                          .scale(screenHeight * 0.045),
                      fontFamily: 'Inter',
                    ),
                    children: [
                      const TextSpan(
                        text: 'Rent',
                        style: TextStyle(color: Colors.black87),
                      ),
                      TextSpan(
                        text: 'loop',
                        style: TextStyle(color: Theme.of(context).primaryColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.04),
            LoadingAnimationWidget.horizontalRotatingDots(
              color: Theme.of(context).primaryColor,
              size: screenWidth * 0.1,
            ),
            SizedBox(height: screenHeight * 0.05),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: screenWidth * 0.1,
          vertical: screenHeight * 0.05,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            SizedBox(height: screenHeight * 0.35),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.home_work_rounded,
                  size: screenHeight * 0.045,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 8),
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: MediaQuery.textScalerOf(context)
                          .clamp(minScaleFactor: 0.5, maxScaleFactor: 1.0)
                          .scale(screenHeight * 0.045),
                      fontFamily: 'Inter',
                    ),
                    children: [
                      const TextSpan(
                        text: 'Rent',
                        style: TextStyle(color: Colors.black87),
                      ),
                      TextSpan(
                        text: 'Loop',
                        style: TextStyle(color: Theme.of(context).primaryColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.04),
            Icon(
              Icons.error_outline,
              size: screenWidth * 0.15,
              color: Colors.red[400],
            ),
            SizedBox(height: screenHeight * 0.02),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.grey[800],
                fontSize: screenHeight * 0.018,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: screenHeight * 0.03),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: screenHeight * 0.02),
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(screenWidth * 0.03),
                  ),
                ),
                child: Text(
                  'Retry',
                  style: TextStyle(
                    fontSize: screenHeight * 0.018,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
