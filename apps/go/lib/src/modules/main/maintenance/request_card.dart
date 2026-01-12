import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

class RequestCard extends StatelessWidget {
  const RequestCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade300, width: 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            context.push('/maintenance/123');
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Leaky Faucet',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge!.copyWith(fontSize: 17),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      color: Colors.blue.shade50,
                    ),
                    child: Text(
                      "In Progress",
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: Colors.blue.shade900,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),

              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  'Case ID: #123456',
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge!.copyWith(color: Colors.grey.shade600),
                ),
              ),

              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Submitted: August 20, 2023',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  leading: Icon(Icons.calendar_today_rounded, size: 22),
                  trailing: Icon(Icons.arrow_forward),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Icon(Icons.alarm, size: 22),
                  const SizedBox(width: 20),
                  Text(
                    'Last update: 2 days ago',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Divider(color: Colors.grey.shade300, thickness: 1, height: 20),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
                    ),
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(100),
                      color: Colors.orange.shade50,
                    ),
                    child: Icon(
                      Icons.construction,
                      color: Colors.orange.shade700,
                      size: 25,
                    ),
                  ),
                  const SizedBox(width: 10),
                  // text wrapped to next line if too long
                  Expanded(
                    child: Text(
                      'Scheduled maintenance with plumber on Aug 25, 2023',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
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
