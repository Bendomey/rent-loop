import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

class StatItem {
  final String title;
  final String value;
  final String count;
  final IconData icon;
  final Color bgColor;
  final Color color;

  StatItem({
    required this.title,
    required this.value,
    required this.count,
    required this.icon,
    required this.bgColor,
    required this.color,
  });
}

class MaintenanceStatsCard extends StatelessWidget {
  const MaintenanceStatsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final List<StatItem> stats = [
      StatItem(
        title: 'Open Issues',
        count: '2',
        value: 'pending',
        icon: Icons.report_problem,
        bgColor: Color.fromARGB(180, 239, 108, 0),
        color: Color.fromARGB(180, 239, 108, 0),
      ),
      StatItem(
        title: 'Resolved Issues',
        count: '5',
        value: 'completed',
        icon: Icons.build,
        bgColor: Color.fromARGB(255, 3, 117, 119),
        color: Color.fromARGB(255, 5, 133, 136),
      ),
      StatItem(
        title: 'In Progress',
        count: '1',
        value: 'in_progress',
        icon: Icons.pending_actions,
        bgColor: Colors.indigo,
        color: Colors.indigo.shade400,
      ),
    ];

    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade100, width: 1),
      ),
      child: Padding(
        padding: EdgeInsets.all(00),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Maintenance Stats',
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                fontSize: 17,
                fontFamily: "Shantell",
              ),
            ),
            SizedBox(height: 5),
            Text(
              'Here is a summary of your maintenance requests and their statuses.',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            SizedBox(height: 15),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 7,
                childAspectRatio: 0.65,
              ),
              itemCount: stats.length,
              itemBuilder: (context, index) {
                final stat = stats[index];

                return InkWell(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (context.mounted) {
                      context.push('/maintenance?status=${stat.value}');
                    }
                  },
                  child: Container(
                    height: 300,
                    // border raduis
                    decoration: BoxDecoration(
                      color: stat.bgColor,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 13,
                              vertical: 13,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(150),
                              color: stat.color,
                            ),
                            child: Icon(
                              stat.icon,
                              color: Colors.white,
                              size: 15,
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stat.count,
                                style: Theme.of(context)
                                    .textTheme
                                    .displayMedium!
                                    .copyWith(
                                      color: Colors.white,
                                      fontSize: 30,
                                    ),
                              ),
                              Text(
                                stat.title,
                                style: Theme.of(context).textTheme.labelLarge!
                                    .copyWith(color: Colors.white),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 5),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (context.mounted) {
                      context.push('/maintenance/new');
                    }
                  },
                  child: Text("Report an Issue"),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
