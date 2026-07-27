import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/shared/theme.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// Guards against tofu boxes: a currency symbol the app renders (notably the
/// Ghana cedi, U+20B5) must exist in at least one bundled font, and every text
/// style in the theme must declare the currency fallback family so the glyph is
/// actually reachable.
void main() {
  group('bundled font coverage', () {
    test('every currency symbol used in lib/ has a glyph in a bundled font', () {
      final bundled = _bundledFontAssets();
      expect(bundled, isNotEmpty, reason: 'no font assets found in pubspec.yaml');

      final covered = <int>{};
      for (final path in bundled) {
        covered.addAll(_cmapCodePoints(File(path).readAsBytesSync()));
      }

      final used = _currencyRunesUsedInSource();
      expect(
        used,
        contains(0x20B5),
        reason: 'expected the cedi sign to still be used somewhere in lib/',
      );

      final missing = used.difference(covered).toList()..sort();
      expect(
        missing,
        isEmpty,
        reason:
            'these currency symbols render as tofu boxes — no bundled font has '
            'a glyph for them: '
            '${missing.map((c) => 'U+${c.toRadixString(16).toUpperCase().padLeft(4, '0')} ${String.fromCharCode(c)}').join(', ')}',
      );
    });
  });

  group('theme fallback wiring', () {
    test('every theme text style falls back to the currency family', () {
      final theme = buildTheme();
      final t = theme.textTheme;
      final styles = <String, TextStyle?>{
        'displayLarge': t.displayLarge,
        'displayMedium': t.displayMedium,
        'displaySmall': t.displaySmall,
        'titleLarge': t.titleLarge,
        'titleMedium': t.titleMedium,
        'bodyLarge': t.bodyLarge,
        'bodyMedium': t.bodyMedium,
        'bodySmall': t.bodySmall,
        'labelLarge': t.labelLarge,
        'labelSmall': t.labelSmall,
        'appBar.title': theme.appBarTheme.titleTextStyle,
        'input.hint': theme.inputDecorationTheme.hintStyle,
      };

      for (final entry in styles.entries) {
        expect(
          entry.value?.fontFamilyFallback,
          containsAll(RLTokens.fontFallback),
          reason:
              '${entry.key} drops the currency fallback — text using it will '
              'show boxes for the cedi sign',
        );
      }
    });
  });
}

/// Font asset paths declared under `flutter: fonts:` in pubspec.yaml.
List<String> _bundledFontAssets() {
  final pubspec = File('pubspec.yaml').readAsStringSync();
  return RegExp(r'''^\s*-\s*asset:\s*["']?([^"'\n]+\.ttf)["']?''', multiLine: true)
      .allMatches(pubspec)
      .map((m) => m.group(1)!.trim())
      .toSet()
      .toList();
}

/// Currency-block runes (U+20A0–U+20BF) that appear in the app's Dart sources.
Set<int> _currencyRunesUsedInSource() {
  final runes = <int>{};
  for (final entity in Directory('lib').listSync(recursive: true)) {
    if (entity is! File || !entity.path.endsWith('.dart')) continue;
    for (final rune in entity.readAsStringSync().runes) {
      if (rune >= 0x20A0 && rune <= 0x20BF) runes.add(rune);
    }
  }
  return runes;
}

/// Code points mapped by a TrueType font's `cmap` table (formats 4 and 12).
Set<int> _cmapCodePoints(Uint8List bytes) {
  final data = ByteData.sublistView(bytes);
  final numTables = data.getUint16(4);

  int? cmapOffset;
  for (var i = 0; i < numTables; i++) {
    final record = 12 + 16 * i;
    final tag = String.fromCharCodes(bytes.sublist(record, record + 4));
    if (tag == 'cmap') {
      cmapOffset = data.getUint32(record + 8);
      break;
    }
  }
  if (cmapOffset == null) return {};

  final codePoints = <int>{};
  final numSubtables = data.getUint16(cmapOffset + 2);
  for (var i = 0; i < numSubtables; i++) {
    final subtable = cmapOffset + data.getUint32(cmapOffset + 4 + 8 * i + 4);
    switch (data.getUint16(subtable)) {
      case 4:
        final segCount = data.getUint16(subtable + 6) ~/ 2;
        final endsAt = subtable + 14;
        final startsAt = endsAt + segCount * 2 + 2;
        for (var s = 0; s < segCount; s++) {
          final end = data.getUint16(endsAt + s * 2);
          final start = data.getUint16(startsAt + s * 2);
          if (start == 0xFFFF) continue;
          for (var c = start; c <= end; c++) {
            codePoints.add(c);
          }
        }
      case 12:
        final numGroups = data.getUint32(subtable + 12);
        for (var g = 0; g < numGroups; g++) {
          final group = subtable + 16 + 12 * g;
          final start = data.getUint32(group);
          final end = data.getUint32(group + 4);
          // Guard against pathological ranges in fonts with huge coverage.
          if (end - start > 0x10000) continue;
          for (var c = start; c <= end; c++) {
            codePoints.add(c);
          }
        }
    }
  }
  return codePoints;
}
