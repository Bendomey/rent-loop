import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/navigation/routes.dart';
import 'package:rentloop_manager/src/shared/theme.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

class RentloopManagerApp extends ConsumerStatefulWidget {
  const RentloopManagerApp({super.key});

  @override
  ConsumerState<RentloopManagerApp> createState() => _RentloopManagerAppState();
}

class _RentloopManagerAppState extends ConsumerState<RentloopManagerApp> {
  late final _router = buildRoutes(ref);

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'RentLoop Manager',
      theme: buildTheme(),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        final toast = ref.watch(rlToastProvider);
        return Stack(
          children: [
            if (child != null) child,
            if (toast != null)
              Positioned(
                left: 14,
                right: 14,
                bottom: 10,
                // This branch is a sibling of the routed app in the Stack
                // above, not a descendant of any Scaffold/Material — so
                // without this, its Text widgets have no DefaultTextStyle
                // ancestor and fall back to Flutter's debug style, which
                // renders a yellow double-underline under every run of
                // text as a "you forgot Material" signal.
                child: Material(
                  type: MaterialType.transparency,
                  child: SafeArea(
                    top: false,
                    child: RLToastWidget(
                      toast: toast,
                      onDismiss: () =>
                          ref.read(rlToastProvider.notifier).dismiss(),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
