// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'link_document_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$linkDocumentNotifierHash() =>
    r'30098eb7d32958e6ca0ccb9de3104f48758cd92a';

/// Backs the Documents tab's MANUAL-mode "Done" step — copies the uploaded
/// file's URL onto the lease record so `lease.lease_agreement_document_url`
/// is set, mirroring the web `LeaseAgreementDocumentSetup`'s own "Done"
/// button (a plain `useUpdateLease()` call, no signing involved for MANUAL
/// mode at all).
///
/// Copied from [LinkDocumentNotifier].
@ProviderFor(LinkDocumentNotifier)
final linkDocumentNotifierProvider =
    AutoDisposeNotifierProvider<
      LinkDocumentNotifier,
      LinkDocumentState
    >.internal(
      LinkDocumentNotifier.new,
      name: r'linkDocumentNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$linkDocumentNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$LinkDocumentNotifier = AutoDisposeNotifier<LinkDocumentState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
