import 'package:rentloop_go/src/architecture/architecture.dart';
// import 'package:rentloop_go/src/repository/repository.dart';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

enum SplashState {
  initial,
  checkingConnectivity,
  connected,
  noInternet,
  checkingAuth,
  authSuccess,
  authFailed,
  apiError,
}

class NavigationLoader extends ConsumerStatefulWidget {
  const NavigationLoader({super.key});

  @override
  ConsumerState<NavigationLoader> createState() => _NavigationLoader();
}

class _NavigationLoader extends ConsumerState<NavigationLoader> {
  SplashState _currentState = SplashState.initial;
  String? _errorMessage;
  bool _isRetrying = false;

  @override
  void initState() {
    super.initState();
    _initializeAsync();
  }

  Future<void> _initializeAsync() async {
    // Show splash branding for a moment
    await Future.delayed(const Duration(seconds: 2));
    await _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    setState(() {
      _currentState = SplashState.checkingConnectivity;
      _errorMessage = null;
    });

    try {
      final connectivityResult = await Connectivity().checkConnectivity();

      if (connectivityResult.contains(ConnectivityResult.none)) {
        setState(() {
          _currentState = SplashState.noInternet;
          _errorMessage =
              'No internet connection. Please check your connection and try again.';
        });
        return;
      }

      setState(() {
        _currentState = SplashState.connected;
      });

      await _checkAuthentication();
    } catch (e) {
      setState(() {
        _currentState = SplashState.noInternet;
        _errorMessage =
            'Failed to check internet connection. Please try again.';
      });
    }
  }

  Future<void> _checkAuthentication() async {
    setState(() {
      _currentState = SplashState.checkingAuth;
      _errorMessage = null;
    });

    try {
      // Check if user has token
      final token = await ref.read(tokenManagerProvider).get();
      if (token == null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go('/auth');
        });
        return;
      }

      // Fetch current client data
      final clientData = null;

      if (clientData != null) {
        setState(() {
          _currentState = SplashState.authSuccess;
        });

        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go('/');
        });
      } else {
        setState(() {
          _currentState = SplashState.apiError;
          _errorMessage =
              'Something went wrong. Kindly retry or come back later.';
        });
      }
    } catch (e) {
      if (e.toString() == "Exception: UserNotFound") {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go('/auth');
        });
        return;
      }

      setState(() {
        _currentState = SplashState.apiError;
        _errorMessage =
            'Something went wrong. Kindly retry or come back later.';
      });
    }
  }

  Future<void> _retry() async {
    setState(() {
      _isRetrying = true;
      _errorMessage = null;
    });

    await _initializeAsync();

    setState(() {
      _isRetrying = false;
    });
  }

  Widget _buildContent() {
    switch (_currentState) {
      case SplashState.initial:
      case SplashState.checkingConnectivity:
      case SplashState.checkingAuth:
        return _buildLoadingState();

      case SplashState.connected:
        return _buildLoadingState();

      case SplashState.authSuccess:
        return _buildLoadingState();

      case SplashState.authFailed:
      case SplashState.noInternet:
      case SplashState.apiError:
        return _buildErrorState();
    }
  }

  Widget _buildLoadingState() {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Add top spacer to push content down slightly
            SizedBox(height: screenHeight * 0.1),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.home_work_rounded,
                  size: screenHeight * 0.045,
                  color: Theme.of(context).primaryColor,
                ),
                SizedBox(width: 8),
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
                      TextSpan(
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
            LoadingAnimationWidget.horizontalRotatingDots(
              color: Theme.of(context).primaryColor,
              size: screenWidth * 0.1,
            ),
            // Reduce bottom spacer to balance the layout
            SizedBox(height: screenHeight * 0.05),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
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
            // Position logo at the same height as loading state
            SizedBox(height: screenHeight * 0.35),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.home_work_rounded,
                  size: screenHeight * 0.045,
                  color: Theme.of(context).primaryColor,
                ),
                SizedBox(width: 8),
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
                      TextSpan(
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
              _errorMessage ?? 'An error occurred',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.grey[800],
                fontSize: screenHeight * 0.018,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: screenHeight * 0.03),
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(screenWidth * 0.03),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: screenWidth * 0.02,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _isRetrying ? null : _retry,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: screenHeight * 0.02),
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(screenWidth * 0.03),
                  ),
                ),
                child: _isRetrying
                    ? SizedBox(
                        width: screenWidth * 0.05,
                        height: screenWidth * 0.05,
                        child: CircularProgressIndicator(
                          strokeWidth: screenWidth * 0.004,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Text(
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: _buildContent());
  }
}
