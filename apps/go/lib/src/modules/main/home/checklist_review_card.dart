import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/checklist_model.dart';
import 'package:rentloop_go/src/repository/providers/checklists_provider.dart';

class ChecklistReviewCard extends ConsumerWidget {
  const ChecklistReviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latestAsync = ref.watch(latestSubmittedChecklistProvider);

    return latestAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (checklist) {
        if (checklist == null) return const SizedBox.shrink();
        final typeLabel = _checklistTypeLabel(checklist.type);
        return _buildCard(
          context,
          checklist: checklist,
          title: '$typeLabel Report Ready for Review',
          body:
              'Your landlord has submitted a $typeLabel report. Please review and respond.',
        );
      },
    );
  }

  String _checklistTypeLabel(String type) {
    switch (type) {
      case 'CHECK_IN':
        return 'Move-in';
      case 'CHECK_OUT':
        return 'Move-out';
      case 'ROUTINE':
        return 'Routine';
      default:
        return 'Condition';
    }
  }

  Widget _buildCard(
    BuildContext context, {
    required LeaseChecklistModel checklist,
    required String title,
    required String body,
  }) {
    return Container(
      margin: const EdgeInsets.all(10),
      child: Card(
        elevation: 0,
        color: Colors.blue.shade50,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: Colors.blue.shade100),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () async {
            await Haptics.vibrate(HapticsType.selection);
            if (context.mounted) {
              context.push('/unit-condition-reports/${checklist.id}');
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.assignment_outlined, color: Colors.blue.shade600),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(
                          context,
                        ).textTheme.displaySmall!.copyWith(fontSize: 17),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        body,
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall!.copyWith(fontSize: 14),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.blue.shade400),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
