import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';
import 'package:rentloop_go/src/repository/providers/leases_provider.dart';
import 'lease_switcher_modal.dart';

class LeaseSelectorBar extends ConsumerWidget {
  final List<LeaseModel> leases;

  const LeaseSelectorBar({super.key, required this.leases});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeLease = ref.watch(currentLeaseNotifierProvider);
    final currentUser = ref.watch(currentUserNotifierProvider);
    final unitLabel = activeLease?.unit?.name ?? activeLease?.unit?.slug ?? '—';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10),
      child: Card(
        elevation: 0,
        color: Colors.grey.shade50,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(50),
          side: BorderSide(color: Colors.grey.shade100),
        ),
        child: Padding(
          padding: const EdgeInsets.only(left: 8, top: 5, bottom: 5, right: 5),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              InkWell(
                borderRadius: BorderRadius.circular(50),
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (context.mounted) {
                    showLeaseSwitcherModal(
                      context,
                      ref,
                      leases,
                      activeLease,
                      currentUser,
                    );
                  }
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 7,
                    horizontal: 7,
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.apartment),
                      const SizedBox(width: 10),
                      Text(
                        unitLabel,
                        style: Theme.of(context).textTheme.bodySmall!,
                      ),
                      Icon(
                        Icons.keyboard_arrow_down,
                        size: 20,
                        color: Colors.grey.shade500,
                      ),
                    ],
                  ),
                ),
              ),
              Row(
                children: [
                  IconButton(
                    padding: EdgeInsets.zero,
                    icon: Badge.count(
                      count: 4,
                      backgroundColor: Colors.red,
                      child: const Icon(Icons.notifications_outlined),
                    ),
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.selection);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      ref.invalidate(leasesProvider);
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
