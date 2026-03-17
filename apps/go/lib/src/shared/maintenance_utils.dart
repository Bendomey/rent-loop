import 'package:flutter/material.dart';

// ─── Label helpers ────────────────────────────────────────────────────────────

String mrStatusLabel(String? status) {
  return switch (status?.toUpperCase()) {
    'NEW' => 'New',
    'PENDING' => 'Pending',
    'IN_PROGRESS' => 'In Progress',
    'IN_REVIEW' => 'In Review',
    'RESOLVED' => 'Resolved',
    'CANCELED' || 'CANCELLED' => 'Cancelled',
    _ => status ?? '',
  };
}

String mrPriorityLabel(String? priority) {
  return switch (priority?.toUpperCase()) {
    'LOW' => 'Low',
    'MEDIUM' => 'Medium',
    'HIGH' => 'High',
    'EMERGENCY' => 'Emergency',
    _ => priority ?? '',
  };
}

String mrCategoryLabel(String? category) {
  return switch (category?.toUpperCase()) {
    'PLUMBING' => 'Plumbing',
    'ELECTRICAL' => 'Electrical',
    'HVAC' => 'HVAC',
    'OTHER' => 'Other',
    _ => category ?? '',
  };
}

String mrActivityActionLabel(String? action) {
  return switch (action?.toUpperCase()) {
    'CREATED' => 'Request Submitted',
    'STATUS_CHANGED' => 'Status Updated',
    'WORKER_ASSIGNED' => 'Worker Assigned',
    'MANAGER_ASSIGNED' => 'Manager Assigned',
    'RESOLVED' => 'Resolved',
    'CANCELED' || 'CANCELLED' => 'Cancelled',
    _ => action ?? 'Update',
  };
}

// ─── Status colours ───────────────────────────────────────────────────────────

Color mrStatusBgColor(String? status) => switch (status?.toUpperCase()) {
  'NEW' => Colors.orange.shade50,
  'IN_PROGRESS' => Colors.blue.shade50,
  'IN_REVIEW' => Colors.purple.shade50,
  'RESOLVED' => Colors.green.shade50,
  'CANCELED' || 'CANCELLED' => Colors.red.shade50,
  _ => Colors.grey.shade100,
};

Color mrStatusTextColor(String? status) => switch (status?.toUpperCase()) {
  'NEW' => Colors.orange.shade900,
  'IN_PROGRESS' => Colors.blue.shade900,
  'IN_REVIEW' => Colors.purple.shade800,
  'RESOLVED' => Colors.green.shade900,
  'CANCELED' || 'CANCELLED' => Colors.red.shade700,
  _ => Colors.grey.shade700,
};

// ─── Activity action icon style ───────────────────────────────────────────────

({IconData icon, Color bg, Color fg}) mrActivityActionStyle(String? action) {
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
    'CANCELED' || 'CANCELLED' => (
      icon: Icons.cancel_rounded,
      bg: Colors.red.shade100,
      fg: Colors.red.shade600,
    ),
    _ => (
      icon: Icons.info_outline_rounded,
      bg: Colors.grey.shade100,
      fg: Colors.grey.shade600,
    ),
  };
}

// ─── Status chip widget ───────────────────────────────────────────────────────

class MrStatusChip extends StatelessWidget {
  const MrStatusChip({super.key, required this.status});

  final String? status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(5),
        color: mrStatusBgColor(status),
      ),
      child: Text(
        mrStatusLabel(status),
        style: TextStyle(
          fontWeight: FontWeight.w900,
          color: mrStatusTextColor(status),
          fontSize: 11,
        ),
      ),
    );
  }
}
