// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'blocks_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$blocksNotifierHash() => r'193c623d32f7e6779387e0c92effaaa25b0d9c9b';

/// Paginated list of a property's blocks — mirrors UnitsNotifier's shape,
/// used by blocks_list.dart. Distinct from propertyBlocksProvider (a plain
/// family FutureProvider used for cheap totals + the add-unit block picker).
///
/// Copied from [BlocksNotifier].
@ProviderFor(BlocksNotifier)
final blocksNotifierProvider =
    AutoDisposeNotifierProvider<BlocksNotifier, BlocksState>.internal(
      BlocksNotifier.new,
      name: r'blocksNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$blocksNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$BlocksNotifier = AutoDisposeNotifier<BlocksState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
