// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_agreement_document_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaseAgreementDocumentHash() =>
    r'0bf6cd15bb8556dd89a53921eefdd2425eb2b7c2';

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

/// `null` means the lease has no document pipeline started yet — a normal,
/// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
///
/// Copied from [leaseAgreementDocument].
@ProviderFor(leaseAgreementDocument)
const leaseAgreementDocumentProvider = LeaseAgreementDocumentFamily();

/// `null` means the lease has no document pipeline started yet — a normal,
/// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
///
/// Copied from [leaseAgreementDocument].
class LeaseAgreementDocumentFamily
    extends Family<AsyncValue<LeaseAgreementDocumentModel?>> {
  /// `null` means the lease has no document pipeline started yet — a normal,
  /// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
  ///
  /// Copied from [leaseAgreementDocument].
  const LeaseAgreementDocumentFamily();

  /// `null` means the lease has no document pipeline started yet — a normal,
  /// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
  ///
  /// Copied from [leaseAgreementDocument].
  LeaseAgreementDocumentProvider call(String propertyId, String leaseId) {
    return LeaseAgreementDocumentProvider(propertyId, leaseId);
  }

  @override
  LeaseAgreementDocumentProvider getProviderOverride(
    covariant LeaseAgreementDocumentProvider provider,
  ) {
    return call(provider.propertyId, provider.leaseId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'leaseAgreementDocumentProvider';
}

/// `null` means the lease has no document pipeline started yet — a normal,
/// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
///
/// Copied from [leaseAgreementDocument].
class LeaseAgreementDocumentProvider
    extends AutoDisposeFutureProvider<LeaseAgreementDocumentModel?> {
  /// `null` means the lease has no document pipeline started yet — a normal,
  /// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
  ///
  /// Copied from [leaseAgreementDocument].
  LeaseAgreementDocumentProvider(String propertyId, String leaseId)
    : this._internal(
        (ref) => leaseAgreementDocument(
          ref as LeaseAgreementDocumentRef,
          propertyId,
          leaseId,
        ),
        from: leaseAgreementDocumentProvider,
        name: r'leaseAgreementDocumentProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$leaseAgreementDocumentHash,
        dependencies: LeaseAgreementDocumentFamily._dependencies,
        allTransitiveDependencies:
            LeaseAgreementDocumentFamily._allTransitiveDependencies,
        propertyId: propertyId,
        leaseId: leaseId,
      );

  LeaseAgreementDocumentProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.leaseId,
  }) : super.internal();

  final String propertyId;
  final String leaseId;

  @override
  Override overrideWith(
    FutureOr<LeaseAgreementDocumentModel?> Function(
      LeaseAgreementDocumentRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LeaseAgreementDocumentProvider._internal(
        (ref) => create(ref as LeaseAgreementDocumentRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        leaseId: leaseId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<LeaseAgreementDocumentModel?>
  createElement() {
    return _LeaseAgreementDocumentProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LeaseAgreementDocumentProvider &&
        other.propertyId == propertyId &&
        other.leaseId == leaseId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin LeaseAgreementDocumentRef
    on AutoDisposeFutureProviderRef<LeaseAgreementDocumentModel?> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `leaseId` of this provider.
  String get leaseId;
}

class _LeaseAgreementDocumentProviderElement
    extends AutoDisposeFutureProviderElement<LeaseAgreementDocumentModel?>
    with LeaseAgreementDocumentRef {
  _LeaseAgreementDocumentProviderElement(super.provider);

  @override
  String get propertyId =>
      (origin as LeaseAgreementDocumentProvider).propertyId;
  @override
  String get leaseId => (origin as LeaseAgreementDocumentProvider).leaseId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
