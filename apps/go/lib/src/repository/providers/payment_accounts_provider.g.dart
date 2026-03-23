// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_accounts_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leasePaymentAccountsHash() =>
    r'a87ff3684f29c525d3fbe083752c4a2369e40cd8';

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

/// Fetches active payment accounts for the property manager of a given lease.
/// Used by the offline payment form so tenants can select where to send payment.
///
/// Copied from [leasePaymentAccounts].
@ProviderFor(leasePaymentAccounts)
const leasePaymentAccountsProvider = LeasePaymentAccountsFamily();

/// Fetches active payment accounts for the property manager of a given lease.
/// Used by the offline payment form so tenants can select where to send payment.
///
/// Copied from [leasePaymentAccounts].
class LeasePaymentAccountsFamily
    extends Family<AsyncValue<List<PaymentAccountModel>>> {
  /// Fetches active payment accounts for the property manager of a given lease.
  /// Used by the offline payment form so tenants can select where to send payment.
  ///
  /// Copied from [leasePaymentAccounts].
  const LeasePaymentAccountsFamily();

  /// Fetches active payment accounts for the property manager of a given lease.
  /// Used by the offline payment form so tenants can select where to send payment.
  ///
  /// Copied from [leasePaymentAccounts].
  LeasePaymentAccountsProvider call(
    String leaseId,
  ) {
    return LeasePaymentAccountsProvider(
      leaseId,
    );
  }

  @override
  LeasePaymentAccountsProvider getProviderOverride(
    covariant LeasePaymentAccountsProvider provider,
  ) {
    return call(
      provider.leaseId,
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
  String? get name => r'leasePaymentAccountsProvider';
}

/// Fetches active payment accounts for the property manager of a given lease.
/// Used by the offline payment form so tenants can select where to send payment.
///
/// Copied from [leasePaymentAccounts].
class LeasePaymentAccountsProvider
    extends AutoDisposeFutureProvider<List<PaymentAccountModel>> {
  /// Fetches active payment accounts for the property manager of a given lease.
  /// Used by the offline payment form so tenants can select where to send payment.
  ///
  /// Copied from [leasePaymentAccounts].
  LeasePaymentAccountsProvider(
    String leaseId,
  ) : this._internal(
          (ref) => leasePaymentAccounts(
            ref as LeasePaymentAccountsRef,
            leaseId,
          ),
          from: leasePaymentAccountsProvider,
          name: r'leasePaymentAccountsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$leasePaymentAccountsHash,
          dependencies: LeasePaymentAccountsFamily._dependencies,
          allTransitiveDependencies:
              LeasePaymentAccountsFamily._allTransitiveDependencies,
          leaseId: leaseId,
        );

  LeasePaymentAccountsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.leaseId,
  }) : super.internal();

  final String leaseId;

  @override
  Override overrideWith(
    FutureOr<List<PaymentAccountModel>> Function(
            LeasePaymentAccountsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LeasePaymentAccountsProvider._internal(
        (ref) => create(ref as LeasePaymentAccountsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        leaseId: leaseId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<PaymentAccountModel>> createElement() {
    return _LeasePaymentAccountsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LeasePaymentAccountsProvider && other.leaseId == leaseId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin LeasePaymentAccountsRef
    on AutoDisposeFutureProviderRef<List<PaymentAccountModel>> {
  /// The parameter `leaseId` of this provider.
  String get leaseId;
}

class _LeasePaymentAccountsProviderElement
    extends AutoDisposeFutureProviderElement<List<PaymentAccountModel>>
    with LeasePaymentAccountsRef {
  _LeasePaymentAccountsProviderElement(super.provider);

  @override
  String get leaseId => (origin as LeasePaymentAccountsProvider).leaseId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
