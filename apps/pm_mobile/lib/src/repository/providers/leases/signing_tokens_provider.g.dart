// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'signing_tokens_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$signingTokensHash() => r'03a9cc5f90cc4fb789a56c047f100edf98edd266';

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

/// See also [signingTokens].
@ProviderFor(signingTokens)
const signingTokensProvider = SigningTokensFamily();

/// See also [signingTokens].
class SigningTokensFamily extends Family<AsyncValue<List<SigningTokenModel>>> {
  /// See also [signingTokens].
  const SigningTokensFamily();

  /// See also [signingTokens].
  SigningTokensProvider call(
    String propertyId,
    String documentId,
    String leaseId,
  ) {
    return SigningTokensProvider(propertyId, documentId, leaseId);
  }

  @override
  SigningTokensProvider getProviderOverride(
    covariant SigningTokensProvider provider,
  ) {
    return call(provider.propertyId, provider.documentId, provider.leaseId);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'signingTokensProvider';
}

/// See also [signingTokens].
class SigningTokensProvider
    extends AutoDisposeFutureProvider<List<SigningTokenModel>> {
  /// See also [signingTokens].
  SigningTokensProvider(String propertyId, String documentId, String leaseId)
    : this._internal(
        (ref) => signingTokens(
          ref as SigningTokensRef,
          propertyId,
          documentId,
          leaseId,
        ),
        from: signingTokensProvider,
        name: r'signingTokensProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$signingTokensHash,
        dependencies: SigningTokensFamily._dependencies,
        allTransitiveDependencies:
            SigningTokensFamily._allTransitiveDependencies,
        propertyId: propertyId,
        documentId: documentId,
        leaseId: leaseId,
      );

  SigningTokensProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
    required this.documentId,
    required this.leaseId,
  }) : super.internal();

  final String propertyId;
  final String documentId;
  final String leaseId;

  @override
  Override overrideWith(
    FutureOr<List<SigningTokenModel>> Function(SigningTokensRef provider)
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SigningTokensProvider._internal(
        (ref) => create(ref as SigningTokensRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
        documentId: documentId,
        leaseId: leaseId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<SigningTokenModel>> createElement() {
    return _SigningTokensProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SigningTokensProvider &&
        other.propertyId == propertyId &&
        other.documentId == documentId &&
        other.leaseId == leaseId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);
    hash = _SystemHash.combine(hash, documentId.hashCode);
    hash = _SystemHash.combine(hash, leaseId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin SigningTokensRef
    on AutoDisposeFutureProviderRef<List<SigningTokenModel>> {
  /// The parameter `propertyId` of this provider.
  String get propertyId;

  /// The parameter `documentId` of this provider.
  String get documentId;

  /// The parameter `leaseId` of this provider.
  String get leaseId;
}

class _SigningTokensProviderElement
    extends AutoDisposeFutureProviderElement<List<SigningTokenModel>>
    with SigningTokensRef {
  _SigningTokensProviderElement(super.provider);

  @override
  String get propertyId => (origin as SigningTokensProvider).propertyId;
  @override
  String get documentId => (origin as SigningTokensProvider).documentId;
  @override
  String get leaseId => (origin as SigningTokensProvider).leaseId;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
