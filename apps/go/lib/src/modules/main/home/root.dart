import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';
import 'package:rentloop_go/src/repository/providers/leases_provider.dart';
import 'announcements_card.dart';
import 'checklist_review_card.dart';
import 'lease_overview_card.dart';
import 'lease_selector_bar.dart';
import 'maintenance_stats_card.dart';
import 'payment_summary_card.dart';
import 'quick_actions_card.dart';
import 'unit_info_card.dart';
import 'upcoming_payment_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Leases are guaranteed loaded by AppStartupNotifier before any
    // authenticated screen renders. leasesProvider is keepAlive so this
    // returns immediately from cache; it also supports pull-to-refresh.
    final leasesAsync = ref.watch(leasesProvider);
    final currentUser = ref.watch(currentUserNotifierProvider);
    final activeLease = ref.watch(currentLeaseNotifierProvider);

    final leases = leasesAsync.valueOrNull ?? [];

    return Scaffold(
      body: _HomeContent(
        leases: leases,
        activeLease: activeLease,
        currentUser: currentUser,
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
    return ListView(
      children: [
        LeaseSelectorBar(leases: leases),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Text(
            'Welcome back, ${currentUser?.tenant?.firstName ?? 'tenant'}!',
            style: Theme.of(context).textTheme.displaySmall,
          ),
        ),
        const AnnouncementsCard(),
        const ChecklistReviewCard(),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          child: UpcomingPaymentCard(),
        ),

        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: LeaseOverviewCard(),
        ),
        const SizedBox(height: 10),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: UnitInfoCard(),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: QuickActionsCard(),
        ),
        const SizedBox(height: 10),
        const SizedBox(height: 10),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: PaymentSummaryCard(),
        ),
        const SizedBox(height: 10),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: MaintenanceStatsCard(),
        ),
      ],
    );
  }
}
