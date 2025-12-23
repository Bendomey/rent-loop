import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

Future<void> launchExternalSite(BuildContext context, String urlSite) async {
  final Uri url = Uri.parse(urlSite);
  if (!await launchUrl(url, mode: LaunchMode.inAppBrowserView)) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not launch site. Try again'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
