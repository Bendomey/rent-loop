// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'announcements_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$announcementsHash() => r'24004b474672782626edd6414395a5a16462e6f2';

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

/// See also [announcements].
@ProviderFor(announcements)
const announcementsProvider = AnnouncementsFamily();

/// See also [announcements].
class AnnouncementsFamily extends Family<AsyncValue<List<AnnouncementModel>>> {
  /// See also [announcements].
  const AnnouncementsFamily();

  /// See also [announcements].
  AnnouncementsProvider call(
    AnnouncementQuery query,
  ) {
    return AnnouncementsProvider(
      query,
    );
  }

  @override
  AnnouncementsProvider getProviderOverride(
    covariant AnnouncementsProvider provider,
  ) {
    return call(
      provider.query,
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
  String? get name => r'announcementsProvider';
}

/// See also [announcements].
class AnnouncementsProvider extends FutureProvider<List<AnnouncementModel>> {
  /// See also [announcements].
  AnnouncementsProvider(
    AnnouncementQuery query,
  ) : this._internal(
          (ref) => announcements(
            ref as AnnouncementsRef,
            query,
          ),
          from: announcementsProvider,
          name: r'announcementsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$announcementsHash,
          dependencies: AnnouncementsFamily._dependencies,
          allTransitiveDependencies:
              AnnouncementsFamily._allTransitiveDependencies,
          query: query,
        );

  AnnouncementsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.query,
  }) : super.internal();

  final AnnouncementQuery query;

  @override
  Override overrideWith(
    FutureOr<List<AnnouncementModel>> Function(AnnouncementsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AnnouncementsProvider._internal(
        (ref) => create(ref as AnnouncementsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        query: query,
      ),
    );
  }

  @override
  FutureProviderElement<List<AnnouncementModel>> createElement() {
    return _AnnouncementsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AnnouncementsProvider && other.query == query;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, query.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin AnnouncementsRef on FutureProviderRef<List<AnnouncementModel>> {
  /// The parameter `query` of this provider.
  AnnouncementQuery get query;
}

class _AnnouncementsProviderElement
    extends FutureProviderElement<List<AnnouncementModel>>
    with AnnouncementsRef {
  _AnnouncementsProviderElement(super.provider);

  @override
  AnnouncementQuery get query => (origin as AnnouncementsProvider).query;
}

String _$latestAnnouncementHash() =>
    r'6f70871f92e1c438f02511ec4cf826eb7a54c52a';

/// Fetches limit:1 for the home card and caches the meta total for the badge.
///
/// Copied from [latestAnnouncement].
@ProviderFor(latestAnnouncement)
final latestAnnouncementProvider = FutureProvider<AnnouncementModel?>.internal(
  latestAnnouncement,
  name: r'latestAnnouncementProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$latestAnnouncementHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef LatestAnnouncementRef = FutureProviderRef<AnnouncementModel?>;
String _$announcementTotalNotifierHash() =>
    r'8ecd89534493e509bd926cb60b1f3375d0d27539';

/// Holds the total announcement count from the last meta response.
///
/// Copied from [AnnouncementTotalNotifier].
@ProviderFor(AnnouncementTotalNotifier)
final announcementTotalNotifierProvider =
    NotifierProvider<AnnouncementTotalNotifier, int>.internal(
  AnnouncementTotalNotifier.new,
  name: r'announcementTotalNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$announcementTotalNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AnnouncementTotalNotifier = Notifier<int>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
