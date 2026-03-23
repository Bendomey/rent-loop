// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoices_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$invoicesHash() => r'4c1c4e2d0f305da6dc3074a9dd6740c22a566238';

/// Fetches all invoices for the currently active lease.
/// Includes both LEASE_RENT (via lease_id) and TENANT_APPLICATION
/// (via the lease's linked tenant application) invoices.
///
/// Copied from [invoices].
@ProviderFor(invoices)
final invoicesProvider = AutoDisposeFutureProvider<List<InvoiceModel>>.internal(
  invoices,
  name: r'invoicesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$invoicesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef InvoicesRef = AutoDisposeFutureProviderRef<List<InvoiceModel>>;
String _$nextOutstandingInvoiceHash() =>
    r'72fe810f049366f58cca2dc3c5193175b3b7ecf4';

/// Fetches the next outstanding invoice (ISSUED or PARTIALLY_PAID) for the
/// home screen upcoming payment card, ordered by due date ascending.
/// Returns null if there are no outstanding invoices.
///
/// Copied from [nextOutstandingInvoice].
@ProviderFor(nextOutstandingInvoice)
final nextOutstandingInvoiceProvider =
    AutoDisposeFutureProvider<InvoiceModel?>.internal(
  nextOutstandingInvoice,
  name: r'nextOutstandingInvoiceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$nextOutstandingInvoiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef NextOutstandingInvoiceRef = AutoDisposeFutureProviderRef<InvoiceModel?>;
String _$invoiceStatsHash() => r'5bf424d20b76e10234409476bb340529bfd8e2af';

/// Fetches invoice stats (counts + amounts grouped by status) for the active lease.
/// Used by the home screen payment summary card.
///
/// Copied from [invoiceStats].
@ProviderFor(invoiceStats)
final invoiceStatsProvider = FutureProvider<Map<String, dynamic>>.internal(
  invoiceStats,
  name: r'invoiceStatsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$invoiceStatsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef InvoiceStatsRef = FutureProviderRef<Map<String, dynamic>>;
String _$invoiceDetailHash() => r'3dd246349949320c289cf8a3595312d5dd3433a9';

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

/// Fetches a single invoice with full line items and payments detail.
///
/// Copied from [invoiceDetail].
@ProviderFor(invoiceDetail)
const invoiceDetailProvider = InvoiceDetailFamily();

/// Fetches a single invoice with full line items and payments detail.
///
/// Copied from [invoiceDetail].
class InvoiceDetailFamily extends Family<AsyncValue<InvoiceModel>> {
  /// Fetches a single invoice with full line items and payments detail.
  ///
  /// Copied from [invoiceDetail].
  const InvoiceDetailFamily();

  /// Fetches a single invoice with full line items and payments detail.
  ///
  /// Copied from [invoiceDetail].
  InvoiceDetailProvider call(
    String leaseId,
    String invoiceId,
  ) {
    return InvoiceDetailProvider(
      leaseId,
      invoiceId,
    );
  }

  @override
  InvoiceDetailProvider getProviderOverride(
    covariant InvoiceDetailProvider provider,
  ) {
    return call(
      provider.leaseId,
      provider.invoiceId,
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
  String? get name => r'invoiceDetailProvider';
}

/// Fetches a single invoice with full line items and payments detail.
///
/// Copied from [invoiceDetail].
class InvoiceDetailProvider extends AutoDisposeFutureProvider<InvoiceModel> {
  /// Fetches a single invoice with full line items and payments detail.
  ///
  /// Copied from [invoiceDetail].
  InvoiceDetailProvider(
    String leaseId,
    String invoiceId,
  ) : this._internal(
          (ref) => invoiceDetail(
            ref as InvoiceDetailRef,
            leaseId,
            invoiceId,
          ),
          from: invoiceDetailProvider,
          name: r'invoiceDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$invoiceDetailHash,
          dependencies: InvoiceDetailFamily._dependencies,
          allTransitiveDependencies:
              InvoiceDetailFamily._allTransitiveDependencies,
          leaseId: leaseId,
          invoiceId: invoiceId,
        );

  InvoiceDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.leaseId,
    required this.invoiceId,
  }) : super.internal();

  final String leaseId;
  final String invoiceId;

  @override
  Override overrideWith(
    FutureOr<InvoiceModel> Function(InvoiceDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: InvoiceDetailProvider._internal(
        (ref) => create(ref as InvoiceDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        leaseId: leaseId,
        invoiceId: invoiceId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<InvoiceModel> createElement() {
    return _InvoiceDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is InvoiceDetailProvider &&
        other.leaseId == leaseId &&
        other.invoiceId == invoiceId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);
    hash = _SystemHash.combine(hash, invoiceId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin InvoiceDetailRef on AutoDisposeFutureProviderRef<InvoiceModel> {
  /// The parameter `leaseId` of this provider.
  String get leaseId;

  /// The parameter `invoiceId` of this provider.
  String get invoiceId;
}

class _InvoiceDetailProviderElement
    extends AutoDisposeFutureProviderElement<InvoiceModel>
    with InvoiceDetailRef {
  _InvoiceDetailProviderElement(super.provider);

  @override
  String get leaseId => (origin as InvoiceDetailProvider).leaseId;
  @override
  String get invoiceId => (origin as InvoiceDetailProvider).invoiceId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
