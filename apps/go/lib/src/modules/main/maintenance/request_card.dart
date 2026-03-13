import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';

Color _statusBgColor(String? status) => switch (status?.toUpperCase()) {
  'PENDING' => Colors.orange.shade50,
  'IN_PROGRESS' => Colors.blue.shade50,
  'RESOLVED' => Colors.green.shade50,
  'CANCELLED' => Colors.grey.shade100,
  _ => Colors.grey.shade100,
};

Color _statusTextColor(String? status) => switch (status?.toUpperCase()) {
  'PENDING' => Colors.orange.shade900,
  'IN_PROGRESS' => Colors.blue.shade900,
  'RESOLVED' => Colors.green.shade900,
  'CANCELLED' => Colors.grey.shade700,
  _ => Colors.grey.shade700,
};

({IconData icon, Color bg, Color fg}) _logActionStyle(String? action) {
  return switch (action?.toUpperCase()) {
    'CREATED' => (
      icon: Icons.add_task_rounded,
      bg: Colors.blue.shade50,
      fg: Colors.blue.shade700,
    ),
    'STATUS_CHANGED' => (
      icon: Icons.swap_horiz_rounded,
      bg: Colors.purple.shade50,
      fg: Colors.purple.shade700,
    ),
    'WORKER_ASSIGNED' => (
      icon: Icons.engineering_rounded,
      bg: Colors.orange.shade50,
      fg: Colors.orange.shade700,
    ),
    'MANAGER_ASSIGNED' => (
      icon: Icons.manage_accounts_rounded,
      bg: Colors.teal.shade50,
      fg: Colors.teal.shade700,
    ),
    'RESOLVED' => (
      icon: Icons.check_circle_rounded,
      bg: Colors.green.shade50,
      fg: Colors.green.shade700,
    ),
    'CANCELED' => (
      icon: Icons.cancel_rounded,
      bg: Colors.grey.shade100,
      fg: Colors.grey.shade600,
    ),
    _ => (
      icon: Icons.info_outline_rounded,
      bg: Colors.grey.shade100,
      fg: Colors.grey.shade600,
    ),
  };
}

class RequestCard extends StatelessWidget {
  const RequestCard({super.key, required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context) {
    final latestLog = request.latestActivityLog;
    final submittedDate = request.createdAt != null
        ? DateTime.tryParse(request.createdAt!)
        : null;
    final updatedDate = request.updatedAt != null
        ? DateTime.tryParse(request.updatedAt!)
        : null;

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
            context.push('/maintenance/${request.id}');
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
                  Expanded(
                    child: Text(
                      request.title ?? 'Untitled',
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge!.copyWith(fontSize: 17),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    margin: const EdgeInsets.only(left: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      color: _statusBgColor(request.status),
                    ),
                    child: Text(
                      maintenanceStatusLabel(request.status ?? ''),
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: _statusTextColor(request.status),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),

              if (request.code != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    'Case ID: #${request.code}',
                    style: Theme.of(context).textTheme.labelLarge!.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ),

              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    submittedDate != null
                        ? 'Submitted: ${submittedDate.format('MMM dd, yyyy')}'
                        : 'Submitted: —',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  leading: const Icon(Icons.calendar_today_rounded, size: 22),
                  trailing: const Icon(Icons.arrow_forward),
                ),
              ),
              if (updatedDate != null)
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    const Icon(Icons.alarm, size: 22),
                    const SizedBox(width: 20),
                    Text(
                      'Updated: ${updatedDate.format('MMM dd, yyyy')}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),

              if (latestLog != null) ...[
                const SizedBox(height: 10),
                Divider(color: Colors.grey.shade300, thickness: 1, height: 20),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Builder(
                      builder: (_) {
                        final style = _logActionStyle(latestLog.action);
                        return Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(100),
                            color: style.bg,
                          ),
                          child: Icon(style.icon, color: style.fg, size: 22),
                        );
                      },
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            maintenanceActivityActionLabel(latestLog.action),
                            style: Theme.of(context).textTheme.labelLarge!
                                .copyWith(fontWeight: FontWeight.bold),
                          ),
                          if (latestLog.description?.isNotEmpty == true) ...[
                            const SizedBox(height: 2),
                            Text(
                              latestLog.description!,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.grey.shade600),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
