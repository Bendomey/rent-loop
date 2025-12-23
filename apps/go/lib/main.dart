import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:rentloop_go/src/lib/sentry_config.dart';

import 'src/app.dart';

void main() async {
  SentryWidgetsFlutterBinding.ensureInitialized();
  // await Firebase.initializeApp();

  await SentryConfig.init();
  runApp(const ProviderScope(child: MyApp()));
}
