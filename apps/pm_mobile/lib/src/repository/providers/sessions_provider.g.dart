// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sessions_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$sessionsHash() => r'0b2bf3c9e86eefdf735b86d763b11c7dc2b636c4';

/// Every device currently signed in as the caller, most recently used first.
///
/// Not kept alive: the list goes stale the moment another device signs in or
/// out, so it is re-read whenever the Sessions page is opened rather than
/// cached across visits.
///
/// Copied from [sessions].
@ProviderFor(sessions)
final sessionsProvider = AutoDisposeFutureProvider<List<SessionModel>>.internal(
  sessions,
  name: r'sessionsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$sessionsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef SessionsRef = AutoDisposeFutureProviderRef<List<SessionModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
