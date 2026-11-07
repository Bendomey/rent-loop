// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bill_detail_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$billDetailHash() => r'8914aea661dc9d5ee2c722df08defd6abec4e37c';

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

/// See also [billDetail].
@ProviderFor(billDetail)
const billDetailProvider = BillDetailFamily();

/// See also [billDetail].
class BillDetailFamily extends Family<AsyncValue<InvoiceModel>> {
  /// See also [billDetail].
  const BillDetailFamily();

  /// See also [billDetail].
  BillDetailProvider call(String propertyId, String id) {
    return BillDetailProvider(propertyId, id);
  }

  @override
  BillDetailProvider getProviderOverride(
    covariant BillDetailProvider provider,
  ) {
    return call(provider.propertyId, provider.id);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'billDetailProvider';
}

/// See also [billDetail].
class BillDetailProvider extends AutoDisposeFutureProvider<InvoiceModel> {
  /// See also [billDetail].
  BillDetailProvider(String propertyId, String id)
    : this._internal(
        (ref) => billDetail(ref as BillDetailRef, propertyId, id),
        from: billDetailProvider,
        name: r'billDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$billDetailHash,
        dependencies: BillDetailFamily._dependencies,
        allTransitiveDependencies: BillDetailFamily._allTransitiveDependencies,
        propertyId: propertyId,
        id: id,
      );

  BillDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.id,
  }) : super.internal();

  final String propertyId;
  final String id;

  @override
  Override overrideWith(
    FutureOr<InvoiceModel> Function(BillDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: BillDetailProvider._internal(
        (ref) => create(ref as BillDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<InvoiceModel> createElement() {
    return _BillDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is BillDetailProvider &&
        other.propertyId == propertyId &&
        other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin BillDetailRef on AutoDisposeFutureProviderRef<InvoiceModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `id` of this provider.
  String get id;
}

class _BillDetailProviderElement
    extends AutoDisposeFutureProviderElement<InvoiceModel>
    with BillDetailRef {
  _BillDetailProviderElement(super.provider);

  @override
  String get propertyId => (origin as BillDetailProvider).propertyId;
  @override
  String get id => (origin as BillDetailProvider).id;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
