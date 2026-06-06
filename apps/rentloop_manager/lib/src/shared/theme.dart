import 'package:flutter/material.dart';
import 'tokens.dart';

ThemeData buildTheme() {
  const sans  = RLTokens.fontSans;
  const serif = RLTokens.fontSerif;
  const mono  = RLTokens.fontMono;

  final base = ThemeData(
    useMaterial3: true,
    fontFamily: sans,
    colorScheme: ColorScheme.fromSeed(
      seedColor: RLTokens.crimson,
      primary: RLTokens.crimson,
      onPrimary: RLTokens.surface,
      surface: RLTokens.surface,
      onSurface: RLTokens.ink,
    ),
    scaffoldBackgroundColor: RLTokens.paper,
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
  );

  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      displayLarge: TextStyle(
        fontFamily: serif,
        fontSize: RLTokens.textDisplay,
        fontWeight: RLTokens.regular,
        letterSpacing: -0.6,
        color: RLTokens.ink,
        height: 1,
      ),
      displayMedium: TextStyle(
        fontFamily: serif,
        fontSize: RLTokens.textTitle,
        fontWeight: RLTokens.regular,
        letterSpacing: -0.4,
        color: RLTokens.ink,
        height: 1,
      ),
      displaySmall: TextStyle(
        fontFamily: serif,
        fontSize: RLTokens.textCardHead,
        fontWeight: RLTokens.regular,
        color: RLTokens.ink,
        height: 1.15,
      ),
      titleLarge: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textBarTitle,
        fontWeight: RLTokens.semibold,
        letterSpacing: -0.2,
        color: RLTokens.ink,
      ),
      titleMedium: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textRowTitle,
        fontWeight: RLTokens.semibold,
        letterSpacing: -0.1,
        color: RLTokens.ink,
      ),
      labelLarge: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textAction,
        fontWeight: RLTokens.semibold,
        letterSpacing: 0.1,
        color: RLTokens.ink,
      ),
      bodyLarge: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textBody,
        fontWeight: RLTokens.regular,
        color: RLTokens.ink,
      ),
      bodySmall: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textSubtitle,
        fontWeight: RLTokens.regular,
        color: RLTokens.muted,
      ),
      labelSmall: TextStyle(
        fontFamily: mono,
        fontSize: RLTokens.textLabel,
        fontWeight: RLTokens.medium,
        letterSpacing: 1.1,
        color: RLTokens.mutedSoft,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: RLTokens.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textBarTitle,
        fontWeight: RLTokens.semibold,
        letterSpacing: -0.2,
        color: RLTokens.ink,
      ),
      iconTheme: IconThemeData(color: RLTokens.ink),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: RLTokens.crimson,
        foregroundColor: RLTokens.surface,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(RLTokens.rMd),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        textStyle: const TextStyle(
          fontFamily: sans,
          fontSize: RLTokens.textAction,
          fontWeight: RLTokens.semibold,
          letterSpacing: 0.1,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: RLTokens.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        borderSide: const BorderSide(color: RLTokens.hairline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        borderSide: const BorderSide(color: RLTokens.hairline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(RLTokens.rMd),
        borderSide: const BorderSide(color: RLTokens.ink, width: 1.5),
      ),
      hintStyle: const TextStyle(
        fontFamily: sans,
        fontSize: RLTokens.textBody,
        color: RLTokens.mutedSoft,
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: RLTokens.hairlineSoft,
      thickness: 1,
      space: 0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: RLTokens.surface,
      selectedItemColor: RLTokens.crimson,
      unselectedItemColor: RLTokens.mutedSoft,
      elevation: 0,
    ),
  );
}
