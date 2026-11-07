const repairCategories = <(String value, String label)>[
  ('PLUMBING', 'Plumbing'),
  ('ELECTRICAL', 'Electrical'),
  ('HVAC', 'Air conditioning'),
  ('APPLIANCE', 'Appliance'),
  ('STRUCTURAL', 'Walls & structure'),
  ('ROOFING', 'Roof'),
  ('PEST_CONTROL', 'Pests'),
  ('LANDSCAPING', 'Compound & garden'),
  ('LOCKS_SECURITY', 'Locks & security'),
  ('PAINTING', 'Painting'),
  ('FLOORING', 'Floors'),
  ('WINDOWS_DOORS', 'Windows & doors'),
  ('SAFETY_FIRE', 'Safety & fire'),
  ('CLEANING', 'Cleaning'),
  ('UTILITIES', 'Water & light bills'),
  ('OTHER', 'Other'),
];

const repairPriorities = <(String value, String label)>[
  ('EMERGENCY', 'Urgent'),
  ('HIGH', 'High'),
  ('MEDIUM', 'Medium'),
  ('LOW', 'Low'),
];

const repairVisibilities = <(String value, String label, String sub)>[
  ('TENANT_VISIBLE', 'Tenant can see this', 'They see it in their app.'),
  ('INTERNAL_ONLY', 'Only staff can see this', 'Managers and staff only.'),
];
