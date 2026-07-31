import 'dart:io' show Platform;
import 'dart:ui' show PlatformDispatcher;

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:package_info_plus/package_info_plus.dart';

/// Shown as the client name on the sessions list, mirroring the web portal's
/// APP_DISPLAY_NAME. Not taken from PackageInfo.appName, which is the launcher
/// label and gets localised.
const String _appDisplayName = 'Rentloop Manager';

/// Marketing names for the handsets we see most. Deliberately small and
/// deliberately optional: a miss simply omits `marketing_name`, leaving the
/// OS-reported `model` as the single source of truth. A stale table therefore
/// costs a nicety, never a wrong answer.
const Map<String, String> _marketingNames = {
  // Samsung
  'SM-S931B': 'Galaxy S25',
  'SM-S926B': 'Galaxy S24+',
  'SM-S921B': 'Galaxy S24',
  'SM-A556B': 'Galaxy A55',
  // Google
  'Pixel 9': 'Pixel 9',
  'Pixel 8': 'Pixel 8',
  // Apple
  'iPhone17,3': 'iPhone 16',
  'iPhone16,2': 'iPhone 15 Pro Max',
  'iPhone15,2': 'iPhone 14 Pro',
  'iPad14,3': 'iPad Pro 11-inch',
};

String? marketingNameFor(String model) => _marketingNames[model];

bool _looksLikeTablet() {
  final view = PlatformDispatcher.instance.views.first;
  final size = view.physicalSize / view.devicePixelRatio;
  final shortestSide = size.width < size.height ? size.width : size.height;
  return shortestSide >= 600;
}

/// Describes this device for the session record the backend keeps.
///
/// Never throws and never blocks a login: any failure degrades to the minimal
/// `{platform, app}` object. Fields are omitted rather than guessed — an
/// absent key means "this device could not report it", never a fabrication.
///
/// Deliberately absent: a user-assigned device name. Android keeps it in
/// Settings.Global.DEVICE_NAME, which device_info_plus does not expose, and
/// iOS 16+ returns a generic "iPhone" without a special Apple entitlement.
Future<Map<String, dynamic>> collectSessionMetadata() async {
  final platform = Platform.isAndroid
      ? 'android'
      : Platform.isIOS
      ? 'ios'
      : 'unknown';

  final metadata = <String, dynamic>{'platform': platform};

  try {
    final package = await PackageInfo.fromPlatform();
    metadata['app'] = {
      // `name` is what the sessions list shows as the client — a native app
      // has no browser to name it, so without this the row reads as unknown.
      'name': _appDisplayName,
      'version': package.version,
      'build': package.buildNumber,
    };
  } catch (_) {
    // app info unavailable; carry on with what we have
  }

  // Locale, and through the IANA zone a rough place. This is the only location
  // signal available without a permission prompt or a paid lookup: the backend
  // reads a representative city out of the zone ("Africa/Accra" -> "Accra")
  // and records it as CLIENT-reported, never as verified.
  try {
    final locale = <String, dynamic>{
      'language': PlatformDispatcher.instance.locale.toLanguageTag(),
    };
    final zone = await FlutterTimezone.getLocalTimezone();
    if (zone.identifier.isNotEmpty) locale['timezone'] = zone.identifier;
    metadata['locale'] = locale;
  } catch (_) {
    // timezone unavailable; the session simply carries no place
  }

  try {
    metadata['device_type'] = _looksLikeTablet() ? 'tablet' : 'phone';

    final plugin = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final info = await plugin.androidInfo;
      final device = <String, dynamic>{
        'manufacturer': info.manufacturer,
        'model': info.model,
      };
      final marketing = marketingNameFor(info.model);
      if (marketing != null) device['marketing_name'] = marketing;

      metadata['device'] = device;
      metadata['os'] = {'name': 'Android', 'version': info.version.release};
    } else if (Platform.isIOS) {
      final info = await plugin.iosInfo;
      final machine = info.utsname.machine;
      final device = <String, dynamic>{
        'manufacturer': 'Apple',
        'model': machine,
      };
      final marketing = marketingNameFor(machine);
      if (marketing != null) device['marketing_name'] = marketing;

      metadata['device'] = device;
      metadata['os'] = {'name': 'iOS', 'version': info.systemVersion};
    }
  } catch (_) {
    // device info unavailable; the minimal object above still stands
  }

  return metadata;
}
