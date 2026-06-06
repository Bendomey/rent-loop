import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/navigation/routes.dart';
import 'package:rentloop_manager/src/shared/theme.dart';

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
    );
  }
}
