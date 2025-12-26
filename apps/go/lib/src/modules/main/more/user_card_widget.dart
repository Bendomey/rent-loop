import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class UserCardWidget extends ConsumerStatefulWidget {
  const UserCardWidget({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _UserCardWidget();
}

class _UserCardWidget extends ConsumerState<UserCardWidget> {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Icon(Icons.account_circle, size: 70),
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            "John Doe",
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
        ),
        Text(
          "0201080802",
          style: const TextStyle(color: Colors.black54, fontSize: 15),
        ),
      ],
    );
  }
}
