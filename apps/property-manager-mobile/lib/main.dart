import 'package:flutter/material.dart';

import 'src/navigation/routes.dart';
import 'src/shared/theme.dart';

void main() {
  runApp(const PropertyManagerApp());
}

class PropertyManagerApp extends StatelessWidget {
  const PropertyManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Rentloop — Property Manager',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(context),
      routerConfig: buildRouter(),
    );
  }
}
