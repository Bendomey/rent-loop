import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/shared/adaptive/menu.dart';
import 'package:rentloop_go/src/shared/adaptive/search_input.dart';
import './request_card.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key, this.statusFilter});

  final String? statusFilter;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _MaintenanceScreen();
}

class _MaintenanceScreen extends ConsumerState<MaintenanceScreen> {
  // add state to hide and show search bar
  bool _showSearchBar = false;
  String statusFilter = 'all';

  @override
  void initState() {
    if (widget.statusFilter != null) {
      statusFilter = widget.statusFilter!;
    }

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Requests',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),

        actions: [
          AdaptiveMenu(
            title: 'Filter Requests',
            selected: statusFilter,
            items: [
              MenuItem(value: 'all', label: 'All', isDefaultAction: true),
              MenuItem(value: 'pending', label: 'Pending'),
              MenuItem(value: 'in_progress', label: 'In Progress'),
              MenuItem(value: 'completed', label: 'Completed'),
            ],
            onSelected: (value) async {
              await Haptics.vibrate(HapticsType.selection);
              // handle filter selection
              setState(() {
                statusFilter = value;
              });
            },
            icon: Badge.count(
              count: statusFilter == 'all' ? 0 : 1,
              backgroundColor: Colors.blueAccent,
              child: const Icon(
                Icons.filter_list,
                size: 27,
                color: Colors.black,
              ),
            ),
          ),
          if (_showSearchBar)
            IconButton(
              icon: Icon(Icons.close),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                // hide search bar
                setState(() {
                  _showSearchBar = false;
                });
              },
            )
          else
            IconButton(
              icon: Icon(Icons.search),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                // show search bar
                setState(() {
                  _showSearchBar = true;
                });
              },
            ),
        ],
      ),

      // body with view
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 10),
        child: Column(
          children: [
            if (_showSearchBar)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: AdaptiveSearchInput(
                  hintText: 'Search requests',
                  controller: TextEditingController(),
                ),
              ),
            // Placeholder for request cards
            Expanded(
              child: ListView.builder(
                itemCount: 5, // Example count
                itemBuilder: (context, index) {
                  return RequestCard();
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Haptics.vibrate(HapticsType.selection);
          if (context.mounted) {
            context.push('/maintenance/new');
          }
        },
        shape: CircleBorder(),
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
