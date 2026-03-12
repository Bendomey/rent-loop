import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/navigation/routes.dart';
import 'package:rentloop_go/src/shared/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Bridges [AppStartupNotifier] state changes to a [ChangeNotifier] so
/// GoRouter's [refreshListenable] can re-evaluate the redirect guard.
class _AppStartupListenable extends ChangeNotifier {
  late final ProviderSubscription<AppStartupState> _sub;

  _AppStartupListenable(WidgetRef ref) {
    _sub = ref.listenManual(appStartupNotifierProvider, (_, __) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _sub.close();
    super.dispose();
  }
}

/// The Widget that configures your application navigation.
class AppNavigator extends ConsumerStatefulWidget {
  const AppNavigator({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _AppNavigator();
}

class _AppNavigator extends ConsumerState<AppNavigator> {
  late final GoRouter router;
  late final _AppStartupListenable _refreshListenable;

  @override
  void initState() {
    super.initState();
    _refreshListenable = _AppStartupListenable(ref);
    router = buildRoutes(ref, _refreshListenable);
  }

  @override
  void dispose() {
    _refreshListenable.dispose();
    super.dispose();
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
