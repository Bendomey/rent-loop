// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bills_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$billsNotifierHash() => r'70046738c1ecb0c14143a4670654aa6a902abbd8';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$BillsNotifier
    extends BuildlessAutoDisposeNotifier<BillsState> {
  late final BillsView view;
  late final String? propertyId;
  late final bool picker;

  BillsState build(BillsView view, String? propertyId, {bool picker = false});
}

/// See also [BillsNotifier].
@ProviderFor(BillsNotifier)
const billsNotifierProvider = BillsNotifierFamily();

/// See also [BillsNotifier].
class BillsNotifierFamily extends Family<BillsState> {
  /// See also [BillsNotifier].
  const BillsNotifierFamily();

  /// See also [BillsNotifier].
  BillsNotifierProvider call(
    BillsView view,
    String? propertyId, {
    bool picker = false,
  }) {
    return BillsNotifierProvider(view, propertyId, picker: picker);
  }

  @override
  BillsNotifierProvider getProviderOverride(
    covariant BillsNotifierProvider provider,
  ) {
    return call(provider.view, provider.propertyId, picker: provider.picker);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'billsNotifierProvider';
}

/// See also [BillsNotifier].
class BillsNotifierProvider
    extends AutoDisposeNotifierProviderImpl<BillsNotifier, BillsState> {
  /// See also [BillsNotifier].
  BillsNotifierProvider(
    BillsView view,
    String? propertyId, {
    bool picker = false,
  }) : this._internal(
         () => BillsNotifier()
           ..view = view
           ..propertyId = propertyId
           ..picker = picker,
         from: billsNotifierProvider,
         name: r'billsNotifierProvider',
         debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
             ? null
             : _$billsNotifierHash,
         dependencies: BillsNotifierFamily._dependencies,
         allTransitiveDependencies:
             BillsNotifierFamily._allTransitiveDependencies,
         view: view,
         propertyId: propertyId,
         picker: picker,
       );

  BillsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.view,
    required this.propertyId,
    required this.picker,
  }) : super.internal();

  final BillsView view;
  final String? propertyId;
  final bool picker;

  @override
  BillsState runNotifierBuild(covariant BillsNotifier notifier) {
    return notifier.build(view, propertyId, picker: picker);
  }

  @override
  Override overrideWith(BillsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: BillsNotifierProvider._internal(
        () => create()
          ..view = view
          ..propertyId = propertyId
          ..picker = picker,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        view: view,
        propertyId: propertyId,
        picker: picker,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<BillsNotifier, BillsState>
  createElement() {
    return _BillsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is BillsNotifierProvider &&
        other.view == view &&
        other.propertyId == propertyId &&
        other.picker == picker;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, view.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, picker.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin BillsNotifierRef on AutoDisposeNotifierProviderRef<BillsState> {
  /// The parameter `view` of this provider.
  BillsView get view;

  /// The parameter `propertyId` of this provider.
  String? get propertyId;

  /// The parameter `picker` of this provider.
  bool get picker;
}

class _BillsNotifierProviderElement
    extends AutoDisposeNotifierProviderElement<BillsNotifier, BillsState>
    with BillsNotifierRef {
  _BillsNotifierProviderElement(super.provider);

  @override
  BillsView get view => (origin as BillsNotifierProvider).view;
  @override
  String? get propertyId => (origin as BillsNotifierProvider).propertyId;
  @override
  bool get picker => (origin as BillsNotifierProvider).picker;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
