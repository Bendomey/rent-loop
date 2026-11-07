// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'financial_account_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$financialAccountHash() => r'acc09292fa4120327dedd3484dd7694bc3aa002e';

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

/// See also [financialAccount].
@ProviderFor(financialAccount)
const financialAccountProvider = FinancialAccountFamily();

/// See also [financialAccount].
class FinancialAccountFamily
    extends Family<AsyncValue<FinancialAccountDetailModel>> {
  /// See also [financialAccount].
  const FinancialAccountFamily();

  /// See also [financialAccount].
  FinancialAccountProvider call(
    String propertyId,
    String accountId,
  ) {
    return FinancialAccountProvider(
      propertyId,
      accountId,
    );
  }

  @override
  FinancialAccountProvider getProviderOverride(
    covariant FinancialAccountProvider provider,
  ) {
    return call(
      provider.propertyId,
      provider.accountId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'financialAccountProvider';
}

/// See also [financialAccount].
class FinancialAccountProvider
    extends AutoDisposeFutureProvider<FinancialAccountDetailModel> {
  /// See also [financialAccount].
  FinancialAccountProvider(
    String propertyId,
    String accountId,
  ) : this._internal(
          (ref) => financialAccount(
            ref as FinancialAccountRef,
            propertyId,
            accountId,
          ),
          from: financialAccountProvider,
          name: r'financialAccountProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$financialAccountHash,
          dependencies: FinancialAccountFamily._dependencies,
          allTransitiveDependencies:
              FinancialAccountFamily._allTransitiveDependencies,
          propertyId: propertyId,
          accountId: accountId,
        );

  FinancialAccountProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.accountId,
  }) : super.internal();

  final String propertyId;
  final String accountId;

  @override
  Override overrideWith(
    FutureOr<FinancialAccountDetailModel> Function(FinancialAccountRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: FinancialAccountProvider._internal(
        (ref) => create(ref as FinancialAccountRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        accountId: accountId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<FinancialAccountDetailModel>
      createElement() {
    return _FinancialAccountProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is FinancialAccountProvider &&
        other.propertyId == propertyId &&
        other.accountId == accountId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, accountId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin FinancialAccountRef
    on AutoDisposeFutureProviderRef<FinancialAccountDetailModel> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `accountId` of this provider.
  String get accountId;
}

class _FinancialAccountProviderElement
    extends AutoDisposeFutureProviderElement<FinancialAccountDetailModel>
    with FinancialAccountRef {
  _FinancialAccountProviderElement(super.provider);

  @override
  String get propertyId => (origin as FinancialAccountProvider).propertyId;
  @override
  String get accountId => (origin as FinancialAccountProvider).accountId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
