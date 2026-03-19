import 'package:rentloop_go/src/api/checklist.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/checklist_model.dart';

part 'checklists_provider.g.dart';

/// Fetches all checklists (SUBMITTED/ACKNOWLEDGED/DISPUTED) for the active lease.
@Riverpod(keepAlive: true)
Future<List<LeaseChecklistModel>> checklists(ChecklistsRef ref) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return [];
  return ref.read(checklistApiProvider).getChecklists(leaseId: activeLease.id);
}

/// Fetches only SUBMITTED checklists for the home banner and badge count.
@Riverpod(keepAlive: true)
Future<LeaseChecklistModel?> latestSubmittedChecklist(
  LatestSubmittedChecklistRef ref,
) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) {
    ref.read(checklistTotalNotifierProvider.notifier).set(0);
    return null;
  }
  final submitted = await ref
      .read(checklistApiProvider)
      .getChecklists(leaseId: activeLease.id, status: 'SUBMITTED');
  ref.read(checklistTotalNotifierProvider.notifier).set(submitted.length);
  return submitted.isEmpty ? null : submitted.first;
}

/// Holds the count of SUBMITTED checklists needing tenant review.
@Riverpod(keepAlive: true)
class ChecklistTotalNotifier extends _$ChecklistTotalNotifier {
  @override
  int build() => 0;

  void set(int total) => state = total;
}

/// Fetches a single checklist with items and acknowledgments populated.
@riverpod
Future<LeaseChecklistModel> singleChecklist(
  SingleChecklistRef ref,
  String checklistId,
) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) throw Exception('No active lease');
  return ref
      .read(checklistApiProvider)
      .getChecklist(leaseId: activeLease.id, checklistId: checklistId);
}
