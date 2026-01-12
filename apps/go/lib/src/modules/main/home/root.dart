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
          IconButton(
            padding: EdgeInsets.zero,
            icon: Badge.count(
              count: 4,
              backgroundColor: Colors.red,
              child: Icon(Icons.notifications_outlined),
            ),
            onPressed: () async {
              await Haptics.vibrate(HapticsType.selection);
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: IconButton(
              icon: Icon(Icons.refresh),
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
            child: Card(
              elevation: 0,
              color: Colors.orange.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(color: Colors.orange.shade100),
              ),
              child: Padding(
                padding: EdgeInsets.all(15),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.lightbulb, color: Colors.orange.shade600),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Announcements",
                            style: Theme.of(
                              context,
                            ).textTheme.displaySmall!.copyWith(fontSize: 17),
                          ),
                          SizedBox(height: 5),
                          Text(
                            "Your rent for June is due in 5 days. Please ensure timely payment to avoid late fees.",
                            style: Theme.of(
                              context,
                            ).textTheme.bodySmall!.copyWith(fontSize: 14),
                          ),
                          SizedBox(height: 5),
                          FilledButton(
                            onPressed: () async {
                              await Haptics.vibrate(HapticsType.selection);
                              if (context.mounted) {
                                context.push('/more/annoucements');
                              }
                            },
                            child: const Text("VIEW "),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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
