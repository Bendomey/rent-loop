import 'package:flutter/material.dart';
import 'package:rentloop_manager/src/shared/coming_soon.dart';

class LeaseDetailScreen extends StatelessWidget {
  const LeaseDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => const RLComingSoon(title: 'Lease');
}
