import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:timeline_tile/timeline_tile.dart';
import 'attachments.dart';

class AttachmentItemUrl {
  final String url;
  final String type;

  AttachmentItemUrl({required this.url, required this.type});
}

class MaintenanceDetailsScreen extends ConsumerStatefulWidget {
  const MaintenanceDetailsScreen({super.key, required this.requestId});

  final String requestId;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _MaintenanceDetailsScreen();
}

class _MaintenanceDetailsScreen
    extends ConsumerState<MaintenanceDetailsScreen> {
  List<AttachmentItemUrl> attachments = [
    AttachmentItemUrl(
      url:
          'https://images.unsplash.com/photo-1768049994214-5df7d70fc078?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      type: 'image',
    ),
    AttachmentItemUrl(
      url:
          'https://images.unsplash.com/photo-1768049994214-5df7d70fc078?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      type: 'image',
    ),
    AttachmentItemUrl(
      url:
          'https://images.unsplash.com/photo-1768049994214-5df7d70fc078?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      type: 'image',
    ),
    AttachmentItemUrl(
      url:
          'https://images.unsplash.com/photo-1768049994214-5df7d70fc078?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      type: 'image',
    ),
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'ML-000123',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
      ),

      // body with view
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 15),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text(
                'General Information',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge!.copyWith(fontSize: 20),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  'Submitted: August 20, 2023',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                leading: Icon(Icons.calendar_today_rounded, size: 22),
                trailing: Container(
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
              const SizedBox(height: 30),
              Text(
                'Title',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge!.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 10),
              Text(
                'Bathroom Light Not Working',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 30),
              Text(
                'Description',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge!.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 10),
              Text(
                'The bathroom light is flickering and sometimes does not turn on at all. This issue has been ongoing for a few days now and needs urgent attention.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Text(
                    'Priority:',
                    style: Theme.of(context).textTheme.bodySmall!.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text('High', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Text(
                    'Preferred Date/Time:',
                    style: Theme.of(context).textTheme.bodySmall!.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    DateTime.now().format('MMM dd, yyyy - hh:mm a'),
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall!.copyWith(fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                'Photos & Videos',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge!.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 20),
              ViewAttachmentsWidget(attachments: attachments),
              Text(
                'Repair Progress',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge!.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 10),
              Card(
                elevation: 0,
                color: Colors.grey.shade100,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                  child: Column(
                    children: [
                      TimelineTile(
                        alignment: TimelineAlign.start,
                        lineXY: 0.1,
                        isFirst: true,
                        endChild: Container(
                          margin: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Case Reported',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                DateTime.now().format('MMM dd, yyyy - hh:mm a'),
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 14,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your case has been reported successfully. ',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                      TimelineTile(
                        alignment: TimelineAlign.start,
                        lineXY: 0.1,
                        endChild: Container(
                          margin: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Fix in progress',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                DateTime.now().format('MMM dd, yyyy - hh:mm a'),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your case is currently being worked on.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                      TimelineTile(
                        alignment: TimelineAlign.start,
                        lineXY: 0.1,
                        isLast: true,
                        endChild: Container(
                          margin: EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Done',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Pending',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 14,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your case has been reported successfully. ',
                                style: Theme.of(context).textTheme.bodySmall!
                                    .copyWith(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 50),
            ],
          ),
        ),
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Haptics.vibrate(HapticsType.selection);
        },
        shape: CircleBorder(),
        child: Icon(Icons.support_agent, color: Colors.white),
      ),
    );
  }
}
