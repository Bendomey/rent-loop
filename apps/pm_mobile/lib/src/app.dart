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
                child: SafeArea(
                  top: false,
                  child: RLToastWidget(
                    toast: toast,
                    onDismiss: () =>
                        ref.read(rlToastProvider.notifier).dismiss(),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
