import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'root.dart';

class ViewAttachmentsWidget extends ConsumerStatefulWidget {
  const ViewAttachmentsWidget({super.key, required this.attachments});

  final List<AttachmentItemUrl> attachments;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _ViewAttachmentsWidget();
}

class _ViewAttachmentsWidget extends ConsumerState<ViewAttachmentsWidget> {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 7,
        childAspectRatio: 0.8,
      ),
      itemCount: widget.attachments.length,
      itemBuilder: (context, index) {
        final attachment = widget.attachments[index];
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                attachment.url,
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
          ],
        );
      },
    );
  }
}
