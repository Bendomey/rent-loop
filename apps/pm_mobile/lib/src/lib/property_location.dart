String propertyLocation(String? address, String? city) {
  final a = (address ?? '').trim();
  final c = (city ?? '').trim();
  if (c.isEmpty) return a;
  if (a.isEmpty) return c;
  final parts = a.toLowerCase().split(',').map((p) => p.trim());
  return parts.contains(c.toLowerCase()) ? a : '$a, $c';
}
