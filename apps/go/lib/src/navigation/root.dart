import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/navigation/routes.dart';
import 'package:rentloop_go/src/shared/theme.dart';
import 'package:flutter/material.dart';

/// The Widget that configures your application navigation.
class AppNavigator extends ConsumerStatefulWidget {
  const AppNavigator({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _AppNavigator();
}

class _AppNavigator extends ConsumerState<AppNavigator> {
  late final GoRouter router;

  @override
  void initState() {
    super.initState();
    router = buildRoutes();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      restorationScopeId: 'rentloop-go-root',
      routeInformationProvider: router.routeInformationProvider,
      routeInformationParser: router.routeInformationParser,
      routerDelegate: router.routerDelegate,
      theme: getThemeData(context),
    );
  }
}
