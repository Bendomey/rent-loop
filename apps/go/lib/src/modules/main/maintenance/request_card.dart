import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_go/src/shared/maintenance_utils.dart';

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
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: MrStatusChip(status: request.status),
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
                        final style = mrActivityActionStyle(latestLog.action);
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
                            mrActivityActionLabel(latestLog.action),
                            style: Theme.of(context).textTheme.labelLarge!
                                .copyWith(fontWeight: FontWeight.bold),
                          ),
                          if (latestLog.action?.toUpperCase() ==
                                  'STATUS_CHANGED' &&
                              latestLog.metadata?['from'] != null &&
                              latestLog.metadata?['to'] != null) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                MrStatusChip(
                                  status:
                                      latestLog.metadata!['from'] as String?,
                                ),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 6),
                                  child: Icon(
                                    Icons.arrow_forward,
                                    size: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                MrStatusChip(
                                  status: latestLog.metadata!['to'] as String?,
                                ),
                              ],
                            ),
                          ] else if (latestLog.description?.isNotEmpty ==
                              true) ...[
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
