import 'package:flutter/cupertino.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'maintenance_stats_card.dart';
import 'upcoming_payment_card.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _HomeScreen();
}

class _HomeScreen extends ConsumerState<HomeScreen> {
  void showIOSModal(BuildContext context) {
    showCupertinoModalBottomSheet(
      context: context,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        child: CupertinoPageScaffold(
          navigationBar: CupertinoNavigationBar(
            leading: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            middle: Text('iOS Modal'),
          ),
          child: SafeArea(child: Center(child: Text('Content'))),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        children: <Widget>[
          Container(
            margin: EdgeInsets.symmetric(horizontal: 10),
            child: Card(
              elevation: 0,
              color: Colors.grey.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
                side: BorderSide(color: Colors.grey.shade100),
              ),
              child: Padding(
                padding: EdgeInsets.only(left: 8, top: 5, bottom: 5, right: 5),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      borderRadius: BorderRadius.circular(50),
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        showIOSModal(context);
                      },
                      child: Padding(
                        padding: EdgeInsets.symmetric(
                          vertical: 7,
                          horizontal: 7,
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.apartment),
                            SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "unit-102-0j88kwrzp9",
                                  style: Theme.of(context).textTheme.bodySmall!,
                                ),
                              ],
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
                            child: Icon(Icons.notifications_outlined),
                          ),
                          onPressed: () async {
                            await Haptics.vibrate(HapticsType.selection);
                          },
                        ),
                        IconButton(
                          icon: Icon(Icons.refresh),
                          onPressed: () async {
                            await Haptics.vibrate(HapticsType.selection);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(height: 20),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              'Welcome back, Benjamin!',
              style: Theme.of(context).textTheme.displaySmall,
            ),
          ),
          SizedBox(height: 5),
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
