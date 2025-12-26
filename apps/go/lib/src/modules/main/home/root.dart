import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'maintenance_stats_card.dart';
import 'upcoming_payment_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _HomeScreen();
}

class _HomeScreen extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: IconButton(
              icon: Badge.count(
                count: 4,
                backgroundColor: Colors.red,
                child: Icon(Icons.notifications_outlined),
              ),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
              },
            ),
          ),
        ],
      ),
      body: ListView(
        children: <Widget>[
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              'Welcome back, Benjamin!',
              style: Theme.of(context).textTheme.displaySmall,
            ),
          ),
          Container(
            margin: EdgeInsets.all(10),
            child: MaterialBanner(
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Announcement",
                    style: Theme.of(context).textTheme.titleMedium!.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    "Your rent for June is due in 5 days. Please ensure timely payment to avoid late fees.",
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              leading: const Icon(Icons.info),
              padding: EdgeInsets.all(10),
              backgroundColor: Colors.grey.shade100,
              actions: [
                IconButton(
                  onPressed: () =>
                      ScaffoldMessenger.of(context).hideCurrentMaterialBanner(),
                  icon: const Icon(Icons.remove_red_eye, color: Colors.red),
                ),
              ],
              dividerColor:
                  Colors.transparent, // removes bottom divider entirely
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: UplomingPaymentCard(),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: MaintenanceStatsCard(),
          ),
        ],
      ),
    );
  }
}
