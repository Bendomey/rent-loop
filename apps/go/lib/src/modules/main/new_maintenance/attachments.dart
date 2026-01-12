import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';
import 'package:rentloop_go/src/shared/adaptive/menu.dart';
import 'root.dart';

class ManageAttachmentsWidget extends ConsumerStatefulWidget {
  const ManageAttachmentsWidget({
    super.key,
    required this.attachments,
    required this.setAttachments,
  });

  final List<AttachmentItem> attachments;
  final Function(List<AttachmentItem>) setAttachments;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _ManageAttachmentsWidget();
}

class _ManageAttachmentsWidget extends ConsumerState<ManageAttachmentsWidget> {
  final ImagePicker _picker = ImagePicker();
  String? imageType;

  // Pick image from gallery
  Future<void> _pickImageFromGallery() async {
    try {
      final List<XFile> pickedFiles = await _picker.pickMultiImage(
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );

      final copyAttachments = List<AttachmentItem>.from(widget.attachments);

      for (var pickedFile in pickedFiles) {
        copyAttachments.add(
          AttachmentItem(file: File(pickedFile.path), type: 'image'),
        );
      }

      widget.setAttachments(copyAttachments);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking image: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Pick image from camera
  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        final copyAttachments = List<AttachmentItem>.from(widget.attachments);
        copyAttachments.add(
          AttachmentItem(file: File(pickedFile.path), type: 'image'),
        );
        widget.setAttachments(copyAttachments);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error capturing image: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 7,
        childAspectRatio: 1,
      ),
      itemCount: widget.attachments.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return AdaptiveMenu(
            title: 'Select an option',
            selected: '',
            items: [
              MenuItem(value: 'camera', label: 'Camera'),
              MenuItem(value: 'picker', label: 'Pick An Image'),
            ],
            onSelected: (value) async {
              await Haptics.vibrate(HapticsType.selection);
              if (value == 'camera') {
                await _pickImageFromCamera();
              } else if (value == 'picker') {
                await _pickImageFromGallery();
              }
            },
            icon: Card(
              color: Colors.black,
              child: Center(
                child: Icon(Icons.add_a_photo, color: Colors.white, size: 25),
              ),
            ),
          );
        }

        final attachment = widget.attachments[index - 1];
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(
                attachment.file,
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  final copyAttachments = List<AttachmentItem>.from(
                    widget.attachments,
                  );
                  copyAttachments.removeAt(index - 1);
                  widget.setAttachments(copyAttachments);
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  padding: EdgeInsets.all(4),
                  child: Icon(Icons.close, color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
