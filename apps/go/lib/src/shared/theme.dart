import 'package:flutter/material.dart';

ThemeData getThemeData(BuildContext context) => ThemeData(
  useMaterial3: true,
  fontFamily: 'Inter',
  colorScheme: ColorScheme.fromSeed(
    seedColor: Colors.grey.shade600,
    surface: Colors.white,
    primary: const Color.fromARGB(255, 230, 2, 63),
    secondary: Colors.white,
  ),
  appBarTheme: AppBarTheme.of(context).copyWith(
    surfaceTintColor: Colors.white70,
    centerTitle: true,
    scrolledUnderElevation: 40,
    titleTextStyle: const TextStyle(
      fontWeight: FontWeight.w600,
      color: Colors.black,
      fontSize: 22,
    ),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(
    backgroundColor: Color.fromARGB(255, 230, 2, 63),
  ),
  textTheme: TextTheme(
    headlineMedium: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22),
    headlineLarge: const TextStyle(fontWeight: FontWeight.w900, fontSize: 35),
    bodyMedium: const TextStyle(fontSize: 17),
    bodySmall: const TextStyle(fontSize: 15),
    titleLarge: Theme.of(
      context,
    ).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w600),
    displayLarge: Theme.of(context).textTheme.displayLarge!.copyWith(
      fontWeight: FontWeight.w900,
      fontSize: 50,
    ),
    displayMedium: Theme.of(context).textTheme.displayLarge!.copyWith(
      fontWeight: FontWeight.w900,
      fontSize: 38,
    ),
    displaySmall: Theme.of(context).textTheme.displayLarge!.copyWith(
      fontWeight: FontWeight.w900,
      fontSize: 33,
    ),
  ),
);
