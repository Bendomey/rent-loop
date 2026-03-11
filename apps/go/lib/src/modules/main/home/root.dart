import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';
import 'package:rentloop_go/src/repository/providers/leases_provider.dart';
import 'announcements_card.dart';
import 'home_skeleton.dart';
import 'lease_selector_bar.dart';
import 'maintenance_stats_card.dart';
import 'upcoming_payment_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leasesAsync = ref.watch(leasesProvider);
    final currentUser = ref.watch(currentUserNotifierProvider);
    final activeLease = ref.watch(currentLeaseNotifierProvider);

    return Scaffold(
      body: leasesAsync.when(
        skipLoadingOnRefresh: false,
        loading: () => const HomeSkeleton(),
        error: (_, __) => const HomeSkeleton(),
        data: (leases) => _HomeContent(
          leases: leases,
          activeLease: activeLease,
          currentUser: currentUser,
        ),
      ),
    );
  }
}

class _HomeContent extends ConsumerWidget {
  final List<LeaseModel> leases;
  final LeaseModel? activeLease;
  final dynamic currentUser;

  const _HomeContent({
    required this.leases,
    required this.activeLease,
    required this.currentUser,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (activeLease == null && leases.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(currentLeaseNotifierProvider.notifier).setLease(leases.first);
      });
    }

    return ListView(
      children: [
        LeaseSelectorBar(leases: leases),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            'Welcome back, ${currentUser?.tenant?.firstName ?? 'tenant'}!',
            style: Theme.of(context).textTheme.displaySmall,
          ),
        ),
        const SizedBox(height: 5),
        const AnnouncementsCard(),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          child: UplomingPaymentCard(),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: MaintenanceStatsCard(),
        ),
      ],
    );
  }
}
