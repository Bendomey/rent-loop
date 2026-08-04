import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/agreement_api.dart';
import 'package:rentloop_manager/src/api/payment_account_api.dart';
import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/onboarding_checklist_logic.dart';
import 'package:rentloop_manager/src/repository/models/agreement_model.dart';

part 'onboarding_checklist_provider.g.dart';

class OnboardingChecklistState {
  const OnboardingChecklistState({
    required this.hasAcceptedAllAgreements,
    required this.isProfileComplete,
    required this.isIndividual,
    required this.isIdentityComplete,
    required this.isPropertiesComplete,
    required this.isPaymentAccountsComplete,
  });

  final bool hasAcceptedAllAgreements;
  final bool isProfileComplete;
  final bool isIndividual;
  final bool isIdentityComplete;
  final bool isPropertiesComplete;
  final bool isPaymentAccountsComplete;

  bool get isComplete =>
      hasAcceptedAllAgreements &&
      isProfileComplete &&
      (!isIndividual || isIdentityComplete) &&
      isPropertiesComplete &&
      isPaymentAccountsComplete;
}

const _kAllCompleteFallback = OnboardingChecklistState(
  hasAcceptedAllAgreements: true,
  isProfileComplete: true,
  isIndividual: false,
  isIdentityComplete: true,
  isPropertiesComplete: true,
  isPaymentAccountsComplete: true,
);

@riverpod
Future<OnboardingChecklistState> onboardingChecklist(
  OnboardingChecklistRef ref,
) async {
  final workspace = ref.watch(currentWorkspaceNotifierProvider);
  // Only reachable from Home, which only renders once a workspace is
  // selected — this guard is defensive, not an expected runtime path.
  if (workspace == null) return _kAllCompleteFallback;

  final clientId = workspace.clientId;
  final isOwner = workspace.role.toUpperCase() == 'OWNER';
  final isIndividual = workspace.client?.type == 'INDIVIDUAL';

  final agreementsFuture = isOwner
      ? ref.read(agreementApiProvider).getAgreements(clientId: clientId)
      : Future.value(<AgreementModel>[]);
  final propertiesFuture = ref
      .read(propertyApiProvider)
      .getProperties(clientId: clientId, page: 1, pageSize: 1);
  final paymentAccountsFuture = ref
      .read(paymentAccountApiProvider)
      .getPaymentAccounts(
        clientId: clientId,
        page: 1,
        pageSize: 1,
        ownerTypes: const ['PROPERTY_OWNER', 'SYSTEM'],
      );

  final agreements = await agreementsFuture;
  final propertiesPage = await propertiesFuture;
  final paymentAccountsPage = await paymentAccountsFuture;

  return OnboardingChecklistState(
    hasAcceptedAllAgreements: computeHasAcceptedAllAgreements(
      isOwner: isOwner,
      agreements: agreements,
    ),
    isProfileComplete: true,
    isIndividual: isIndividual,
    isIdentityComplete: computeIsIdentityComplete(
      isIndividual: isIndividual,
      idType: workspace.client?.idType,
      idNumber: workspace.client?.idNumber,
    ),
    isPropertiesComplete: propertiesPage.meta.total > 0,
    isPaymentAccountsComplete: paymentAccountsPage.meta.total > 0,
  );
}
