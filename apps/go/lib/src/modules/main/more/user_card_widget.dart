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
    final currentUser = ref.watch(currentUserNotifierProvider);
    final tenant = currentUser?.tenant;

    final fullName = tenant != null
        ? '${tenant.firstName} ${tenant.lastName}'.trim()
        : '';
    final phone = currentUser?.phoneNumber ?? '';

    final photoUrl = tenant?.profilePhotoUrl;

    return Column(
      children: [
        photoUrl != null && photoUrl.isNotEmpty
            ? CircleAvatar(
                radius: 35,
                backgroundImage: NetworkImage(photoUrl),
                backgroundColor: Colors.grey.shade200,
              )
            : const Icon(Icons.account_circle, size: 70),
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(
            fullName,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
          ),
        ),
        Text(
          phone,
          style: const TextStyle(color: Colors.black54, fontSize: 15),
        ),
      ],
    );
  }
}
