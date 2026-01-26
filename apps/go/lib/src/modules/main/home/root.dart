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
              child: Text('Done'),
            ),
            middle: Text(
              'unit-102-0j88kwrzp9...',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              controller: ModalScrollController.of(context),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 20),
                    Center(
                      child: Column(
                        children: [
                          // currentUserControllerState.driver?.profilePhoto != null &&
                          //         currentUserControllerState
                          //             .driver!
                          //             .profilePhoto!
                          //             .isNotEmpty
                          //     ? CircleAvatar(
                          //         radius: 35,
                          //         backgroundImage: NetworkImage(
                          //           currentUserControllerState
                          //               .driver!
                          //               .profilePhoto!,
                          //         ),
                          //         backgroundColor: Colors.grey.shade400,
                          //       )
                          //     :
                          const Icon(Icons.account_circle_rounded, size: 90),
                          SizedBox(height: 10),
                          Text(
                            "Hi, Benjamin!",
                            style: Theme.of(
                              context,
                            ).textTheme.labelLarge!.copyWith(fontSize: 25),
                          ),
                          SizedBox(height: 10),
                          FilledButton(
                            onPressed: () {
                              context.go('/settings/lease-details');
                            },
                            child: Text("Manage your Rentloop Lease"),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 20),
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: Colors.grey.shade50,
                      ),
                      child: ListView.separated(
                        physics: NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: 5,
                        separatorBuilder: (context, index) =>
                            Divider(height: 0.5),
                        itemBuilder: (context, index) {
                          return ListTile(
                            leading: Icon(Icons.apartment),
                            title: Text("unit-102-0j88kwrzp9"),
                            subtitle: Text(
                              "Madina, Accra",
                              style: Theme.of(context).textTheme.bodySmall!
                                  .copyWith(
                                    color: Colors.grey.shade600,
                                    fontSize: 13,
                                  ),
                            ),
                            trailing: Text("99+"),
                            onTap: () {
                              Navigator.pop(context);
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
