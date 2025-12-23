import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:rentloop_go/src/constants.dart';

class SentryConfig {
  static Future<void> init() async {
    await SentryFlutter.init((options) {
      options.dsn = SENTRY_DSN;
      options.tracesSampleRate = 1.0;
      options.enableAutoSessionTracking = true;
      options.attachStacktrace = true;
      options.debug = isStaging; // Debug mode for staging
      options.environment = isStaging ? 'staging' : 'production';
    });
  }

  /// Used for tracking exceptions
  static void captureException(
    dynamic exception,
    dynamic stackTrace, {
    Map<String, dynamic>? extra,
  }) {
    Sentry.captureException(
      exception,
      stackTrace: stackTrace,
      hint: Hint.withMap(extra ?? {}),
    );
  }

  /// Log custom events and messages
  static void captureMessage(
    String message, {
    SentryLevel level = SentryLevel.info,
    Map<String, dynamic>? extra,
  }) {
    Sentry.captureMessage(
      message,
      level: level,
      hint: Hint.withMap(extra ?? {}),
    );
  }

  /// Track user actions for debugging context
  static void addBreadcrumb(
    String message, {
    String category = 'app',
    Map<String, dynamic>? data,
  }) {
    Sentry.addBreadcrumb(
      Breadcrumb(message: message, category: category, data: data),
    );
  }
}
