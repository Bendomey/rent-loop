import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

class AnnouncementsCard extends StatelessWidget {
  const AnnouncementsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(10),
      child: Card(
        elevation: 0,
        color: Colors.orange.shade50,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: Colors.orange.shade100),
        ),
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.lightbulb, color: Colors.orange.shade600),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Announcements',
                      style: Theme.of(
                        context,
                      ).textTheme.displaySmall!.copyWith(fontSize: 17),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Your rent for June is due in 5 days. Please ensure timely payment to avoid late fees.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall!.copyWith(fontSize: 14),
                    ),
                    const SizedBox(height: 5),
                    FilledButton(
                      onPressed: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) {
                          context.push('/more/annoucements');
                        }
                      },
                      child: const Text('VIEW'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
