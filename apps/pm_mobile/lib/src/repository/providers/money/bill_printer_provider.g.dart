// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bill_printer_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$billPrinterHash() => r'a394557828b0c426eb3810a3bd4e0f522090d531';

/// Opens the system print sheet, which on iOS also offers save and share.
/// The PDF is built before the sheet opens so a build failure reaches the
/// caller instead of dying inside the platform's layout callback.
///
/// Copied from [billPrinter].
@ProviderFor(billPrinter)
final billPrinterProvider = AutoDisposeProvider<BillPrinter>.internal(
  billPrinter,
  name: r'billPrinterProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$billPrinterHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef BillPrinterRef = AutoDisposeProviderRef<BillPrinter>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
