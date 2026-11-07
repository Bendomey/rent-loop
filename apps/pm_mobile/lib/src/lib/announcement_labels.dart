const announcementTypes = <(String value, String label)>[
  ('MAINTENANCE', 'Repairs & works'),
  ('COMMUNITY', 'Community'),
  ('POLICY_CHANGE', 'Rule change'),
  ('EMERGENCY', 'Emergency'),
];

const announcementPriorities = <(String value, String label)>[
  ('NORMAL', 'Normal'),
  ('IMPORTANT', 'Important'),
  ('URGENT', 'Urgent'),
];

String announcementStatusLabel(String status) => switch (status) {
  'PUBLISHED' => 'Sent',
  'SCHEDULED' => 'Scheduled',
  'DRAFT' => 'Draft',
  'EXPIRED' => 'Ended',
  _ => status,
};
