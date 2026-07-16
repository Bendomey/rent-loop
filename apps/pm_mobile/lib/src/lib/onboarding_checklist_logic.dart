import 'package:rentloop_manager/src/repository/models/agreement_model.dart';

/// Whether every agreement the user needs to accept has been accepted.
/// Only OWNER-role client_users are required to accept agreements — every
/// other role defaults to true (the check doesn't apply to them at all,
/// not just skipped-after-an-empty-fetch), matching the web portal's loader.
bool computeHasAcceptedAllAgreements({
  required bool isOwner,
  required List<AgreementModel> agreements,
}) {
  if (!isOwner) return true;
  return agreements.every((a) => a.userHasAccepted);
}

/// Whether the client's identity details are complete. Only applies to
/// individual clients — companies are always considered complete here.
bool computeIsIdentityComplete({
  required bool isIndividual,
  required String? idType,
  required String? idNumber,
}) {
  if (!isIndividual) return true;
  return idType != null && idNumber != null;
}
