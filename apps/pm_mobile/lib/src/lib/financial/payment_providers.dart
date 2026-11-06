const paymentProviders = <({String value, String label})>[
  (value: 'CASH', label: 'Cash'),
  (value: 'MTN', label: 'MTN MoMo'),
  (value: 'VODAFONE', label: 'Telecel Cash'),
  (value: 'AIRTELTIGO', label: 'AT Money'),
  (value: 'BANK_API', label: 'Bank transfer'),
];

String paymentRailLabel(String? rail) => switch (rail) {
  'MOMO' => 'Momo',
  'OFFLINE' => 'Offline (Not via Rentloop)',
  'BANK_TRANSFER' => 'Bank Transfer',
  'CARD' => 'Credit Card',
  _ => rail ?? 'Account',
};
