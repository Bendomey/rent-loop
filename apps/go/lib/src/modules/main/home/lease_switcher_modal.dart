import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

void showLeaseSwitcherModal(
  BuildContext context,
  WidgetRef ref,
  List<LeaseModel> leases,
  LeaseModel? activeLease,
  dynamic currentUser,
) {
  showCupertinoModalBottomSheet(
    context: context,
    builder: (context) => SizedBox(
      height: MediaQuery.of(context).size.height * 0.8,
      child: CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          leading: CupertinoButton(
            padding: EdgeInsets.zero,
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
          middle: Text(
            leases.isNotEmpty
                ? (leases.first.unit?.name ?? leases.first.unit?.slug ?? '—')
                : '—',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            controller: ModalScrollController.of(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  Center(
                    child: Column(
                      children: [
                        () {
                          final photoUrl = currentUser?.tenant?.profilePhotoUrl;
                          if (photoUrl != null && photoUrl.isNotEmpty) {
                            return CircleAvatar(
                              radius: 45,
                              backgroundImage: NetworkImage(photoUrl),
                              backgroundColor: Colors.grey.shade200,
                            );
                          }
                          return const Icon(
                            Icons.account_circle_rounded,
                            size: 90,
                          );
                        }(),
                        const SizedBox(height: 10),
                        Text(
                          currentUser?.tenant?.firstName != null
                              ? 'Hi, ${currentUser!.tenant!.firstName}!'
                              : 'Hi there!',
                          style: Theme.of(
                            context,
                          ).textTheme.labelLarge!.copyWith(fontSize: 25),
                        ),
                        const SizedBox(height: 10),
                        FilledButton(
                          onPressed: () async {
                            await Haptics.vibrate(HapticsType.selection);

                            if (context.mounted) {
                              Navigator.pop(context);
                              context.push('/more/lease-details');
                            }
                          },
                          child: const Text('Manage your Rentloop Lease'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (leases.isNotEmpty)
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: Colors.grey.shade50,
                      ),
                      child: ListView.separated(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: leases.length,
                        separatorBuilder: (_, __) =>
                            Divider(height: 0.5, color: Colors.grey.shade200),
                        itemBuilder: (context, index) {
                          final lease = leases[index];
                          final label =
                              lease.unit?.name ??
                              lease.unit?.slug ??
                              lease.code;
                          final isActive = lease.id == activeLease?.id;
                          return ListTile(
                            leading: const Icon(Icons.apartment),
                            title: Text(label),
                            subtitle: Text(
                              leaseStatusLabel(lease.status),
                              style: Theme.of(context).textTheme.bodySmall!
                                  .copyWith(
                                    color: Colors.grey.shade600,
                                    fontSize: 13,
                                  ),
                            ),
                            trailing: isActive
                                ? const Icon(Icons.check, color: Colors.green)
                                : null,
                            onTap: () async {
                              await ref
                                  .read(currentLeaseNotifierProvider.notifier)
                                  .setLease(lease);
                              if (context.mounted) Navigator.pop(context);
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
