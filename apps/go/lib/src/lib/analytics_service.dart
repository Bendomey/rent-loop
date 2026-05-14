import 'package:appsflyer_sdk/appsflyer_sdk.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/widgets.dart';
import 'package:rentloop_go/src/constants.dart';

class AnalyticsService {
  static final FirebaseAnalytics _firebase = FirebaseAnalytics.instance;
  static AppsflyerSdk? _appsflyer;

  static Future<void> init() async {
    final options = AppsFlyerOptions(
      afDevKey: APPSFLYER_DEV_KEY,
      appId: APPSFLYER_APP_ID_IOS,
      showDebug: APPSFLYER_IS_DEBUG,
    );
    _appsflyer = AppsflyerSdk(options);
    _appsflyer!.initSdk(
      registerConversionDataCallback: false,
      registerOnAppOpenAttributionCallback: false,
      registerOnDeepLinkingCallback: false,
    );
  }

  static FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: _firebase);

  static NavigatorObserver get appsflyerObserver =>
      _AppsflyerNavigatorObserver();

  static Future<void> logEvent(
    String name, {
    Map<String, Object>? parameters,
  }) async {
    await _firebase.logEvent(name: name, parameters: parameters);
    await _logAppsflyer(name, parameters);
  }

  static Future<void> setUserId(String? userId) async {
    await _firebase.setUserId(id: userId);
    _appsflyer?.setCustomerUserId(userId ?? '');
  }

  // Maps Firebase event names to AppsFlyer canonical names where applicable,
  // then forwards to the AppsFlyer SDK.
  static Future<void> _logAppsflyer(
    String name,
    Map<String, Object>? parameters,
  ) async {
    if (_appsflyer == null) return;
    final params = parameters ?? {};
    final String afName;
    switch (name) {
      case 'login':
        afName = 'af_login';
      case 'payment_initiated':
        afName = 'af_purchase';
      default:
        afName = name;
    }
    await _appsflyer!.logEvent(afName, params);
  }
}

class _AppsflyerNavigatorObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    final name = route.settings.name;
    if (name != null && name.isNotEmpty) {
      AnalyticsService._appsflyer
          ?.logEvent('af_content_view', {'af_content_id': name});
    }
  }
}
