// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'generate_signing_token_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$generateSigningTokenNotifierHash() =>
    r'671d72498c49cb2420b0550e89d42fc8539ae8e1';

/// Backs both "Request Signature" (no existing token) and "Resend" (token
/// exists but unsigned) — resend is a separate notifier
/// (`resend_signing_token_notifier.dart`) since it hits a different
/// endpoint, not a variant of this one.
///
/// Copied from [GenerateSigningTokenNotifier].
@ProviderFor(GenerateSigningTokenNotifier)
final generateSigningTokenNotifierProvider =
    AutoDisposeNotifierProvider<
      GenerateSigningTokenNotifier,
      GenerateSigningTokenState
    >.internal(
      GenerateSigningTokenNotifier.new,
      name: r'generateSigningTokenNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$generateSigningTokenNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$GenerateSigningTokenNotifier =
    AutoDisposeNotifier<GenerateSigningTokenState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
