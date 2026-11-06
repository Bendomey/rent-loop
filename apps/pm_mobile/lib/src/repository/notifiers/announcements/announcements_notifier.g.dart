// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'announcements_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$announcementsNotifierHash() =>
    r'14b2a41932472cf1c9c0147a9131ff12f87a9b5b';

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

abstract class _$AnnouncementsNotifier
    extends BuildlessAutoDisposeNotifier<AnnouncementsState> {
  late final String? propertyId;

  AnnouncementsState build(
    String? propertyId,
  );
}

/// See also [AnnouncementsNotifier].
@ProviderFor(AnnouncementsNotifier)
const announcementsNotifierProvider = AnnouncementsNotifierFamily();

/// See also [AnnouncementsNotifier].
class AnnouncementsNotifierFamily extends Family<AnnouncementsState> {
  /// See also [AnnouncementsNotifier].
  const AnnouncementsNotifierFamily();

  /// See also [AnnouncementsNotifier].
  AnnouncementsNotifierProvider call(
    String? propertyId,
  ) {
    return AnnouncementsNotifierProvider(
      propertyId,
    );
  }

  @override
  AnnouncementsNotifierProvider getProviderOverride(
    covariant AnnouncementsNotifierProvider provider,
  ) {
    return call(
      provider.propertyId,
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
  String? get name => r'announcementsNotifierProvider';
}

/// See also [AnnouncementsNotifier].
class AnnouncementsNotifierProvider extends AutoDisposeNotifierProviderImpl<
    AnnouncementsNotifier, AnnouncementsState> {
  /// See also [AnnouncementsNotifier].
  AnnouncementsNotifierProvider(
    String? propertyId,
  ) : this._internal(
          () => AnnouncementsNotifier()..propertyId = propertyId,
          from: announcementsNotifierProvider,
          name: r'announcementsNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$announcementsNotifierHash,
          dependencies: AnnouncementsNotifierFamily._dependencies,
          allTransitiveDependencies:
              AnnouncementsNotifierFamily._allTransitiveDependencies,
          propertyId: propertyId,
        );

  AnnouncementsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.propertyId,
  }) : super.internal();

  final String? propertyId;

  @override
  AnnouncementsState runNotifierBuild(
    covariant AnnouncementsNotifier notifier,
  ) {
    return notifier.build(
      propertyId,
    );
  }

  @override
  Override overrideWith(AnnouncementsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: AnnouncementsNotifierProvider._internal(
        () => create()..propertyId = propertyId,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        propertyId: propertyId,
      ),
    );
  }

  @override
  AutoDisposeNotifierProviderElement<AnnouncementsNotifier, AnnouncementsState>
      createElement() {
    return _AnnouncementsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AnnouncementsNotifierProvider &&
        other.propertyId == propertyId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, propertyId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin AnnouncementsNotifierRef
    on AutoDisposeNotifierProviderRef<AnnouncementsState> {
  /// The parameter `propertyId` of this provider.
  String? get propertyId;
}

class _AnnouncementsNotifierProviderElement
    extends AutoDisposeNotifierProviderElement<AnnouncementsNotifier,
        AnnouncementsState> with AnnouncementsNotifierRef {
  _AnnouncementsNotifierProviderElement(super.provider);

  @override
  String? get propertyId =>
      (origin as AnnouncementsNotifierProvider).propertyId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
